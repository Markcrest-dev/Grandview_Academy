import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const DB_PATH = path.resolve(process.cwd(), 'src/data/medical.json');

// Helper to read database
function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading medical DB, resetting:', err);
    return { charts: [], visits: [] };
  }
}

// Helper to write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing medical DB:', err);
    return false;
  }
}

/**
 * GET /api/medical/records
 * Get all medical charts with optional search by name or admission number.
 */
router.get('/records', requireAuth, (req, res) => {
  try {
    const { search } = req.query;
    const db = readDb();
    let results = db.charts;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        c =>
          c.student_name.toLowerCase().includes(q) ||
          c.admission_number.toLowerCase().includes(q)
      );
    }

    sendSuccess(res, {
      data: results,
      message: 'Student medical charts retrieved successfully.'
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

/**
 * POST /api/medical/records
 * Create or update a student medical chart.
 * Restricted to Nurse and Admin.
 */
router.post('/records', requireAuth, requireRoles('admin', 'non_teaching_staff'), async (req, res) => {
  try {
    const {
      admission_number,
      blood_group,
      genotype,
      allergies,
      chronic_conditions,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history
    } = req.body;

    const errors = validateRequired(req.body, ['admission_number', 'blood_group', 'genotype']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    // 1. Verify student exists in Supabase
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('admission_number', admission_number)
      .maybeSingle();

    if (studentError || !student) {
      return sendError(res, { message: `Student with Admission Number "${admission_number}" not found.`, statusCode: 404 });
    }

    const db = readDb();
    const student_name = `${student.first_name} ${student.last_name}`;

    // 2. Find if chart already exists
    const chartIndex = db.charts.findIndex(c => c.admission_number === admission_number);

    const chartData = {
      id: chartIndex !== -1 ? db.charts[chartIndex].id : `chart-${Date.now()}`,
      student_id: student.id,
      student_name,
      admission_number,
      blood_group,
      genotype,
      allergies: allergies || 'None reported',
      chronic_conditions: chronic_conditions || 'None',
      emergency_contact_name: emergency_contact_name || 'Not provided',
      emergency_contact_phone: emergency_contact_phone || 'Not provided',
      medical_history: medical_history || 'No significant history.'
    };

    if (chartIndex !== -1) {
      db.charts[chartIndex] = chartData;
    } else {
      db.charts.push(chartData);
    }

    writeDb(db);

    sendSuccess(res, {
      data: chartData,
      message: `Medical file for ${student_name} saved successfully.`
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

/**
 * GET /api/medical/visits
 * List all clinical clinic visits.
 */
router.get('/visits', requireAuth, (req, res) => {
  try {
    const db = readDb();
    sendSuccess(res, {
      data: db.visits,
      message: 'Clinic visit logs retrieved successfully.'
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

/**
 * POST /api/medical/visits
 * Log a new clinic room sickbay visit.
 * Restricted to Nurse and Admin.
 */
router.post('/visits', requireAuth, requireRoles('admin', 'non_teaching_staff'), async (req, res) => {
  try {
    const { admission_number, symptoms, diagnosis, treatment, nurse_remarks } = req.body;
    const errors = validateRequired(req.body, ['admission_number', 'symptoms', 'diagnosis', 'treatment']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    // 1. Verify student exists in Supabase
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('admission_number', admission_number)
      .maybeSingle();

    if (studentError || !student) {
      return sendError(res, { message: `Student with Admission Number "${admission_number}" not found.`, statusCode: 404 });
    }

    const db = readDb();
    const student_name = `${student.first_name} ${student.last_name}`;

    const newVisit = {
      id: `visit-${Date.now()}`,
      student_id: student.id,
      student_name,
      admission_number,
      visit_date: new Date().toISOString(),
      symptoms,
      diagnosis,
      treatment,
      nurse_remarks: nurse_remarks || ''
    };

    db.visits.unshift(newVisit);
    writeDb(db);

    sendSuccess(res, {
      data: newVisit,
      message: `Sickbay visit successfully logged for ${student_name}.`,
      statusCode: 201
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

export default router;
