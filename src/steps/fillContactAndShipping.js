const { dismissOverlays, waitForSettled } = require('../util/dom');
const { setNativeValue, typeInto, selectByLabelOrValue, clickContinue } = require('../util/form');

async function waitForAnySelector(page, selectors, timeoutMs) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  await Promise.race(
    list.map((sel) => page.waitForSelector(sel, { timeout: timeoutMs }).catch(() => null))
  );
}

async function setAnyVisibleSelectByOption(page, wanted) {
  const did = await page
    .evaluate((wanted) => {
      const norm = (s) => String(s || '').trim().toLowerCase();
      const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const target = norm(wanted);
      const selects = Array.from(document.querySelectorAll('select')).filter(
        (s) => isVisible(s) && !s.disabled
      );
      for (const s of selects) {
        const opts = Array.from(s.options || []);
        const opt =
          opts.find((o) => norm(o.value) === target) ||
          opts.find((o) => norm(o.label || o.textContent) === target) ||
          opts.find((o) => norm(o.label || o.textContent).includes(target));
        if (!opt) continue;
        s.value = opt.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, wanted)
    .catch(() => false);

  return did;
}

async function fillContactAndShipping(page, config) {
  await dismissOverlays(page);
  await waitForAnySelector(
    page,
    ['input#email', 'input[name="email"]', 'input[autocomplete="email"]', 'input[name="checkout[email]"]'],
    20000
  );

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
    await waitForAnySelector(
      page,
      ['select[name="zone"]', '#Select3', 'select[autocomplete="shipping address-level1"]'],
      20000
    );

    const zoneSelector = 'select[name="zone"], #Select3, select[autocomplete="shipping address-level1"]';
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

    await waitForSettled(page, { idleMs: 350, timeoutMs: 1000 }).catch(() => {});

    const stateOk = await page
      .evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const v = String(el.value || '').trim();
        return v.length > 0;
      }, zoneSelector)
      .catch(() => false);

    if (!stateOk) throw new Error('State selection failed');
  }

  await typeInto(
    page,
    [
      'input[name*="phone"]',
      'input[placeholder="Phone"]',
      'input[autocomplete="shipping tel"]',
      'input[name="checkout[shipping_address][phone]"]',
      'input[autocomplete="tel"]',
    ],
    s.phone
  ).catch(() => {});

  await setNativeValue(
    page,
    [
      'input[name*="phone"]',
      'input[placeholder="Phone"]',
      'input[autocomplete="shipping tel"]',
      'input[name="checkout[shipping_address][phone]"]',
      'input[autocomplete="tel"]',
    ],
    String(s.phone).replace(/[^\d+]/g, '')
  ).catch(() => {});

  await waitForSettled(page, { idleMs: 250, timeoutMs: 1000 }).catch(() => {});

  await clickContinue(page);
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page
      .waitForFunction(() => !location.pathname.includes('/information'), { timeout: 30000 })
      .catch(() => {}),
  ]);

  if (page.url().includes('/information')) {
    throw new Error('Checkout did not advance past Information (validation likely failed)');
  }
}

module.exports = { fillContactAndShipping };

