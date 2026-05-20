import crypto from 'crypto';
import cache from '../../cache';

type TelegramMiniAppUser = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

const parseInitData = (initData: string): Record<string, string> => {
  const params = new URLSearchParams(initData);
  return Object.fromEntries(params.entries());
};

const validateTelegramInitData = (initData: string, botToken: string): boolean => {
  if (!initData || !botToken) return false;

  const data = parseInitData(initData);
  const providedHash = data.hash;
  if (!providedHash) return false;

  delete data.hash;

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(providedHash, 'hex'), Buffer.from(calculatedHash, 'hex'));
  } catch {
    return false;
  }
};

const getTelegramUserFromInitData = (initData: string): TelegramMiniAppUser | null => {
  const data = parseInitData(initData);
  if (!data.user) return null;

  try {
    return JSON.parse(data.user) as TelegramMiniAppUser;
  } catch {
    return null;
  }
};

const getAuthenticatedWebUser = (req: any): TelegramMiniAppUser | null => {
  const initData = req.headers['x-telegram-init-data'] || req.query.initData;
  if (typeof initData === 'string' && validateTelegramInitData(initData, cache.config.bot_token)) {
    return getTelegramUserFromInitData(initData);
  }

  if (cache.config.dev_mode) {
    const devUser = req.headers['x-dev-user'];
    if (typeof devUser === 'string') {
      try {
        return JSON.parse(devUser);
      } catch {
        return null;
      }
    }
  }

  return null;
};

export {
  getAuthenticatedWebUser,
  getTelegramUserFromInitData,
  parseInitData,
  validateTelegramInitData,
};
