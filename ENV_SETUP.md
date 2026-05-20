# Environment Setup

Use the root `.env` file for your real local secrets and environment-specific values.

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
- `DATABASE_URL` - your Neon Serverless PostgreSQL connection string
- `MY_EVM_RECEIVING_ADDRESS` - your EVM wallet receiving address
- `DEFAULT_LEAD_FEE_EUR` - default marketplace lead fee, currently `0.50`

## Safe template

The repository also includes a committed template here:

`/workspace/.env.example`

Use `.env.example` as the reference template, but keep your real secrets only in `.env`.
