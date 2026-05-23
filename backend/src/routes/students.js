import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum, isValidDate } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

const VALID_LEVELS = ['primary', 'secondary', 'university'];
const VALID_STATUSES = ['active', 'graduated', 'withdrawn', 'suspended'];

/**
 * GET /api/students/family/children
 * Get all linked children for the currently authenticated parent.
 */
router.get('/family/children', requireAuth, requireRoles('parent'), async (req, res, next) => {
  try {
    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!parent) {
      return sendError(res, { message: 'Parent profile folder not found.', statusCode: 404 });
    }

    const { data: mappings } = await supabaseAdmin
      .from('parent_student')
      .select('student_id')
      .eq('parent_id', parent.id);

    const studentIds = mappings ? mappings.map(m => m.student_id) : [];
    
    if (studentIds.length === 0) {
      return sendSuccess(res, { data: [], message: 'No linked children found.' });
    }

    const { data: children, error } = await supabaseAdmin
      .from('students')
      .select('*, classes!students_current_class_id_fkey(*)')
      .in('id', studentIds);

    if (error) {
      return sendError(res, { message: `Failed to fetch family records: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, { data: children, message: 'Family children records fetched successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/students
 * List students with optional filters: level, class_id, status, search.
 * Required role: admin, teaching_staff (any authenticated portal user can list, but let's restrict to staff and admins).
 */
router.get('/', requireAuth, requireRoles('admin', 'teaching_staff', 'non_teaching_staff'), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { level, class_id, status, search } = req.query;

    if (level && !isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` });
    }

    if (status && !isEnum(status, VALID_STATUSES)) {
      return sendError(res, { message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    let query = supabaseAdmin
      .from('students')
      .select('*, classes!students_current_class_id_fkey(*)', { count: 'exact' });

    if (level) {
      query = query.eq('level', level);
    }
    if (class_id) {
      query = query.eq('current_class_id', class_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
    }

    const { data: students, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('last_name', { ascending: true });

    if (error) {
      return sendError(res, { message: `Failed to fetch students: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: students,
      message: 'Students fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/students/:id
 * Get a single student profile (including users account info, class info, and mapped parents).
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Standard security checks: students and parents can only see their own profile/child profile
    const currentRole = req.user.role;
    if (currentRole === 'student') {
      // Find current user's student profile ID
      const { data: currentStudent } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (!currentStudent || currentStudent.id !== id) {
        return sendError(res, { message: 'Access denied. You can only view your own profile.', statusCode: 403 });
      }
    } else if (currentRole === 'parent') {
      // Verify parent is linked to this student
      const { data: currentParent } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (!currentParent) {
        return sendError(res, { message: 'Access denied.', statusCode: 403 });
      }

      const { data: mapping } = await supabaseAdmin
        .from('parent_student')
        .select('*')
        .eq('parent_id', currentParent.id)
        .eq('student_id', id)
        .maybeSingle();

      if (!mapping) {
        return sendError(res, { message: 'Access denied. You can only view your children\'s profiles.', statusCode: 403 });
      }
    }

    // Retrieve student profile
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*, users(email, is_active), classes!students_current_class_id_fkey(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !student) {
      return sendError(res, { message: 'Student profile not found.', statusCode: 404 });
    }

    // Load parent mappings
    const { data: parentMappings } = await supabaseAdmin
      .from('parent_student')
      .select('parents(*)')
      .eq('student_id', id);

    const parents = parentMappings ? parentMappings.map(m => m.parents) : [];

    sendSuccess(res, {
      data: {
        ...student,
        parents,
      },
      message: 'Student profile retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/students
 * Register a new student (Admin-only).
 */
router.post('/', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      level,
      current_class_id,
      admission_date,
      photo_url,
      parent_id, // optional: link to existing parent
    } = req.body;

    const errors = validateRequired(req.body, ['first_name', 'last_name', 'level', 'date_of_birth', 'gender']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    if (!isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}`, statusCode: 400 });
    }

    if (!isValidDate(date_of_birth)) {
      return sendError(res, { message: 'Invalid date of birth format. Must be YYYY-MM-DD.', statusCode: 400 });
    }

    // Generate admission number GA/YYYY/XXX
    const currentYear = new Date().getFullYear();
    const { count } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true });

    const nextIndex = (count || 0) + 1;
    const admission_number = `GA/${currentYear}/${String(nextIndex).padStart(3, '0')}`;

    // Create user account for the student
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('StudentPassword123', salt);
    const studentEmail = `${first_name.toLowerCase()}.${last_name.toLowerCase()}${nextIndex}@grandview.edu`;

    const { data: newUser, error: userErr } = await supabaseAdmin
      .from('users')
      .insert({
        email: studentEmail,
        password_hash: defaultPasswordHash,
        role: 'student',
        must_change_password: true,
        is_active: true,
      })
      .select()
      .single();

    if (userErr || !newUser) {
      return sendError(res, { message: `User creation failed: ${userErr?.message}`, statusCode: 500 });
    }

    // Insert student profile
    const { data: student, error: studentErr } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: newUser.id,
        admission_number,
        first_name,
        last_name,
        middle_name,
        date_of_birth,
        gender,
        level,
        current_class_id: current_class_id || null,
        admission_date: admission_date || new Date().toISOString().split('T')[0],
        photo_url: photo_url || null,
        status: 'active',
      })
      .select()
      .single();

    if (studentErr || !student) {
      // rollback user
      await supabaseAdmin.from('users').delete().eq('id', newUser.id);
      return sendError(res, { message: `Student profile creation failed: ${studentErr?.message}`, statusCode: 500 });
    }

    // Link parent if provided
    if (parent_id) {
      await supabaseAdmin.from('parent_student').insert({
        parent_id,
        student_id: student.id,
      });
    }

    sendSuccess(res, {
      data: student,
      message: `Student registered successfully with Admission Number: ${admission_number}`,
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/students/:id
 * Update a student's profile (Admin-only).
 */
router.put('/:id', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      level,
      current_class_id,
      status,
      photo_url,
    } = req.body;

    // Verify student profile exists
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!existingStudent) {
      return sendError(res, { message: 'Student profile not found.', statusCode: 404 });
    }

    if (level && !isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}`, statusCode: 400 });
    }

    if (status && !isEnum(status, VALID_STATUSES)) {
      return sendError(res, { message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, statusCode: 400 });
    }

    if (date_of_birth && !isValidDate(date_of_birth)) {
      return sendError(res, { message: 'Invalid date of birth format. Must be YYYY-MM-DD.', statusCode: 400 });
    }

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (middle_name !== undefined) updateData.middle_name = middle_name;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (gender !== undefined) updateData.gender = gender;
    if (level !== undefined) updateData.level = level;
    if (current_class_id !== undefined) updateData.current_class_id = current_class_id;
    if (status !== undefined) updateData.status = status;
    if (photo_url !== undefined) updateData.photo_url = photo_url;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedStudent, error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to update student: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: updatedStudent,
      message: 'Student profile updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/students/:id/link-parent
 * Link an existing parent profile to a student (Admin-only).
 * Body: { parent_id }
 */
router.post('/:id/link-parent', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parent_id } = req.body;

    if (!parent_id) {
      return sendError(res, { message: 'parent_id is required.', statusCode: 400 });
    }

    // Verify student exists
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('id', id)
      .maybeSingle();

    if (!student) {
      return sendError(res, { message: 'Student profile not found.', statusCode: 404 });
    }

    // Verify parent exists
    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('id, first_name, last_name')
      .eq('id', parent_id)
      .maybeSingle();

    if (!parent) {
      return sendError(res, { message: 'Parent profile not found.', statusCode: 404 });
    }

    // Check for existing link
    const { data: existing } = await supabaseAdmin
      .from('parent_student')
      .select('*')
      .eq('parent_id', parent_id)
      .eq('student_id', id)
      .maybeSingle();

    if (existing) {
      return sendError(res, { message: 'This parent is already linked to this student.', statusCode: 409 });
    }

    // Create link
    const { error } = await supabaseAdmin
      .from('parent_student')
      .insert({ parent_id, student_id: id });

    if (error) {
      return sendError(res, { message: `Failed to link parent: ${error.message}`, statusCode: 500 });
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'PARENT_STUDENT_LINK',
      entity_type: 'parent_student',
      entity_id: id,
      details: { parent_id, parent_name: `${parent.first_name} ${parent.last_name}`, student_name: `${student.first_name} ${student.last_name}` },
      ip_address: req.ip
    });

    sendSuccess(res, {
      data: { student_id: id, parent_id },
      message: `Parent ${parent.first_name} ${parent.last_name} linked to student ${student.first_name} ${student.last_name} successfully.`,
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/students/:id/unlink-parent/:parentId
 * Unlink a parent profile from a student (Admin-only).
 */
router.delete('/:id/unlink-parent/:parentId', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id, parentId } = req.params;

    const { error } = await supabaseAdmin
      .from('parent_student')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', id);

    if (error) {
      return sendError(res, { message: `Failed to unlink parent: ${error.message}`, statusCode: 500 });
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'PARENT_STUDENT_UNLINK',
      entity_type: 'parent_student',
      entity_id: id,
      details: { parent_id: parentId },
      ip_address: req.ip
    });

    sendSuccess(res, {
      data: null,
      message: 'Parent unlinked from student successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
