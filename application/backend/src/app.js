const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');

const config = require('./config');
const logger = require('./utils/logger');
const healthRoutes = require('./routes/health.routes');
const userRoutes = require('./routes/user.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Building the app as a factory function (rather than a module-level side effect)
// means tests can `require('./app')` and hit it with supertest without ever
// binding a port - important for fast, parallel-safe unit tests.
function createApp() {
  const app = express();

  // Security headers (CSP, X-Frame-Options, etc.) - cheap, high-value default.
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  // Structured request logging - one JSON line per request with method,
  // path, status, and response time. This is what feeds Loki/Promtail later.
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.get('/', (req, res) => {
    res.status(200).json({ service: 'cloudboard-backend', status: 'running' });
  });

  app.use('/', healthRoutes);
  app.use('/api', userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
