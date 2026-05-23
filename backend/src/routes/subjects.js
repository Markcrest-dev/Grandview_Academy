import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired } from '../utils/validators.js';

const router = Router();

/**
 * GET /api/subjects
 * List subjects with optional filters: level, department.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: 'Subject listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/subjects/:id
 * Get a single subject.
 */
router.get('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Subject ${req.params.id} — not yet implemented`,
  });
});

/**
 * POST /api/subjects
 * Create a new subject.
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['name', 'code', 'level']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', ...req.body },
    message: 'Subject creation — not yet implemented',
    statusCode: 201,
  });
});

export default router;
