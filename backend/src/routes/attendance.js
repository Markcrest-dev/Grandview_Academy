import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum, isValidDate } from '../utils/validators.js';

const router = Router();

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];

/**
 * GET /api/attendance
 * List attendance records with filters: class_id, date, term_id.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: 'Attendance listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/attendance/student/:id
 * Get attendance history for a specific student.
 */
router.get('/student/:id', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: `Attendance for student ${req.params.id} — not yet implemented`,
    pagination: { page, limit, total: 0 },
  });
});

/**
 * POST /api/attendance
 * Record attendance for a class on a given date.
 * Body: { class_id, date, records: [{ student_id, status }] }
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['class_id', 'date']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  if (!isValidDate(req.body.date)) {
    return sendError(res, { message: 'Invalid date format. Use YYYY-MM-DD' });
  }

  if (!Array.isArray(req.body.records) || req.body.records.length === 0) {
    return sendError(res, { message: 'records must be a non-empty array of { student_id, status }' });
  }

  // Validate each record's status
  for (const record of req.body.records) {
    if (!isEnum(record.status, VALID_STATUSES)) {
      return sendError(res, {
        message: `Invalid status "${record.status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }
  }

  sendSuccess(res, {
    data: { recorded: req.body.records.length },
    message: 'Attendance recording — not yet implemented',
    statusCode: 201,
  });
});

export default router;
