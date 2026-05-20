jest.mock('../src/cache', () => ({
  config: {
    bot_token: '123456:TEST_TOKEN',
    owner_id: 'owner1',
    marketplace_lead_fee: 0.5,
    marketplace_currency: 'EUR',
    marketplace_request_categories: ['Stan na dan', 'Tražim pomoć'],
    marketplace_cities: ['Beograd', 'Novi Sad'],
    marketplace_listing_categories: ['Auto', 'Nekretnine', 'Razno'],
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
  formatMoney,
  getMarketplaceOptions,
  isProviderMatchingRequest,
  normalizeMarketplaceValue,
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
    });
  });

  it('formats fee amounts and minor units', () => {
    expect(formatMoney(0.5, 'EUR')).toBe('€0.50');
    expect(toMinorUnits(0.5)).toBe(50);
  });
});
