const { dismissOverlays, waitForSettled } = require('../util/dom');
const { setNativeValue, typeInto, selectByLabelOrValue, clickContinue } = require('../util/form');

async function waitForAnySelector(page, selectors, timeoutMs) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  const result = await Promise.race([
    ...list.map((sel) => page.waitForSelector(sel, { timeout: timeoutMs }).then(() => true).catch(() => null)),
    new Promise((r) => setTimeout(() => r(null), timeoutMs)),
  ]);
  return !!result;
}

async function fillContactAndShipping(page, config) {
  await dismissOverlays(page);

  const found = await waitForAnySelector(
    page,
    ['input#email', 'input[name="email"]', 'input[autocomplete="email"]', 'input[name="checkout[email]"]'],
    20000
  );
  if (!found) throw new Error('Email field not found on checkout page');

  const s = config.shipping;
  await typeInto(
    page,
    ['input#email', 'input[name="email"]', 'input[name="checkout[email]"]', 'input[autocomplete="email"]'],
    s.email
  );

  await typeInto(
    page,
    [
      'input[name*="first_name"]',
      'input[placeholder="First name"]',
      'input[autocomplete="given-name"]',
      'input[name="checkout[shipping_address][first_name]"]',
    ],
    s.firstName
  );

  await typeInto(
    page,
    [
      'input[name*="last_name"]',
      'input[placeholder="Last name"]',
      'input[autocomplete="family-name"]',
      'input[name="checkout[shipping_address][last_name]"]',
    ],
    s.lastName
  );

  await typeInto(
    page,
    [
      'input[name*="address1"]',
      'input[placeholder="Address"]',
      'input[autocomplete="shipping address-line1"]',
      'input[name="checkout[shipping_address][address1]"]',
      'input[autocomplete="address-line1"]',
    ],
    s.address1
  );
  await page.keyboard.press('Escape').catch(() => {});
  await new Promise((r) => setTimeout(r, 300));

  if (s.address2) {
    await typeInto(
      page,
      [
        'input[name*="address2"]',
        'input[placeholder*="Apartment" i]',
        'input[autocomplete="shipping address-line2"]',
        'input[name="checkout[shipping_address][address2]"]',
        'input[autocomplete="address-line2"]',
      ],
      s.address2
    ).catch(() => {});
  }

  await typeInto(
    page,
    [
      'input[name*="city"]',
      'input[placeholder="City"]',
      'input[autocomplete="shipping address-level2"]',
      'input[name="checkout[shipping_address][city]"]',
      'input[autocomplete="address-level2"]',
    ],
    s.city
  );

  await typeInto(
    page,
    [
      'input[name*="zip"]',
      'input[name*="postal"]',
      'input[placeholder*="zip" i]',
      'input[autocomplete="shipping postal-code"]',
      'input[name="checkout[shipping_address][zip]"]',
      'input[autocomplete="postal-code"]',
    ],
    s.postalCode
  );

  await selectByLabelOrValue(page, ['select[name*="country"]'], { label: s.country }).catch(() => {});

  if (s.state) {
    const zoneSelectors = ['select[name="zone"]', '#Select3', 'select[autocomplete="shipping address-level1"]'];
    await waitForAnySelector(page, zoneSelectors, 20000);

    const zoneSelector = zoneSelectors.join(', ');
    const zoneValue = await page
      .evaluate(
        ({ sel, wanted }) => {
          const norm = (v) => String(v || '').trim().toLowerCase();
          const s = document.querySelector(sel);
          if (!s) return '';
          const w = norm(wanted);
          const opts = Array.from(s.options || []);
          const match = (o) => {
            const text = norm(o.label || o.textContent);
            const val = norm(o.value);
            if (text === w || val === w) return true;
            const altRaw = o.getAttribute('data-alternate-values');
            if (altRaw) {
              try {
                const alts = JSON.parse(altRaw);
                if (Array.isArray(alts) && alts.some((a) => norm(a) === w)) return true;
              } catch (_) {}
            }
            return false;
          };
          const opt =
            opts.find(match) ||
            opts.find((o) => norm(o.label || o.textContent).includes(w)) ||
            opts.find((o) => norm(o.value).includes(w));
          return opt?.value ? String(opt.value) : '';
        },
        { sel: zoneSelector, wanted: s.state }
      )
      .catch(() => '');

    if (zoneValue) {
      await page.select(zoneSelector, zoneValue).catch(() => {});
    } else {
      await selectByLabelOrValue(page, [zoneSelector], { label: s.state }).catch(() => {});
    }

    await waitForSettled(page, { idleMs: 500, timeoutMs: 2000 });

    const stateOk = await page
      .evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? String(el.value || '').trim().length > 0 : false;
      }, zoneSelector)
      .catch(() => false);

    if (!stateOk) throw new Error('State selection failed');
  }

  const phoneSelectors = [
    'input[name*="phone"]',
    'input[placeholder="Phone"]',
    'input[autocomplete="shipping tel"]',
    'input[name="checkout[shipping_address][phone]"]',
    'input[autocomplete="tel"]',
  ];

  const phoneTyped = await typeInto(page, phoneSelectors, s.phone).catch(() => false);
  if (!phoneTyped) {
    await setNativeValue(page, phoneSelectors, String(s.phone).replace(/[^\d+]/g, '')).catch(() => {});
  }

  await waitForSettled(page, { idleMs: 400, timeoutMs: 2000 });

  await clickContinue(page);

  await Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
    page.waitForFunction(() => !location.pathname.includes('/information'), { timeout: 30000 }),
  ]).catch(() => {});

  await waitForSettled(page, { idleMs: 500, timeoutMs: 3000 });

  if (page.url().includes('/information')) {
    throw new Error('Checkout did not advance past Information (validation likely failed)');
  }
}

module.exports = { fillContactAndShipping };
