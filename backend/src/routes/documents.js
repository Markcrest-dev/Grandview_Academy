import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/documents
 * List all documents with optional filters (related_to, related_id)
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { related_to, related_id } = req.query;

    let query = supabaseAdmin
      .from('documents')
      .select('*');

    if (related_to) {
      query = query.eq('related_to', related_to);
    }
    if (related_id) {
      query = query.eq('related_id', related_id);
    }

    const { data: docs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to retrieve documents: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: docs,
      message: 'Learning materials and documents retrieved successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/documents
 * Upload / Publish a new document entry in the database.
 * Restricted to Admins and Teachers.
 */
router.post('/', requireAuth, requireRoles('admin', 'teaching_staff'), async (req, res, next) => {
  try {
    const { title, file_url, file_type, related_to, related_id } = req.body;

    const errors = validateRequired(req.body, ['title', 'file_url', 'file_type']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    const { data: newDoc, error } = await supabaseAdmin
      .from('documents')
      .insert({
        title,
        file_url,
        file_type,
        uploaded_by: req.user.id,
        related_to: related_to || null,
        related_id: related_id || null
      })
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to publish document: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: newDoc,
      message: `Document "${title}" successfully registered in database catalog.`,
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

export default router;
