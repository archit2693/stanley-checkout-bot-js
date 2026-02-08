function normalizeText(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecoverableExecutionError(err) {
  const msg = String(err?.message || err || '');
  return (
    msg.includes('Execution context was destroyed') ||
    msg.includes('Cannot find context') ||
    msg.includes('detached Frame')
  );
}

async function waitForSettled(page, { idleMs = 500, timeoutMs = 8000 } = {}) {
  const deadline = Date.now() + timeoutMs;

  if (typeof page.waitForNetworkIdle === 'function') {
    const remaining = Math.max(deadline - Date.now(), 500);
    await page
      .waitForNetworkIdle({ idleTime: Math.min(idleMs, 300), timeout: remaining })
      .catch(() => {});
  }

  const domStableMs = Math.min(idleMs, 400);
  await page
    .evaluate(
      (ms) =>
        new Promise((resolve) => {
          let timer = setTimeout(resolve, ms);
          const obs = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              obs.disconnect();
              resolve();
            }, ms);
          });
          obs.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
          });
          setTimeout(() => {
            obs.disconnect();
            resolve();
          }, ms * 5);
        }),
      domStableMs
    )
    .catch(() => {});

  const leftover = Math.max(deadline - Date.now(), 0);
  if (leftover > 0 && leftover < idleMs) await sleep(leftover);
}

async function clickModalClose(page) {
  const did = await page
    .evaluate(() => {
      const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const modalRoots = Array.from(
        document.querySelectorAll(
          '[role="dialog"], [aria-modal="true"], dialog, [class*="modal" i], [class*="Modal" i]'
        )
      ).filter(isVisible);

      if (modalRoots.length === 0) return false;

      const root = modalRoots[modalRoots.length - 1];
      const candidates = Array.from(
        root.querySelectorAll(
          'button,[role="button"],[aria-label*="close" i],[title*="close" i],[data-testid*="close" i]'
        )
      ).filter((el) => isVisible(el) && !el.disabled);

      const byAria = candidates.find((el) =>
        /close|dismiss|no thanks/i.test(el.getAttribute('aria-label') || el.getAttribute('title') || '')
      );
      const byText = candidates.find((el) => {
        const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        return t === '×' || t.toLowerCase() === 'x';
      });
      const target = byAria || byText;
      if (!target) return false;
      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
      target.click();
      return true;
    })
    .catch(() => false);

  return did;
}

async function clickFirstByText(
  page,
  texts,
  { selectors = ['a', 'button'], exact = false, timeoutMs = 15000 } = {}
) {
  const wanted = (Array.isArray(texts) ? texts : [texts]).map(normalizeText);
  const selector = selectors.join(',');

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let clicked = false;
    try {
      clicked = await page.evaluate(
        ({ selector, wanted, exact }) => {
          const isVisible = (el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };
          const candidates = Array.from(document.querySelectorAll(selector)).filter(
            (el) => isVisible(el) && !el.disabled
          );

          for (const el of candidates) {
            const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
            if (!t) continue;
            const ok = wanted.some((w) => (exact ? t === w : t.includes(w)));
            if (!ok) continue;
            el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
            el.click();
            return true;
          }
          return false;
        },
        { selector, wanted, exact }
      );
    } catch (err) {
      if (isRecoverableExecutionError(err)) {
        await sleep(350);
        continue;
      }
      throw err;
    }

    if (clicked) return true;
    await sleep(300);
  }

  throw new Error(`Could not find clickable element by text: ${texts}`);
}

async function clickFirstMatchingSelector(page, selectors, { timeoutMs = 15000 } = {}) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    try {
      const el = await page.$(sel);
      if (!el) continue;
      await el.click().catch(() => { });
      return true;
    } catch (err) {
      if (isRecoverableExecutionError(err)) break;
      throw err;
    }
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const sel of list) {
      try {
        const el = await page.$(sel);
        if (!el) continue;
        await el.click().catch(() => { });
        return true;
      } catch (err) {
        if (isRecoverableExecutionError(err)) {
          await sleep(350);
          continue;
        }
        throw err;
      }
    }
    await sleep(250);
  }

  throw new Error(`Could not click any selector: ${list.join(', ')}`);
}

async function dismissCookieConsent(page) {
  await clickFirstByText(page, ['accept all cookies', 'accept all', 'accept cookies'], {
    selectors: ['button', 'input[type="button"]', 'input[type="submit"]', 'a'],
    timeoutMs: 2000,
  }).catch(() => { });

  await clickFirstMatchingSelector(
    page,
    [
      '#onetrust-accept-btn-handler',
      '.optanon-alert-box-button-middle',
      '.cookie-accept-all',
      '[id*="accept" i][id*="cookie" i]',
      '[class*="accept" i][class*="cookie" i]',
      '[data-testid*="accept" i][data-testid*="cookie" i]',
    ],
    { timeoutMs: 1500 }
  ).catch(() => { });

  await page
    .evaluate(() => {
      const cookieBanners = document.querySelectorAll(
        '[class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i]'
      );
      cookieBanners.forEach((el) => {
        const buttons = el.querySelectorAll('button, a');
        buttons.forEach((btn) => {
          const text = (btn.innerText || btn.textContent || '').toLowerCase();
          if (
            text.includes('accept all') ||
            text.includes('accept cookies') ||
            (text.includes('accept') && text.includes('all'))
          ) {
            btn.click();
          }
        });
      });
    })
    .catch(() => { });
}

async function dismissOverlays(page, { gentle = false } = {}) {
  await dismissCookieConsent(page);
  await clickModalClose(page).catch(() => {});

  if (gentle) return;

  const common = [
    ['accept', 'agree', 'ok', 'got it'],
    ['close', 'dismiss', 'no thanks'],
  ];

  for (const texts of common) {
    await clickFirstByText(page, texts, {
      selectors: ['button', 'input[type="button"]', 'input[type="submit"]'],
      timeoutMs: 800,
    }).catch(() => {});
  }

  await clickFirstMatchingSelector(
    page,
    [
      '[aria-label="Close"]',
      '[aria-label="close"]',
      'button[aria-label*="dismiss" i]',
      'button[title*="close" i]',
      'button[aria-label*="close" i]',
      'button[data-testid*="close" i]',
      'button[class*="close" i]',
    ],
    { timeoutMs: 500 }
  ).catch(() => {});
}

module.exports = {
  sleep,
  normalizeText,
  waitForSettled,
  clickFirstByText,
  clickFirstMatchingSelector,
  dismissCookieConsent,
  dismissOverlays,
};

