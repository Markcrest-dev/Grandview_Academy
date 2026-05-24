import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/elearning
 * Fetch materials for a specific class
 */
router.get('/', async (req, res, next) => {
  try {
    const { class_id } = req.query;
    
    // Students must provide their class_id or we derive it
    let targetClassId = class_id;

    if (req.user.role === 'student' && !targetClassId) {
      const { data: student } = await supabaseAdmin.from('students').select('class_id').eq('user_id', req.user.id).single();
      if (student) targetClassId = student.class_id;
    }

    let query = supabaseAdmin
      .from('elearning_materials')
      .select('*, subjects(name), classes(name), staff(first_name, last_name, designation)')
      .order('created_at', { ascending: false });

    if (targetClassId) query = query.eq('class_id', targetClassId);

    const { data, error } = await query;
    if (error) return sendError(res, { message: 'Failed to fetch materials.', statusCode: 500 });
    
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/elearning
 * Upload new material (Teachers/Admins)
 */
router.post('/', requireRoles('admin', 'teaching_staff'), async (req, res, next) => {
  try {
    const { title, description, class_id, subject_id, material_type, file_url } = req.body;
    
    const errors = validateRequired(req.body, ['title', 'class_id', 'subject_id', 'file_url']);
    if (errors) return sendError(res, { message: 'Required fields missing.', errors, statusCode: 400 });

    // Find staff id
    let staff_id = null;
    if (req.user.role === 'teaching_staff') {
      const { data } = await supabaseAdmin.from('staff').select('id').eq('user_id', req.user.id).single();
      staff_id = data ? data.id : null;
    }

    const { data, error } = await supabaseAdmin
      .from('elearning_materials')
      .insert({ title, description, class_id, subject_id, material_type, file_url, uploaded_by: staff_id })
      .select('*, subjects(name), classes(name)')
      .single();

    if (error) return sendError(res, { message: 'Failed to upload material.', statusCode: 500 });
    sendSuccess(res, { data, message: 'Material uploaded successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/elearning/:id
 * Delete material
 */
router.delete('/:id', requireRoles('admin', 'teaching_staff'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('elearning_materials')
      .delete()
      .eq('id', req.params.id);

    if (error) return sendError(res, { message: 'Failed to delete material.', statusCode: 500 });
    sendSuccess(res, { message: 'Material deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
