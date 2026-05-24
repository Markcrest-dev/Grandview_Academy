import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

// --- ASSIGNMENT CRUD ---

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { class_id, subject_id, term_id, created_by } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    let query = supabaseAdmin.from('assignments')
      .select('*, subjects(id,name,code), classes(id,name,level), staff:created_by(id,first_name,last_name)', { count: 'exact' })
      .eq('is_active', true);
    if (class_id) query = query.eq('class_id', class_id);
    if (subject_id) query = query.eq('subject_id', subject_id);
    if (term_id) query = query.eq('term_id', term_id);
    if (created_by) query = query.eq('created_by', created_by);
    const { data, error, count } = await query.range(offset, offset+limit-1).order('due_date', { ascending: false });
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    sendSuccess(res, { data, message: 'Assignments fetched.', pagination: { page, limit, total: count||0 } });
  } catch (err) { next(err); }
});

router.get('/student/my-assignments', requireAuth, requireRoles('student'), async (req, res, next) => {
  try {
    const { data: student } = await supabaseAdmin.from('students').select('id,class_id').eq('user_id', req.user.id).maybeSingle();
    if (!student) return sendError(res, { message: 'Student profile not found.', statusCode: 404 });
    const { data: assignments, error } = await supabaseAdmin.from('assignments')
      .select('*, subjects(id,name,code), staff:created_by(id,first_name,last_name)')
      .eq('class_id', student.class_id).eq('is_active', true).order('due_date', { ascending: false });
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    const ids = assignments.map(a => a.id);
    let subs = [];
    if (ids.length > 0) {
      const { data: s } = await supabaseAdmin.from('assignment_submissions').select('*').eq('student_id', student.id).in('assignment_id', ids);
      subs = s || [];
    }
    const merged = assignments.map(a => {
      const sub = subs.find(s => s.assignment_id === a.id);
      return { ...a, submission: sub||null, status: sub ? (sub.graded_at ? 'graded' : 'submitted') : (new Date(a.due_date)<new Date() ? 'overdue' : 'pending') };
    });
    sendSuccess(res, { data: merged, message: 'Student assignments fetched.' });
  } catch (err) { next(err); }
});

router.get('/student/:student_id/assignments', requireAuth, requireRoles('parent', 'admin', 'teaching_staff'), async (req, res, next) => {
  try {
    const { student_id } = req.params;
    const { data: student } = await supabaseAdmin.from('students').select('id,class_id').eq('id', student_id).maybeSingle();
    if (!student) return sendError(res, { message: 'Student profile not found.', statusCode: 404 });
    const { data: assignments, error } = await supabaseAdmin.from('assignments')
      .select('*, subjects(id,name,code), staff:created_by(id,first_name,last_name)')
      .eq('class_id', student.class_id).eq('is_active', true).order('due_date', { ascending: false });
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    const ids = assignments.map(a => a.id);
    let subs = [];
    if (ids.length > 0) {
      const { data: s } = await supabaseAdmin.from('assignment_submissions').select('*').eq('student_id', student.id).in('assignment_id', ids);
      subs = s || [];
    }
    const merged = assignments.map(a => {
      const sub = subs.find(s => s.assignment_id === a.id);
      return { ...a, submission: sub||null, status: sub ? (sub.graded_at ? 'graded' : 'submitted') : (new Date(a.due_date)<new Date() ? 'overdue' : 'pending') };
    });
    sendSuccess(res, { data: merged, message: 'Student assignments fetched for parent/admin.' });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('assignments')
      .select('*, subjects(id,name,code), classes(id,name,level), staff:created_by(id,first_name,last_name)')
      .eq('id', req.params.id).maybeSingle();
    if (error || !data) return sendError(res, { message: 'Assignment not found.', statusCode: 404 });
    sendSuccess(res, { data, message: 'Assignment retrieved.' });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRoles('teaching_staff','admin'), async (req, res, next) => {
  try {
    const errs = validateRequired(req.body, ['title','class_id','due_date']);
    if (errs) return sendError(res, { message: 'Validation failed', errors: errs, statusCode: 400 });
    const { title, description, subject_id, class_id, term_id, due_date, max_score, file_url } = req.body;
    let staffId = null;
    const { data: staff } = await supabaseAdmin.from('staff').select('id').eq('user_id', req.user.id).maybeSingle();
    if (staff) staffId = staff.id;
    const { data: created, error } = await supabaseAdmin.from('assignments').insert({
      title, description: description||null, subject_id: subject_id||null, class_id,
      term_id: term_id||null, created_by: staffId, due_date,
      max_score: max_score ? parseFloat(max_score) : 100.00, file_url: file_url||null,
    }).select('*, subjects(id,name,code), classes(id,name,level)').single();
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    // Notify students
    try {
      const { data: students } = await supabaseAdmin.from('students').select('user_id').eq('class_id', class_id);
      if (students?.length) {
        await supabaseAdmin.from('notifications').insert(students.map(s => ({
          user_id: s.user_id, title: `New Assignment: ${title}`,
          body: `Due: ${new Date(due_date).toLocaleDateString()}`, type: 'assignment', reference_id: created.id,
        })));
      }
    } catch (e) { console.error('Notif error:', e); }
    sendSuccess(res, { data: created, message: 'Assignment created.', statusCode: 201 });
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireRoles('teaching_staff','admin'), async (req, res, next) => {
  try {
    const u = { updated_at: new Date().toISOString() };
    ['title','description','subject_id','class_id','term_id','due_date','file_url','is_active'].forEach(k => { if (req.body[k] !== undefined) u[k] = req.body[k]; });
    if (req.body.max_score !== undefined) u.max_score = parseFloat(req.body.max_score);
    const { data, error } = await supabaseAdmin.from('assignments').update(u).eq('id', req.params.id).select().single();
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    sendSuccess(res, { data, message: 'Assignment updated.' });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRoles('teaching_staff','admin'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin.from('assignments').update({ is_active: false }).eq('id', req.params.id);
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    sendSuccess(res, { data: null, message: 'Assignment removed.' });
  } catch (err) { next(err); }
});

// --- SUBMISSIONS ---

router.get('/:id/submissions', requireAuth, requireRoles('teaching_staff','admin'), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, error, count } = await supabaseAdmin.from('assignment_submissions')
      .select('*, students(id,first_name,last_name,admission_number)', { count: 'exact' })
      .eq('assignment_id', req.params.id).range(offset, offset+limit-1).order('submitted_at', { ascending: false });
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    sendSuccess(res, { data, message: 'Submissions fetched.', pagination: { page, limit, total: count||0 } });
  } catch (err) { next(err); }
});

router.post('/:id/submit', requireAuth, requireRoles('student'), async (req, res, next) => {
  try {
    const { file_url, text_content } = req.body;
    if (!file_url && !text_content) return sendError(res, { message: 'Provide file or text content.', statusCode: 400 });
    const { data: student } = await supabaseAdmin.from('students').select('id').eq('user_id', req.user.id).maybeSingle();
    if (!student) return sendError(res, { message: 'Student not found.', statusCode: 404 });
    const { data: assignment } = await supabaseAdmin.from('assignments').select('id,is_active').eq('id', req.params.id).maybeSingle();
    if (!assignment?.is_active) return sendError(res, { message: 'Assignment not found.', statusCode: 404 });
    const { data, error } = await supabaseAdmin.from('assignment_submissions').upsert({
      assignment_id: req.params.id, student_id: student.id,
      file_url: file_url||null, text_content: text_content||null, submitted_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,student_id' }).select().single();
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    sendSuccess(res, { data, message: 'Submitted.', statusCode: 201 });
  } catch (err) { next(err); }
});

router.post('/:id/grade', requireAuth, requireRoles('teaching_staff','admin'), async (req, res, next) => {
  try {
    const errs = validateRequired(req.body, ['student_id','score']);
    if (errs) return sendError(res, { message: 'Validation failed', errors: errs, statusCode: 400 });
    let staffId = null;
    const { data: staff } = await supabaseAdmin.from('staff').select('id').eq('user_id', req.user.id).maybeSingle();
    if (staff) staffId = staff.id;
    const { data, error } = await supabaseAdmin.from('assignment_submissions').update({
      score: parseFloat(req.body.score), remarks: req.body.remarks||null, graded_by: staffId, graded_at: new Date().toISOString(),
    }).eq('assignment_id', req.params.id).eq('student_id', req.body.student_id).select('*, students(id,first_name,last_name,user_id)').single();
    if (error) return sendError(res, { message: error.message, statusCode: 500 });
    if (data?.students?.user_id) {
      try { await supabaseAdmin.from('notifications').insert({ user_id: data.students.user_id, title: 'Assignment Graded', body: `Score: ${req.body.score}`, type: 'assignment', reference_id: req.params.id }); } catch (e) {}
    }
    sendSuccess(res, { data, message: 'Graded.' });
  } catch (err) { next(err); }
});

export default router;
