import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired } from '../utils/validators.js';

const router = Router();

/**
 * GET /api/classes
 * List classes with optional filters: level, academic_year_id.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: 'Class listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/classes/:id
 * Get a single class with its details.
 */
router.get('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Class ${req.params.id} — not yet implemented`,
  });
});

/**
 * GET /api/classes/:id/students
 * Get all students enrolled in a class.
 */
router.get('/:id/students', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: `Students in class ${req.params.id} — not yet implemented`,
    pagination: { page, limit, total: 0 },
  });
});

/**
 * POST /api/classes
 * Create a new class/section.
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['name', 'level', 'academic_year_id']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', ...req.body },
    message: 'Class creation — not yet implemented',
    statusCode: 201,
  });
});

/**
 * PUT /api/classes/:id
 * Update a class.
 */
router.put('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Class ${req.params.id} update — not yet implemented`,
  });
});

export default router;
