import express from 'express';
import helmet from 'helmet';
import env from './config/env.js';
import cors from './middleware/cors.js';
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';
import { testConnection } from './config/database.js';

const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors);

// Request Logger
app.use(requestLogger);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all API routes
app.use('/api', apiRouter);

// Standard 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  console.log('🔄 Starting Grandview Academy SMS API Server...');

  try {
    // Test Database connection
    console.log('📡 Testing connection to Supabase...');
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Supabase PostgreSQL connected successfully.');
    }
  } catch (err) {
    console.warn(`⚠️  Database warning: ${err.message}`);
    console.warn('   The server will run, but database queries may fail until Supabase credentials in .env are correct.');
  }

  app.listen(env.port, () => {
    console.log(`🚀 Server is running in ${env.nodeEnv} mode on port ${env.port}`);
    console.log(`🔗 Local API Health URL: http://localhost:${env.port}/api/health`);
  });
}

startServer();

export default app;
