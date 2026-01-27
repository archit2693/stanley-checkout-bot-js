const { clickFirstByText, dismissOverlays, waitForSettled } = require('../util/dom');

async function waitForDomNav(page, timeoutMs) {
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {}),
    waitForSettled(page, { idleMs: 600, timeoutMs: Math.min(2000, timeoutMs) }).catch(() => {}),
  ]);
}

async function goToCheckout(page) {
  await dismissOverlays(page);
  if (page.url().includes('/checkouts/')) {
    return;
  }

  await clickFirstByText(page, ['checkout'], { selectors: ['button', 'a'], timeoutMs: 8000 }).catch(
    () => {}
  );
  await waitForDomNav(page, 12000);

  if (page.url().includes('/checkouts/')) {
    return;
  }

  await clickFirstByText(page, ['view cart', 'cart'], { selectors: ['a', 'button'], timeoutMs: 5000 })
    .then(() => waitForDomNav(page, 12000))
    .catch(() => {});

  if (page.url().includes('/checkouts/')) {
    return;
  }

  await clickFirstByText(page, ['checkout'], { selectors: ['button', 'a'], timeoutMs: 20000 });
  await waitForDomNav(page, 20000);
}

module.exports = { goToCheckout };

