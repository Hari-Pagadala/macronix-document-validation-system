#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Checks if all necessary environment variables are set up correctly
 * Usage: node validateEnvironment.js
 */

const fs = require('fs');
const path = require('path');
const { getEnvironmentConfig } = require('./config/environmentConfig');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const icons = {
  check: '✅',
  cross: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  arrow: '→'
};

console.log(`\n${colors.bold}${colors.cyan}🔍 Environment Configuration Validator${colors.reset}\n`);

const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`${icons.info} Current NODE_ENV: ${colors.bold}${nodeEnv}${colors.reset}\n`);

// Check which .env file is being used
const envFiles = {
  development: '.env.local',
  production: '.env.production'
};

const expectedEnvFile = envFiles[nodeEnv] || envFiles['development'];
const envPath = path.join(__dirname, expectedEnvFile);
const envExists = fs.existsSync(envPath);

console.log(`${colors.bold}File Status:${colors.reset}`);
console.log(`  ${envExists ? icons.check : icons.cross} ${expectedEnvFile} ${envExists ? colors.green + 'EXISTS' + colors.reset : colors.red + 'MISSING' + colors.reset}`);

if (!envExists) {
  console.log(`\n${colors.red}${icons.warn} Warning: ${expectedEnvFile} file not found!${colors.reset}`);
  console.log(`  Please create this file with your environment variables.\n`);
  process.exit(1);
}

// Load and validate configuration
const config = getEnvironmentConfig();

// Validation rules
const validations = [
  {
    section: 'Critical Services',
    checks: [
      {
        name: 'Database Connection',
        validate: () => config.database.host && config.database.name && config.database.user && config.database.password,
        required: true,
        details: () => `Host: ${config.database.host}, DB: ${config.database.name}, User: ${config.database.user}`
      },
      {
        name: 'JWT Secret',
        validate: () => config.jwt.secret && config.jwt.secret.length >= 32,
        required: true,
        details: () => `Length: ${(config.jwt.secret || '').length} chars (min: 32)`
      }
    ]
  },
  {
    section: 'Optional Services',
    checks: [
      {
        name: 'Email (SMTP)',
        validate: () => config.email.enabled,
        required: false,
        details: () => `${config.email.host}:${config.email.port} (User: ${config.email.user}, Secure: ${config.email.secure})`
      },
      {
        name: 'SMS (Fast2SMS)',
        validate: () => config.sms.enabled,
        required: false,
        details: () => `API Key: ${config.sms.apiKey ? '***' + config.sms.apiKey.slice(-4) : 'NOT SET'}`
      },
      {
        name: 'Image Upload (ImageKit)',
        validate: () => config.imageKit.enabled,
        required: false,
        details: () => `Endpoint: ${config.imageKit.endpoint || 'NOT SET'}`
      },
      {
        name: 'Short URL Service',
        validate: () => config.shortUrl.baseUrl,
        required: false,
        details: () => `Base URL: ${config.shortUrl.baseUrl}`
      }
    ]
  }
];

let allValid = true;

validations.forEach(section => {
  console.log(`\n${colors.bold}${section.section}:${colors.reset}`);
  
  section.checks.forEach(check => {
    const isValid = check.validate();
    const status = isValid 
      ? `${colors.green}${icons.check} OK${colors.reset}`
      : check.required 
        ? `${colors.red}${icons.cross} FAILED${colors.reset}`
        : `${colors.yellow}${icons.warn} NOT CONFIGURED${colors.reset}`;
    
    if (!isValid && check.required) {
      allValid = false;
    }
    
    console.log(`  ${status} - ${check.name}`);
    if (isValid || !check.required) {
      console.log(`      ${colors.cyan}${check.details()}${colors.reset}`);
    } else {
      console.log(`      ${colors.red}This service is required but not properly configured${colors.reset}`);
    }
  });
});

// Environment-specific recommendations
console.log(`\n${colors.bold}Environment-Specific Notes:${colors.reset}`);

if (nodeEnv === 'production') {
  console.log(`  ${icons.warn} Running in PRODUCTION mode`);
  console.log(`  • Ensure all required variables are set`);
  console.log(`  • Use strong, unique credentials`);
  console.log(`  • Enable database SSL (DB_SSL=true)`);
  console.log(`  • Use port 465 for SMTP (SMTP_PORT=465, SMTP_SECURE=true)`);
  console.log(`  • Keep .env.production secure and never commit to version control`);
} else {
  console.log(`  ${icons.check} Running in development mode`);
  console.log(`  • Test credentials are acceptable`);
  console.log(`  • Optional services can be skipped`);
  console.log(`  • .env.local is in .gitignore (safe to use locally)`);
}

// Final summary
console.log(`\n${colors.bold}Summary:${colors.reset}`);

if (allValid) {
  console.log(`${colors.green}${icons.check} All critical services are configured correctly!${colors.reset}`);
  console.log(`\nYou can now start the server with: ${colors.bold}npm start${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${icons.cross} Some critical services are not configured.${colors.reset}`);
  console.log(`\nPlease fix the above issues before starting the server.`);
  console.log(`See ENVIRONMENT_CONFIG_GUIDE.md for detailed setup instructions.\n`);
  process.exit(1);
}
