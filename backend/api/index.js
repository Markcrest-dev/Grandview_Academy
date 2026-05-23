/**
 * Vercel Serverless Entry Point
 * 
 * Wraps the Express app for Vercel's serverless runtime.
 * Vercel manages the HTTP listener — we just export the app.
 */
import app from '../src/server.js';

export default app;
