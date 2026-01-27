const { dismissOverlays, waitForSettled } = require('../util/dom');
const { typeIntoFrame } = require('../util/frames');
const { typeInto } = require('../util/form');

async function fillPayment(page, config) {
  await dismissOverlays(page);
  await waitForSettled(page, { idleMs: 900, timeoutMs: 4000 }).catch(() => {});
  if (!page.url().includes('/payment')) {
    throw new Error('Not on Payment step');
  }

  const p = config.payment;

  await typeInto(page, ['input[name*="name_on_card"]', 'input[name*="name"]'], p.nameOnCard).catch(
    () => {}
  );

  await typeIntoFrame(
    page,
    [
      'input[name="number"]',
      'input[aria-label*="card number" i]',
      'input[placeholder*="card number" i]',
      'input[id*="number" i]',
      'input[name*="cardnumber" i]',
    ],
    p.cardNumber
  );

  await typeIntoFrame(
    page,
    [
      'input[name="expiry"]',
      'input[aria-label*="expiration" i]',
      'input[placeholder*="expiration" i]',
      'input[id*="expiry" i]',
    ],
    p.expiry
  );

  await typeIntoFrame(
    page,
    [
      'input[name="verification_value"]',
      'input[name="cvv"]',
      'input[aria-label*="security code" i]',
      'input[placeholder*="security code" i]',
      'input[aria-label*="cvv" i]',
    ],
    p.cvv
  );
}

module.exports = { fillPayment };

