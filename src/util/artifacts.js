const fs = require('node:fs/promises');
const path = require('node:path');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function timestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    pad2(d.getMonth() + 1),
    pad2(d.getDate()),
    '-',
    pad2(d.getHours()),
    pad2(d.getMinutes()),
    pad2(d.getSeconds()),
  ].join('');
}

async function createRunArtifacts() {
  const dir = path.resolve(process.cwd(), 'artifacts', timestamp());
  await fs.mkdir(dir, { recursive: true });
  const logPath = path.join(dir, 'run.log');
  await fs.writeFile(logPath, '');

  async function log(line) {
    const msg = `[${new Date().toISOString()}] ${line}\n`;
    await fs.appendFile(logPath, msg);
    process.stdout.write(msg);
  }

  async function savePageSnapshot(page, name) {
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    await page
      .screenshot({ path: path.join(dir, `${safe}.png`), fullPage: true })
      .catch(() => {});
    const html = await page.content().catch(() => '');
    if (html) await fs.writeFile(path.join(dir, `${safe}.html`), html).catch(() => {});
    const url = page.url?.();
    if (url) await fs.writeFile(path.join(dir, `${safe}.url.txt`), String(url)).catch(() => {});
  }

  return { dir, log, savePageSnapshot };
}

async function withStep(artifacts, page, stepName, fn) {
  await artifacts.log(`STEP start: ${stepName}`);
  try {
    const out = await fn();
    await artifacts.savePageSnapshot(page, `step_${stepName}_ok`);
    await artifacts.log(`STEP ok: ${stepName}`);
    return out;
  } catch (err) {
    await artifacts.savePageSnapshot(page, `step_${stepName}_error`);
    await artifacts.log(`STEP error: ${stepName} - ${err?.message || err}`);
    throw err;
  }
}

module.exports = { createRunArtifacts, withStep };

