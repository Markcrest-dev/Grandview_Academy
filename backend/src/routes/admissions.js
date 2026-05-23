import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum, isValidDate, isValidEmail } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

const VALID_LEVELS = ['primary', 'secondary', 'university'];
const VALID_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];

/**
 * POST /api/admissions/apply
 * Public online application submission endpoint.
 * No auth required.
 */
router.post('/apply', async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      level,
      previous_school,
      grade_applied_for,
      photo_url,
      parent_first_name,
      parent_last_name,
      parent_email,
      parent_phone,
      parent_relationship,
      parent_address,
    } = req.body;

    const requiredFields = [
      'first_name',
      'last_name',
      'date_of_birth',
      'gender',
      'level',
      'parent_first_name',
      'parent_last_name',
      'parent_email',
      'parent_phone',
      'parent_relationship',
      'parent_address',
    ];

    const errors = validateRequired(req.body, requiredFields);
    if (errors) {
      return sendError(res, { message: 'Required fields are missing.', errors, statusCode: 400 });
    }

    if (!isValidEmail(parent_email)) {
      return sendError(res, { message: 'Invalid parent email address.', statusCode: 400 });
    }

    if (!isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid academic level. Must be: ${VALID_LEVELS.join(', ')}`, statusCode: 400 });
    }

    if (!isValidDate(date_of_birth)) {
      return sendError(res, { message: 'Invalid student date of birth. Must be YYYY-MM-DD.', statusCode: 400 });
    }

    // Fetch active academic year
    const { data: activeYear } = await supabaseAdmin
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .maybeSingle();

    const { data: application, error } = await supabaseAdmin
      .from('admission_applications')
      .insert({
        first_name,
        last_name,
        middle_name: middle_name || null,
        date_of_birth,
        gender,
        level,
        previous_school: previous_school || null,
        grade_applied_for: grade_applied_for || null,
        photo_url: photo_url || null,
        parent_first_name,
        parent_last_name,
        parent_email,
        parent_phone,
        parent_relationship,
        parent_address,
        status: 'pending',
        academic_year_id: activeYear ? activeYear.id : null,
      })
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Application submission failed: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: application,
      message: 'Your admission application has been submitted successfully!',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admissions/applications
 * Admin-only: List applications with optional pagination and filters.
 */
router.get('/applications', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, level, search } = req.query;

    if (status && !isEnum(status, VALID_STATUSES)) {
      return sendError(res, { message: `Invalid status. Must be: ${VALID_STATUSES.join(', ')}`, statusCode: 400 });
    }

    if (level && !isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid level. Must be: ${VALID_LEVELS.join(', ')}`, statusCode: 400 });
    }

    let query = supabaseAdmin
      .from('admission_applications')
      .select('*, academic_years(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (level) {
      query = query.eq('level', level);
    }
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,parent_email.ilike.%${search}%`);
    }

    const { data: applications, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch applications: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: applications,
      message: 'Applications retrieved successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admissions/applications/:id
 * Admin-only: View details of a specific application.
 */
router.get('/applications/:id', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: application, error } = await supabaseAdmin
      .from('admission_applications')
      .select('*, academic_years(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !application) {
      return sendError(res, { message: 'Application not found.', statusCode: 404 });
    }

    sendSuccess(res, {
      data: application,
      message: 'Application retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admissions/applications/:id/status
 * Admin-only: Update status of application (e.g. move to 'under_review' or 'rejected').
 */
router.put('/applications/:id/status', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!status || !isEnum(status, ['under_review', 'rejected'])) {
      return sendError(res, { message: 'Invalid status. Can only change to under_review or rejected here.', statusCode: 400 });
    }

    if (status === 'rejected' && !rejection_reason) {
      return sendError(res, { message: 'Rejection reason is required when status is rejected.', statusCode: 400 });
    }

    const { data: application } = await supabaseAdmin
      .from('admission_applications')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!application) {
      return sendError(res, { message: 'Application not found.', statusCode: 404 });
    }

    const { data: updatedApp, error } = await supabaseAdmin
      .from('admission_applications')
      .update({
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to update status: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: updatedApp,
      message: `Application status updated to ${status}.`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admissions/applications/:id/admit
 * Admin-only: Enroll applicant. Creates users, students, parent profiles and links relationships.
 */
router.post('/applications/:id/admit', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { class_id } = req.body;

    if (!class_id) {
      return sendError(res, { message: 'Target classroom allocation (class_id) is required.', statusCode: 400 });
    }

    // 1. Fetch application details
    const { data: application, error: appErr } = await supabaseAdmin
      .from('admission_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (appErr || !application) {
      return sendError(res, { message: 'Application not found.', statusCode: 404 });
    }

    if (application.status === 'approved') {
      return sendError(res, { message: 'This application has already been approved and admitted.', statusCode: 400 });
    }

    // Verify class exists and matches level
    const { data: targetClass, error: classErr } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('id', class_id)
      .maybeSingle();

    if (classErr || !targetClass) {
      return sendError(res, { message: 'Allocated classroom not found.', statusCode: 400 });
    }

    if (targetClass.level !== application.level) {
      return sendError(res, { message: `Class level mismatch. Application is for ${application.level}, but class is ${targetClass.level}.`, statusCode: 400 });
    }

    // 2. Fetch current count to generate sequential student indices
    const currentYear = new Date().getFullYear();
    const { count: studentCount } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true });

    const studentIndex = (studentCount || 0) + 1;
    const admission_number = `GA/${currentYear}/${String(studentIndex).padStart(3, '0')}`;
    const studentEmail = `${application.first_name.toLowerCase()}.${application.last_name.toLowerCase()}${studentIndex}@grandview.edu`;

    // 3. Create Student User Account
    const salt = await bcrypt.genSalt(10);
    const studentPasswordHash = await bcrypt.hash('StudentPassword123', salt);

    const { data: studentUser, error: studUserErr } = await supabaseAdmin
      .from('users')
      .insert({
        email: studentEmail,
        password_hash: studentPasswordHash,
        role: 'student',
        must_change_password: true,
        is_active: true,
      })
      .select()
      .single();

    if (studUserErr || !studentUser) {
      return sendError(res, { message: `Student user creation failed: ${studUserErr?.message}`, statusCode: 500 });
    }

    // 4. Create Student Profile
    const { data: studentProfile, error: studProfErr } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: studentUser.id,
        admission_number,
        first_name: application.first_name,
        last_name: application.last_name,
        middle_name: application.middle_name,
        date_of_birth: application.date_of_birth,
        gender: application.gender,
        level: application.level,
        current_class_id: class_id,
        admission_date: new Date().toISOString().split('T')[0],
        photo_url: application.photo_url,
        status: 'active',
      })
      .select()
      .single();

    if (studProfErr || !studentProfile) {
      // rollback student user
      await supabaseAdmin.from('users').delete().eq('id', studentUser.id);
      return sendError(res, { message: `Student profile creation failed: ${studProfErr?.message}`, statusCode: 500 });
    }

    // 5. Parent Account Mapping
    let finalParentProfileId = null;

    // Check if a parent user already exists with that email
    const { data: existingParentUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', application.parent_email)
      .eq('role', 'parent')
      .maybeSingle();

    if (existingParentUser) {
      // Fetch parent profile
      const { data: existingParentProfile } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', existingParentUser.id)
        .maybeSingle();

      if (existingParentProfile) {
        finalParentProfileId = existingParentProfile.id;
      }
    }

    if (!finalParentProfileId) {
      // Create new parent user
      const parentPasswordHash = await bcrypt.hash('ParentPassword123', salt);
      const { data: parentUser, error: parentUserErr } = await supabaseAdmin
        .from('users')
        .insert({
          email: application.parent_email,
          password_hash: parentPasswordHash,
          role: 'parent',
          must_change_password: true,
          is_active: true,
        })
        .select()
        .single();

      if (!parentUserErr && parentUser) {
        // Generate Parent ID Number: GAP/YYYY/XXX
        const { count: parentCount } = await supabaseAdmin
          .from('parents')
          .select('*', { count: 'exact', head: true });

        const parentIndex = (parentCount || 0) + 1;
        const parent_id_number = `GAP/${currentYear}/${String(parentIndex).padStart(3, '0')}`;

        // Create Parent Profile
        const { data: parentProfile, error: parentProfErr } = await supabaseAdmin
          .from('parents')
          .insert({
            user_id: parentUser.id,
            parent_id_number,
            first_name: application.parent_first_name,
            last_name: application.parent_last_name,
            phone: application.parent_phone,
            email: application.parent_email,
            relationship: application.parent_relationship,
            address: application.parent_address,
          })
          .select()
          .single();

        if (!parentProfErr && parentProfile) {
          finalParentProfileId = parentProfile.id;
        } else {
          // roll back parent user if profile failed
          await supabaseAdmin.from('users').delete().eq('id', parentUser.id);
        }
      }
    }

    // 6. Link Parent & Student
    if (finalParentProfileId) {
      await supabaseAdmin.from('parent_student').insert({
        parent_id: finalParentProfileId,
        student_id: studentProfile.id,
      });
    }

    // 7. Update Application status to approved
    await supabaseAdmin
      .from('admission_applications')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    sendSuccess(res, {
      data: {
        student: studentProfile,
        email: studentEmail,
        admission_number,
      },
      message: `Applicant admitted successfully! Assigned Admission No: ${admission_number}`,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
