import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { supabaseAdmin } from '../config/database.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Authentication Middleware
 * 
 * Verifies the JWT session token passed in the Authorization header.
 * Attaches the authenticated user's database record to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, {
        message: 'Access denied. No session token provided.',
        statusCode: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, {
        message: 'Access denied. Invalid token format.',
        statusCode: 401,
      });
    }

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, {
          message: 'Your session has expired. Please log in again.',
          statusCode: 401,
        });
      }
      return sendError(res, {
        message: 'Invalid session token. Authentication failed.',
        statusCode: 401,
      });
    }

    // Ensure we aren't using a temporary 2FA token for standard endpoints
    if (decoded.type === '2fa_pending') {
      return sendError(res, {
        message: 'Multi-factor authentication required to complete session.',
        statusCode: 401,
      });
    }

    // Retrieve user details from database to ensure account is active
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_active, must_change_password')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !user) {
      return sendError(res, {
        message: 'Authentication failed. Account not found.',
        statusCode: 401,
      });
    }

    if (!user.is_active) {
      return sendError(res, {
        message: 'This account has been deactivated. Please contact administration.',
        statusCode: 403,
      });
    }

    // Hydrate request with authenticated user data
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Rejects requests if the user does not have one of the allowed roles.
 * Must be mounted AFTER requireAuth.
 * 
 * @param {...string} allowedRoles - Role strings (e.g. 'admin', 'student')
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        message: `Forbidden access. Requires role: [${allowedRoles.join(', ')}]`,
        statusCode: 403,
      });
    }

    next();
  };
}
