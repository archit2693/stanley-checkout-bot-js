#!/usr/bin/env node

const express = require('express');
const { runWithProductUrl } = require('./runner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const jobs = new Map();
let jobCounter = 0;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', activeJobs: jobs.size });
});

app.post('/checkout', async (req, res) => {
  const { productUrl, confirmPurchase = false } = req.body;

  if (!productUrl || typeof productUrl !== 'string') {
    return res.status(400).json({ error: 'productUrl is required' });
  }

  if (!productUrl.includes('stanley1913.com')) {
    return res.status(400).json({ error: 'productUrl must be a Stanley website URL' });
  }

  const configPath = req.body.configPath || process.env.BOT_CONFIG_PATH || '';
  const jobId = `job_${++jobCounter}_${Date.now()}`;

  console.log(`[${jobId}] Starting checkout for: ${productUrl}`);
  jobs.set(jobId, { status: 'running', startedAt: new Date().toISOString() });

  res.json({
    jobId,
    status: 'running',
    message: 'Checkout started in background',
    statusUrl: `/status/${jobId}`,
  });

  runWithProductUrl({
    productUrl,
    confirmPurchase: Boolean(confirmPurchase),
    headful: false,
    slowMo: 0,
    configPath,
  })
    .then((result) => {
      console.log(`[${jobId}] Completed successfully. Artifacts: ${result.artifactsPath}`);
      jobs.set(jobId, {
        status: 'completed',
        artifactsPath: result.artifactsPath,
        completedAt: new Date().toISOString(),
        message: confirmPurchase
          ? 'Checkout completed'
          : 'Checkout stopped before final submission (safe mode)',
      });
    })
    .catch((error) => {
      console.error(`[${jobId}] Failed:`, error.message);
      console.error(`[${jobId}] Stack:`, error.stack);
      jobs.set(jobId, {
        status: 'failed',
        error: error.message,
        stack: error.stack,
        completedAt: new Date().toISOString(),
      });
    });
});

app.get('/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Stanley Bot Server running on http://localhost:${PORT}`);
  console.log(`📋 Health: GET /health`);
  console.log(`🛒 Checkout: POST /checkout`);
  console.log(`📊 Status: GET /status/:jobId`);
  console.log(`Config path: ${process.env.BOT_CONFIG_PATH || 'Not set'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
