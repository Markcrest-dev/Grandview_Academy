import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

// Only Admins and Non-Teaching Staff (Security) should manage visitors
router.use(requireAuth);
router.use(requireRoles('admin', 'non_teaching_staff'));

/**
 * GET /api/visitors
 * Get a list of all visitors (recent first)
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('visitors')
      .select('*, recorded_by_user:users!recorded_by(email)')
      .order('sign_in_time', { ascending: false })
      .limit(Number(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, { message: 'Failed to fetch visitors.', statusCode: 500 });
    }

    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/visitors
 * Log a new visitor
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, purpose, host_name } = req.body;
    
    const errors = validateRequired(req.body, ['name', 'purpose', 'host_name']);
    if (errors) {
      return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('visitors')
      .insert({
        name,
        phone,
        purpose,
        host_name,
        recorded_by: req.user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return sendError(res, { message: 'Failed to log visitor.', statusCode: 500 });
    }

    sendSuccess(res, { data, message: 'Visitor logged successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/visitors/:id/sign-out
 * Mark a visitor as signed out
 */
router.patch('/:id/sign-out', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('visitors')
      .update({
        status: 'signed_out',
        sign_out_time: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, { message: 'Failed to sign out visitor.', statusCode: 500 });
    }

    sendSuccess(res, { data, message: 'Visitor signed out.' });
  } catch (err) {
    next(err);
  }
});

export default router;
