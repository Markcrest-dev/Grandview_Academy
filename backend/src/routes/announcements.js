import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';

const router = Router();

const VALID_AUDIENCES = ['all', 'staff', 'students', 'parents', 'primary', 'secondary', 'university'];
const VALID_PRIORITIES = ['normal', 'important', 'urgent'];

/**
 * GET /api/announcements
 * List announcements with optional filters: target_audience, priority.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: 'Announcement listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/announcements/:id
 * Get a single announcement.
 */
router.get('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Announcement ${req.params.id} — not yet implemented`,
  });
});

/**
 * POST /api/announcements
 * Create a new announcement.
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['title', 'content', 'target_audience']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  if (!isEnum(req.body.target_audience, VALID_AUDIENCES)) {
    return sendError(res, {
      message: `Invalid target_audience. Must be one of: ${VALID_AUDIENCES.join(', ')}`,
    });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', ...req.body },
    message: 'Announcement creation — not yet implemented',
    statusCode: 201,
  });
});

/**
 * PUT /api/announcements/:id
 * Update an announcement.
 */
router.put('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Announcement ${req.params.id} update — not yet implemented`,
  });
});

/**
 * DELETE /api/announcements/:id
 * Delete an announcement.
 */
router.delete('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Announcement ${req.params.id} deletion — not yet implemented`,
  });
});

export default router;
