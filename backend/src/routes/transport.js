import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/transport/routes
 * Fetch all transport routes
 */
router.get('/routes', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transport_routes')
      .select('*')
      .order('name', { ascending: true });

    if (error) return sendError(res, { message: 'Failed to fetch routes.', statusCode: 500 });
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/transport/routes
 * Create a new route (Admin Only)
 */
router.post('/routes', requireRoles('admin'), async (req, res, next) => {
  try {
    const { name, vehicle_details, driver_name, driver_phone, fee } = req.body;
    
    const errors = validateRequired(req.body, ['name', 'fee']);
    if (errors) return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });

    const { data, error } = await supabaseAdmin
      .from('transport_routes')
      .insert({ name, vehicle_details, driver_name, driver_phone, fee })
      .select()
      .single();

    if (error) return sendError(res, { message: 'Failed to create route.', statusCode: 500 });
    sendSuccess(res, { data, message: 'Route created successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/transport/assignments
 * Get assignments for a specific route or student
 */
router.get('/assignments', requireRoles('admin'), async (req, res, next) => {
  try {
    const { route_id } = req.query;
    let query = supabaseAdmin
      .from('transport_assignments')
      .select('*, students(first_name, last_name, admission_number, classes(name))')
      .order('assigned_date', { ascending: false });

    if (route_id) query = query.eq('route_id', route_id);

    const { data, error } = await query;
    if (error) return sendError(res, { message: 'Failed to fetch assignments.', statusCode: 500 });
    
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/transport/assignments
 * Assign a student to a route
 */
router.post('/assignments', requireRoles('admin'), async (req, res, next) => {
  try {
    const { route_id, student_id } = req.body;
    const errors = validateRequired(req.body, ['route_id', 'student_id']);
    if (errors) return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });

    const { data, error } = await supabaseAdmin
      .from('transport_assignments')
      .insert({ route_id, student_id })
      .select('*, students(first_name, last_name, admission_number)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return sendError(res, { message: 'Student is already assigned to this route.', statusCode: 400 });
      }
      return sendError(res, { message: 'Failed to assign student.', statusCode: 500 });
    }

    sendSuccess(res, { data, message: 'Student assigned successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/transport/assignments/:id
 * Remove a student from a route
 */
router.delete('/assignments/:id', requireRoles('admin'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('transport_assignments')
      .delete()
      .eq('id', req.params.id);

    if (error) return sendError(res, { message: 'Failed to remove assignment.', statusCode: 500 });
    sendSuccess(res, { message: 'Assignment removed successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
