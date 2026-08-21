// Centralized configuration.
// Every place in the codebase that needs an env var should import from here
// instead of reading process.env directly - this gives us one place to see
// every config value the app depends on, and one place to add validation.

require('dotenv').config();

const requiredInProduction = ['MONGO_URI'];

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/cloudboard',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10) || 10000,
};

function validateConfig() {
  if (config.env !== 'production') return;

  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Fail fast and loud - a production app should never limp along with
    // silently-defaulted config for things like the database connection string.
    // eslint-disable-next-line no-console
    console.error(
      `FATAL: missing required environment variables in production: ${missing.join(', ')}`
    );
    process.exit(1);
  }
}

validateConfig();

module.exports = config;
