#!/usr/bin/env node

/**
 * Script to validate environment variables
 * This script checks if all required environment variables are set
 */

// Required environment variables
const requiredVars = [
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'CERTIFICATE_SECRET',
];

// Optional environment variables with defaults
const optionalVars = {
  'NODE_ENV': 'development',
  'RATE_LIMIT_WINDOW_MS': '60000',
  'RATE_LIMIT_MAX_REQUESTS': '100',
  'LOG_LEVEL': 'info',
  'DOMAIN': 'localhost',
  'EMAIL': 'admin@example.com',
  'STAGING': 'true',
  'EXPIRY_THRESHOLD': '30',
  'CERTBOT_CONTAINER_NAME': 'certbot',
  'NGINX_CONTAINER_NAME': 'nginx',
  'RENEWAL_DAYS': '30',
  'REDIS_URL': 'redis://redis:6379',
  'CACHE_ENABLED': 'true',
  'CACHE_TTL_DEFAULT': '300',
  'CACHE_TTL_CERTIFICATES': '600',
  'CACHE_TTL_TEMPLATES': '1800',
  'CACHE_TTL_VALIDATION': '3600',
  'CACHE_TTL_STATIC': '86400',
  'PRISMA_CONNECTION_LIMIT': '10',
  'PRISMA_CONNECTION_TIMEOUT': '15000',
  'PRISMA_POOL_TIMEOUT': '10000',
  'PRISMA_IDLE_TIMEOUT': '60000',
  'SLOW_QUERY_THRESHOLD': '500',
  'LOG_QUERIES': 'false',
};

console.log('Validating environment variables...');

// Check required variables
const missingVars = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables in your .env file or environment.');
  process.exit(1);
}

// Check optional variables
for (const [varName, defaultValue] of Object.entries(optionalVars)) {
  if (!process.env[varName]) {
    console.warn(`⚠️  Optional variable ${varName} not set, using default: ${defaultValue}`);
  }
}

// Validate DATABASE_URL format
const dbUrlRegex = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/;
if (!dbUrlRegex.test(process.env.DATABASE_URL)) {
  console.error('❌ DATABASE_URL format is invalid.');
  console.error('   Expected format: postgresql://user:password@host:port/database');
  process.exit(1);
}

// Check for weak secrets in production
if (process.env.NODE_ENV === 'production') {
  const weakSecrets = [];
  
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    weakSecrets.push('NEXTAUTH_SECRET');
  }
  
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    weakSecrets.push('JWT_SECRET');
  }
  
  if (process.env.CERTIFICATE_SECRET && process.env.CERTIFICATE_SECRET.length < 32) {
    weakSecrets.push('CERTIFICATE_SECRET');
  }
  
  if (weakSecrets.length > 0) {
    console.warn('⚠️  Weak secrets detected in production:');
    weakSecrets.forEach(varName => console.warn(`   - ${varName} (should be at least 32 characters)`));
    console.warn('\nConsider using stronger secrets for production.');
  }
  
  // Check SSL configuration in production
  const sslWarnings = [];
  
  if (process.env.DOMAIN === 'localhost' || process.env.DOMAIN === 'example.com') {
    sslWarnings.push('DOMAIN is set to default value. Set to your actual domain name.');
  }
  
  if (process.env.EMAIL === 'admin@example.com') {
    sslWarnings.push('EMAIL is set to default value. Set to your actual email for Let\'s Encrypt notifications.');
  }
  
  if (process.env.STAGING === 'true') {
    sslWarnings.push('STAGING is set to true. Set to false for production certificates.');
  }
  
  if (sslWarnings.length > 0) {
    console.warn('⚠️  SSL configuration warnings for production:');
    sslWarnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('\nUpdate these settings before deploying to production.');
  }
}

console.log('✅ All required environment variables are set.');
console.log('Environment validation completed successfully.');