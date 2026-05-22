import fs from 'fs';
import { migrateData } from './migrate';
import cache from './cache';
import { Addon } from './interfaces';
import * as db from './db';
import * as error from './error';
import TelegramAddon from './addons/telegram';
import SignalAddon from './addons/signal';
import * as webserver from './addons/web';
import * as log from 'fancy-log'

/**
 * Check and migrate SQLite database to MongoDB.
 */
async function checkAndMigrateDatabase() {
  const sqliteDbPath = './config/support.db';
  const migratedDbPath = './config/support.old.db';

  if (fs.existsSync(sqliteDbPath)) {
    log.info('SQLite database detected. Starting migration...');
    try {
      await migrateData();
      fs.renameSync(sqliteDbPath, migratedDbPath);
      log.info('Migration completed successfully. Renamed support.db to support.old.db');
    } catch (err) {
      log.error('Migration failed:', err);
      process.exit(1);
    }
  } else {
    log.info('No SQLite database detected. Skipping migration.');
  }
}

/**
 * Factory function to create enabled addons.
 */
function createAddons(): Addon[] {
  const addons: Addon[] = [];

  // Create Telegram addon if a bot token is provided.
  if (cache.config && cache.config.bot_token) {
    if (cache.config.bot_token === 'YOUR_BOT_TOKEN') {
      log.error('Please change your bot token in config/config.yaml');
      process.exit(1);
    }
    const telegram = TelegramAddon.getInstance(cache.config.bot_token);
    // Tag the addon with its platform (for later identification).
    (telegram as any).platform = 'telegram';
    addons.push(telegram);
  }

  // Create Signal addon if enabled.
  if (cache.config && cache.config.signal_enabled) {
    const signalAddon = SignalAddon.getInstance();
    (signalAddon as any).platform = 'signal';
    addons.push(signalAddon);
  }

  return addons;
}

function logStartupConfigurationSummary() {
  const hasMongoUri = Boolean(cache.config.mongodb_uri || process.env.MONGODB_URI || process.env.MONGO_URI);
  const hasDatabaseUrl = Boolean(cache.config.database_url || process.env.DATABASE_URL);
  const hasBotToken = Boolean(cache.config.bot_token);
  const hasAdminId = Boolean(cache.config.owner_id);
  const declaredPort = process.env.PORT || cache.config.web_server_port || 8080;

  log.info(
    [
      'Startup config summary:',
      `bot_token=${hasBotToken ? 'set' : 'missing'}`,
      `admin_id=${hasAdminId ? 'set' : 'missing'}`,
      `mongodb_uri=${hasMongoUri ? 'set' : 'missing'}`,
      `database_url=${hasDatabaseUrl ? 'set' : 'missing'}`,
      `web_server=${cache.config.web_server ? 'enabled' : 'disabled'}`,
      `marketplace=${cache.config.marketplace_enabled ? 'enabled' : 'disabled'}`,
      `port=${declaredPort}`,
    ].join(' ')
  );
}

/**
 * Main initialization function.
 */
async function main(logs = true) {
  logStartupConfigurationSummary();
  await db.connect();
  await checkAndMigrateDatabase();

  // Create and store all enabled addons.
  const addons = createAddons();
  // cache.addons = addons;

  // Initialize the webserver if enabled and if there's a Telegram addon.
  const telegramAddon = addons.find((addon) => (addon as any).platform === 'telegram');
  if (cache.config.web_server && telegramAddon) {
    webserver.init(telegramAddon as TelegramAddon);
  }

  // Initialize global error handling.
  error.init(logs);

  // Start each addon. Each addon handles its own platform-specific configuration.
  addons.forEach((addon) => {
    addon.start();
  });
}

main();

export { createAddons, main };
