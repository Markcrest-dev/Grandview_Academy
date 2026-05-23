import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/subjects
 * List subjects with optional filters: level, department.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { level, department } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    let query = supabaseAdmin
      .from('subjects')
      .select('*', { count: 'exact' });

    if (level) query = query.eq('level', level);
    if (department) query = query.eq('department', department);

    const { data: subjects, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    if (error) {
      return sendError(res, { message: `Failed to fetch subjects: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: subjects,
      message: 'Subjects fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/subjects/:id
 * Get a single subject.
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: subject, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !subject) {
      return sendError(res, { message: 'Subject not found.', statusCode: 404 });
    }

    sendSuccess(res, {
      data: subject,
      message: 'Subject retrieved successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/subjects
 * Create a new subject (Admin only).
 */
router.post('/', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const errors = validateRequired(req.body, ['name', 'code', 'level']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    const { name, code, level, department, is_elective } = req.body;

    const { data: newSubject, error } = await supabaseAdmin
      .from('subjects')
      .insert({
        name,
        code,
        level,
        department: department || null,
        is_elective: is_elective || false
      })
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to create subject: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: newSubject,
      message: 'Subject created successfully.',
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

export default router;

