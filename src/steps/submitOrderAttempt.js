const { clickFirstByText, dismissOverlays, waitForSettled } = require('../util/dom');

async function submitOrderAttempt(page, _config, { confirmPurchase }) {
  await dismissOverlays(page);

  const texts = ['pay now', 'complete order', 'place order', 'buy now'];
  if (!confirmPurchase) {
    await waitForSettled(page, { timeoutMs: 20000 }).catch(() => {});
    return;
  }

  await clickFirstByText(page, texts, {
    selectors: ['button', 'input[type="submit"]'],
    timeoutMs: 20000,
  });

  await waitForSettled(page, { timeoutMs: 60000 }).catch(() => {});
}

module.exports = { submitOrderAttempt };

