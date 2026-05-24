import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const DB_PATH = path.resolve(process.cwd(), 'src/data/course_registration.json');

// Helper to read DB
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { registrations: [] };
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { registrations: [] };
  }
}

// Helper to write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing course registration DB:', err);
    return false;
  }
}

/**
 * GET /api/academics/registration
 * Get a student's registered courses (electives)
 */
router.get('/registration', requireAuth, (req, res) => {
  try {
    const { student_id } = req.query;
    if (!student_id) return sendError(res, { message: 'student_id is required', statusCode: 400 });

    const db = readDb();
    const studentReg = db.registrations.find(r => r.student_id === student_id);

    sendSuccess(res, {
      data: studentReg ? studentReg.subject_ids : [],
      message: 'Course registrations fetched successfully.'
    });
  } catch (err) {
    sendError(res, { message: err.message, statusCode: 500 });
  }
});

/**
 * POST /api/academics/registration
 * Save a student's registered courses (electives)
 */
router.post('/registration', requireAuth, (req, res) => {
  try {
    const { student_id, subject_ids } = req.body;
    if (!student_id || !Array.isArray(subject_ids)) {
      return sendError(res, { message: 'student_id and an array of subject_ids are required', statusCode: 400 });
    }

    const db = readDb();
    const index = db.registrations.findIndex(r => r.student_id === student_id);

    if (index !== -1) {
      db.registrations[index].subject_ids = subject_ids;
      db.registrations[index].updated_at = new Date().toISOString();
    } else {
      db.registrations.push({
        student_id,
        subject_ids,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    writeDb(db);

    sendSuccess(res, {
      data: subject_ids,
      message: 'Course registration saved successfully.'
    });
  } catch (err) {
    sendError(res, { message: err.message, statusCode: 500 });
  }
});

/**
 * GET /api/academics/at-risk
 * AI Performance Prediction logic (At-Risk Flagging)
 * Scans student grades and attendance to identify struggling students
 */
router.get('/at-risk', requireRoles('admin', 'teaching_staff'), async (req, res, next) => {
  try {
    // 1. Fetch active students with their class info
    const { data: students, error: studentErr } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name, admission_number, classes(name)')
      .eq('status', 'active');
      
    if (studentErr) throw studentErr;

    // 2. Fetch all grades to calculate averages
    const { data: grades, error: gradeErr } = await supabaseAdmin
      .from('grades')
      .select('student_id, score');
      
    if (gradeErr) throw gradeErr;

    // 3. Fetch attendance
    const { data: attendance, error: attErr } = await supabaseAdmin
      .from('attendance')
      .select('student_id, status');
      
    if (attErr) throw attErr;

    const atRiskStudents = [];

    // Process each student
    for (const student of students) {
      // Calculate Grade Average
      const studentGrades = grades.filter(g => g.student_id === student.id);
      let avgScore = 100; // default to good if no grades yet
      if (studentGrades.length > 0) {
        const totalScore = studentGrades.reduce((sum, g) => sum + Number(g.score), 0);
        avgScore = totalScore / studentGrades.length;
      }

      // Calculate Attendance Rate
      const studentAtt = attendance.filter(a => a.student_id === student.id);
      let attendanceRate = 100;
      if (studentAtt.length > 0) {
        const presentCount = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        attendanceRate = (presentCount / studentAtt.length) * 100;
      }

      // Flagging Logic (AI Model placeholder heuristics)
      // At-risk if Average Score < 50 OR Attendance Rate < 75%
      const isAtRisk = avgScore < 50 || attendanceRate < 75;

      if (isAtRisk) {
        let riskFactors = [];
        if (avgScore < 50) riskFactors.push(`Low Grades (${avgScore.toFixed(1)}%)`);
        if (attendanceRate < 75) riskFactors.push(`Poor Attendance (${attendanceRate.toFixed(1)}%)`);

        atRiskStudents.push({
          ...student,
          avg_score: avgScore,
          attendance_rate: attendanceRate,
          risk_factors: riskFactors,
          risk_level: avgScore < 40 || attendanceRate < 60 ? 'High' : 'Moderate'
        });
      }
    }

    sendSuccess(res, { data: atRiskStudents });
  } catch (err) {
    next(err);
  }
});

export default router;
