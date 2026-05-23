import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';

const router = Router();

const VALID_ASSESSMENT_TYPES = ['ca1', 'ca2', 'ca3', 'exam', 'project', 'practical'];

/**
 * GET /api/grades
 * List grades with filters: student_id, subject_id, class_id, term_id.
 */
router.get('/', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: 'Grade listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/grades/student/:id
 * Get all grades for a specific student.
 */
router.get('/student/:id', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: `Grades for student ${req.params.id} — not yet implemented`,
    pagination: { page, limit, total: 0 },
  });
});

/**
 * POST /api/grades
 * Enter grades for students.
 * Body: { subject_id, class_id, term_id, assessment_type, entries: [{ student_id, score, max_score }] }
 */
router.post('/', (req, res) => {
  const errors = validateRequired(req.body, ['subject_id', 'class_id', 'term_id', 'assessment_type']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  if (!isEnum(req.body.assessment_type, VALID_ASSESSMENT_TYPES)) {
    return sendError(res, {
      message: `Invalid assessment_type. Must be one of: ${VALID_ASSESSMENT_TYPES.join(', ')}`,
    });
  }

  if (!Array.isArray(req.body.entries) || req.body.entries.length === 0) {
    return sendError(res, { message: 'entries must be a non-empty array of { student_id, score, max_score }' });
  }

  sendSuccess(res, {
    data: { recorded: req.body.entries.length },
    message: 'Grade entry — not yet implemented',
    statusCode: 201,
  });
});

export default router;
