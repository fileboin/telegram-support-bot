import crypto from 'crypto';

jest.mock('../src/cache', () => ({
  config: {
    bot_token: '123456:TEST_TOKEN',
    dev_mode: false,
  },
}));

import {
  getTelegramUserFromInitData,
  parseInitData,
  validateTelegramInitData,
} from '../src/addons/web/auth';

const createInitData = (botToken: string, user: Record<string, any>) => {
  const payload: Record<string, string> = {
    auth_date: '1716220800',
    query_id: 'AAEAAAE',
    user: JSON.stringify(user),
  };

  const dataCheckString = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return `${new URLSearchParams(payload).toString()}&hash=${hash}`;
};

describe('Telegram Mini App auth helpers', () => {
  it('parses init data into a flat object', () => {
    const initData = 'query_id=abc&user=%7B%22id%22%3A1%7D&hash=123';
    expect(parseInitData(initData)).toEqual({
      query_id: 'abc',
      user: '{"id":1}',
      hash: '123',
    });
  });

  it('validates signed init data', () => {
    const initData = createInitData('123456:TEST_TOKEN', {
      id: 42,
      first_name: 'Ana',
      username: 'ana',
    });

    expect(validateTelegramInitData(initData, '123456:TEST_TOKEN')).toBe(true);
  });

  it('extracts the Telegram user from init data', () => {
    const initData = createInitData('123456:TEST_TOKEN', {
      id: 42,
      first_name: 'Ana',
      username: 'ana',
    });

    expect(getTelegramUserFromInitData(initData)).toEqual({
      id: 42,
      first_name: 'Ana',
      username: 'ana',
    });
  });
});
