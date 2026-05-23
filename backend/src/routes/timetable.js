import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired, isEnum } from '../utils/validators.js';

const router = Router();

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * GET /api/timetable/class/:id
 * Get the full timetable for a class.
 */
router.get('/class/:id', (req, res) => {
  sendSuccess(res, {
    data: [],
    message: `Timetable for class ${req.params.id} — not yet implemented`,
  });
});

/**
 * GET /api/timetable/teacher/:id
 * Get the timetable for a specific teacher (all their slots).
 */
router.get('/teacher/:id', (req, res) => {
  sendSuccess(res, {
    data: [],
    message: `Timetable for teacher ${req.params.id} — not yet implemented`,
  });
});

/**
 * POST /api/timetable
 * Create a new timetable slot.
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['class_id', 'subject_id', 'teacher_id', 'day_of_week', 'start_time', 'end_time']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  if (!isEnum(req.body.day_of_week, VALID_DAYS)) {
    return sendError(res, {
      message: `Invalid day_of_week. Must be one of: ${VALID_DAYS.join(', ')}`,
    });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', ...req.body },
    message: 'Timetable slot creation — not yet implemented',
    statusCode: 201,
  });
});

/**
 * PUT /api/timetable/:id
 * Update a timetable slot.
 */
router.put('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Timetable slot ${req.params.id} update — not yet implemented`,
  });
});

/**
 * DELETE /api/timetable/:id
 * Delete a timetable slot.
 */
router.delete('/:id', (req, res) => {
  sendSuccess(res, {
    data: null,
    message: `Timetable slot ${req.params.id} deletion — not yet implemented`,
  });
});

export default router;
