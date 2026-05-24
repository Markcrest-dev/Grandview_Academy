import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { requireAuth } from '../middleware/auth.js';

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

export default router;
