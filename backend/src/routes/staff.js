import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

const VALID_STAFF_TYPES = ['teaching', 'non_teaching'];

/**
 * GET /api/staff
 * List staff with optional filters: staff_type, department, search.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { staff_type, department, search } = req.query;

    if (staff_type && !isEnum(staff_type, VALID_STAFF_TYPES)) {
      return sendError(res, { message: `Invalid staff_type. Must be one of: ${VALID_STAFF_TYPES.join(', ')}` });
    }

    let query = supabaseAdmin
      .from('staff')
      .select('*, users(email, is_active)', { count: 'exact' });

    if (staff_type) {
      query = query.eq('staff_type', staff_type);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,staff_id_number.ilike.%${search}%`);
    }

    const { data: staffMembers, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('last_name', { ascending: true });

    if (error) {
      return sendError(res, { message: `Failed to fetch staff: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: staffMembers,
      message: 'Staff listing fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/staff/:id
 * Get a single staff profile.
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: staffMember, error } = await supabaseAdmin
      .from('staff')
      .select('*, users(email, is_active)')
      .eq('id', id)
      .maybeSingle();

    if (error || !staffMember) {
      return sendError(res, { message: 'Staff profile not found.', statusCode: 404 });
    }

    sendSuccess(res, {
      data: staffMember,
      message: 'Staff profile retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/staff
 * Register a new staff member.
 */
router.post('/', requireAuth, requireRoles('admin'), (req, res) => {
  const errors = validateRequired(req.body, ['first_name', 'last_name', 'staff_id_number', 'staff_type']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  if (!isEnum(req.body.staff_type, VALID_STAFF_TYPES)) {
    return sendError(res, { message: `Invalid staff_type. Must be one of: ${VALID_STAFF_TYPES.join(', ')}` });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', ...req.body },
    message: 'Staff registration — not yet implemented',
    statusCode: 201,
  });
});

/**
 * PUT /api/staff/:id
 * Update a staff member's profile.
 */
router.put('/:id', requireAuth, requireRoles('admin'), (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Staff ${req.params.id} update — not yet implemented`,
  });
});

export default router;
