# 🌍 Geopolitical Risk Monitor

Real-time geopolitical risk tracker with interactive world map and portfolio positioning recommendations powered by live Yahoo Finance data.

![Theme: Dark](https://img.shields.io/badge/theme-dark-0a0a0f)
![Data: Yahoo Finance](https://img.shields.io/badge/data-Yahoo%20Finance-7c3aed)
![Framework: React + D3](https://img.shields.io/badge/stack-React%20%2B%20D3-61dafb)

## Features

- **Interactive Risk Map** — D3 Natural Earth projection with 12 geopolitical risk zones, animated threat indicators, and severity-scaled pulse effects
- **Live Market Data** — Real-time stock prices and performance (YTD, 3M, 1Y, 5Y) from Yahoo Finance
- **Portfolio Positioning** — 6 sector categories (Defense, Energy, Precious Metals, Cybersecurity, Shipping, Agriculture) with 22 tickers mapped to geopolitical risk themes
- **3-Month Sparklines** — Inline price trend charts per stock
- **Risk Scoring** — Composite risk index with CRITICAL / HIGH / ELEVATED / MODERATE / WATCH classifications

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

Open `http://localhost:5173` in your browser.

## Deployment

This repo is configured for **automatic GitHub Pages deployment**. Every push to `main` triggers a build and deploy via GitHub Actions.

### Setup (one-time):

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the site deploys automatically

Your site will be live at: `https://<your-username>.github.io/<repo-name>/`

## Tech Stack

- **React 18** — UI framework
- **D3.js** — Map projection (Natural Earth)
- **Vite** — Build tool
- **Yahoo Finance API** — Market data (via CORS proxy)

## Disclaimer

This tool is for informational and educational purposes only. Risk scores are composite assessments. Stock signals are algorithmic suggestions, not financial advice. Consult a licensed financial advisor before making investment decisions.
