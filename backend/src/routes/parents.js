import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/parents
 * List all parent profiles with optional search.
 * Restricted to admin.
 */
router.get('/', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { search } = req.query;

    let query = supabaseAdmin
      .from('parents')
      .select('*, users(email, is_active)', { count: 'exact' });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,parent_id_number.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: parents, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('last_name', { ascending: true });

    if (error) {
      return sendError(res, { message: `Failed to fetch parents: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: parents,
      message: 'Parent profiles fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/parents/:id
 * Get a single parent profile with linked students.
 */
router.get('/:id', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: parent, error } = await supabaseAdmin
      .from('parents')
      .select('*, users(email, is_active)')
      .eq('id', id)
      .maybeSingle();

    if (error || !parent) {
      return sendError(res, { message: 'Parent profile not found.', statusCode: 404 });
    }

    // Load linked students
    const { data: mappings } = await supabaseAdmin
      .from('parent_student')
      .select('students(*, classes!students_current_class_id_fkey(*))')
      .eq('parent_id', id);

    const linkedStudents = mappings ? mappings.map(m => m.students).filter(Boolean) : [];

    sendSuccess(res, {
      data: {
        ...parent,
        linked_students: linkedStudents,
      },
      message: 'Parent profile retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
