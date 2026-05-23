import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, validateRequired, isEnum } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

const VALID_AUDIENCES = ['all', 'staff', 'students', 'parents', 'primary', 'secondary', 'university'];
const VALID_PRIORITIES = ['normal', 'important', 'urgent'];

/**
 * GET /api/announcements
 * List announcements with optional filters: target_audience, priority.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { target_audience, priority } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    let query = supabaseAdmin
      .from('announcements')
      .select('*, users(email)', { count: 'exact' });

    if (target_audience) {
      query = query.eq('target_audience', target_audience);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: announcements, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('published_at', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch announcements: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: announcements,
      message: 'Announcements fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/announcements/:id
 * Get a single announcement.
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .select('*, users(email)')
      .eq('id', id)
      .maybeSingle();

    if (error || !announcement) {
      return sendError(res, { message: 'Announcement not found.', statusCode: 404 });
    }

    sendSuccess(res, {
      data: announcement,
      message: 'Announcement retrieved successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/announcements
 * Create a new announcement (Staff/Admin only).
 */
router.post('/', requireAuth, requireRoles('admin', 'teaching_staff', 'non_teaching_staff'), async (req, res, next) => {
  try {
    const errors = validateRequired(req.body, ['title', 'content', 'target_audience']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    const { title, content, target_audience, priority, level } = req.body;

    if (!isEnum(target_audience, VALID_AUDIENCES)) {
      return sendError(res, {
        message: `Invalid target_audience. Must be one of: ${VALID_AUDIENCES.join(', ')}`,
        statusCode: 400
      });
    }

    if (priority && !isEnum(priority, VALID_PRIORITIES)) {
      return sendError(res, {
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        statusCode: 400
      });
    }

    const { data: newAnnouncement, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        content,
        target_audience,
        level: level || null,
        priority: priority || 'normal',
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to publish announcement: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: newAnnouncement,
      message: 'Announcement published successfully.',
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/announcements/:id
 * Update an announcement.
 */
router.put('/:id', requireAuth, requireRoles('admin', 'teaching_staff', 'non_teaching_staff'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, target_audience, priority, level } = req.body;

    if (target_audience && !isEnum(target_audience, VALID_AUDIENCES)) {
      return sendError(res, {
        message: `Invalid target_audience. Must be one of: ${VALID_AUDIENCES.join(', ')}`,
        statusCode: 400
      });
    }

    if (priority && !isEnum(priority, VALID_PRIORITIES)) {
      return sendError(res, {
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        statusCode: 400
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (priority !== undefined) updateData.priority = priority;
    if (level !== undefined) updateData.level = level;
    
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to update announcement: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: updated,
      message: 'Announcement updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/announcements/:id
 * Delete an announcement.
 */
router.delete('/:id', requireAuth, requireRoles('admin', 'teaching_staff', 'non_teaching_staff'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      return sendError(res, { message: `Failed to delete announcement: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: null,
      message: 'Announcement deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;

