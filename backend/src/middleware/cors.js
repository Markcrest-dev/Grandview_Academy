import cors from 'cors';
import env from '../config/env.js';

/**
 * CORS configuration.
 * In development: allows the Vite dev server origin.
 * In production: restricts to FRONTEND_URL from env + Vercel preview URLs.
 */

const devOrigins = [
  env.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
];

const prodOrigins = [
  env.frontendUrl,
].filter(Boolean);

const corsOptions = {
  origin: env.isDev
    ? devOrigins
    : (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        // Allow configured frontend URL
        if (prodOrigins.includes(origin)) return callback(null, true);
        // Allow Vercel preview deployments (*.vercel.app)
        if (/\.vercel\.app$/.test(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);

