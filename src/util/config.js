const fs = require('node:fs/promises');
const path = require('node:path');

function assertString(v, name) {
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new Error(`Config error: ${name} must be a non-empty string`);
  }
}

function assertObject(v, name) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error(`Config error: ${name} must be an object`);
  }
}

function validateConfig(cfg) {
  assertObject(cfg, 'root');
  assertString(cfg.baseUrl, 'baseUrl');
  assertObject(cfg.shipping, 'shipping');
  assertString(cfg.shipping.email, 'shipping.email');
  assertString(cfg.shipping.firstName, 'shipping.firstName');
  assertString(cfg.shipping.lastName, 'shipping.lastName');
  assertString(cfg.shipping.address1, 'shipping.address1');
  assertString(cfg.shipping.city, 'shipping.city');
  assertString(cfg.shipping.postalCode, 'shipping.postalCode');
  assertString(cfg.shipping.country, 'shipping.country');
  assertString(cfg.shipping.phone, 'shipping.phone');

  if (cfg.shipping.state) assertString(cfg.shipping.state, 'shipping.state');
  if (cfg.shipping.address2) assertString(cfg.shipping.address2, 'shipping.address2');

  assertObject(cfg.payment, 'payment');
  assertString(cfg.payment.cardNumber, 'payment.cardNumber');
  assertString(cfg.payment.expiry, 'payment.expiry');
  assertString(cfg.payment.cvv, 'payment.cvv');
  assertString(cfg.payment.nameOnCard, 'payment.nameOnCard');

  if (cfg.timeouts) assertObject(cfg.timeouts, 'timeouts');
  return cfg;
}

async function loadConfig(configPath) {
  const resolved =
    configPath?.trim() ||
    process.env.BOT_CONFIG_PATH?.trim() ||
    path.resolve(process.cwd(), 'config', 'bot.config.json');

  const buf = await fs.readFile(resolved);
  const cfg = JSON.parse(String(buf));
  return validateConfig(cfg);
}

module.exports = { loadConfig };

