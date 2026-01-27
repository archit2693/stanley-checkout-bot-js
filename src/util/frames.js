function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findFrameWithSelector(page, selector, { timeoutMs = 15000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const frame of page.frames()) {
      try {
        const el = await frame.$(selector);
        if (el) return frame;
      } catch (_) {}
    }
    await sleep(250);
  }
  return null;
}

async function typeIntoFrame(page, selectors, value) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    const frame = await findFrameWithSelector(page, sel, { timeoutMs: 8000 });
    if (!frame) continue;
    const el = await frame.$(sel);
    if (!el) continue;
    await el.focus();
    await frame.type(sel, String(value), { delay: 10 });
    return true;
  }
  throw new Error(`Could not find frame input for selectors: ${list.join(', ')}`);
}

module.exports = { findFrameWithSelector, typeIntoFrame };

