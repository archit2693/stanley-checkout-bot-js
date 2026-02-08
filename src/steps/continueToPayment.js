const { dismissOverlays, waitForSettled } = require('../util/dom');
const { clickContinue, checkFirstRadioByName } = require('../util/form');

async function continueToPayment(page) {
  await dismissOverlays(page);
  await waitForSettled(page, { idleMs: 500, timeoutMs: 3000 });

  await checkFirstRadioByName(page, 'checkout[shipping_rate][id]').catch(() => {});
  await waitForSettled(page, { idleMs: 300, timeoutMs: 1500 });

  await clickContinue(page);

  await Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
    page.waitForFunction(() => location.pathname.includes('/payment'), { timeout: 30000 }),
  ]).catch(() => {});

  await waitForSettled(page, { idleMs: 500, timeoutMs: 3000 });

  if (!page.url().includes('/payment')) {
    throw new Error('Checkout did not advance to Payment');
  }
}

module.exports = { continueToPayment };
