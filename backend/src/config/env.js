import 'dotenv/config';

/**
 * Environment configuration with validation.
 * Fails fast at startup if required variables are missing.
 */

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

const optional = {
  PORT: '5000',
  NODE_ENV: 'development',
  FRONTEND_URL: 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
};

// Validate required variables
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n❌  Missing required environment variables:');
  missing.forEach((key) => console.error(`   • ${key}`));
  console.error('\n   Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

const env = {
  // Server
  port: parseInt(process.env.PORT || optional.PORT, 10),
  nodeEnv: process.env.NODE_ENV || optional.NODE_ENV,
  isDev: (process.env.NODE_ENV || optional.NODE_ENV) === 'development',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || optional.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || optional.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || optional.CLOUDINARY_API_SECRET,

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || optional.FRONTEND_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
};

export default env;
