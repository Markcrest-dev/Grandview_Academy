import morgan from 'morgan';
import env from '../config/env.js';

/**
 * HTTP request logging middleware.
 * Uses 'dev' format in development (coloured, concise).
 * Uses 'combined' format in production (Apache-style, suitable for log aggregation).
 */
const requestLogger = morgan(env.isDev ? 'dev' : 'combined');

export default requestLogger;
