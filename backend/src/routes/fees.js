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

// ============================================================
// PAYSTACK PAYMENT INTEGRATION
// ============================================================

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_CALLBACK = process.env.PAYSTACK_CALLBACK_URL || '';

/**
 * POST /api/fees/pay/initialize
 * Initialize a Paystack transaction. Returns an authorization URL.
 * Body: { student_id, fee_structure_id, amount, email }
 */
router.post('/pay/initialize', requireAuth, requireRoles('parent', 'admin', 'non_teaching_staff'), async (req, res, next) => {
  try {
    const errs = validateRequired(req.body, ['student_id', 'fee_structure_id', 'amount', 'email']);
    if (errs) return sendError(res, { message: 'Validation failed', errors: errs, statusCode: 400 });

    const { student_id, fee_structure_id, amount, email } = req.body;
    const amountKobo = Math.round(parseFloat(amount) * 100); // Paystack uses kobo (smallest unit)

    if (amountKobo <= 0) return sendError(res, { message: 'Amount must be greater than 0.', statusCode: 400 });

    if (!PAYSTACK_SECRET) {
      return sendError(res, { message: 'Payment gateway not configured. Contact administration.', statusCode: 503 });
    }

    const reference = `GA-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        callback_url: PAYSTACK_CALLBACK || undefined,
        metadata: {
          student_id,
          fee_structure_id,
          user_id: req.user.id,
        },
      }),
    });

    const result = await response.json();
    if (!result.status) {
      return sendError(res, { message: result.message || 'Failed to initialize payment.', statusCode: 502 });
    }

    sendSuccess(res, {
      data: {
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      },
      message: 'Payment initialized. Redirect user to authorization_url.',
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/fees/pay/verify
 * Verify a Paystack payment after redirect.
 * Query: ?reference=xxx
 */
router.get('/pay/verify', requireAuth, async (req, res, next) => {
  try {
    const { reference } = req.query;
    if (!reference) return sendError(res, { message: 'Payment reference required.', statusCode: 400 });

    if (!PAYSTACK_SECRET) {
      return sendError(res, { message: 'Payment gateway not configured.', statusCode: 503 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });

    const result = await response.json();
    if (!result.status || result.data.status !== 'success') {
      return sendError(res, { message: 'Payment verification failed or not yet completed.', statusCode: 400 });
    }

    const { metadata, amount: amountKobo } = result.data;
    const amountNaira = amountKobo / 100;

    // Check if this reference was already recorded
    const { data: existingPayment } = await supabaseAdmin
      .from('fee_payments')
      .select('id')
      .eq('receipt_number', reference)
      .maybeSingle();

    if (existingPayment) {
      return sendSuccess(res, { data: existingPayment, message: 'Payment already recorded.' });
    }

    // Record the payment
    const { data: payment, error } = await supabaseAdmin
      .from('fee_payments')
      .insert({
        student_id: metadata.student_id,
        fee_structure_id: metadata.fee_structure_id,
        amount_paid: amountNaira,
        payment_method: 'paystack',
        payment_date: new Date().toISOString().split('T')[0],
        receipt_number: reference,
        recorded_by: null,
        remarks: `Online payment via Paystack. Ref: ${reference}`,
      })
      .select('*, students(*), fee_structures(*)')
      .single();

    if (error) return sendError(res, { message: error.message, statusCode: 500 });

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: metadata.user_id || req.user.id,
      action: 'ONLINE_FEE_PAYMENT',
      entity_type: 'fee_payment',
      entity_id: payment.id,
      details: { amount: amountNaira, reference, method: 'paystack' },
      ip_address: req.ip,
    });

    // Notify the parent
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: req.user.id,
        title: '✅ Payment Confirmed',
        body: `Your payment of ₦${amountNaira.toLocaleString()} has been confirmed. Receipt: ${reference}`,
        type: 'fee',
        reference_id: payment.id,
      });
    } catch (e) {}

    sendSuccess(res, { data: payment, message: `Payment verified and recorded. Receipt: ${reference}` });
  } catch (err) { next(err); }
});

/**
 * POST /api/fees/pay/webhook
 * Paystack webhook handler for server-to-server payment confirmation.
 */
router.post('/pay/webhook', async (req, res, next) => {
  try {
    // Paystack sends a hash in the x-paystack-signature header
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const { reference, metadata, amount: amountKobo } = data;
      const amountNaira = amountKobo / 100;

      // Check if already recorded
      const { data: existing } = await supabaseAdmin
        .from('fee_payments')
        .select('id')
        .eq('receipt_number', reference)
        .maybeSingle();

      if (!existing && metadata?.student_id && metadata?.fee_structure_id) {
        await supabaseAdmin.from('fee_payments').insert({
          student_id: metadata.student_id,
          fee_structure_id: metadata.fee_structure_id,
          amount_paid: amountNaira,
          payment_method: 'paystack',
          payment_date: new Date().toISOString().split('T')[0],
          receipt_number: reference,
          remarks: `Webhook confirmed. Ref: ${reference}`,
        });
      }
    }

    res.status(200).send('OK');
  } catch (err) { next(err); }
});

// ============================================================
// PAYMENT RECEIPT GENERATOR
// ============================================================

/**
 * GET /api/fees/receipts/:payment_id
 * Returns structured receipt data for a specific payment.
 */
router.get('/receipts/:payment_id', requireAuth, async (req, res, next) => {
  try {
    const { payment_id } = req.params;

    const { data: payment, error } = await supabaseAdmin
      .from('fee_payments')
      .select('*, students(id, first_name, last_name, admission_number, classes(name, level)), fee_structures(*, terms(name), academic_years(name))')
      .eq('id', payment_id)
      .maybeSingle();

    if (error || !payment) {
      return sendError(res, { message: 'Payment record not found.', statusCode: 404 });
    }

    const receipt = {
      school: {
        name: 'Grandview Academy',
        tagline: 'Excellence Rooted in Tradition',
        address: 'Grandview Academy, Lagos, Nigeria',
        email: 'registrar@grandview.edu.ng',
      },
      student: {
        name: `${payment.students?.first_name || ''} ${payment.students?.last_name || ''}`,
        admissionNumber: payment.students?.admission_number || '',
        class: payment.students?.classes?.name || '',
        level: payment.students?.classes?.level || '',
      },
      payment: {
        id: payment.id,
        receiptNumber: payment.receipt_number,
        amount: payment.amount_paid,
        method: payment.payment_method,
        date: payment.payment_date,
        remarks: payment.remarks,
      },
      fee: {
        type: payment.fee_structures?.fee_type || '',
        description: payment.fee_structures?.description || '',
        term: payment.fee_structures?.terms?.name || '',
        academicYear: payment.fee_structures?.academic_years?.name || '',
      },
      generatedAt: new Date().toISOString(),
    };

    sendSuccess(res, { data: receipt, message: 'Receipt generated successfully.' });
  } catch (err) { next(err); }
});

export default router;
