/**
 * Environment Configuration Loader
 * Handles loading environment variables based on NODE_ENV
 * Supports: .env.local (development), .env.production (production)
 * Falls back to .env.example for reference
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const loadEnvironmentConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  // Go up one level from /config to /backend
  const backendDir = path.join(__dirname, '..');
  
  let envFile;
  
  // Determine which .env file to load
  if (nodeEnv === 'production') {
    envFile = path.join(backendDir, '.env.production');
  } else {
    // Default to .env.local for development/local
    envFile = path.join(backendDir, '.env.local');
  }
  
  // Check if the environment file exists
  if (fs.existsSync(envFile)) {
    console.log(`📁 Loading environment from: ${path.basename(envFile)} (NODE_ENV=${nodeEnv})`);
    dotenv.config({ path: envFile });
  } else {
    console.warn(`⚠️  Environment file not found: ${path.basename(envFile)}`);
    console.log(`   Falling back to .env.example for reference`);
    
    // Try .env.example as fallback
    const exampleFile = path.join(backendDir, '.env.example');
    if (fs.existsSync(exampleFile)) {
      dotenv.config({ path: exampleFile });
    } else {
      console.error(`❌ No environment configuration found. Please create ${path.basename(envFile)}`);
    }
  }
  
  // Validate critical environment variables
  validateEnvironmentVariables(nodeEnv);
};

/**
 * Validate that critical environment variables are set
 * In production, stricter validation is enforced
 */
const validateEnvironmentVariables = (nodeEnv) => {
  const requiredVars = [
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    const message = `❌ Missing required environment variables: ${missingVars.join(', ')}`;
    
    if (nodeEnv === 'production') {
      // In production, missing critical vars should fail
      throw new Error(message);
    } else {
      // In development, warn but allow to continue
      console.warn(message);
    }
  }
  
  // Validate optional services (they should be set but missing keys won't block startup)
  const optionalServices = {
    'Email (SMTP)': ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
    'SMS (Fast2SMS)': ['FAST2SMS_API_KEY'],
    'Image Upload (ImageKit)': ['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_ENDPOINT']
  };
  
  Object.entries(optionalServices).forEach(([serviceName, vars]) => {
    const allSet = vars.every(v => process.env[v]);
    const allMissing = vars.every(v => !process.env[v]);
    
    if (allMissing) {
      console.warn(`⚠️  ${serviceName} - NOT CONFIGURED (${vars.join(', ')})`);
    } else if (!allSet) {
      console.warn(`⚠️  ${serviceName} - PARTIALLY CONFIGURED (missing: ${vars.filter(v => !process.env[v]).join(', ')})`);
    } else {
      console.log(`✅ ${serviceName} - Configured`);
    }
  });
};

/**
 * Get environment-specific configuration
 */
const getEnvironmentConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    // Server
    port: process.env.PORT || 5000,
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    
    // Database
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialect: process.env.DB_DIALECT || 'postgres',
      logging: process.env.DB_LOGGING === 'true',
      ssl: nodeEnv === 'production' ? true : (process.env.DB_SSL === 'true')
    },
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET
    },
    
    // Frontend
    frontend: {
      url: process.env.FRONTEND_URL
    },
    
    // ImageKit
    imageKit: {
      enabled: !!(process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY),
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      endpoint: process.env.IMAGEKIT_ENDPOINT
    },
    
    // Email (SMTP)
    email: {
      enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM || process.env.SMTP_USER
    },
    
    // SMS (Fast2SMS)
    sms: {
      enabled: !!process.env.FAST2SMS_API_KEY,
      apiKey: process.env.FAST2SMS_API_KEY,
      senderId: process.env.FAST2SMS_SENDER_ID,
      dltTemplateId: process.env.FAST2SMS_DLT_TEMPLATE_ID
    },
    
    // Short URLs
    shortUrl: {
      baseUrl: process.env.SHORT_URL_BASE,
      apiKey: process.env.SHORT_URL_API_KEY
    },
    
    // Logging
    logging: {
      debug: process.env.DEBUG === 'true',
      level: process.env.LOG_LEVEL || 'info'
    }
  };
};

module.exports = {
  loadEnvironmentConfig,
  getEnvironmentConfig
};
