const { createRunArtifacts, withStep } = require('./util/artifacts');
const { loadConfig } = require('./util/config');
const { launchBrowser } = require('./util/browser');
const steps = require('./steps');

async function run({ headful, slowMo, confirmPurchase, configPath }) {
  const artifacts = await createRunArtifacts();
  const config = await loadConfig(configPath);

  const browser = await launchBrowser({ headful, slowMo });
  const page = await browser.newPage();
  page.setDefaultTimeout(config.timeouts?.actionMs ?? 30000);
  page.setDefaultNavigationTimeout(config.timeouts?.navigationMs ?? 60000);

  try {
    await withStep(artifacts, page, 'openHome', () => steps.openHome(page, config));
    await withStep(artifacts, page, 'openShop', () => steps.openShopMenu(page, config));
    await withStep(artifacts, page, 'selectProduct', () => steps.selectAnyTumblerOrCup(page, config));
    await withStep(artifacts, page, 'addToCart', () => steps.addToCart(page, config));
    await withStep(artifacts, page, 'goToCheckout', () => steps.goToCheckout(page, config));
    await withStep(artifacts, page, 'fillShipping', () =>
      steps.fillContactAndShipping(page, config)
    );
    await withStep(artifacts, page, 'continueToPayment', () =>
      steps.continueToPayment(page, config)
    );
    await withStep(artifacts, page, 'fillPayment', () => steps.fillPayment(page, config));
    await withStep(artifacts, page, 'submitOrderAttempt', () =>
      steps.submitOrderAttempt(page, config, { confirmPurchase })
    );
  } finally {
    await browser.close().catch(() => {});
  }
}

async function runWithProductUrl({ productUrl, confirmPurchase, headful, slowMo, configPath }) {
  const artifacts = await createRunArtifacts();
  const config = await loadConfig(configPath);

  const browser = await launchBrowser({ headful, slowMo });
  const page = await browser.newPage();
  page.setDefaultTimeout(config.timeouts?.actionMs ?? 30000);
  page.setDefaultNavigationTimeout(config.timeouts?.navigationMs ?? 60000);

  try {
    await withStep(artifacts, page, 'openProductPage', async () => {
      const { dismissOverlays, waitForSettled } = require('./util/dom');
      await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
      await waitForSettled(page, { timeoutMs: 8000 });
      await dismissOverlays(page);
      await waitForSettled(page, { timeoutMs: 5000 }).catch(() => {});
      await dismissOverlays(page);
    });

    await withStep(artifacts, page, 'addToCart', () => steps.addToCart(page, config));
    await withStep(artifacts, page, 'goToCheckout', () => steps.goToCheckout(page, config));
    await withStep(artifacts, page, 'fillShipping', () =>
      steps.fillContactAndShipping(page, config)
    );
    await withStep(artifacts, page, 'continueToPayment', () =>
      steps.continueToPayment(page, config)
    );
    await withStep(artifacts, page, 'fillPayment', () => steps.fillPayment(page, config));
    await withStep(artifacts, page, 'submitOrderAttempt', () =>
      steps.submitOrderAttempt(page, config, { confirmPurchase })
    );

    return { artifactsPath: artifacts.dir };
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = { run, runWithProductUrl };

