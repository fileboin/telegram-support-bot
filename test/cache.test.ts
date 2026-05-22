import cache from '../src/cache';
import { applyEnvironmentOverrides, parseDotEnvFile, parseOptionalBoolean } from '../src/env-config';
import * as fs from 'fs';
import * as YAML from 'yaml';

// Mock file system and YAML
jest.mock('fs');
jest.mock('yaml');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockYAML = YAML as jest.Mocked<typeof YAML>;

describe('Cache Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have default cache structure', () => {
    expect(cache).toHaveProperty('userId');
    expect(cache).toHaveProperty('ticketIDs');
    expect(cache).toHaveProperty('ticketStatus');
    expect(cache).toHaveProperty('ticketSent');
    expect(cache).toHaveProperty('io');
    expect(cache).toHaveProperty('config');
  });

  it('should initialize with correct default values', () => {
    expect(typeof cache.userId).toBe('number');
    expect(Array.isArray(cache.ticketIDs)).toBe(true);
    expect(Array.isArray(cache.ticketStatus)).toBe(true);
    expect(Array.isArray(cache.ticketSent)).toBe(true);
    expect(typeof cache.io).toBe('object');
    expect(typeof cache.config).toBe('object');
  });

  it('should have config with language properties', () => {
    expect(cache.config).toHaveProperty('language');
    expect(cache.config.language).toHaveProperty('dear');
    expect(cache.config.language).toHaveProperty('regards');
  });

  it('should be a singleton instance', () => {
    const cache1 = require('../src/cache').default;
    const cache2 = require('../src/cache').default;
    expect(cache1).toBe(cache2);
  });

  it('should allow modification of cache properties', () => {
    const originalUserId = cache.userId;
    cache.userId = 'test123';
    expect(cache.userId).toBe('test123');
    
    // Reset for other tests
    cache.userId = originalUserId;
  });

  it('should allow adding items to arrays', () => {
    const originalLength = cache.ticketIDs.length;
    cache.ticketIDs.push('T001');
    expect(cache.ticketIDs.length).toBe(originalLength + 1);
    expect(cache.ticketIDs).toContain('T001');
    
    // Clean up
    cache.ticketIDs.pop();
  });

  it('should have configuration properties', () => {
    expect(cache.config).toHaveProperty('parse_mode');
    expect(cache.config).toHaveProperty('categories');
    expect(cache.config).toHaveProperty('anonymous_replies');
    expect(cache.config).toHaveProperty('clean_replies');
  });

  it('should parse dotenv-style content', () => {
    expect(parseDotEnvFile([
      '# comment',
      'TELEGRAM_BOT_TOKEN=test-token',
      'DEFAULT_LEAD_FEE_EUR=0.75',
      '',
    ].join('\n'))).toEqual({
      TELEGRAM_BOT_TOKEN: 'test-token',
      DEFAULT_LEAD_FEE_EUR: '0.75',
    });
  });

  it('should map supported env values onto runtime config', () => {
    const baseConfig: any = {
      bot_token: 'yaml-token',
      owner_id: 'yaml-owner',
      dev_mode: false,
      web_server: false,
      web_server_port: 3000,
      web_app_url: '',
      marketplace_enabled: true,
      marketplace_lead_fee: 0.5,
      mongodb_uri: 'mongodb://yaml-host/support',
      database_url: '',
      my_evm_receiving_address: '',
    };

    const mapped = applyEnvironmentOverrides(baseConfig, {
      TELEGRAM_BOT_TOKEN: 'env-token',
      ADMIN_TELEGRAM_ID: 'env-owner',
      DEFAULT_LEAD_FEE_EUR: '0.90',
      MY_EVM_RECEIVING_ADDRESS: '0xabc',
      DEV_MODE: 'true',
      WEB_SERVER: 'true',
      WEB_SERVER_PORT: '9090',
      WEB_APP_URL: 'https://example.com/app',
      MARKETPLACE_ENABLED: 'false',
      DATABASE_URL: 'postgresql://example',
    });

    expect(mapped.bot_token).toBe('env-token');
    expect(mapped.owner_id).toBe('env-owner');
    expect(mapped.dev_mode).toBe(true);
    expect(mapped.web_server).toBe(true);
    expect(mapped.web_server_port).toBe(9090);
    expect(mapped.web_app_url).toBe('https://example.com/app');
    expect(mapped.marketplace_enabled).toBe(false);
    expect(mapped.marketplace_lead_fee).toBe(0.9);
    expect(mapped.my_evm_receiving_address).toBe('0xabc');
    expect(mapped.database_url).toBe('postgresql://example');
    expect(mapped.mongodb_uri).toBe('mongodb://yaml-host/support');
  });

  it('should parse common boolean env values', () => {
    expect(parseOptionalBoolean('true')).toBe(true);
    expect(parseOptionalBoolean('1')).toBe(true);
    expect(parseOptionalBoolean('false')).toBe(false);
    expect(parseOptionalBoolean('off')).toBe(false);
    expect(parseOptionalBoolean('maybe')).toBeNull();
  });
});
