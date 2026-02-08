const { clickFirstByText, dismissOverlays, waitForSettled } = require('../util/dom');

async function clickFirstProductTile(page) {
  const did = await page.evaluate(() => {
    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const links = Array.from(document.querySelectorAll('a[href]')).filter((a) => {
      if (!isVisible(a)) return false;
      const href = a.getAttribute('href') || '';
      return href.includes('/products/');
    });
    const first = links[0];
    if (!first) return false;
    first.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
    first.click();
    return true;
  });
  if (!did) throw new Error('Could not find a product tile link');
}

async function selectAnyTumblerOrCup(page) {
  await dismissOverlays(page);

  await clickFirstByText(
    page,
    ['tumblers', 'tumbler', 'quenchers', 'quencher', 'drinkware', 'cups'],
    { selectors: ['a', 'button'], timeoutMs: 15000 }
  ).catch(() => { });

  await waitForSettled(page, { idleMs: 400, timeoutMs: 2000 }).catch(() => { });

  const onProduct = page.url().includes('/products/');
  if (!onProduct) {
    await page.waitForSelector('a[href*="/products/"]', { timeout: 15000 }).catch(() => { });
    await clickFirstProductTile(page);
    await waitForSettled(page, { idleMs: 500, timeoutMs: 2500 }).catch(() => { });
  }
}

module.exports = { selectAnyTumblerOrCup };

