const { dismissOverlays, waitForSettled } = require('../util/dom');
const { clickContinue, checkFirstRadioByName } = require('../util/form');

async function continueToPayment(page) {
  await dismissOverlays(page);
  await checkFirstRadioByName(page, 'checkout[shipping_rate][id]').catch(() => {});
  await clickContinue(page);
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.waitForFunction(() => location.pathname.includes('/payment'), { timeout: 30000 }).catch(() => {}),
  ]);

  if (!page.url().includes('/payment')) throw new Error('Checkout did not advance to Payment');
}

module.exports = { continueToPayment };

