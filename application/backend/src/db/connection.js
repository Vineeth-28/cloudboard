const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

// We track connection state ourselves rather than trusting mongoose's
// internal readyState alone, so the /health endpoint has a simple boolean
// to report without reaching into mongoose internals from another module.
let isConnected = false;

mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error({ err }, 'MongoDB connection error');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});

/**
 * Connects to MongoDB with basic retry/backoff.
 * Deliberately does NOT block server startup - the HTTP server should start
 * listening immediately so Kubernetes readiness/liveness probes get a response,
 * even while the app is still trying to reach the database. The /health
 * endpoint reports the real db status so probes and operators can see it.
 */
async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      return;
    } catch (err) {
      logger.warn(
        { attempt, retries, err: err.message },
        'MongoDB connection attempt failed, retrying'
      );
      if (attempt === retries) {
        logger.error('Exhausted MongoDB connection retries - continuing without DB');
        return;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }
}

function getConnectionStatus() {
  return isConnected;
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connectWithRetry, getConnectionStatus, disconnect };
