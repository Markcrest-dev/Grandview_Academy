import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

/**
 * GET /api/health
 * Health check — verifies the API is running and Supabase is reachable.
 */
router.get('/', async (req, res) => {
  try {
    // Quick Supabase connectivity test
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);

    // Table not existing is fine — it means the DB connection works
    const dbStatus = !error || error.code === '42P01' ? 'connected' : 'error';

    sendSuccess(res, {
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime(),
      },
      message: 'Grandview Academy API is running',
    });
  } catch (err) {
    sendSuccess(res, {
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'unreachable',
        uptime: process.uptime(),
      },
      message: 'Grandview Academy API is running (database unreachable)',
    });
  }
});

export default router;
