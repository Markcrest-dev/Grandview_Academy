import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const VALID_LEVELS = ['primary', 'secondary', 'university'];

/**
 * GET /api/fees/structures
 * List fee structures with optional filters: level, academic_year_id, term_id.
 */
router.get('/structures', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { level, academic_year_id, term_id } = req.query;

    if (level && !VALID_LEVELS.includes(level)) {
      return sendError(res, { message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` });
    }

    let query = supabaseAdmin
      .from('fee_structures')
      .select('*, academic_years(*), terms(*)', { count: 'exact' });

    if (level) {
      query = query.eq('level', level);
    }
    if (academic_year_id) {
      query = query.eq('academic_year_id', academic_year_id);
    }
    if (term_id) {
      query = query.eq('term_id', term_id);
    }

    const { data: structures, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch fee structures: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: structures,
      message: 'Fee structures retrieved successfully.',
      pagination: { page, limit, total: count || 0 }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/fees/structures
 * Create a new fee structure entry.
 * Restricted to admins and non-teaching staff (Bursar).
 */
router.post('/structures', requireAuth, requireRoles('admin', 'non_teaching_staff'), async (req, res, next) => {
  try {
    const { academic_year_id, term_id, level, fee_type, amount, description } = req.body;

    const errors = validateRequired(req.body, ['academic_year_id', 'term_id', 'level', 'fee_type', 'amount']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    if (!VALID_LEVELS.includes(level)) {
      return sendError(res, { message: `Invalid level. Must be: ${VALID_LEVELS.join(', ')}`, statusCode: 400 });
    }

    if (parseFloat(amount) < 0) {
      return sendError(res, { message: 'Amount must be greater than or equal to 0.', statusCode: 400 });
    }

    const { data: newStructure, error } = await supabaseAdmin
      .from('fee_structures')
      .insert({
        academic_year_id,
        term_id,
        level,
        fee_type,
        amount: parseFloat(amount),
        description: description || null
      })
      .select('*, academic_years(*), terms(*)')
      .single();

    if (error) {
      return sendError(res, { message: `Failed to create fee structure: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: newStructure,
      message: 'Fee structure created successfully.',
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/fees/payments
 * List fee payments.
 */
router.get('/payments', requireAuth, requireRoles('admin', 'non_teaching_staff'), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { student_id, term_id } = req.query;

    let query = supabaseAdmin
      .from('fee_payments')
      .select('*, students(*, classes(*)), fee_structures(*, terms(*), academic_years(*))', { count: 'exact' });

    if (student_id) {
      query = query.eq('student_id', student_id);
    }
    if (term_id) {
      // In Postgres we can filter nested structure via joins or filter key
      // If we need to filter payments by the fee structure's term, we can query fee_structures table first, 
      // or filter fee_payments where fee_structure_id is in term
      const { data: structIds } = await supabaseAdmin
        .from('fee_structures')
        .select('id')
        .eq('term_id', term_id);
      const ids = structIds ? structIds.map(s => s.id) : [];
      if (ids.length > 0) {
        query = query.in('fee_structure_id', ids);
      } else {
        return sendSuccess(res, { data: [], message: 'No payments matches.', pagination: { page, limit, total: 0 } });
      }
    }

    const { data: payments, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('payment_date', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch payments: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: payments,
      message: 'Fee payments fetched successfully.',
      pagination: { page, limit, total: count || 0 }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/fees/payments/student/:id
 * Get fee payment history for a specific student.
 */
router.get('/payments/student/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

    const { data: payments, error, count } = await supabaseAdmin
      .from('fee_payments')
      .select('*, fee_structures(*, terms(*), academic_years(*))', { count: 'exact' })
      .eq('student_id', id)
      .range(offset, offset + limit - 1)
      .order('payment_date', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch student payments: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: payments,
      message: 'Student ledger statement fetched successfully.',
      pagination: { page, limit, total: count || 0 }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/fees/payments
 * Record a fee payment.
 * Restricted to admins and non-teaching staff (Bursar).
 */
router.post('/payments', requireAuth, requireRoles('admin', 'non_teaching_staff', 'parent'), async (req, res, next) => {
  try {
    const { student_id, fee_structure_id, amount_paid, payment_method, payment_date, remarks } = req.body;

    const errors = validateRequired(req.body, ['student_id', 'fee_structure_id', 'amount_paid', 'payment_method']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    if (parseFloat(amount_paid) <= 0) {
      return sendError(res, { message: 'Payment amount must be greater than 0.', statusCode: 400 });
    }

    // Load logged-in staff profile to map the recorder
    let recorded_by = null;
    if (req.user.role === 'non_teaching_staff') {
      const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('id')
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (staff) {
        recorded_by = staff.id;
      }
    }

    // Generate unique institutional receipt number
    const receipt_number = `GA-REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: payment, error } = await supabaseAdmin
      .from('fee_payments')
      .insert({
        student_id,
        fee_structure_id,
        amount_paid: parseFloat(amount_paid),
        payment_method,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        receipt_number,
        recorded_by,
        remarks: remarks || null
      })
      .select('*, students(*), fee_structures(*)')
      .single();

    if (error) {
      return sendError(res, { message: `Failed to record fee payment: ${error.message}`, statusCode: 500 });
    }

    // Record an audit log entry
    await supabaseAdmin.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'FEE_PAYMENT_RECORD',
      entity_type: 'fee_payment',
      entity_id: payment.id,
      details: { amount: amount_paid, receipt: receipt_number },
      ip_address: req.ip
    });

    sendSuccess(res, {
      data: payment,
      message: `Tuition fee payment registered successfully. Receipt: ${receipt_number}`,
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

export default router;
