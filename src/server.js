#!/usr/bin/env node

const express = require('express');
const { runWithProductUrl } = require('./runner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let isProcessing = false;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', processing: isProcessing });
});

app.post('/checkout', async (req, res) => {
  if (isProcessing) {
    return res.status(429).json({ error: 'Another checkout is in progress' });
  }

  const { productUrl, confirmPurchase = false } = req.body;

  if (!productUrl || typeof productUrl !== 'string') {
    return res.status(400).json({ error: 'productUrl is required' });
  }

  if (!productUrl.includes('stanley1913.com')) {
    return res.status(400).json({ error: 'productUrl must be a Stanley website URL' });
  }

  const configPath = req.body.configPath || process.env.BOT_CONFIG_PATH || '';

  isProcessing = true;

  try {
    const result = await runWithProductUrl({
      productUrl,
      confirmPurchase: Boolean(confirmPurchase),
      headful: false,
      slowMo: 0,
      configPath,
    });

    res.json({
      success: true,
      artifactsPath: result.artifactsPath,
      message: confirmPurchase
        ? 'Checkout completed'
        : 'Checkout stopped before final submission (safe mode)',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    isProcessing = false;
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Stanley Bot Server running on http://localhost:${PORT}`);
  console.log(`📋 Health: GET http://localhost:${PORT}/health`);
  console.log(`🛒 Checkout: POST http://localhost:${PORT}/checkout`);
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
