import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';

const router = Router();

const VALID_STAFF_TYPES = ['teaching', 'non_teaching'];

/**
 * GET /api/staff
 * List staff with optional filters: staff_type, department.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { staff_type, department } = req.query;

  if (staff_type && !isEnum(staff_type, VALID_STAFF_TYPES)) {
    return sendError(res, { message: `Invalid staff_type. Must be one of: ${VALID_STAFF_TYPES.join(', ')}` });
  }

  sendSuccess(res, {
    data: [],
    message: 'Staff listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/staff/:id
 * Get a single staff profile.
 */
router.get('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Staff ${req.params.id} — not yet implemented`,
  });
});

/**
 * POST /api/staff
 * Register a new staff member.
 */
router.post('/', (req, res) => {
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
router.put('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Staff ${req.params.id} update — not yet implemented`,
  });
});

export default router;
