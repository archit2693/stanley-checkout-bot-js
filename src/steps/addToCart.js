const { clickFirstByText, dismissOverlays, waitForSettled } = require('../util/dom');

async function selectFirstOptionFromSelects(page) {
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select')).filter((s) => {
      const r = s.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !s.disabled;
    });
    for (const s of selects) {
      const opts = Array.from(s.options || []).filter((o) => !o.disabled && o.value);
      const pick = opts.find((o) => !/select|choose|pick/i.test(o.textContent || '')) || opts[0];
      if (pick) {
        s.value = pick.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
}

async function clickFirstEnabledVariantButton(page) {
  const did = await page.evaluate(() => {
    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const btns = Array.from(document.querySelectorAll('button')).filter(
      (b) =>
        isVisible(b) &&
        !b.disabled &&
        !/add to cart|checkout|buy now/i.test((b.innerText || b.textContent || '').trim())
    );

    const preferred = btns.find((b) =>
      /oz|color|size|ml|fl|flowstate|quencher/i.test(
        (b.getAttribute('aria-label') || b.innerText || b.textContent || '').toLowerCase()
      )
    );
    const target = preferred || btns[0];
    if (!target) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  });
  return did;
}

async function addToCart(page) {
  await dismissOverlays(page);
  await selectFirstOptionFromSelects(page);
  await clickFirstEnabledVariantButton(page).catch(() => {});

  await clickFirstByText(page, ['add to cart', 'add to bag'], {
    selectors: ['button', 'a'],
    timeoutMs: 20000,
  });

  await waitForSettled(page, { idleMs: 600, timeoutMs: 2500 }).catch(() => {});
}

module.exports = { addToCart };

