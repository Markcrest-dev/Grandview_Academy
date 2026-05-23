import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum, isValidDate } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];

/**
 * GET /api/attendance
 * List attendance records with filters: class_id, date, term_id.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { class_id, date, term_id } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    let query = supabaseAdmin
      .from('attendance')
      .select('*, students(id, first_name, last_name, admission_number)', { count: 'exact' });

    if (class_id) {
      query = query.eq('class_id', class_id);
    }
    if (date) {
      if (!isValidDate(date)) {
        return sendError(res, { message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      query = query.eq('date', date);
    }
    if (term_id) {
      query = query.eq('term_id', term_id);
    }

    const { data: records, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch attendance: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: records,
      message: 'Attendance records fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/attendance/student/:id
 * Get attendance history and stats for a specific student.
 */
router.get('/student/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch all attendance records for this student
    const { data: records, error } = await supabaseAdmin
      .from('attendance')
      .select('*, classes(name), terms(name)')
      .eq('student_id', id)
      .order('date', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch attendance history: ${error.message}`, statusCode: 500 });
    }

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 100;

    sendSuccess(res, {
      data: {
        records,
        stats: {
          total,
          present,
          late,
          absent,
          excused,
          rate
        }
      },
      message: 'Student attendance history fetched successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/attendance
 * Record attendance for a class on a given date.
 * Body: { class_id, date, term_id, records: [{ student_id, status, remarks }] }
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const errors = validateRequired(req.body, ['class_id', 'date']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    const { class_id, date, term_id, records } = req.body;

    if (!isValidDate(date)) {
      return sendError(res, { message: 'Invalid date format. Use YYYY-MM-DD', statusCode: 400 });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return sendError(res, { message: 'records must be a non-empty array of { student_id, status, remarks }', statusCode: 400 });
    }

    // Validate each record's status
    for (const record of records) {
      if (!isEnum(record.status, VALID_STATUSES)) {
        return sendError(res, {
          message: `Invalid status "${record.status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
          statusCode: 400
        });
      }
    }

    // 1. Resolve active term if not explicitly passed
    let termId = term_id;
    if (!termId) {
      const { data: currentTerm } = await supabaseAdmin
        .from('terms')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      if (!currentTerm) {
        return sendError(res, { message: 'No active academic term configured in the system.', statusCode: 400 });
      }
      termId = currentTerm.id;
    }

    // 2. Resolve staff profile of logged-in user if they are faculty
    let staffId = null;
    if (req.user.role === 'teaching_staff' || req.user.role === 'non_teaching_staff') {
      const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('id')
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (staff) {
        staffId = staff.id;
      }
    }

    // 3. Prepare rows for bulk upsert
    const rows = records.map(record => ({
      student_id: record.student_id,
      class_id,
      term_id: termId,
      date,
      status: record.status,
      remarks: record.remarks || null,
      marked_by: staffId
    }));

    // 4. Perform bulk upsert on conflict of (student_id, date)
    const { data: upserted, error } = await supabaseAdmin
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,date' })
      .select();

    if (error) {
      return sendError(res, { message: `Failed to upsert attendance: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: { recorded: upserted.length },
      message: 'Attendance records saved successfully.',
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

export default router;

