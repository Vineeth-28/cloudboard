const logger = require('../utils/logger');

// 404 handler - must be registered after all real routes.
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

// Centralized error handler - must be registered LAST, with 4 args,
// so Express recognizes it as an error-handling middleware.
// Every thrown/next(err) error in the app funnels through here, which means
// there's exactly one place that decides what error shape the client sees
// and exactly one place that logs unhandled errors.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled request error');

  // Mongoose validation errors -> 400 with field-level detail
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation Error', details });
  }

  // Mongoose duplicate key error (e.g. unique email) -> 409
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key', details: err.keyValue });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  return res.status(statusCode).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
