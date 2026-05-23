import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isValidEmail, isEnum } from '../utils/validators.js';

const router = Router();

const VALID_ROLES = ['admin', 'teaching_staff', 'non_teaching_staff', 'student', 'parent'];

/**
 * GET /api/users
 * List all users with optional role filter and pagination.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { role } = req.query;

  if (role && !isEnum(role, VALID_ROLES)) {
    return sendError(res, { message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  // Skeleton response — will query Supabase in Phase 4
  sendSuccess(res, {
    data: [],
    message: 'User listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/users/:id
 * Get a single user by ID.
 */
router.get('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `User ${req.params.id} — not yet implemented`,
  });
});

/**
 * POST /api/users
 * Create a new user (admin-only in Phase 3+).
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['email', 'role']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  if (!isValidEmail(req.body.email)) {
    return sendError(res, { message: 'Invalid email address' });
  }

  if (!isEnum(req.body.role, VALID_ROLES)) {
    return sendError(res, { message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  // Skeleton — will create user in Supabase in Phase 3
  sendSuccess(res, {
    data: { id: 'placeholder', email: req.body.email, role: req.body.role },
    message: 'User creation — not yet implemented',
    statusCode: 201,
  });
});

/**
 * PUT /api/users/:id
 * Update a user's details.
 */
router.put('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `User ${req.params.id} update — not yet implemented`,
  });
});

/**
 * DELETE /api/users/:id
 * Deactivate a user account (soft delete).
 */
router.delete('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `User ${req.params.id} deactivation — not yet implemented`,
  });
});

export default router;
