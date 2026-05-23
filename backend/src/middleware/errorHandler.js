import env from '../config/env.js';

/**
 * Global error handling middleware.
 * Catches all errors passed via next(err) and returns a standardised JSON response.
 */
export default function errorHandler(err, req, res, _next) {
  // Log the full error in development
  if (env.isDev) {
    console.error('─'.repeat(60));
    console.error(`❌  ${err.message}`);
    console.error(err.stack);
    console.error('─'.repeat(60));
  } else {
    console.error(`❌  ${err.message}`);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: env.isDev ? err.message : 'Internal server error',
    ...(env.isDev && { stack: err.stack }),
  });
}
