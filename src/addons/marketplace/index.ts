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
  createdAt: Date;
  updatedAt: Date;
};

type MarketplaceSettings = mongoose.Document & {
  _id: string;
  leadFee: number;
  currency: string;
  updatedBy: string;
  updatedAt: Date;
};

const SettingsSchema = new mongoose.Schema<MarketplaceSettings>({
  _id: { type: String, default: SETTINGS_ID },
  leadFee: { type: Number, default: Number(cache.config.marketplace_lead_fee || 0.5) },
  currency: { type: String, default: cache.config.marketplace_currency || 'EUR' },
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

const normalizeMarketplaceValue = (value: string = ''): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

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
  `${currency === 'EUR' ? '€' : `${currency} `}${amount.toFixed(2)}`;

const toMinorUnits = (amount: number): number => Math.round(amount * 100);

const isProviderMatchingRequest = (
  provider: { citiesNormalized?: string[]; categoriesNormalized?: string[] },
  request: { cityNormalized: string; categoryNormalized: string },
): boolean => {
  return Boolean(
    provider.citiesNormalized?.includes(request.cityNormalized) &&
    provider.categoriesNormalized?.includes(request.categoryNormalized),
  );
};

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

async function listClientRequests(userId: string | number): Promise<any[]> {
  const requests = await RequestModel.find({ clientTelegramId: userId.toString(), status: { $ne: 'deleted' } })
    .sort({ createdAt: -1 });
  return requests.map((request) => request.toObject());
}

async function listProviderRequests(userId: string | number): Promise<any[]> {
  const provider = await getProviderProfile(userId);
  if (!provider || !provider.isActive) return [];

  const requests = await RequestModel.find({
    status: 'open',
    cityNormalized: { $in: provider.citiesNormalized },
    categoryNormalized: { $in: provider.categoriesNormalized },
    clientTelegramId: { $ne: userId.toString() },
  }).sort({ createdAt: -1 });

  const paidLeads = await LeadModel.find({
    providerTelegramId: userId.toString(),
    status: 'paid',
  });

  const paidLeadRequestIds = new Map(
    paidLeads.map((lead) => [lead.requestId.toString(), lead])
  );

  return requests.map((request) => {
    const requestObject = request.toObject();
    const paidLead = paidLeadRequestIds.get(request._id.toString());
    return {
      ...requestObject,
      leadUnlocked: Boolean(paidLead),
      contact: paidLead ? getClientContact(requestObject) : null,
    };
  });
}

async function listAllRequests(): Promise<any[]> {
  const requests = await RequestModel.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
  return requests.map((request) => request.toObject());
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
  return listings.map((listing) => listing.toObject());
}

async function listUserListings(userId: string | number): Promise<any[]> {
  const listings = await ListingModel.find({
    ownerTelegramId: userId.toString(),
    status: { $ne: 'deleted' },
  }).sort({ createdAt: -1 });
  return listings.map((listing) => listing.toObject());
}

async function listAllListings(): Promise<any[]> {
  const listings = await ListingModel.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
  return listings.map((listing) => listing.toObject());
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

async function getAdminDashboardSummary() {
  const [openRequests, matchedRequests, activeListings, providers] = await Promise.all([
    RequestModel.countDocuments({ status: 'open' }),
    RequestModel.countDocuments({ status: 'matched' }),
    ListingModel.countDocuments({ status: 'active' }),
    ProviderModel.countDocuments({ isActive: true }),
  ]);
  return { openRequests, matchedRequests, activeListings, providers };
}

async function getRequestById(requestId: string): Promise<MarketplaceRequest | null> {
  return await RequestModel.findById(requestId);
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

  await Promise.all(providers.map(async (provider) => {
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
    };
  }

  const settings = await getMarketplaceSettings();
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
    paymentMethod: cache.config.telegram_payment_provider_token ? 'telegram' : 'manual',
  });

  if (!cache.config.telegram_payment_provider_token) {
    await completeLeadPayment(invoicePayload, 'manual-payment');
    return {
      mode: 'unlocked',
      contact: getClientContact(request),
      fee: settings.leadFee,
      currency: settings.currency,
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
  };
}

async function completeLeadPayment(invoicePayload: string, paymentChargeId: string) {
  const lead = await findLeadByPayload(invoicePayload);
  if (!lead) {
    throw new Error('Lead not found for payment');
  }
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
      'Javite se korisniku direktno što pre.',
    ].join('\n')
  );

  await sendMessage(
    request.clientTelegramId,
    Messenger.TELEGRAM,
    `Provajder ${providerHandle} je prihvatio vaš zahtev za "${request.title}" i uskoro vam se javlja.`
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
  createLeadCheckout,
  createListing,
  createMarketplaceRequest,
  completeLeadPayment,
  deleteListing,
  deleteMarketplaceRequest,
  dispatchRequestToProviders,
  findLeadByPayload,
  formatMoney,
  getAdminDashboardSummary,
  getMarketplaceOptions,
  getMarketplaceSettings,
  getProviderProfile,
  getRequestById,
  handleSuccessfulPayment,
  isProviderMatchingRequest,
  listAllListings,
  listAllRequests,
  listClientRequests,
  listListings,
  listProviderRequests,
  listUserListings,
  normalizeMarketplaceValue,
  parseLeadFeeInput,
  setMarketplaceLeadFee,
  toMinorUnits,
  updateListing,
  updateMarketplaceRequest,
  upsertProviderProfile,
};
