const { clickFirstByText, dismissOverlays, waitForSettled } = require('../util/dom');

async function openShopMenu(page) {
  await dismissOverlays(page);
  await page.waitForSelector('header, nav', { timeout: 20000 }).catch(() => {});

  const did = await page
    .evaluate(() => {
      const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      const roots = Array.from(document.querySelectorAll('header, nav'));
      const links = roots
        .flatMap((r) => Array.from(r.querySelectorAll('a[href],button')))
        .filter((el) => isVisible(el) && !el.disabled);

      const pick = links.find((el) => {
        const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (text !== 'shop') return false;
        if (el.tagName.toLowerCase() === 'a') {
          const href = el.getAttribute('href') || '';
          if (href.startsWith('http') && !href.includes('stanley1913.com')) return false;
        }
        return true;
      });

      if (!pick) return false;
      pick.scrollIntoView({ block: 'center', inline: 'center' });
      pick.click();
      return true;
    })
    .catch(() => false);

  if (!did) {
    await clickFirstByText(page, 'shop', {
      selectors: ['header a', 'header button', 'nav a', 'nav button'],
      exact: true,
      timeoutMs: 20000,
    });
  }

  await waitForSettled(page, { timeoutMs: 30000 }).catch(() => {});
}

module.exports = { openShopMenu };

