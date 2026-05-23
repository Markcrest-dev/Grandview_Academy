import cors from 'cors';
import env from '../config/env.js';

/**
 * CORS configuration.
 * In development: allows the Vite dev server origin.
 * In production: restricts to FRONTEND_URL from env.
 */
const corsOptions = {
  origin: env.isDev
    ? [env.frontendUrl, 'http://localhost:5173', 'http://localhost:5174']
    : env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);
