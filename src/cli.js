#!/usr/bin/env node

const { run } = require('./runner');

function parseArgs(argv) {
  const args = {
    headful: false,
    slowMo: 0,
    confirmPurchase: false,
    configPath: process.env.BOT_CONFIG_PATH || '',
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--headful') args.headful = true;
    else if (a === '--headless') args.headful = false;
    else if (a === '--confirm-purchase') args.confirmPurchase = true;
    else if (a === '--slowmo') args.slowMo = Number(argv[++i] || 0);
    else if (a === '--config') args.configPath = String(argv[++i] || '');
  }

  return args;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage:',
      '  BOT_CONFIG_PATH=./config/bot.config.json node src/cli.js --headful --slowmo 50',
      '',
      'Options:',
      '  --config <path>         Path to config JSON (or use BOT_CONFIG_PATH env var)',
      '  --headful               Run with visible browser UI',
      '  --headless              Run headless (default)',
      '  --slowmo <ms>           Slow down actions (ms)',
      '  --confirm-purchase      Allow final order submit click',
      '  --help, -h              Show this help',
      '',
      'Safety:',
      '  Without --confirm-purchase, the bot stops before the final submit button.',
      '',
    ].join('\n')
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  await run(args);
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exitCode = 1;
});

