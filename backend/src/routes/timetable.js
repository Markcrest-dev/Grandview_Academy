import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired, isEnum } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * GET /api/timetable/class/:id
 * Get the full timetable for a class.
 */
router.get('/class/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: slots, error } = await supabaseAdmin
      .from('timetable_slots')
      .select('*, subjects(id, name, code), staff(id, first_name, last_name)')
      .eq('class_id', id);

    if (error) {
      return sendError(res, { message: `Failed to fetch timetable: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: slots,
      message: 'Class timetable retrieved successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/timetable/teacher/:id
 * Get the timetable for a specific teacher (all their slots).
 */
router.get('/teacher/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: slots, error } = await supabaseAdmin
      .from('timetable_slots')
      .select('*, classes(id, name), subjects(id, name, code)')
      .eq('teacher_id', id);

    if (error) {
      return sendError(res, { message: `Failed to fetch teacher schedule: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: slots,
      message: 'Teacher schedule retrieved successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/timetable
 * Create a new timetable slot.
 */
router.post('/', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const errors = validateRequired(req.body, ['class_id', 'subject_id', 'teacher_id', 'day_of_week', 'start_time', 'end_time']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;

    if (!isEnum(day_of_week, VALID_DAYS)) {
      return sendError(res, {
        message: `Invalid day_of_week. Must be one of: ${VALID_DAYS.join(', ')}`,
        statusCode: 400
      });
    }

    const { data: newSlot, error } = await supabaseAdmin
      .from('timetable_slots')
      .insert({
        class_id,
        subject_id,
        teacher_id,
        day_of_week,
        start_time,
        end_time,
        room: room || null
      })
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to create timetable slot: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: newSlot,
      message: 'Timetable slot created successfully.',
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/timetable/:id
 * Update a timetable slot.
 */
router.put('/:id', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;

    if (day_of_week && !isEnum(day_of_week, VALID_DAYS)) {
      return sendError(res, {
        message: `Invalid day_of_week. Must be one of: ${VALID_DAYS.join(', ')}`,
        statusCode: 400
      });
    }

    const updateData = {};
    if (class_id !== undefined) updateData.class_id = class_id;
    if (subject_id !== undefined) updateData.subject_id = subject_id;
    if (teacher_id !== undefined) updateData.teacher_id = teacher_id;
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (room !== undefined) updateData.room = room;

    const { data: updated, error } = await supabaseAdmin
      .from('timetable_slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to update timetable slot: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: updated,
      message: 'Timetable slot updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/timetable/:id
 * Delete a timetable slot.
 */
router.delete('/:id', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('timetable_slots')
      .delete()
      .eq('id', id);

    if (error) {
      return sendError(res, { message: `Failed to delete timetable slot: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: null,
      message: 'Timetable slot deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;

