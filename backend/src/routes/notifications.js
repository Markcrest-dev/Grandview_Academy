import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/notifications
 * Fetch the authenticated user's notifications, newest first.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { type, unread } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (type) {
      query = query.eq('type', type);
    }
    if (unread === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, { message: `Failed to fetch notifications: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: notifications,
      message: 'Notifications fetched successfully.',
      pagination: { page, limit, total: count || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns the total number of unread notifications for the current user.
 */
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) {
      return sendError(res, { message: `Failed to get unread count: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: { count: count || 0 },
      message: 'Unread count retrieved.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: updated, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return sendError(res, { message: `Failed to mark notification as read: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: updated,
      message: 'Notification marked as read.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all of the current user's notifications as read.
 */
router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) {
      return sendError(res, { message: `Failed to mark all as read: ${error.message}`, statusCode: 500 });
    }

    sendSuccess(res, {
      data: null,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
