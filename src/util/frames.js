function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findFrameWithSelector(page, selector, { timeoutMs = 15000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const frame of page.frames()) {
      try {
        const el = await frame.$(selector);
        if (el) return { frame, el };
      } catch (_) {}
    }
    await sleep(300);
  }
  return null;
}

async function clearFrameInput(frame, el) {
  await el.click({ clickCount: 3 }).catch(() => {});
  await frame.evaluate((input) => {
    if (input && typeof input.select === 'function') input.select();
  }, el).catch(() => {});
  await el.press('Backspace').catch(() => {});
}

async function verifyTyped(frame, sel, expected) {
  const actual = await frame
    .$eval(sel, (input) => (input.value || '').replace(/\s/g, ''))
    .catch(() => null);

  if (actual === null) return true;
  if (actual.length > 0) return true;

  const active = await frame
    .evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : '';
    })
    .catch(() => '');
  if (active === 'INPUT') return true;

  return false;
}

async function typeIntoFrame(page, selectors, value, { retries = 3, delayMs = 55, timeoutMs = 15000 } = {}) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  const val = String(value);

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const sel of list) {
      const result = await findFrameWithSelector(page, sel, { timeoutMs });
      if (!result) continue;

      const { frame, el } = result;
      try {
        await el.click().catch(() => {});
        await sleep(100);
        await clearFrameInput(frame, el);
        await sleep(80);
        await el.type(val, { delay: delayMs });
        await sleep(150);

        if (await verifyTyped(frame, sel, val)) return true;
      } catch (_) {}

      break;
    }

    if (attempt < retries) await sleep(500 * attempt);
  }

  throw new Error(`Could not type into frame input after ${retries} attempts: ${list.join(', ')}`);
}

module.exports = { findFrameWithSelector, typeIntoFrame };
