const { waitForSettled } = require('../util/dom');
const { findFrameWithSelector, typeIntoFrame } = require('../util/frames');
const { typeInto } = require('../util/form');

const IFRAME_SELECTORS = {
  number: [
    'iframe[id*="card-fields-number"]',
    'iframe[name*="card-fields-number"]',
    'iframe[src*="card-fields"][src*="number"]',
  ],
  expiry: [
    'iframe[id*="card-fields-expiry"]',
    'iframe[name*="card-fields-expiry"]',
    'iframe[src*="card-fields"][src*="expiry"]',
  ],
  cvv: [
    'iframe[id*="card-fields-verification"]',
    'iframe[name*="card-fields-verification"]',
    'iframe[src*="card-fields"][src*="verification"]',
  ],
};

const INPUT_SELECTORS = {
  number: [
    'input[name="number"]',
    'input[aria-label*="card number" i]',
    'input[placeholder*="card number" i]',
    'input[id*="number" i]',
    'input[name*="cardnumber" i]',
  ],
  expiry: [
    'input[name="expiry"]',
    'input[aria-label*="expiration" i]',
    'input[placeholder*="expiration" i]',
    'input[id*="expiry" i]',
  ],
  cvv: [
    'input[name="verification_value"]',
    'input[name="cvv"]',
    'input[aria-label*="security code" i]',
    'input[placeholder*="security code" i]',
    'input[aria-label*="cvv" i]',
  ],
};

async function waitForPaymentIframes(page, timeoutMs = 30000) {
  const allSelectors = [
    ...IFRAME_SELECTORS.number,
    ...IFRAME_SELECTORS.expiry,
    ...IFRAME_SELECTORS.cvv,
  ];
  const combined = allSelectors.join(',');

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const count = await page
      .evaluate((sel) => document.querySelectorAll(sel).length, combined)
      .catch(() => 0);
    if (count >= 3) return true;

    const anyInput = await findFrameWithSelector(page, INPUT_SELECTORS.number[0], { timeoutMs: 2000 });
    if (anyInput) return true;

    await new Promise((r) => setTimeout(r, 500));
  }

  const fallback = await findFrameWithSelector(page, INPUT_SELECTORS.number[0], { timeoutMs: 5000 });
  if (fallback) return true;

  throw new Error('Payment iframes did not load within timeout');
}

async function tryAutofill(page, payment) {
  const [mm, yy] = payment.expiry.replace(/\s/g, '').split('/');
  const expiryYear = yy.length === 2 ? `20${yy}` : yy;

  for (const sel of INPUT_SELECTORS.number) {
    const result = await findFrameWithSelector(page, sel, { timeoutMs: 3000 });
    if (!result) continue;
    try {
      await result.el.autofill({
        creditCard: {
          number: payment.cardNumber.replace(/\s/g, ''),
          name: payment.nameOnCard,
          expiryMonth: mm.padStart(2, '0'),
          expiryYear: expiryYear,
          cvc: payment.cvv,
        },
      });
      await new Promise((r) => setTimeout(r, 500));
      return true;
    } catch (_) {}
  }
  return false;
}

async function typePaymentFields(page, payment) {
  const opts = { retries: 3, delayMs: 65, timeoutMs: 15000 };

  await typeIntoFrame(page, INPUT_SELECTORS.number, payment.cardNumber, opts);
  await new Promise((r) => setTimeout(r, 300));

  await typeIntoFrame(page, INPUT_SELECTORS.expiry, payment.expiry, opts);
  await new Promise((r) => setTimeout(r, 300));

  await typeIntoFrame(page, INPUT_SELECTORS.cvv, payment.cvv, opts);
}

async function fillPayment(page, config) {
  await waitForSettled(page, { idleMs: 1200, timeoutMs: 8000 });

  if (!page.url().includes('/payment')) {
    throw new Error('Not on Payment step');
  }

  const p = config.payment;

  await waitForPaymentIframes(page);

  await typeInto(page, ['input[name*="name_on_card"]', 'input[name*="name"]'], p.nameOnCard).catch(() => {});

  const autofilled = await tryAutofill(page, p);
  if (autofilled) return;

  await typePaymentFields(page, p);
}

module.exports = { fillPayment };
