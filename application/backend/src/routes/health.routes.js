const express = require('express');
const { getConnectionStatus } = require('../db/connection');

const router = express.Router();

// Kept deliberately fast and dependency-light: this is what Kubernetes
// liveness/readiness probes and the load balancer's health check hit,
// potentially every few seconds. It must respond even if downstream
// dependencies (DB) are degraded - it just reports their state.
router.get('/health', (req, res) => {
  const dbConnected = getConnectionStatus();

  res.status(200).json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    dependencies: {
      mongodb: dbConnected ? 'connected' : 'disconnected',
    },
  });
});

module.exports = router;
