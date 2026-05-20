import express from 'express';
import http from 'http';
import rateLimit from 'express-rate-limit';
import cache from '../../cache';
import TelegramAddon from '../telegram';
import * as log from 'fancy-log';
import {
  createLeadCheckout,
  createListing,
  createMarketplaceRequest,
  deleteListing,
  deleteMarketplaceRequest,
  getAdminDashboardSummary,
  getMarketplaceOptions,
  getMarketplaceSettings,
  getProviderProfile,
  listAllListings,
  listAllRequests,
  listClientRequests,
  listListings,
  listProviderRequests,
  parseLeadFeeInput,
  setMarketplaceLeadFee,
  updateListing,
  updateMarketplaceRequest,
  upsertProviderProfile,
} from '../marketplace';
import { getAuthenticatedWebUser } from './auth';
import { renderMiniAppHtml } from './template';

let started = false;

const ensureAuthenticated = (req: any, res: any, next: any) => {
  const user = getAuthenticatedWebUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Telegram Mini App authentication required.' });
  }
  req.user = user;
  req.isAdmin = user.id.toString() === cache.config.owner_id.toString();
  next();
};

const ensureAdmin = (req: any, res: any, next: any) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin permissions required.' });
  }
  next();
};

const serializeError = (res: any, error: any, code: number = 400) => {
  return res.status(code).json({ error: error?.message || 'Unexpected error' });
};

const init = function(_bot: TelegramAddon) {
  if (!cache.config.web_server || started) {
    return;
  }
  started = true;

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const app = express();
  const port = cache.config.web_server_port || 8080;
  const server = http.createServer(app);

  app.use(limiter);
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req: any, res: any) => res.json({ ok: true }));

  app.get('/', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderMiniAppHtml('Marketplace Bot'));
  });

  app.get('/api/bootstrap', ensureAuthenticated, async (req: any, res: any) => {
    try {
      const [settings, providerProfile, myRequests, providerRequests, listings] = await Promise.all([
        getMarketplaceSettings(),
        getProviderProfile(req.user.id),
        listClientRequests(req.user.id),
        listProviderRequests(req.user.id),
        listListings(),
      ]);

      const response: any = {
        user: req.user,
        admin: req.isAdmin,
        settings: {
          leadFee: settings.leadFee,
          currency: settings.currency,
        },
        options: getMarketplaceOptions(),
        providerProfile,
        myRequests,
        providerRequests,
        listings,
      };

      if (req.isAdmin) {
        const [dashboard, adminRequests, adminListings] = await Promise.all([
          getAdminDashboardSummary(),
          listAllRequests(),
          listAllListings(),
        ]);
        response.dashboard = dashboard;
        response.adminRequests = adminRequests;
        response.adminListings = adminListings;
      }

      res.json(response);
    } catch (error) {
      serializeError(res, error, 500);
    }
  });

  app.get('/api/provider-profile', ensureAuthenticated, async (req: any, res: any) => {
    try {
      res.json(await getProviderProfile(req.user.id));
    } catch (error) {
      serializeError(res, error, 500);
    }
  });

  app.post('/api/provider-profile', ensureAuthenticated, async (req: any, res: any) => {
    try {
      const profile = await upsertProviderProfile(req.user, req.body || {});
      res.json(profile);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.post('/api/requests', ensureAuthenticated, async (req: any, res: any) => {
    try {
      const payload = req.body || {};
      if (!payload.title || !payload.category || !payload.city) {
        return res.status(400).json({ error: 'Title, category, and city are required.' });
      }
      const request = await createMarketplaceRequest(req.user, payload);
      res.status(201).json(request);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.patch('/api/requests/:id', ensureAuthenticated, async (req: any, res: any) => {
    try {
      if (!req.isAdmin) {
        return res.status(403).json({ error: 'Only admin can edit all requests.' });
      }
      const request = await updateMarketplaceRequest(req.params.id, req.body || {});
      res.json(request);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.delete('/api/requests/:id', ensureAuthenticated, async (req: any, res: any) => {
    try {
      if (!req.isAdmin) {
        return res.status(403).json({ error: 'Only admin can delete requests.' });
      }
      const request = await deleteMarketplaceRequest(req.params.id);
      res.json(request);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.post('/api/requests/:id/checkout', ensureAuthenticated, async (req: any, res: any) => {
    try {
      const result = await createLeadCheckout(req.user, req.params.id);
      res.json(result);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.post('/api/listings', ensureAuthenticated, async (req: any, res: any) => {
    try {
      const payload = req.body || {};
      if (!payload.title || !payload.category || !payload.city || !payload.description) {
        return res.status(400).json({ error: 'Title, category, city, and description are required.' });
      }
      const listing = await createListing(req.user, payload);
      res.status(201).json(listing);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.patch('/api/listings/:id', ensureAuthenticated, async (req: any, res: any) => {
    try {
      if (!req.isAdmin) {
        return res.status(403).json({ error: 'Only admin can edit all listings.' });
      }
      const listing = await updateListing(req.params.id, req.body || {});
      res.json(listing);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.delete('/api/listings/:id', ensureAuthenticated, async (req: any, res: any) => {
    try {
      if (!req.isAdmin) {
        return res.status(403).json({ error: 'Only admin can delete listings.' });
      }
      const listing = await deleteListing(req.params.id);
      res.json(listing);
    } catch (error) {
      serializeError(res, error);
    }
  });

  app.get('/api/settings', ensureAuthenticated, ensureAdmin, async (_req: any, res: any) => {
    try {
      const settings = await getMarketplaceSettings();
      res.json(settings);
    } catch (error) {
      serializeError(res, error, 500);
    }
  });

  app.put('/api/settings', ensureAuthenticated, ensureAdmin, async (req: any, res: any) => {
    try {
      const fee = parseLeadFeeInput((req.body?.leadFee || '').toString());
      if (fee === null) {
        return res.status(400).json({ error: 'Lead fee must be a valid number.' });
      }
      const settings = await setMarketplaceLeadFee(fee, req.user.id.toString());
      res.json(settings);
    } catch (error) {
      serializeError(res, error);
    }
  });

  server.listen(port, () => log.info(`Marketplace Mini App server started on port ${port}`));
};

export { init };
