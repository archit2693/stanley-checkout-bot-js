const { clickFirstByText, dismissOverlays, waitForSettled } = require('../util/dom');

async function submitOrderAttempt(page, _config, { confirmPurchase }) {
  await dismissOverlays(page, { gentle: true });
  await waitForSettled(page, { idleMs: 500, timeoutMs: 3000 });

  if (!confirmPurchase) {
    return;
  }

  const texts = ['pay now', 'complete order', 'place order', 'buy now'];
  await clickFirstByText(page, texts, {
    selectors: ['button', 'input[type="submit"]'],
    timeoutMs: 20000,
  });

  await waitForSettled(page, { idleMs: 2000, timeoutMs: 60000 });
}

module.exports = { submitOrderAttempt };
