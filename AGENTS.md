# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Telegram Support Bot (TSB) v5.0.0 — a Node.js/TypeScript support ticketing bot for Telegram (primary) and Signal (secondary), with a marketplace addon and web Mini App. Single `package.json`, no monorepo.

### Services

| Service | How to run | Notes |
|---------|-----------|-------|
| MongoDB | `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017` | Required for `npm run dev`. Tests mock MongoDB. |
| App (dev) | `npm run dev` | Requires `config/config.yaml` + a real Telegram bot token. |

### Lint / Test / Build

- **Lint**: `ESLINT_USE_FLAT_CONFIG=false npx eslint src/` — the project uses `.eslintrc.yml` (legacy format) with ESLint 9, so the env var is required. Two pre-existing rule errors (`valid-jsdoc`, `require-jsdoc`) come from `eslint-config-google`.
- **Test**: `npm test` — runs Jest with all external services mocked. No MongoDB or bot token needed.
- **Build**: `npm run build` — compiles TypeScript to `./build/`.
- **Dev**: `npm run dev` — uses `ts-node-dev` for hot reload.

### Config

- Copy `config/config-sample.yaml` to `config/config.yaml` before running the app.
- The app reads `.env` from the project root for secrets (see `.env.example`). `TELEGRAM_BOT_TOKEN` maps to `bot_token` in the config.
- MongoDB URI defaults to `mongodb://localhost:27017/support` if not set via `MONGO_URI` / `mongodb_uri`.

### Gotchas

- The app exits immediately if `bot_token` is `'YOUR_BOT_TOKEN'` — a real Telegram bot token is required to start the Telegram addon.
- ESLint 9 requires `ESLINT_USE_FLAT_CONFIG=false` to work with the existing `.eslintrc.yml` config.
- Node.js engine requirement: `>=22.0.0`.
