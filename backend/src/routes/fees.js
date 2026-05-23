import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired } from '../utils/validators.js';

const router = Router();

/**
 * GET /api/fees/structures
 * List fee structures with filters: academic_year_id, term_id, level.
 */
router.get('/structures', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: 'Fee structure listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * POST /api/fees/structures
 * Create a new fee structure entry.
 */
router.post('/structures', (req, res) => {
  const errors = validateRequired(req.body, ['academic_year_id', 'term_id', 'level', 'fee_type', 'amount']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', ...req.body },
    message: 'Fee structure creation — not yet implemented',
    statusCode: 201,
  });
});

/**
 * GET /api/fees/payments
 * List fee payments with filters: student_id, term_id.
 */
router.get('/payments', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: 'Fee payment listing — not yet implemented',
    pagination: { page, limit, total: 0 },
  });
});

/**
 * GET /api/fees/payments/student/:id
 * Get fee payment history for a specific student.
 */
router.get('/payments/student/:id', (req, res) => {
  const { page, limit } = parsePagination(req.query);

  sendSuccess(res, {
    data: [],
    message: `Fee payments for student ${req.params.id} — not yet implemented`,
    pagination: { page, limit, total: 0 },
  });
});

/**
 * POST /api/fees/payments
 * Record a fee payment.
 */
router.post('/payments', (req, res) => {
  const errors = validateRequired(req.body, ['student_id', 'fee_structure_id', 'amount_paid', 'payment_method']);
  if (errors) {
    return sendError(res, { message: 'Validation failed', errors });
  }

  sendSuccess(res, {
    data: { id: 'placeholder', receipt_number: 'GA-REC-000000', ...req.body },
    message: 'Fee payment recording — not yet implemented',
    statusCode: 201,
  });
});

export default router;
