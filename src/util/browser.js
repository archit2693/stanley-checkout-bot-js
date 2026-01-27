const puppeteer = require('puppeteer');

async function launchBrowser({ headful, slowMo }) {
  return puppeteer.launch({
    headless: !headful,
    slowMo: Number.isFinite(slowMo) ? slowMo : 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });
}

module.exports = { launchBrowser };

