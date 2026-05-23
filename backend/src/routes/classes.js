import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const VALID_LEVELS = ['primary', 'secondary', 'university'];

/**
 * GET /api/classes
 * List classes with optional filters: level, academic_year_id.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { level, academic_year_id } = req.query;

    if (level && !isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` });
    }

    let query = supabaseAdmin
      .from('classes')
      .select('*, staff(*), academic_years(*)', { count: 'exact' });

    if (level) {
      query = query.eq('level', level);
    }
    if (academic_year_id) {
      query = query.eq('academic_year_id', academic_year_id);
    }

    const { data: classes, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    if (error) {
      return sendError(res, { message: `Failed to fetch classes: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: classes,
      message: 'Classes fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/classes/:id
 * Get a single class with its details.
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: cohort, error } = await supabaseAdmin
      .from('classes')
      .select('*, staff(*), academic_years(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !cohort) {
      return sendError(res, { message: 'Class not found.', statusCode: 404 });
    }

    sendSuccess(res, {
      data: cohort,
      message: 'Class retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/classes/:id/students
 * Get all students enrolled in a class.
 */
router.get('/:id/students', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

    // Verify class exists first
    const { data: cohort } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!cohort) {
      return sendError(res, { message: 'Class not found.', statusCode: 404 });
    }

    const { data: students, error, count } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact' })
      .eq('current_class_id', id)
      .eq('status', 'active')
      .range(offset, offset + limit - 1)
      .order('last_name', { ascending: true });

    if (error) {
      return sendError(res, { message: `Failed to fetch students for class: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: students,
      message: 'Class students fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/classes
 * Create a new class/section (Admin-only).
 */
router.post('/', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { name, level, academic_year_id, class_teacher_id } = req.body;
    const errors = validateRequired(req.body, ['name', 'level', 'academic_year_id']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    if (!isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}`, statusCode: 400 });
    }

    const { data: newClass, error } = await supabaseAdmin
      .from('classes')
      .insert({
        name,
        level,
        academic_year_id,
        class_teacher_id: class_teacher_id || null,
      })
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to create class: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: newClass,
      message: 'Class created successfully.',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/classes/:id
 * Update a class.
 */
router.put('/:id', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, level, academic_year_id, class_teacher_id } = req.body;

    const { data: cohort } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!cohort) {
      return sendError(res, { message: 'Class not found.', statusCode: 404 });
    }

    if (level && !isEnum(level, VALID_LEVELS)) {
      return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}`, statusCode: 400 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (level !== undefined) updateData.level = level;
    if (academic_year_id !== undefined) updateData.academic_year_id = academic_year_id;
    if (class_teacher_id !== undefined) updateData.class_teacher_id = class_teacher_id;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedClass, error } = await supabaseAdmin
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to update class: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: updatedClass,
      message: 'Class updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
