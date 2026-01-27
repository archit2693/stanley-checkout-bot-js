const { dismissOverlays, waitForSettled } = require('../util/dom');

async function openHome(page, config) {
  await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForSettled(page, { timeoutMs: 8000 });
  await dismissOverlays(page);
  await waitForSettled(page, { timeoutMs: 5000 }).catch(() => {});
  await dismissOverlays(page);
}

module.exports = { openHome };

