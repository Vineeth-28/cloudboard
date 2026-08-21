const pino = require('pino');
const config = require('../config');

// Structured (JSON) logging is what lets log aggregators like Loki/ELK
// actually parse and query logs instead of grepping plain text.
// In development we pretty-print for human readability; in every other
// environment we emit raw JSON, one line per event, which is what
// Promtail/Fluentd expect to scrape from stdout.
const logger = pino({
  level: config.logLevel,
  base: { service: 'cloudboard-backend', env: config.env },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    config.env === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});

module.exports = logger;
