import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import env from '../config/env.js';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Unified portal login endpoint.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password, role } = req.body;
    
    const errors = validateRequired(req.body, ['identifier', 'password', 'role']);
    if (errors) {
      return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });
    }

    const validRoles = ['admin', 'student', 'staff', 'parent'];
    if (!validRoles.includes(role)) {
      return sendError(res, { message: 'Invalid role provided.', statusCode: 400 });
    }

    let userRecord = null;
    let profileData = null;

    const isEmail = identifier.includes('@');

    // First, lookup via email if applicable
    if (isEmail) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', identifier)
        .maybeSingle();
      
      if (!error && user) {
        userRecord = user;
      }
    }

    if (role === 'admin') {
      if (!userRecord && !isEmail) {
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', identifier)
          .eq('role', 'admin')
          .maybeSingle();
        userRecord = !error ? user : null;
      }
      if (!userRecord || userRecord.role !== 'admin') {
        return sendError(res, { message: 'Invalid email or password.', statusCode: 401 });
      }
    } 
    
    else if (role === 'student') {
      let studentQuery = supabaseAdmin.from('students').select('*, users(*)');
      
      if (userRecord) {
        studentQuery = studentQuery.eq('user_id', userRecord.id);
      } else {
        studentQuery = studentQuery.eq('admission_number', identifier);
      }

      const { data: student, error: studentError } = await studentQuery.maybeSingle();

      if (studentError || !student || !student.users) {
        return sendError(res, { message: 'Invalid Admission Number, Email or password.', statusCode: 401 });
      }

      userRecord = student.users;
      profileData = {
        id: student.id,
        admissionNumber: student.admission_number,
        firstName: student.first_name,
        lastName: student.last_name,
        photoUrl: student.photo_url,
        level: student.level,
        classId: student.current_class_id,
      };
    } 
    
    else if (role === 'staff') {
      let staffQuery = supabaseAdmin.from('staff').select('*, users(*)');
      
      if (userRecord) {
        staffQuery = staffQuery.eq('user_id', userRecord.id);
      } else {
        staffQuery = staffQuery.eq('staff_id_number', identifier);
      }

      const { data: staff, error: staffError } = await staffQuery.maybeSingle();

      if (staffError || !staff || !staff.users) {
        return sendError(res, { message: 'Invalid Staff ID, Email or password.', statusCode: 401 });
      }

      userRecord = staff.users;
      profileData = {
        id: staff.id,
        staffIdNumber: staff.staff_id_number,
        firstName: staff.first_name,
        lastName: staff.last_name,
        photoUrl: staff.photo_url,
        department: staff.department,
        designation: staff.designation,
        staffType: staff.staff_type,
      };
    } 
    
    else if (role === 'parent') {
      let parent = null;

      if (userRecord) {
        const { data: directParent, error: directError } = await supabaseAdmin
          .from('parents')
          .select('*, users(*)')
          .eq('user_id', userRecord.id)
          .maybeSingle();
          
        if (!directError && directParent) {
          parent = directParent;
        }
      } else {
        // 1. Try directly searching by Parent ID Number
        const { data: directParent, error: directError } = await supabaseAdmin
          .from('parents')
          .select('*, users(*)')
          .eq('parent_id_number', identifier)
          .maybeSingle();

        if (!directError && directParent) {
          parent = directParent;
        } else {
          // 2. Try looking up child by Admission Number and loading parent mapping
          const { data: child, error: childError } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('admission_number', identifier)
            .maybeSingle();

          if (!childError && child) {
            const { data: mappings, error: mapError } = await supabaseAdmin
              .from('parent_student')
              .select('parents(*, users(*))')
              .eq('student_id', child.id);

            if (!mapError && mappings && mappings.length > 0) {
              parent = mappings[0].parents;
            }
          }
        }
      }

      if (!parent || !parent.users) {
        return sendError(res, { message: 'Invalid Parent ID, Email, Student Admission Number or password.', statusCode: 401 });
      }

      userRecord = parent.users;
      profileData = {
        id: parent.id,
        parentIdNumber: parent.parent_id_number,
        firstName: parent.first_name,
        lastName: parent.last_name,
        phone: parent.phone,
        email: parent.email,
      };
    }

    // Verify account is active
    if (!userRecord.is_active) {
      return sendError(res, { message: 'This account has been deactivated.', statusCode: 403 });
    }

    // Verify password hash
    const passwordMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!passwordMatch) {
      return sendError(res, { message: 'Invalid login credentials.', statusCode: 401 });
    }

    // Check if 2FA is active (for admin only, as required)
    if (role === 'admin' && userRecord.two_factor_enabled) {
      // Sign temporary 2FA token
      const tempToken = jwt.sign(
        { id: userRecord.id, email: userRecord.email, role: 'admin', type: '2fa_pending' },
        env.jwtSecret,
        { expiresIn: '5m' }
      );

      return sendSuccess(res, {
        data: { requires2FA: true, tempToken },
        message: '2-Factor Authentication required.',
      });
    }

    // Standard session token signing
    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, role: userRecord.role },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    // Save login audit trace asynchronously
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userRecord.id,
      action: 'LOGIN',
      entity_type: 'user',
      entity_id: userRecord.id,
      ip_address: req.ip,
      details: { role, user_agent: req.get('user-agent') }
    });

    sendSuccess(res, {
      data: {
        token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          role: userRecord.role,
          mustChangePassword: userRecord.must_change_password,
          profile: profileData,
        },
      },
      message: 'Login successful.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/verify-2fa
 * Complete admin session by verifying TOTP.
 */
router.post('/verify-2fa', async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;
    
    const errors = validateRequired(req.body, ['tempToken', 'code']);
    if (errors) {
      return sendError(res, { message: 'Fields missing.', errors, statusCode: 400 });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, env.jwtSecret);
    } catch (err) {
      return sendError(res, { message: 'Temporary session expired or invalid. Please login again.', statusCode: 401 });
    }

    if (decoded.type !== '2fa_pending') {
      return sendError(res, { message: 'Invalid session token context.', statusCode: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !user || !user.is_active) {
      return sendError(res, { message: 'User account not found or disabled.', statusCode: 401 });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1, // Allow 30s drift either way
    });

    if (!verified) {
      return sendError(res, { message: 'Invalid 2FA code. Please try again.', statusCode: 401 });
    }

    // Issue standard full JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    // Save audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'LOGIN_2FA_VERIFIED',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip,
      details: { verified: true }
    });

    sendSuccess(res, {
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          mustChangePassword: user.must_change_password,
          profile: null,
        },
      },
      message: 'MFA Verification successful.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/setup-2fa
 * Generate TOTP secret and QR code URI for admin settings.
 */
router.post('/setup-2fa', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Grandview Academy SMS: ${req.user.email}`,
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Temporarily cache secret in DB so we can verify it before final activation
    const { error } = await supabaseAdmin
      .from('users')
      .update({ two_factor_secret: secret.base32 })
      .eq('id', req.user.id);

    if (error) {
      return sendError(res, { message: 'Database update failed during setup.', statusCode: 500 });
    }

    sendSuccess(res, {
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
      },
      message: 'MFA setup initialized.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/enable-2fa
 * Verify setup code and enable 2FA on the admin user profile.
 */
router.post('/enable-2fa', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return sendError(res, { message: 'Verification code is required.', statusCode: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('two_factor_secret')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user || !user.two_factor_secret) {
      return sendError(res, { message: 'MFA setup has not been initialized.', statusCode: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      return sendError(res, { message: 'Incorrect validation code.', statusCode: 400 });
    }

    // Set 2FA to enabled in DB
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', req.user.id);

    if (updateError) {
      return sendError(res, { message: 'Failed to enable MFA.', statusCode: 500 });
    }

    sendSuccess(res, {
      message: 'Multi-Factor Authentication enabled successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/disable-2fa
 * Turn off MFA (requires account password to verify request).
 */
router.post('/disable-2fa', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return sendError(res, { message: 'Password confirmation required.', statusCode: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user) {
      return sendError(res, { message: 'User verification failed.', statusCode: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return sendError(res, { message: 'Invalid password. Cannot disable MFA.', statusCode: 401 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ two_factor_enabled: false, two_factor_secret: null })
      .eq('id', req.user.id);

    if (updateError) {
      return sendError(res, { message: 'Failed to disable MFA.', statusCode: 500 });
    }

    sendSuccess(res, {
      message: 'Multi-Factor Authentication disabled successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/change-password
 * Change password for active session.
 */
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const errors = validateRequired(req.body, ['currentPassword', 'newPassword']);
    if (errors) {
      return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });
    }

    if (newPassword.length < 6) {
      return sendError(res, { message: 'New password must be at least 6 characters.', statusCode: 400 });
    }

    // Load full user details with password hash
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user) {
      return sendError(res, { message: 'Verification error.', statusCode: 401 });
    }

    // Verify old password match
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return sendError(res, { message: 'Current password does not match.', statusCode: 400 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    // Save updated password in DB
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashed,
        must_change_password: false,
      })
      .eq('id', req.user.id);

    if (updateError) {
      return sendError(res, { message: 'Failed to update database record.', statusCode: 500 });
    }

    sendSuccess(res, {
      message: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Hydrate browser context and verify validity of stored JWT session.
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    let profileData = null;
    const role = req.user.role;

    if (role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id, admission_number, first_name, last_name, photo_url, level, current_class_id')
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (student) {
        profileData = {
          id: student.id,
          admissionNumber: student.admission_number,
          firstName: student.first_name,
          lastName: student.last_name,
          photoUrl: student.photo_url,
          level: student.level,
          classId: student.current_class_id,
        };
      }
    } 
    
    else if (role === 'teaching_staff' || role === 'non_teaching_staff') {
      const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('id, staff_id_number, first_name, last_name, photo_url, department, designation, staff_type')
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (staff) {
        profileData = {
          id: staff.id,
          staffIdNumber: staff.staff_id_number,
          firstName: staff.first_name,
          lastName: staff.last_name,
          photoUrl: staff.photo_url,
          department: staff.department,
          designation: staff.designation,
          staffType: staff.staff_type,
        };
      }
    } 
    
    else if (role === 'parent') {
      const { data: parent } = await supabaseAdmin
        .from('parents')
        .select('id, parent_id_number, first_name, last_name, phone, email')
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (parent) {
        profileData = {
          id: parent.id,
          parentIdNumber: parent.parent_id_number,
          firstName: parent.first_name,
          lastName: parent.last_name,
          phone: parent.phone,
          email: parent.email,
        };
      }
    }

    sendSuccess(res, {
      data: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        mustChangePassword: req.user.must_change_password,
        profile: profileData,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
