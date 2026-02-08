# 🎭 Web Checkout Bot - Stanley

> Automate the complete purchase flow on Stanley1913.com with a single command or HTTP API. Navigate, select products, fill forms, and checkout—all while you watch or sleep.

## 🚀 Quick Start

### CLI Mode
```bash
# Install dependencies
npm install

# Copy and configure
cp config/bot.config.example.json config/bot.config.json
# Edit config/bot.config.json with your details

# Run in safe mode (won't submit order)
npm run bot -- --headful --slowmo 100
```

### HTTP Server Mode (for n8n/Zapier/Make)
```bash
npm run server

# Local testing (headless)
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"productUrl": "https://www.stanley1913.com/products/adventure-quencher-travel-tumbler-40-oz", "confirmPurchase": false}'

# With visible browser
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"productUrl": "https://www.stanley1913.com/products/adventure-quencher-travel-tumbler-40-oz", "confirmPurchase": false, "headful": true, "slowMo": 100}'

# Deploy to Render.com (free): Push to GitHub, connect to Render, auto-deploys from render.yaml

# Expose locally with ngrok (for testing webhooks/external access)
npm run server
# In another terminal:
ngrok http 3000
```

## ✨ Features

- **Dual Mode Operation** - CLI for manual runs, HTTP server for automation workflows (n8n, Zapier, Make)
- **Direct Product URL** - Start from any Stanley product page (HTTP mode)
- **Complete Automation** - From homepage to checkout, handles the entire purchase flow
- **Smart Element Detection** - Multiple selector strategies handle dynamic websites
- **Overlay Management** - Automatically dismisses modals, popups, and cookie banners
- **iframe Support** - Handles payment forms embedded in iframes (Stripe, Braintree, etc.)
- **Comprehensive Logging** - Screenshots, HTML snapshots, and detailed logs for each step
- **Safety First** - Default safe mode prevents accidental purchases
- **Retry Logic** - Robust error handling with automatic retries
- **Framework Compatible** - Works with React, Vue, Angular, and vanilla JS sites

## 📋 Requirements

- Node.js 14+ 
- Chrome/Chromium (installed automatically by Puppeteer)

## ⚙️ Configuration

Create `config/bot.config.json` from the example:

```json
{
  "baseUrl": "https://www.stanley1913.com/",
  "timeouts": {
    "actionMs": 30000,
    "navigationMs": 60000
  },
  "shipping": {
    "email": "your@email.com",
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "Seattle",
    "state": "Washington",
    "postalCode": "98101",
    "country": "United States",
    "phone": "2065550123"
  },
  "payment": {
    "nameOnCard": "JOHN DOE",
    "cardNumber": "4242424242424242",
    "expiry": "12/34",
    "cvv": "123"
  }
}
```

## 🎮 Usage

### Safe Mode (Recommended for Testing)
```bash
# Watch the bot in action (visible browser)
npm run bot -- --headful --slowmo 100

# Run headless (no browser window)
npm run bot -- --headless
```

### Production Mode (⚠️ Will Submit Order)
```bash
npm run bot -- --headful --confirm-purchase
```

### Options

| Flag | Description |
|------|-------------|
| `--headful` | Show browser UI (great for debugging) |
| `--headless` | Run without browser window (default) |
| `--slowmo <ms>` | Slow down actions by milliseconds |
| `--confirm-purchase` | **Enable actual order submission** |
| `--config <path>` | Path to config file |
| `--help` | Show help message |

### Environment Variables

```bash
BOT_CONFIG_PATH=./config/bot.config.json npm run bot
```

## 🛡️ Safety

**By default, the bot stops before submitting the final order.** This prevents accidental purchases during testing.

To actually complete a purchase, you must explicitly pass `--confirm-purchase`:

```bash
npm run bot -- --confirm-purchase
```

## 📁 Project Structure

```
puppet/
├── src/
│   ├── cli.js              # Entry point
│   ├── runner.js            # Main orchestrator
│   ├── steps/               # Automation steps
│   │   ├── openHome.js
│   │   ├── openShopMenu.js
│   │   ├── selectAnyTumblerOrCup.js
│   │   ├── addToCart.js
│   │   ├── goToCheckout.js
│   │   ├── fillContactAndShipping.js
│   │   ├── continueToPayment.js
│   │   ├── fillPayment.js
│   │   └── submitOrderAttempt.js
│   └── util/                # Utilities
│       ├── artifacts.js     # Logging & screenshots
│       ├── browser.js       # Browser config
│       ├── config.js        # Config loader
│       ├── dom.js           # DOM interactions
│       ├── form.js          # Form filling
│       └── frames.js        # iframe handling
├── config/
│   └── bot.config.example.json
└── artifacts/               # Generated logs & screenshots
```

## 📊 Artifacts

Each run creates a timestamped directory in `artifacts/` containing:

- `run.log` - Detailed execution log
- `step_*.png` - Screenshots at each step
- `step_*.html` - HTML snapshots
- `step_*.url.txt` - URLs visited

Example: `artifacts/20260126-143052/`

## 🔧 How It Works

1. **Launch Browser** - Starts Puppeteer with configured options
2. **Navigate Home** - Goes to base URL and dismisses overlays
3. **Open Shop** - Finds and clicks the "Shop" menu
4. **Select Product** - Navigates to a tumbler/cup product page
5. **Add to Cart** - Selects variants and adds product
6. **Checkout** - Navigates to checkout page
7. **Fill Shipping** - Completes contact and shipping forms
8. **Payment** - Fills credit card information (handles iframes)
9. **Submit** - Optionally completes the order (if `--confirm-purchase`)

Each step includes error handling, retries, and artifact capture.

## 🎯 Design Highlights

- **Multiple Selector Strategy** - Tries various selectors to find elements (handles site changes)
- **Recoverable Errors** - Detects and retries on transient errors (page navigation, context loss)
- **Event Dispatching** - Manually triggers input/change events for framework compatibility
- **Smart Waiting** - Waits for network idle, DOM ready, and element visibility
- **Platform Aware** - Uses correct keyboard shortcuts (Cmd on macOS, Ctrl on Windows/Linux)
