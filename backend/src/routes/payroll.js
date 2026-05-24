import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Basic auth check for finance/admin
const requireFinanceRole = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  
  if (req.user.role === 'non_teaching_staff') {
    const { data } = await supabaseAdmin.from('staff').select('department').eq('user_id', req.user.id).single();
    if (data && data.department && data.department.toLowerCase().includes('bursary')) {
      return next();
    }
  }
  
  return sendError(res, { message: 'Forbidden. Finance/Admin role required.', statusCode: 403 });
};

/**
 * GET /api/payroll
 * Fetch payroll records
 */
router.get('/', requireFinanceRole, async (req, res, next) => {
  try {
    const { month, year } = req.query;
    let query = supabaseAdmin
      .from('payroll_records')
      .select('*, staff(first_name, last_name, employee_id, department, designation)')
      .order('created_at', { ascending: false });

    if (month) query = query.eq('month', month);
    if (year) query = query.eq('year', year);

    const { data, error } = await query;
    if (error) return sendError(res, { message: 'Failed to fetch payroll records.', statusCode: 500 });
    
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payroll/generate
 * Generate empty payroll records for all active staff for a specific month/year
 */
router.post('/generate', requireFinanceRole, async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const errors = validateRequired(req.body, ['month', 'year']);
    if (errors) return sendError(res, { message: 'Missing month or year.', errors, statusCode: 400 });

    // Fetch all staff
    const { data: staffList, error: staffErr } = await supabaseAdmin
      .from('staff')
      .select('id, base_salary')
      .eq('status', 'active');
      
    if (staffErr) return sendError(res, { message: 'Failed to fetch staff.', statusCode: 500 });

    // Prepare payroll records (assuming staff table doesn't have base_salary yet, default to 0)
    const records = staffList.map(s => ({
      staff_id: s.id,
      base_salary: s.base_salary || 0,
      month,
      year,
      status: 'pending'
    }));

    if (records.length === 0) {
      return sendSuccess(res, { message: 'No active staff found to generate payroll.' });
    }

    const { data, error } = await supabaseAdmin
      .from('payroll_records')
      .insert(records)
      .select();

    if (error) {
      if (error.code === '23505') return sendError(res, { message: 'Payroll for this month/year already generated.', statusCode: 400 });
      return sendError(res, { message: 'Failed to generate payroll.', statusCode: 500 });
    }

    sendSuccess(res, { data, message: `Generated ${data.length} payroll records.` });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/payroll/:id
 * Update payroll details (salary, bonus, deductions)
 */
router.patch('/:id', requireFinanceRole, async (req, res, next) => {
  try {
    const { base_salary, bonus, deductions } = req.body;
    
    const updates = {};
    if (base_salary !== undefined) updates.base_salary = base_salary;
    if (bonus !== undefined) updates.bonus = bonus;
    if (deductions !== undefined) updates.deductions = deductions;

    const { data, error } = await supabaseAdmin
      .from('payroll_records')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, staff(first_name, last_name)')
      .single();

    if (error) return sendError(res, { message: 'Failed to update payroll record.', statusCode: 500 });
    sendSuccess(res, { data, message: 'Payroll record updated.' });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/payroll/:id/pay
 * Mark a record as paid
 */
router.patch('/:id/pay', requireFinanceRole, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payroll_records')
      .update({ status: 'paid', payment_date: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, staff(first_name, last_name)')
      .single();

    if (error) return sendError(res, { message: 'Failed to mark as paid.', statusCode: 500 });
    sendSuccess(res, { data, message: 'Salary marked as paid.' });
  } catch (err) {
    next(err);
  }
});

export default router;
