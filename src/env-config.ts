import { Config } from './interfaces';
import * as fs from 'fs';

const parseDotEnvFile = (content: string): Record<string, string> => {
  return content
    .split(/\r?\n/)
    .reduce((accumulator: Record<string, string>, line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return accumulator;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key) {
        return accumulator;
      }

      accumulator[key] = rawValue.replace(/^['"]|['"]$/g, '');
      return accumulator;
    }, {});
};

const loadRootDotEnv = (path: string = './.env'): Record<string, string> => {
  if (!fs.existsSync(path)) {
    return {};
  }

  return parseDotEnvFile(fs.readFileSync(path, 'utf8'));
};

const parseOptionalNumber = (value?: string): number | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalBoolean = (value?: string): boolean | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return null;
};

const applyEnvironmentOverrides = (config: Config, env: Record<string, string>): Config => {
  const runtimeEnv = { ...env, ...process.env };
  const nextConfig = {
    ...config,
  } as Config;

  if (runtimeEnv.TELEGRAM_BOT_TOKEN) {
    nextConfig.bot_token = runtimeEnv.TELEGRAM_BOT_TOKEN;
  }
  if (runtimeEnv.ADMIN_TELEGRAM_ID) {
    nextConfig.owner_id = runtimeEnv.ADMIN_TELEGRAM_ID;
  }
  if (runtimeEnv.MY_EVM_RECEIVING_ADDRESS) {
    nextConfig.my_evm_receiving_address = runtimeEnv.MY_EVM_RECEIVING_ADDRESS;
  }

  const leadFeeFromEnv = parseOptionalNumber(runtimeEnv.DEFAULT_LEAD_FEE_EUR);
  if (leadFeeFromEnv !== null) {
    nextConfig.marketplace_lead_fee = leadFeeFromEnv;
  }

  const webServerFromEnv = parseOptionalBoolean(runtimeEnv.WEB_SERVER);
  if (webServerFromEnv !== null) {
    nextConfig.web_server = webServerFromEnv;
  }

  const devModeFromEnv = parseOptionalBoolean(runtimeEnv.DEV_MODE);
  if (devModeFromEnv !== null) {
    nextConfig.dev_mode = devModeFromEnv;
  }

  const webServerPortFromEnv = parseOptionalNumber(runtimeEnv.WEB_SERVER_PORT);
  if (webServerPortFromEnv !== null) {
    nextConfig.web_server_port = webServerPortFromEnv;
  }

  const marketplaceEnabledFromEnv = parseOptionalBoolean(runtimeEnv.MARKETPLACE_ENABLED);
  if (marketplaceEnabledFromEnv !== null) {
    nextConfig.marketplace_enabled = marketplaceEnabledFromEnv;
  }

  if (runtimeEnv.WEB_APP_URL) {
    nextConfig.web_app_url = runtimeEnv.WEB_APP_URL;
  }

  if (runtimeEnv.DATABASE_URL) {
    nextConfig.database_url = runtimeEnv.DATABASE_URL;
    if (/^mongodb(\+srv)?:\/\//i.test(runtimeEnv.DATABASE_URL)) {
      nextConfig.mongodb_uri = runtimeEnv.DATABASE_URL;
    }
  }

  if (runtimeEnv.MONGODB_URI) {
    nextConfig.mongodb_uri = runtimeEnv.MONGODB_URI;
  }
  if (runtimeEnv.MONGO_URI) {
    nextConfig.mongodb_uri = runtimeEnv.MONGO_URI;
  }

  return nextConfig;
};

export {
  applyEnvironmentOverrides,
  loadRootDotEnv,
  parseDotEnvFile,
  parseOptionalBoolean,
};
