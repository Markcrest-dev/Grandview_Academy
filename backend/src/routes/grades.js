import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const VALID_ASSESSMENT_TYPES = ['ca1', 'ca2', 'ca3', 'exam', 'project', 'practical'];

/**
 * GET /api/grades
 * List grades with filters: student_id, subject_id, class_id, term_id.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { student_id, subject_id, class_id, term_id } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    let query = supabaseAdmin
      .from('grades')
      .select('*, students(id, first_name, last_name, admission_number), subjects(id, name, code)', { count: 'exact' });

    if (student_id) query = query.eq('student_id', student_id);
    if (subject_id) query = query.eq('subject_id', subject_id);
    if (class_id) query = query.eq('class_id', class_id);
    if (term_id) query = query.eq('term_id', term_id);

    const { data: grades, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch grades: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: grades,
      message: 'Grades fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/grades/student/:id
 * Get all grades for a specific student, compiled for report card presentation.
 */
router.get('/student/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: grades, error } = await supabaseAdmin
      .from('grades')
      .select('*, subjects(name, code, level), classes(name), terms(name, academic_year_id)')
      .eq('student_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return sendError(res, { message: `Failed to fetch student report: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: grades,
      message: 'Student grades report fetched successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/grades
 * Enter grades for students.
 * Body: { subject_id, class_id, term_id, assessment_type, entries: [{ student_id, score, max_score, remarks }] }
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const errors = validateRequired(req.body, ['subject_id', 'class_id', 'term_id', 'assessment_type']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    const { subject_id, class_id, term_id, assessment_type, entries } = req.body;

    if (!isEnum(assessment_type, VALID_ASSESSMENT_TYPES)) {
      return sendError(res, {
        message: `Invalid assessment_type. Must be one of: ${VALID_ASSESSMENT_TYPES.join(', ')}`,
        statusCode: 400
      });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return sendError(res, { message: 'entries must be a non-empty array of { student_id, score, max_score }', statusCode: 400 });
    }

    // Validate grades range check score >= 0 and score <= max_score
    for (const entry of entries) {
      const maxScore = entry.max_score ?? 100.00;
      if (entry.score < 0 || entry.score > maxScore) {
        return sendError(res, {
          message: `Validation failed: Score ${entry.score} is out of bounds for max score ${maxScore}`,
          statusCode: 400
        });
      }
    }

    // 1. Resolve staff profile of logged-in user
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

    // 2. Safely clear any duplicate records matching context to prevent duplicate entry
    const studentIds = entries.map(e => e.student_id);
    const { error: delError } = await supabaseAdmin
      .from('grades')
      .delete()
      .eq('subject_id', subject_id)
      .eq('class_id', class_id)
      .eq('term_id', term_id)
      .eq('assessment_type', assessment_type)
      .in('student_id', studentIds);

    if (delError) {
      return sendError(res, { message: `Failed to clear existing grades: ${delError.message}`, statusCode: 500 });
    }

    // 3. Build rows for bulk insertion
    const rows = entries.map(entry => ({
      student_id: entry.student_id,
      subject_id,
      class_id,
      term_id,
      assessment_type,
      score: entry.score,
      max_score: entry.max_score ?? 100.00,
      remarks: entry.remarks || null,
      entered_by: staffId
    }));

    // 4. Batch insert
    const { data: inserted, error: insError } = await supabaseAdmin
      .from('grades')
      .insert(rows)
      .select();

    if (insError) {
      return sendError(res, { message: `Failed to save grades: ${insError.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: { recorded: inserted.length },
      message: 'Grades recorded successfully.',
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/grades/performance
 * Get aggregated performance reports for a class and term.
 */
router.get('/performance', requireAuth, async (req, res, next) => {
  try {
    const { class_id, term_id } = req.query;
    
    if (!class_id) {
      return sendError(res, { message: 'class_id is required', statusCode: 400 });
    }
    
    let query = supabaseAdmin
      .from('grades')
      .select('*, students(id, first_name, last_name, admission_number)')
      .eq('class_id', class_id);
      
    if (term_id) {
      query = query.eq('term_id', term_id);
    }
    
    const { data: grades, error } = await query;
    if (error) throw error;
    
    // Group by student
    const studentMap = {};
    
    for (const g of grades) {
      if (!g.students) continue; // safety
      const sid = g.student_id;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          student: g.students,
          totalScore: 0,
          totalMax: 0,
          entries: 0
        };
      }
      studentMap[sid].totalScore += Number(g.score);
      studentMap[sid].totalMax += Number(g.max_score);
      studentMap[sid].entries += 1;
    }
    
    const performance = Object.values(studentMap).map(item => {
      const average = item.totalMax > 0 ? (item.totalScore / item.totalMax) * 100 : 0;
      let letterGrade = 'F';
      if (average >= 70) letterGrade = 'A';
      else if (average >= 60) letterGrade = 'B';
      else if (average >= 50) letterGrade = 'C';
      else if (average >= 40) letterGrade = 'D';
      
      return {
        student: item.student,
        average_score: parseFloat(average.toFixed(2)),
        letter_grade: letterGrade,
        total_entries: item.entries
      };
    });
    
    // Sort by highest average
    performance.sort((a, b) => b.average_score - a.average_score);
    
    sendSuccess(res, {
      data: performance,
      message: 'Performance reports generated.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
