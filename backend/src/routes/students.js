import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';

const router = Router();

const VALID_LEVELS = ['primary', 'secondary', 'university'];
const VALID_STATUSES = ['active', 'graduated', 'withdrawn', 'suspended'];

/**
 * GET /api/students
 * List students with optional filters: level, class_id, status.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { level, class_id, status } = req.query;

  if (level && !isEnum(level, VALID_LEVELS)) {
    return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` });
  }

  sendSuccess(res, {
    data: [],
    message: 'Student listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/students/:id
 * Get a single student profile.
 */
router.get('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Student ${req.params.id} — not yet implemented`,
  });
});

/**
 * POST /api/students
 * Register a new student.
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['first_name', 'last_name', 'level', 'admission_number']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  if (!isEnum(req.body.level, VALID_LEVELS)) {
    return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', ...req.body },
    message: 'Student registration — not yet implemented',
    statusCode: 201,
  });
});

/**
 * PUT /api/students/:id
 * Update a student's profile.
 */
router.put('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Student ${req.params.id} update — not yet implemented`,
  });
});

export default router;
