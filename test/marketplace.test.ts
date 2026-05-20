jest.mock('../src/cache', () => ({
  config: {
    bot_token: '123456:TEST_TOKEN',
    owner_id: 'owner1',
    marketplace_lead_fee: 0.5,
    marketplace_currency: 'EUR',
    marketplace_crypto_refund_fee: 0.03,
    marketplace_crypto_refund_chain: 'Polygon',
    marketplace_request_categories: ['Stan na dan', 'Tražim pomoć'],
    marketplace_cities: ['Beograd', 'Novi Sad'],
    marketplace_listing_categories: ['Auto', 'Nekretnine', 'Razno'],
    marketplace_voucher_providers: ['X-bon', 'Aircash'],
    mt_pelerin_url: 'https://widget.mtpelerin.com',
    telegram_payment_provider_token: '',
    web_app_url: 'https://example.com/app',
    staffchat_id: 'staff1',
    staffchat_type: 'telegram',
  },
}));

jest.mock('../src/middleware', () => ({
  sendMessage: jest.fn(),
}));

jest.mock('../src/addons/telegram', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      bot: {
        api: {
          raw: {
            createInvoiceLink: jest.fn().mockResolvedValue('https://t.me/invoice'),
          },
        },
      },
    })),
  },
}));

jest.mock('mongoose', () => {
  const createQuery = () => ({
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  });

  return {
    Schema: Object.assign(
      jest.fn().mockImplementation(() => ({})),
      { Types: { ObjectId: function ObjectId() {} } }
    ),
    model: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn(() => createQuery()),
      create: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn(),
    }),
    models: {},
    Types: { ObjectId: function ObjectId() {} },
  };
});

import {
  calculateCryptoRefundNetAmount,
  formatMoney,
  getMarketplaceOptions,
  isProviderMatchingRequest,
  isValidEvmAddress,
  normalizeMarketplaceValue,
  normalizeVoucherCode,
  parseLeadFeeInput,
  toMinorUnits,
} from '../src/addons/marketplace';

describe('marketplace helpers', () => {
  it('normalizes marketplace values for matching', () => {
    expect(normalizeMarketplaceValue('  Brčko ')).toBe('brcko');
  });

  it('parses lead fee input with Balkan decimal formats', () => {
    expect(parseLeadFeeInput('0,75')).toBe(0.75);
    expect(parseLeadFeeInput('abc')).toBeNull();
  });

  it('matches provider city and category against request', () => {
    expect(isProviderMatchingRequest(
      {
        citiesNormalized: ['beograd'],
        categoriesNormalized: ['stan na dan'],
      },
      {
        cityNormalized: 'beograd',
        categoryNormalized: 'stan na dan',
      }
    )).toBe(true);
  });

  it('returns configured marketplace options', () => {
    expect(getMarketplaceOptions()).toEqual({
      requestCategories: ['Stan na dan', 'Tražim pomoć'],
      cities: ['Beograd', 'Novi Sad'],
      listingCategories: ['Auto', 'Nekretnine', 'Razno'],
      voucherProviders: ['X-bon', 'Aircash'],
    });
  });

  it('formats fee amounts and minor units', () => {
    expect(formatMoney(0.5, 'EUR')).toBe('€0.50');
    expect(toMinorUnits(0.5)).toBe(50);
  });

  it('normalizes voucher codes and validates evm addresses', () => {
    expect(normalizeVoucherCode(' xbon-1234 5678 ')).toBe('XBON12345678');
    expect(isValidEvmAddress('0x1234567890abcdef1234567890ABCDEF12345678')).toBe(true);
    expect(isValidEvmAddress('0x123')).toBe(false);
  });

  it('deducts network fee from crypto refunds', () => {
    expect(calculateCryptoRefundNetAmount(0.5, 0.03)).toBe(0.47);
    expect(calculateCryptoRefundNetAmount(0.02, 0.03)).toBe(0);
  });
});
