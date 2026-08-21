const createApp = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { connectWithRetry, disconnect } = require('./db/connection');

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'CloudBoard backend listening');
});

// Connect to MongoDB in the background. We do NOT await this before
// listen() above - the server should accept traffic (and answer /health)
// even while the database connection is still being established or retried.
connectWithRetry();

// --- Graceful shutdown ---
// Kubernetes sends SIGTERM before killing a pod (giving it terminationGracePeriodSeconds
// to shut down cleanly). Handling it properly means:
//   1. Stop accepting new connections
//   2. Let in-flight requests finish
//   3. Close the DB connection cleanly
//   4. Exit
// Without this, rolling updates and pod evictions can cut off requests mid-flight.
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, 'Received shutdown signal, closing gracefully');

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, config.shutdownTimeoutMs);
  forceExitTimer.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error while closing HTTP server');
      process.exit(1);
    }

    try {
      await disconnect();
      logger.info('Shutdown complete');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (disconnectErr) {
      logger.error({ err: disconnectErr }, 'Error while closing MongoDB connection');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Safety nets: log and exit on truly unexpected failures rather than
// continuing in an unknown state.
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception - exiting');
  process.exit(1);
});

module.exports = server;
