const { dismissOverlays, waitForSettled } = require('../util/dom');

async function openHome(page, config) {
  await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForSettled(page, { timeoutMs: 5000 });
  await dismissOverlays(page);
}

module.exports = { openHome };
