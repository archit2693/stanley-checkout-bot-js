const { clickFirstByText, dismissOverlays, waitForSettled } = require('../util/dom');

async function waitForNav(page, timeoutMs) {
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: timeoutMs }),
    waitForSettled(page, { idleMs: 800, timeoutMs: Math.min(5000, timeoutMs) }),
  ]).catch(() => {});
}

function isOnCheckout(page) {
  return page.url().includes('/checkouts/');
}

async function goToCheckout(page) {
  await dismissOverlays(page);
  if (isOnCheckout(page)) return;

  await clickFirstByText(page, ['checkout'], { selectors: ['button', 'a'], timeoutMs: 8000 }).catch(() => {});
  await waitForNav(page, 15000);
  if (isOnCheckout(page)) return;

  await clickFirstByText(page, ['view cart', 'cart'], { selectors: ['a', 'button'], timeoutMs: 5000 })
    .then(() => waitForNav(page, 15000))
    .catch(() => {});
  if (isOnCheckout(page)) return;

  await clickFirstByText(page, ['checkout'], { selectors: ['button', 'a'], timeoutMs: 20000 });
  await waitForNav(page, 20000);

  if (!isOnCheckout(page)) {
    throw new Error('Failed to reach checkout page');
  }
}

module.exports = { goToCheckout };
