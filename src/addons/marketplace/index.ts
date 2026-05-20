import mongoose from 'mongoose';
import cache from '../../cache';
import { sendMessage } from '../../middleware';
import { Messenger } from '../../interfaces';
import * as log from 'fancy-log';

const botTokenSuffix = (cache.config.bot_token || 'token').slice(-5);
const collectionPrefix = `marketplace_${cache.config.owner_id || 'owner'}_${botTokenSuffix}`;

const SETTINGS_ID = 'marketplace-settings';
const LEAD_PREFIX = 'marketplace-lead';

const DEFAULT_REQUEST_CATEGORIES = [
  'Stan na dan',
  'Tražim pomoć',
  'Vodoinstalater',
  'Električar',
  'Selidba',
  'Prevoz',
  'Čišćenje',
  'Ostalo',
];

const DEFAULT_CITIES = [
  'Beograd',
  'Novi Sad',
  'Niš',
  'Kragujevac',
  'Subotica',
  'Sarajevo',
  'Banja Luka',
  'Tuzla',
  'Brčko',
  'Podgorica',
  'Skoplje',
];

const DEFAULT_LISTING_CATEGORIES = ['Auto', 'Nekretnine', 'Razno'];
const DEFAULT_VOUCHER_PROVIDERS = ['X-bon', 'Aircash', 'Voucher'];

type TelegramUser = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type ProviderProfile = mongoose.Document & {
  telegramUserId: string;
  firstName: string;
  username: string;
  cities: string[];
  categories: string[];
  citiesNormalized: string[];
  categoriesNormalized: string[];
  notes: string;
  isActive: boolean;
  lastSeenAt: Date;
};

type MarketplaceRequest = mongoose.Document & {
  clientTelegramId: string;
  clientName: string;
  clientUsername: string;
  title: string;
  category: string;
  categoryNormalized: string;
  city: string;
  cityNormalized: string;
  notes: string;
  status: string;
  matchedProviderId: string | null;
  acceptedLeadId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

type ClassifiedListing = mongoose.Document & {
  ownerTelegramId: string;
  ownerName: string;
  ownerUsername: string;
  title: string;
  category: string;
  city: string;
  cityNormalized: string;
  description: string;
  price: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type Lead = mongoose.Document & {
  requestId: mongoose.Types.ObjectId;
  providerTelegramId: string;
  providerName: string;
  providerUsername: string;
  status: string;
  feeAmount: number;
  currency: string;
  invoicePayload: string;
  paymentChargeId: string;
  paymentMethod: string;
  contactUnlockedAt: Date | null;
  refund_status: string;
  refund_requested_method: string;
  refund_requested_wallet_address: string;
  refund_requested_at: Date | null;
  refund_resolved_at: Date | null;
  refund_fee_deduction: number;
  refund_net_amount: number;
  refund_tx_reference: string;
  createdAt: Date;
  updatedAt: Date;
};

type MarketplaceSettings = mongoose.Document & {
  _id: string;
  leadFee: number;
  currency: string;
  mtPelerinUrl: string;
  cryptoRefundFee: number;
  cryptoRefundChain: string;
  updatedBy: string;
  updatedAt: Date;
};

type WalletAccount = mongoose.Document & {
  telegramUserId: string;
  currency: string;
  balance: number;
  evmRefundAddress: string;
  totalVoucherRedeemed: number;
  createdAt: Date;
  updatedAt: Date;
};

type Voucher = mongoose.Document & {
  code: string;
  normalizedCode: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  redeemedBy: string;
  redeemedAt: Date | null;
  createdBy: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

type BalanceLog = mongoose.Document & {
  telegramUserId: string;
  amount: number;
  currency: string;
  balanceAfter: number;
  type: string;
  direction: string;
  referenceType: string;
  referenceId: string;
  note: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

const SettingsSchema = new mongoose.Schema<MarketplaceSettings>({
  _id: { type: String, default: SETTINGS_ID },
  leadFee: { type: Number, default: Number(cache.config.marketplace_lead_fee || 0.5) },
  currency: { type: String, default: cache.config.marketplace_currency || 'EUR' },
  mtPelerinUrl: { type: String, default: cache.config.mt_pelerin_url || '' },
  cryptoRefundFee: { type: Number, default: Number(cache.config.marketplace_crypto_refund_fee || 0.03) },
  cryptoRefundChain: { type: String, default: cache.config.marketplace_crypto_refund_chain || 'Polygon' },
  updatedBy: { type: String, default: cache.config.owner_id || 'system' },
}, { timestamps: true });

const ProviderSchema = new mongoose.Schema<ProviderProfile>({
  telegramUserId: { type: String, required: true, unique: true },
  firstName: { type: String, default: '' },
  username: { type: String, default: '' },
  cities: { type: [String], default: [] },
  categories: { type: [String], default: [] },
  citiesNormalized: { type: [String], default: [] },
  categoriesNormalized: { type: [String], default: [] },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

const MarketplaceRequestSchema = new mongoose.Schema<MarketplaceRequest>({
  clientTelegramId: { type: String, required: true },
  clientName: { type: String, default: '' },
  clientUsername: { type: String, default: '' },
  title: { type: String, required: true },
  category: { type: String, required: true },
  categoryNormalized: { type: String, required: true },
  city: { type: String, required: true },
  cityNormalized: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, default: 'open' },
  matchedProviderId: { type: String, default: null },
  acceptedLeadId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

const ListingSchema = new mongoose.Schema<ClassifiedListing>({
  ownerTelegramId: { type: String, required: true },
  ownerName: { type: String, default: '' },
  ownerUsername: { type: String, default: '' },
  title: { type: String, required: true },
  category: { type: String, required: true },
  city: { type: String, required: true },
  cityNormalized: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, default: '' },
  status: { type: String, default: 'active' },
}, { timestamps: true });

const LeadSchema = new mongoose.Schema<Lead>({
  requestId: { type: mongoose.Schema.Types.ObjectId, required: true },
  providerTelegramId: { type: String, required: true },
  providerName: { type: String, default: '' },
  providerUsername: { type: String, default: '' },
  status: { type: String, default: 'pending_payment' },
  feeAmount: { type: Number, required: true },
  currency: { type: String, required: true },
  invoicePayload: { type: String, required: true, unique: true },
  paymentChargeId: { type: String, default: '' },
  paymentMethod: { type: String, default: 'telegram' },
  contactUnlockedAt: { type: Date, default: null },
  refund_status: { type: String, default: 'none' },
  refund_requested_method: { type: String, default: '' },
  refund_requested_wallet_address: { type: String, default: '' },
  refund_requested_at: { type: Date, default: null },
  refund_resolved_at: { type: Date, default: null },
  refund_fee_deduction: { type: Number, default: 0 },
  refund_net_amount: { type: Number, default: 0 },
  refund_tx_reference: { type: String, default: '' },
}, { timestamps: true });

const WalletSchema = new mongoose.Schema<WalletAccount>({
  telegramUserId: { type: String, required: true, unique: true },
  currency: { type: String, default: cache.config.marketplace_currency || 'EUR' },
  balance: { type: Number, default: 0 },
  evmRefundAddress: { type: String, default: '' },
  totalVoucherRedeemed: { type: Number, default: 0 },
}, { timestamps: true });

const VoucherSchema = new mongoose.Schema<Voucher>({
  code: { type: String, required: true },
  normalizedCode: { type: String, required: true, unique: true },
  provider: { type: String, default: 'Voucher' },
  amount: { type: Number, required: true },
  currency: { type: String, default: cache.config.marketplace_currency || 'EUR' },
  status: { type: String, default: 'unused' },
  redeemedBy: { type: String, default: '' },
  redeemedAt: { type: Date, default: null },
  createdBy: { type: String, default: '' },
  note: { type: String, default: '' },
}, { timestamps: true });

const BalanceLogSchema = new mongoose.Schema<BalanceLog>({
  telegramUserId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: cache.config.marketplace_currency || 'EUR' },
  balanceAfter: { type: Number, required: true },
  type: { type: String, required: true },
  direction: { type: String, required: true },
  referenceType: { type: String, default: '' },
  referenceId: { type: String, default: '' },
  note: { type: String, default: '' },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

const SettingsModel: any = (mongoose.models[`${collectionPrefix}_settings`] ||
  mongoose.model<MarketplaceSettings>(`${collectionPrefix}_settings`, SettingsSchema));
const ProviderModel: any = (mongoose.models[`${collectionPrefix}_providers`] ||
  mongoose.model<ProviderProfile>(`${collectionPrefix}_providers`, ProviderSchema));
const RequestModel: any = (mongoose.models[`${collectionPrefix}_requests`] ||
  mongoose.model<MarketplaceRequest>(`${collectionPrefix}_requests`, MarketplaceRequestSchema));
const ListingModel: any = (mongoose.models[`${collectionPrefix}_listings`] ||
  mongoose.model<ClassifiedListing>(`${collectionPrefix}_listings`, ListingSchema));
const LeadModel: any = (mongoose.models[`${collectionPrefix}_leads`] ||
  mongoose.model<Lead>(`${collectionPrefix}_leads`, LeadSchema));
const WalletModel: any = (mongoose.models[`${collectionPrefix}_wallets`] ||
  mongoose.model<WalletAccount>(`${collectionPrefix}_wallets`, WalletSchema));
const VoucherModel: any = (mongoose.models[`${collectionPrefix}_vouchers`] ||
  mongoose.model<Voucher>(`${collectionPrefix}_vouchers`, VoucherSchema));
const BalanceLogModel: any = (mongoose.models[`${collectionPrefix}_balance_logs`] ||
  mongoose.model<BalanceLog>(`${collectionPrefix}_balance_logs`, BalanceLogSchema));

const normalizeMarketplaceValue = (value: string = ''): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const normalizeVoucherCode = (value: string = ''): string => value
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .trim();

const uniqueNormalizedList = (values: string[] = []): string[] => {
  return [...new Set(values.map((value) => normalizeMarketplaceValue(value)).filter(Boolean))];
};

const getMarketplaceOptions = () => ({
  requestCategories: cache.config.marketplace_request_categories?.length
    ? cache.config.marketplace_request_categories
    : DEFAULT_REQUEST_CATEGORIES,
  cities: cache.config.marketplace_cities?.length
    ? cache.config.marketplace_cities
    : DEFAULT_CITIES,
  listingCategories: cache.config.marketplace_listing_categories?.length
    ? cache.config.marketplace_listing_categories
    : DEFAULT_LISTING_CATEGORIES,
  voucherProviders: cache.config.marketplace_voucher_providers?.length
    ? cache.config.marketplace_voucher_providers
    : DEFAULT_VOUCHER_PROVIDERS,
});

const parseLeadFeeInput = (value: string): number | null => {
  if (!value) return null;
  const cleaned = value.replace(',', '.').replace(/[^\d.]/g, '');
  if (!/\d/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
};

const formatMoney = (amount: number, currency: string = 'EUR'): string =>
  `${currency === 'EUR' ? '€' : `${currency} `}${Number(amount || 0).toFixed(2)}`;

const toMinorUnits = (amount: number): number => Math.round(amount * 100);

const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

const calculateCryptoRefundNetAmount = (amount: number, networkFee: number): number =>
  roundMoney(Math.max(roundMoney(amount) - roundMoney(networkFee), 0));

const isProviderMatchingRequest = (
  provider: { citiesNormalized?: string[]; categoriesNormalized?: string[] },
  request: { cityNormalized: string; categoryNormalized: string },
): boolean => {
  return Boolean(
    provider.citiesNormalized?.includes(request.cityNormalized) &&
    provider.categoriesNormalized?.includes(request.categoryNormalized),
  );
};

const isValidEvmAddress = (value: string = ''): boolean => /^0x[a-fA-F0-9]{40}$/.test(value.trim());

const toPlainObject = (value: any): any => value && typeof value.toObject === 'function' ? value.toObject() : value;

const getClientContact = (request: any) => {
  const handle = request.clientUsername ? `@${request.clientUsername}` : 'without username';
  return {
    label: `${request.clientName || 'Client'} (${handle})`,
    telegramUrl: request.clientUsername
      ? `https://t.me/${request.clientUsername}`
      : `tg://user?id=${request.clientTelegramId}`,
    username: request.clientUsername || '',
    telegramId: request.clientTelegramId,
  };
};

async function getMarketplaceSettings(): Promise<MarketplaceSettings> {
  return await SettingsModel.findOneAndUpdate(
    { _id: SETTINGS_ID },
    {
      $setOnInsert: {
        leadFee: Number(cache.config.marketplace_lead_fee || 0.5),
        currency: cache.config.marketplace_currency || 'EUR',
        mtPelerinUrl: cache.config.mt_pelerin_url || '',
        cryptoRefundFee: Number(cache.config.marketplace_crypto_refund_fee || 0.03),
        cryptoRefundChain: cache.config.marketplace_crypto_refund_chain || 'Polygon',
        updatedBy: cache.config.owner_id || 'system',
      },
    },
    { upsert: true, new: true }
  );
}

async function setMarketplaceLeadFee(amount: number, updatedBy: string): Promise<MarketplaceSettings> {
  return await SettingsModel.findOneAndUpdate(
    { _id: SETTINGS_ID },
    { $set: { leadFee: amount, updatedBy } },
    { upsert: true, new: true }
  );
}

async function getOrCreateWallet(telegramUserId: string | number): Promise<WalletAccount> {
  return await WalletModel.findOneAndUpdate(
    { telegramUserId: telegramUserId.toString() },
    {
      $setOnInsert: {
        telegramUserId: telegramUserId.toString(),
        currency: cache.config.marketplace_currency || 'EUR',
        balance: 0,
        evmRefundAddress: '',
        totalVoucherRedeemed: 0,
      },
    },
    { upsert: true, new: true }
  );
}

async function recordBalanceLog(
  telegramUserId: string | number,
  amount: number,
  balanceAfter: number,
  type: string,
  note: string,
  direction: string,
  referenceType: string = '',
  referenceId: string = '',
  metadata: any = {},
) {
  return await BalanceLogModel.create({
    telegramUserId: telegramUserId.toString(),
    amount: roundMoney(amount),
    currency: cache.config.marketplace_currency || 'EUR',
    balanceAfter: roundMoney(balanceAfter),
    type,
    direction,
    referenceType,
    referenceId,
    note,
    metadata,
  });
}

async function adjustWalletBalance(
  telegramUserId: string | number,
  delta: number,
  type: string,
  note: string,
  referenceType: string = '',
  referenceId: string = '',
  metadata: any = {},
) {
  const wallet = await getOrCreateWallet(telegramUserId);
  const nextBalance = roundMoney((wallet.balance || 0) + delta);
  if (nextBalance < 0) {
    throw new Error('Insufficient wallet balance');
  }
  wallet.balance = nextBalance;
  await wallet.save();
  await recordBalanceLog(
    telegramUserId,
    delta,
    nextBalance,
    type,
    note,
    delta >= 0 ? 'credit' : 'debit',
    referenceType,
    referenceId,
    metadata,
  );
  return wallet;
}

async function recordExternalBalanceEvent(
  telegramUserId: string | number,
  type: string,
  note: string,
  referenceType: string = '',
  referenceId: string = '',
  metadata: any = {},
) {
  const wallet = await getOrCreateWallet(telegramUserId);
  await recordBalanceLog(
    telegramUserId,
    0,
    wallet.balance || 0,
    type,
    note,
    'external',
    referenceType,
    referenceId,
    metadata,
  );
  return wallet;
}

async function getWalletSummary(telegramUserId: string | number) {
  const wallet = await getOrCreateWallet(telegramUserId);
  const balanceLogs = await BalanceLogModel.find({ telegramUserId: telegramUserId.toString() })
    .sort({ createdAt: -1 })
    .limit(25);
  return {
    wallet: toPlainObject(wallet),
    balanceLogs: balanceLogs.map((entry: any) => toPlainObject(entry)),
  };
}

async function listAllBalanceLogs(): Promise<any[]> {
  const logs = await BalanceLogModel.find({}).sort({ createdAt: -1 }).limit(100);
  return logs.map((entry: any) => toPlainObject(entry));
}

async function upsertProviderProfile(user: TelegramUser, data: any): Promise<ProviderProfile> {
  const cities = Array.isArray(data.cities) ? data.cities : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];
  return await ProviderModel.findOneAndUpdate(
    { telegramUserId: user.id.toString() },
    {
      $set: {
        firstName: user.first_name || '',
        username: user.username || '',
        cities,
        categories,
        citiesNormalized: uniqueNormalizedList(cities),
        categoriesNormalized: uniqueNormalizedList(categories),
        notes: data.notes || '',
        isActive: data.isActive !== false,
        lastSeenAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}

async function getProviderProfile(telegramUserId: string | number): Promise<ProviderProfile | null> {
  return await ProviderModel.findOne({ telegramUserId: telegramUserId.toString() });
}

async function createMarketplaceRequest(user: TelegramUser, payload: any): Promise<MarketplaceRequest> {
  const request = await RequestModel.create({
    clientTelegramId: user.id.toString(),
    clientName: user.first_name || 'Telegram user',
    clientUsername: user.username || '',
    title: (payload.title || '').trim(),
    category: payload.category,
    categoryNormalized: normalizeMarketplaceValue(payload.category),
    city: payload.city,
    cityNormalized: normalizeMarketplaceValue(payload.city),
    notes: (payload.notes || '').trim(),
    status: 'open',
  });
  await dispatchRequestToProviders(request);
  return request;
}

async function getRequestById(requestId: string): Promise<MarketplaceRequest | null> {
  return await RequestModel.findById(requestId);
}

async function getLeadById(leadId: string): Promise<Lead | null> {
  return await LeadModel.findById(leadId);
}

async function findLeadByPayload(invoicePayload: string): Promise<Lead | null> {
  return await LeadModel.findOne({ invoicePayload });
}

async function findPaidLead(providerUserId: string | number, requestId: string): Promise<Lead | null> {
  return await LeadModel.findOne({
    providerTelegramId: providerUserId.toString(),
    requestId,
    status: 'paid',
  });
}

async function decorateRequestsWithLeadData(requestDocs: any[]): Promise<any[]> {
  const requestIds = requestDocs.map((request) => request._id);
  const leads = requestIds.length > 0
    ? await LeadModel.find({ requestId: { $in: requestIds }, status: { $ne: 'cancelled' } }).sort({ createdAt: -1 })
    : [];

  const primaryLeadByRequestId = new Map<string, any>();
  leads.forEach((lead: any) => {
    const key = lead.requestId.toString();
    const current = primaryLeadByRequestId.get(key);
    const leadPriority = lead.status === 'paid' ? 2 : 1;
    const currentPriority = current ? (current.status === 'paid' ? 2 : 1) : -1;
    if (!current || leadPriority > currentPriority) {
      primaryLeadByRequestId.set(key, lead);
    }
  });

  return requestDocs.map((request) => {
    const requestObject = toPlainObject(request);
    const lead = primaryLeadByRequestId.get(request._id.toString());
    const leadObject = lead ? toPlainObject(lead) : null;
    return {
      ...requestObject,
      lead: leadObject ? {
        _id: leadObject._id,
        providerTelegramId: leadObject.providerTelegramId,
        providerUsername: leadObject.providerUsername,
        paymentMethod: leadObject.paymentMethod,
        feeAmount: leadObject.feeAmount,
        currency: leadObject.currency,
        refund_status: leadObject.refund_status,
        refund_requested_method: leadObject.refund_requested_method,
        refund_requested_wallet_address: leadObject.refund_requested_wallet_address,
        refund_requested_at: leadObject.refund_requested_at,
        refund_resolved_at: leadObject.refund_resolved_at,
        refund_fee_deduction: leadObject.refund_fee_deduction,
        refund_net_amount: leadObject.refund_net_amount,
        refund_tx_reference: leadObject.refund_tx_reference,
      } : null,
    };
  });
}

async function listClientRequests(userId: string | number): Promise<any[]> {
  const requests = await RequestModel.find({ clientTelegramId: userId.toString(), status: { $ne: 'deleted' } })
    .sort({ createdAt: -1 });
  return await decorateRequestsWithLeadData(requests);
}

async function listProviderRequests(userId: string | number): Promise<any[]> {
  const provider = await getProviderProfile(userId);
  if (!provider || !provider.isActive) return [];

  const openRequests = await RequestModel.find({
    status: 'open',
    cityNormalized: { $in: provider.citiesNormalized },
    categoryNormalized: { $in: provider.categoriesNormalized },
    clientTelegramId: { $ne: userId.toString() },
  }).sort({ createdAt: -1 });

  const leads = await LeadModel.find({
    providerTelegramId: userId.toString(),
    status: { $in: ['pending_payment', 'paid'] },
  }).sort({ createdAt: -1 });

  const requestIdsFromLeads = [...new Set(leads.map((lead: any) => lead.requestId.toString()))];
  const requestsFromLeads = requestIdsFromLeads.length > 0
    ? await RequestModel.find({ _id: { $in: requestIdsFromLeads }, status: { $ne: 'deleted' } }).sort({ createdAt: -1 })
    : [];

  const combinedRequestMap = new Map<string, any>();
  [...openRequests, ...requestsFromLeads].forEach((request: any) => {
    combinedRequestMap.set(request._id.toString(), request);
  });

  const paidLeadByRequestId = new Map(
    leads.map((lead: any) => [lead.requestId.toString(), lead])
  );

  return Array.from(combinedRequestMap.values()).map((request: any) => {
    const requestObject = toPlainObject(request);
    const lead = paidLeadByRequestId.get(request._id.toString());
    const leadObject = lead ? toPlainObject(lead) : null;
    return {
      ...requestObject,
      leadUnlocked: Boolean(leadObject && leadObject.status === 'paid'),
      contact: leadObject && leadObject.status === 'paid' ? getClientContact(requestObject) : null,
      lead: leadObject ? {
        _id: leadObject._id,
        paymentMethod: leadObject.paymentMethod,
        feeAmount: leadObject.feeAmount,
        currency: leadObject.currency,
        refund_status: leadObject.refund_status,
        refund_requested_method: leadObject.refund_requested_method,
        refund_requested_wallet_address: leadObject.refund_requested_wallet_address,
        refund_requested_at: leadObject.refund_requested_at,
        refund_resolved_at: leadObject.refund_resolved_at,
        refund_fee_deduction: leadObject.refund_fee_deduction,
        refund_net_amount: leadObject.refund_net_amount,
      } : null,
    };
  }).sort((a: any, b: any) =>
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

async function listAllRequests(): Promise<any[]> {
  const requests = await RequestModel.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
  return await decorateRequestsWithLeadData(requests);
}

async function updateMarketplaceRequest(
  requestId: string,
  updates: any,
): Promise<MarketplaceRequest | null> {
  const safeUpdates: any = {};
  if (updates.title) safeUpdates.title = updates.title.trim();
  if (updates.category) {
    safeUpdates.category = updates.category;
    safeUpdates.categoryNormalized = normalizeMarketplaceValue(updates.category);
  }
  if (updates.city) {
    safeUpdates.city = updates.city;
    safeUpdates.cityNormalized = normalizeMarketplaceValue(updates.city);
  }
  if (typeof updates.notes === 'string') safeUpdates.notes = updates.notes.trim();
  if (updates.status) safeUpdates.status = updates.status;
  return await RequestModel.findByIdAndUpdate(requestId, { $set: safeUpdates }, { new: true });
}

async function deleteMarketplaceRequest(requestId: string): Promise<MarketplaceRequest | null> {
  await LeadModel.updateMany({ requestId }, { $set: { status: 'cancelled' } });
  return await RequestModel.findByIdAndUpdate(
    requestId,
    { $set: { status: 'deleted' } },
    { new: true }
  );
}

async function createListing(user: TelegramUser, payload: any): Promise<ClassifiedListing> {
  return await ListingModel.create({
    ownerTelegramId: user.id.toString(),
    ownerName: user.first_name || 'Telegram user',
    ownerUsername: user.username || '',
    title: (payload.title || '').trim(),
    category: payload.category,
    city: payload.city,
    cityNormalized: normalizeMarketplaceValue(payload.city),
    description: (payload.description || '').trim(),
    price: (payload.price || '').toString().trim(),
    status: 'active',
  });
}

async function listListings(filters: any = {}): Promise<any[]> {
  const query: any = { status: 'active' };
  if (filters.category) query.category = filters.category;
  if (filters.city) query.cityNormalized = normalizeMarketplaceValue(filters.city);
  const listings = await ListingModel.find(query).sort({ createdAt: -1 });
  return listings.map((listing: any) => toPlainObject(listing));
}

async function listUserListings(userId: string | number): Promise<any[]> {
  const listings = await ListingModel.find({
    ownerTelegramId: userId.toString(),
    status: { $ne: 'deleted' },
  }).sort({ createdAt: -1 });
  return listings.map((listing: any) => toPlainObject(listing));
}

async function listAllListings(): Promise<any[]> {
  const listings = await ListingModel.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
  return listings.map((listing: any) => toPlainObject(listing));
}

async function updateListing(listingId: string, updates: any): Promise<ClassifiedListing | null> {
  const safeUpdates: any = {};
  if (updates.title) safeUpdates.title = updates.title.trim();
  if (updates.category) safeUpdates.category = updates.category;
  if (updates.city) {
    safeUpdates.city = updates.city;
    safeUpdates.cityNormalized = normalizeMarketplaceValue(updates.city);
  }
  if (typeof updates.description === 'string') safeUpdates.description = updates.description.trim();
  if (typeof updates.price === 'string') safeUpdates.price = updates.price.trim();
  if (updates.status) safeUpdates.status = updates.status;
  return await ListingModel.findByIdAndUpdate(listingId, { $set: safeUpdates }, { new: true });
}

async function deleteListing(listingId: string): Promise<ClassifiedListing | null> {
  return await ListingModel.findByIdAndUpdate(
    listingId,
    { $set: { status: 'deleted' } },
    { new: true }
  );
}

async function createVoucher(adminId: string | number, payload: any): Promise<Voucher> {
  const code = (payload.code || '').trim();
  const amount = roundMoney(Number(payload.amount || 0));
  if (!code) {
    throw new Error('Voucher code is required');
  }
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error('Voucher amount must be greater than 0');
  }

  const normalizedCode = normalizeVoucherCode(code);
  const existingVoucher = await VoucherModel.findOne({ normalizedCode });
  if (existingVoucher) {
    throw new Error('Voucher code already exists');
  }

  return await VoucherModel.create({
    code,
    normalizedCode,
    provider: payload.provider || 'Voucher',
    amount,
    currency: cache.config.marketplace_currency || 'EUR',
    status: 'unused',
    redeemedBy: '',
    redeemedAt: null,
    createdBy: adminId.toString(),
    note: (payload.note || '').trim(),
  });
}

async function listAllVouchers(): Promise<any[]> {
  const vouchers = await VoucherModel.find({}).sort({ createdAt: -1 }).limit(100);
  return vouchers.map((voucher: any) => toPlainObject(voucher));
}

async function redeemVoucher(user: TelegramUser, code: string) {
  const normalizedCode = normalizeVoucherCode(code);
  if (!normalizedCode) {
    throw new Error('Voucher code is required');
  }

  const voucher = await VoucherModel.findOne({ normalizedCode, status: 'unused' });
  if (!voucher) {
    throw new Error('Voucher is invalid or already used');
  }

  voucher.status = 'redeemed';
  voucher.redeemedBy = user.id.toString();
  voucher.redeemedAt = new Date();
  await voucher.save();

  const wallet = await adjustWalletBalance(
    user.id,
    voucher.amount,
    'voucher_redeem',
    `Voucher redeemed (${voucher.provider})`,
    'voucher',
    voucher._id.toString(),
    { provider: voucher.provider, code: voucher.code }
  );

  wallet.totalVoucherRedeemed = roundMoney((wallet.totalVoucherRedeemed || 0) + voucher.amount);
  await wallet.save();

  return {
    voucher: toPlainObject(voucher),
    wallet: toPlainObject(wallet),
  };
}

async function getAdminDashboardSummary() {
  const [openRequests, matchedRequests, activeListings, providers, totalWallets, pendingRefunds, unusedVouchers] = await Promise.all([
    RequestModel.countDocuments({ status: 'open' }),
    RequestModel.countDocuments({ status: 'matched' }),
    ListingModel.countDocuments({ status: 'active' }),
    ProviderModel.countDocuments({ isActive: true }),
    WalletModel.countDocuments({}),
    LeadModel.countDocuments({ refund_status: { $in: ['requested_internal', 'requested_crypto'] } }),
    VoucherModel.countDocuments({ status: 'unused' }),
  ]);

  const walletDocs = await WalletModel.find({}).sort({ updatedAt: -1 });
  const totalWalletBalance = roundMoney(
    walletDocs.reduce((sum: number, wallet: any) => sum + Number(wallet.balance || 0), 0)
  );

  return {
    openRequests,
    matchedRequests,
    activeListings,
    providers,
    totalWallets,
    totalWalletBalance,
    pendingRefunds,
    unusedVouchers,
  };
}

async function dispatchRequestToProviders(request: MarketplaceRequest) {
  const providers = await ProviderModel.find({
    isActive: true,
    citiesNormalized: request.cityNormalized,
    categoriesNormalized: request.categoryNormalized,
  });

  const settings = await getMarketplaceSettings();
  const webAppUrl = cache.config.web_app_url || '';
  const requestText = [
    'Novi hitni zahtev',
    `${request.category} • ${request.city}`,
    request.title,
    request.notes ? `Napomena: ${request.notes}` : '',
    '',
    `Otključavanje kontakta: ${formatMoney(settings.leadFee, settings.currency)}`,
  ].filter(Boolean).join('\n');

  await Promise.all(providers.map(async (provider: any) => {
    const options = webAppUrl ? {
      reply_markup: {
        inline_keyboard: [[{ text: 'Otvori Mini App', web_app: { url: webAppUrl } }]],
      },
    } : undefined;
    try {
      await sendMessage(provider.telegramUserId, Messenger.TELEGRAM, requestText, options);
    } catch (error) {
      log.error('Failed to notify provider about request:', error);
    }
  }));

  try {
    await sendMessage(
      cache.config.staffchat_id,
      cache.config.staffchat_type,
      `Marketplace zahtev: ${request.category} u ${request.city} • poslato ${providers.length} provajdera`
    );
  } catch (error) {
    log.error('Failed to notify staff about marketplace request:', error);
  }
}

async function completeLeadPaymentForLead(lead: Lead, paymentChargeId: string) {
  if (lead.status === 'paid') {
    return lead;
  }

  const request = await getRequestById(lead.requestId.toString());
  if (!request) {
    throw new Error('Request not found for lead');
  }

  lead.status = 'paid';
  lead.paymentChargeId = paymentChargeId;
  lead.contactUnlockedAt = new Date();
  lead.refund_status = lead.refund_status || 'none';
  await lead.save();

  request.status = 'matched';
  request.matchedProviderId = lead.providerTelegramId;
  request.acceptedLeadId = lead._id as mongoose.Types.ObjectId;
  await request.save();

  const contact = getClientContact(request);
  const providerHandle = lead.providerUsername ? `@${lead.providerUsername}` : lead.providerName || 'provider';

  await sendMessage(
    lead.providerTelegramId,
    Messenger.TELEGRAM,
    [
      'Kontakt je otključan.',
      `Klijent: ${contact.label}`,
      `Telegram: ${contact.telegramUrl}`,
      '',
      lead.paymentMethod === 'wallet'
        ? 'Iznos je naplaćen iz internog wallet balansa.'
        : 'Javite se korisniku direktno što pre.',
    ].join('\n')
  );

  await sendMessage(
    request.clientTelegramId,
    Messenger.TELEGRAM,
    `Provajder ${providerHandle} je prihvatio vaš zahtev za "${request.title}" i uskoro vam se javlja.`
  );

  return lead;
}

async function createLeadCheckout(user: TelegramUser, requestId: string) {
  const request = await getRequestById(requestId);
  if (!request || request.status === 'deleted' || request.status === 'closed') {
    throw new Error('Request not found');
  }
  if (request.clientTelegramId === user.id.toString()) {
    throw new Error('You cannot accept your own request');
  }
  if (request.status === 'matched' && request.matchedProviderId !== user.id.toString()) {
    throw new Error('Request was already accepted');
  }

  const alreadyPaid = await findPaidLead(user.id, requestId);
  if (alreadyPaid) {
    return {
      mode: 'unlocked',
      contact: getClientContact(request),
      fee: alreadyPaid.feeAmount,
      currency: alreadyPaid.currency,
      paymentMethod: alreadyPaid.paymentMethod,
    };
  }

  const settings = await getMarketplaceSettings();
  const wallet = await getOrCreateWallet(user.id);
  const invoicePayload = `${LEAD_PREFIX}:${requestId}:${user.id}:${Date.now()}`;

  const lead = await LeadModel.create({
    requestId,
    providerTelegramId: user.id.toString(),
    providerName: user.first_name || '',
    providerUsername: user.username || '',
    status: 'pending_payment',
    feeAmount: settings.leadFee,
    currency: settings.currency,
    invoicePayload,
    paymentMethod: wallet.balance >= settings.leadFee
      ? 'wallet'
      : (cache.config.telegram_payment_provider_token ? 'telegram' : 'manual'),
    refund_status: 'none',
  });

  if (wallet.balance >= settings.leadFee) {
    const updatedWallet = await adjustWalletBalance(
      user.id,
      -settings.leadFee,
      'lead_unlock_debit',
      `Lead unlock for ${request.category} in ${request.city}`,
      'lead',
      lead._id.toString(),
      { requestId: request._id.toString() }
    );
    await completeLeadPaymentForLead(lead, 'wallet-balance');
    return {
      mode: 'wallet',
      contact: getClientContact(request),
      fee: settings.leadFee,
      currency: settings.currency,
      walletBalance: updatedWallet.balance,
    };
  }

  if (!cache.config.telegram_payment_provider_token) {
    await completeLeadPayment(invoicePayload, 'manual-payment');
    return {
      mode: 'unlocked',
      contact: getClientContact(request),
      fee: settings.leadFee,
      currency: settings.currency,
      paymentMethod: 'manual',
    };
  }

  const TelegramAddon = require('../telegram').default;
  const title = `Lead unlock • ${request.category}`;
  const description = `${request.title} (${request.city})`;
  const invoiceLink = await (TelegramAddon.getInstance() as any).bot.api.raw.createInvoiceLink({
    title,
    description,
    payload: lead.invoicePayload,
    provider_token: cache.config.telegram_payment_provider_token,
    currency: settings.currency,
    prices: [{ label: 'Lead unlock', amount: toMinorUnits(settings.leadFee) }],
  });

  return {
    mode: 'invoice',
    invoiceLink,
    fee: settings.leadFee,
    currency: settings.currency,
    walletBalance: wallet.balance || 0,
  };
}

async function completeLeadPayment(invoicePayload: string, paymentChargeId: string) {
  const lead = await findLeadByPayload(invoicePayload);
  if (!lead) {
    throw new Error('Lead not found for payment');
  }
  return await completeLeadPaymentForLead(lead, paymentChargeId);
}

async function requestLeadRefund(
  user: TelegramUser,
  leadId: string,
  method: string,
  evmAddress: string = '',
) {
  const lead = await getLeadById(leadId);
  if (!lead || lead.status !== 'paid') {
    throw new Error('Paid lead not found');
  }
  if (lead.providerTelegramId !== user.id.toString()) {
    throw new Error('You can only request refunds for your own leads');
  }
  if (lead.refund_status === 'approved_internal' || lead.refund_status === 'approved_crypto') {
    throw new Error('Refund already processed');
  }

  const normalizedMethod = method === 'crypto' ? 'crypto' : 'internal';
  if (normalizedMethod === 'crypto' && !isValidEvmAddress(evmAddress)) {
    throw new Error('Valid EVM wallet address is required');
  }

  const wallet = await getOrCreateWallet(user.id);
  if (normalizedMethod === 'crypto') {
    wallet.evmRefundAddress = evmAddress.trim();
    await wallet.save();
  }

  lead.refund_status = normalizedMethod === 'crypto' ? 'requested_crypto' : 'requested_internal';
  lead.refund_requested_method = normalizedMethod;
  lead.refund_requested_wallet_address = normalizedMethod === 'crypto'
    ? evmAddress.trim()
    : '';
  lead.refund_requested_at = new Date();
  await lead.save();

  try {
    await sendMessage(
      cache.config.staffchat_id,
      cache.config.staffchat_type,
      `Refund request received for lead ${lead._id.toString()} • method: ${normalizedMethod}`
    );
  } catch (error) {
    log.error('Failed to notify staff about refund request:', error);
  }

  return lead;
}

async function approveLeadRefundInternal(leadId: string, adminId: string | number) {
  const lead = await getLeadById(leadId);
  if (!lead || lead.status !== 'paid') {
    throw new Error('Paid lead not found');
  }
  if (lead.refund_status === 'approved_internal' || lead.refund_status === 'approved_crypto') {
    throw new Error('Refund already processed');
  }

  const updatedWallet = await adjustWalletBalance(
    lead.providerTelegramId,
    lead.feeAmount,
    'refund_internal',
    'Internal marketplace balance refund approved',
    'lead',
    lead._id.toString(),
    { approvedBy: adminId.toString() }
  );

  lead.refund_status = 'approved_internal';
  lead.refund_requested_method = 'internal';
  lead.refund_requested_at = lead.refund_requested_at || new Date();
  lead.refund_resolved_at = new Date();
  lead.refund_fee_deduction = 0;
  lead.refund_net_amount = lead.feeAmount;
  lead.refund_tx_reference = `internal-wallet-${Date.now()}`;
  await lead.save();

  await sendMessage(
    lead.providerTelegramId,
    Messenger.TELEGRAM,
    `Refund approved to your internal balance. Credited: ${formatMoney(lead.feeAmount, lead.currency)}. New balance: ${formatMoney(updatedWallet.balance, updatedWallet.currency)}.`
  );

  return lead;
}

async function approveLeadRefundCrypto(
  leadId: string,
  adminId: string | number,
  walletAddress?: string,
) {
  const lead = await getLeadById(leadId);
  if (!lead || lead.status !== 'paid') {
    throw new Error('Paid lead not found');
  }
  if (lead.refund_status === 'approved_internal' || lead.refund_status === 'approved_crypto') {
    throw new Error('Refund already processed');
  }

  const settings = await getMarketplaceSettings();
  const targetAddress = (walletAddress || lead.refund_requested_wallet_address || '').trim();
  if (!isValidEvmAddress(targetAddress)) {
    throw new Error('Valid EVM wallet address is required for crypto refunds');
  }

  const networkFee = roundMoney(settings.cryptoRefundFee || 0);
  const netAmount = calculateCryptoRefundNetAmount(lead.feeAmount, networkFee);

  lead.refund_status = 'approved_crypto';
  lead.refund_requested_method = 'crypto';
  lead.refund_requested_wallet_address = targetAddress;
  lead.refund_requested_at = lead.refund_requested_at || new Date();
  lead.refund_resolved_at = new Date();
  lead.refund_fee_deduction = networkFee;
  lead.refund_net_amount = netAmount;
  lead.refund_tx_reference = `${settings.cryptoRefundChain || 'EVM'}-${Date.now()}`;
  await lead.save();

  await recordExternalBalanceEvent(
    lead.providerTelegramId,
    'refund_crypto',
    `Crypto refund approved on ${settings.cryptoRefundChain}`,
    'lead',
    lead._id.toString(),
    {
      approvedBy: adminId.toString(),
      walletAddress: targetAddress,
      networkFee,
      netAmount,
      chain: settings.cryptoRefundChain,
    }
  );

  await sendMessage(
    lead.providerTelegramId,
    Messenger.TELEGRAM,
    `Crypto refund approved. Gross: ${formatMoney(lead.feeAmount, lead.currency)}. Estimated ${settings.cryptoRefundChain} fee deducted: ${formatMoney(networkFee, lead.currency)}. Net payout: ${formatMoney(netAmount, lead.currency)} to ${targetAddress}.`
  );

  return lead;
}

async function handleSuccessfulPayment(ctx: any) {
  const payment = ctx.message?.successful_payment;
  if (!payment?.invoice_payload?.startsWith(LEAD_PREFIX)) {
    return;
  }
  await completeLeadPayment(
    payment.invoice_payload,
    payment.telegram_payment_charge_id || payment.provider_payment_charge_id || 'telegram-payment'
  );
}

export {
  LEAD_PREFIX,
  approveLeadRefundCrypto,
  approveLeadRefundInternal,
  calculateCryptoRefundNetAmount,
  createLeadCheckout,
  createListing,
  createMarketplaceRequest,
  createVoucher,
  completeLeadPayment,
  deleteListing,
  deleteMarketplaceRequest,
  dispatchRequestToProviders,
  findLeadByPayload,
  formatMoney,
  getAdminDashboardSummary,
  getLeadById,
  getMarketplaceOptions,
  getMarketplaceSettings,
  getOrCreateWallet,
  getProviderProfile,
  getRequestById,
  getWalletSummary,
  handleSuccessfulPayment,
  isProviderMatchingRequest,
  isValidEvmAddress,
  listAllBalanceLogs,
  listAllListings,
  listAllRequests,
  listAllVouchers,
  listClientRequests,
  listListings,
  listProviderRequests,
  listUserListings,
  normalizeMarketplaceValue,
  normalizeVoucherCode,
  parseLeadFeeInput,
  redeemVoucher,
  requestLeadRefund,
  setMarketplaceLeadFee,
  toMinorUnits,
  updateListing,
  updateMarketplaceRequest,
  upsertProviderProfile,
};
