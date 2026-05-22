# Environment Setup

Use the root `.env` file for your real local secrets and environment-specific values.
These values are automatically loaded at runtime and override matching app config values.

## Where to put your real values

Open this file in the project root:

`/workspace/.env`

If you do not see it in the explorer, use Quick Open:

- Press `Ctrl+P` / `Cmd+P`
- Type `.env`
- Press Enter

## What belongs in `.env`

- `TELEGRAM_BOT_TOKEN` - your Telegram bot token from BotFather
- `ADMIN_TELEGRAM_ID` - your Telegram numeric user ID for admin access
- `MONGODB_URI` - required for the current app runtime and deploys today
- `DATABASE_URL` - your Neon Serverless PostgreSQL connection string for future migration work
- `MY_EVM_RECEIVING_ADDRESS` - your EVM wallet receiving address
- `DEFAULT_LEAD_FEE_EUR` - default marketplace lead fee, currently `0.50`
- `WEB_APP_URL` - the public HTTPS URL for the Mini App, for example `https://your-app.example.com`
- `PUBLIC_URL` - optional hosting-provided public URL; supported as a fallback for Mini App links

## Runtime mapping

The app now maps these `.env` values automatically:

- `TELEGRAM_BOT_TOKEN` -> `bot_token`
- `ADMIN_TELEGRAM_ID` -> `owner_id`
- `DEFAULT_LEAD_FEE_EUR` -> `marketplace_lead_fee`
- `MY_EVM_RECEIVING_ADDRESS` -> `my_evm_receiving_address`
- `DATABASE_URL` -> `database_url`
- `MONGODB_URI` -> `mongodb_uri`
- `WEB_APP_URL` -> `web_app_url`
- `PUBLIC_URL` -> `web_app_url` fallback

If `DATABASE_URL` is a MongoDB connection string, it will also be used as `mongodb_uri`.
If it is a PostgreSQL/Neon URL, it is stored in runtime config, but the current app still uses MongoDB/Mongoose for persistence.
If `web_app_url` is still empty, `/miniapp` will stay disabled instead of sending a broken placeholder link.

## Safe template

The repository also includes a committed template here:

`/workspace/.env.example`

Use `.env.example` as the reference template, but keep your real secrets only in `.env`.
