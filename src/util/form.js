const { clickFirstByText } = require('./dom');

async function setNativeValue(page, selectors, value) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  const val = String(value);
  for (const sel of list) {
    const did = await page
      .evaluate(
        ({ sel, val }) => {
          const el = document.querySelector(sel);
          if (!el || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false;
          const proto = Object.getPrototypeOf(el);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          const setter = desc?.set;
          if (setter) setter.call(el, val);
          else el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.blur?.();
          return true;
        },
        { sel, val }
      )
      .catch(() => false);
    if (did) return true;
  }
  return false;
}

async function typeInto(page, selectors, value, { clear = true } = {}) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    const el = await page.$(sel);
    if (!el) continue;
    if (clear) {
      await setNativeValue(page, [sel], '').catch(() => {});
    }
    await el.click({ clickCount: 3 }).catch(() => {});
    await el.focus();
    if (clear) {
      const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.down(mod).catch(() => {});
      await page.keyboard.press('A').catch(() => {});
      await page.keyboard.up(mod).catch(() => {});
      await page.keyboard.press('Backspace').catch(() => {});
    }
    await page.type(sel, String(value), { delay: 5 });
    await page.keyboard.press('Tab').catch(() => {});
    return true;
  }
  throw new Error(`Could not find input for selectors: ${list.join(', ')}`);
}

async function selectByLabelOrValue(page, selectors, { label, value }) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    const el = await page.$(sel);
    if (!el) continue;

    if (value) {
      const selected = await page.select(sel, value).catch(() => []);
      if (Array.isArray(selected) && selected.includes(value)) return true;
    }

    if (label) {
      const selected = await page.evaluate(({ sel, label }) => {
        const norm = (v) => String(v || '').trim().toLowerCase();
        const s = document.querySelector(sel);
        if (!s) return false;

        const wanted = norm(label);
        const opts = Array.from(s.options || []);
        const match = (o) => {
          const text = norm(o.label || o.textContent);
          const val = norm(o.value);
          if (text === wanted || val === wanted) return true;

          const altRaw = o.getAttribute('data-alternate-values');
          if (altRaw) {
            try {
              const alts = JSON.parse(altRaw);
              if (Array.isArray(alts) && alts.some((a) => norm(a) === wanted)) return true;
            } catch (_) {}
          }
          return false;
        };

        const opt =
          opts.find(match) ||
          opts.find((o) => norm(o.label || o.textContent).includes(wanted)) ||
          opts.find((o) => norm(o.value).includes(wanted));

        if (!opt) return false;

        s.focus?.();
        s.value = opt.value;
        s.dispatchEvent(new Event('input', { bubbles: true }));
        s.dispatchEvent(new Event('change', { bubbles: true }));
        s.blur?.();
        return true;
      }, { sel, label });
      if (selected) return true;
    }
  }
  throw new Error(`Could not select option for selectors: ${list.join(', ')}`);
}

async function checkFirstRadioByName(page, name) {
  const did = await page.evaluate((name) => {
    const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`));
    const enabled = radios.find((r) => !r.disabled);
    if (!enabled) return false;
    enabled.click();
    return true;
  }, name);
  if (!did) throw new Error(`Could not select radio group: ${name}`);
}

async function clickContinue(page) {
  await clickFirstByText(page, ['continue to shipping', 'continue to delivery', 'continue'], {
    selectors: ['button', 'input[type="submit"]'],
    timeoutMs: 20000,
  });
}

module.exports = { setNativeValue, typeInto, selectByLabelOrValue, checkFirstRadioByName, clickContinue };

