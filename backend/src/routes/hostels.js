import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/hostels
 * Fetch all hostels
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hostels')
      .select('*')
      .order('name', { ascending: true });

    if (error) return sendError(res, { message: 'Failed to fetch hostels.', statusCode: 500 });
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hostels
 * Create a new hostel (Admin Only)
 */
router.post('/', requireRoles('admin'), async (req, res, next) => {
  try {
    const { name, gender_type, capacity, fee } = req.body;
    
    const errors = validateRequired(req.body, ['name', 'gender_type', 'capacity', 'fee']);
    if (errors) return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });

    const { data, error } = await supabaseAdmin
      .from('hostels')
      .insert({ name, gender_type, capacity, fee })
      .select()
      .single();

    if (error) return sendError(res, { message: 'Failed to create hostel.', statusCode: 500 });
    sendSuccess(res, { data, message: 'Hostel created successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hostels/allocations
 * Get allocations for a specific hostel or student
 */
router.get('/allocations', requireRoles('admin'), async (req, res, next) => {
  try {
    const { hostel_id } = req.query;
    let query = supabaseAdmin
      .from('hostel_allocations')
      .select('*, students(first_name, last_name, admission_number, classes(name))')
      .order('allocated_date', { ascending: false });

    if (hostel_id) query = query.eq('hostel_id', hostel_id);

    const { data, error } = await query;
    if (error) return sendError(res, { message: 'Failed to fetch allocations.', statusCode: 500 });
    
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hostels/allocations
 * Allocate a student to a hostel room
 */
router.post('/allocations', requireRoles('admin'), async (req, res, next) => {
  try {
    const { hostel_id, student_id, room_number } = req.body;
    const errors = validateRequired(req.body, ['hostel_id', 'student_id']);
    if (errors) return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });

    const { data, error } = await supabaseAdmin
      .from('hostel_allocations')
      .insert({ hostel_id, student_id, room_number })
      .select('*, students(first_name, last_name, admission_number)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return sendError(res, { message: 'Student is already allocated to this hostel.', statusCode: 400 });
      }
      return sendError(res, { message: 'Failed to allocate student.', statusCode: 500 });
    }

    sendSuccess(res, { data, message: 'Student allocated successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/hostels/allocations/:id
 * Remove a student from a hostel
 */
router.delete('/allocations/:id', requireRoles('admin'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('hostel_allocations')
      .delete()
      .eq('id', req.params.id);

    if (error) return sendError(res, { message: 'Failed to remove allocation.', statusCode: 500 });
    sendSuccess(res, { message: 'Allocation removed successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
