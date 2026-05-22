import * as db from './db';
import cache from './cache';
import * as middleware from './middleware';
import { Context } from './interfaces';
import { ISupportee } from './db';
import {
  getMarketplaceSettings,
  getPhoneVerificationSummary,
  parseLeadFeeInput,
  savePhoneVerification,
  setMarketplaceLeadFee,
} from './addons/marketplace';
import * as log from 'fancy-log'

/**
 * Extracts ticket ID from the reply text.
 *
 * @param replyText - The text to extract the ticket ID from.
 * @returns The ticket ID as a string or undefined if not found.
 */
const extractTicketId = (replyText: string): string | undefined => {
  const match = replyText.match(new RegExp(`#T(.*) ${cache.config.language.from}`));
  return match ? match[1] : undefined;
};

/**
 * Display help text depending on whether the user is an admin.
 *
 * @param ctx - The bot context.
 */
const helpCommand = (ctx: Context): void => {
  const { language, parse_mode } = cache.config;
  const text = ctx.session.admin ? language.helpCommandStaffText : language.helpCommandText;
  middleware.reply(ctx, text, { parse_mode });
};

/**
 * Close all open tickets.
 *
 * @param ctx - The bot context.
 */
const clearCommand = (ctx: Context): void => {
  if (!ctx.session.admin) return;
  db.closeAll();
  // Reset the ticket arrays
  cache.ticketIDs.length = 0;
  cache.ticketStatus.length = 0;
  cache.ticketSent.length = 0;
  middleware.reply(ctx, 'All tickets closed.');
};

/**
 * Display open tickets.
 *
 * @param ctx - The bot context.
 */
const openCommand = (ctx: Context): void => {
  if (!ctx.session.admin) return;
  const groups: string[] = [];
  const { categories, language } = cache.config;

  if (categories && categories.length > 0) {
    categories.forEach(category => {
      if (!category.subgroups) {
        if (category.group_id == ctx.chat.id) groups.push(category.name);
      } else {
        category.subgroups.forEach((sub: { group_id: any; name: string }) => {
          if (sub.group_id == ctx.chat.id) groups.push(sub.name);
        });
      }
    });
  }

  db.open((userList: any[]) => {
    let openTickets = '';
    userList.forEach(ticket => {
      if (ticket.userid != null) {
        let ticketInfo = '';
        const uidStr = ticket.userid.toString();
        if (uidStr.includes('WEB')) {
          ticketInfo = '(web)';
        } else if (uidStr.includes('SIGNAL')) {
          ticketInfo = '(signal)';
        }
        openTickets += `#T${ticket.id.toString().padStart(6, '0')} ${ticketInfo}\n`;
      }
    });
    middleware.reply(ctx, `*${language.openTickets}\n\n* ${openTickets}`);
  }, groups);
};

/**
 * Close a specific ticket.
 *
 * @param ctx - The bot context.
 */
const closeCommand = (ctx: Context): void => {
  if (!ctx.session.admin) return;
  const groups: string[] = [];
  const { categories, language } = cache.config;

  if (categories) {
    categories.forEach(category => {
      if (!category.subgroups || category.subgroups.length === 0) {
        if (category.group_id == ctx.chat.id) groups.push(category.name);
      } else {
        category.subgroups.forEach((sub: { group_id: any; name: string }) => {
          if (sub.group_id == ctx.chat.id) groups.push(sub.name);
        });
      }
    });
  }

  // Only process if the reply is to a bot message
  if (!ctx.message.reply_to_message.from.is_bot) return;
  const replyText = ctx.message.reply_to_message.text || ctx.message.reply_to_message.caption;
  if (!replyText) return;
  const ticketId = extractTicketId(replyText);
  if (!ticketId) return;

  db.open((tickets: ISupportee[]) => {
    if (!tickets) {
      log.info('Close command: tickets undefined');
      return;
    }
    let userId: any = null;
    tickets.forEach(ticket => {
      if (ticket.id.toString().padStart(6, '0') === ticketId) {
        db.add(ticket.userid, 'closed', ticket.category, ctx.messenger);
      }
      userId = ticket.userid;
    });
    const paddedTicket = ticketId.toString().padStart(6, '0');
    middleware.reply(ctx, `${cache.config.language.ticket} #T${paddedTicket} ${cache.config.language.closed}`);
    middleware.sendMessage(
      userId,
      ctx.messenger,
      `${cache.config.language.ticket} #T${paddedTicket} ${cache.config.language.closed}\n\n${cache.config.language.ticketClosed}`
    );
    delete cache.ticketIDs[userId];
    delete cache.ticketStatus[userId];
    delete cache.ticketSent[userId];
  }, groups);
};

/**
 * Ban a user based on a ticket.
 *
 * @param ctx - The bot context.
 */
const banCommand = (ctx: Context): void => {
  if (!ctx.session.admin) return;
  const replyText = ctx.message.reply_to_message.text;
  if (!replyText) return;
  const ticketId = extractTicketId(replyText);
  if (!ticketId) return;
  db.getByTicketId(ticketId, (ticket: { userid: any; id: { toString: () => string } }) => {
    db.add(ticket.userid, 'banned', '', ctx.messenger);
    middleware.sendMessage(
      ctx.chat.id,
      ctx.messenger,
      `${cache.config.language.usr_with_ticket} #T${ticketId.toString().padStart(6, '0')} ${cache.config.language.banned}`
    );
  });
};

/**
 * Reopen a closed ticket.
 *
 * @param ctx - The bot context.
 */
const reopenCommand = (ctx: Context): void => {
  if (!ctx.session.admin) return;
  const replyText = ctx.message.reply_to_message.text;
  if (!replyText) return;
  const ticketId = extractTicketId(replyText);
  if (!ticketId) return;
  db.getByTicketId(ticketId, (ticket: { userid: any; id: { toString: () => string } }) => {
    db.reopen(ticket.userid, '', ctx.messenger);
    middleware.sendMessage(
      ctx.chat.id,
      ctx.messenger,
      `${cache.config.language.usr_with_ticket} #T${ticket.id.toString().padStart(6, '0')} ${cache.config.language.ticketReopened}`
    );
  });
};

/**
 * Unban a user based on a ticket.
 *
 * @param ctx - The bot context.
 */
const unbanCommand = (ctx: Context): void => {
  if (!ctx.session.admin) return;
  const replyText = ctx.message.reply_to_message.text;
  if (!replyText) return;
  const ticketId = extractTicketId(replyText);
  if (!ticketId) return;
  db.getByTicketId(ticketId, (ticket: { userid: any; id: { toString: () => string } }) => {
    db.add(ticket.userid, 'closed', '', ctx.messenger);
    middleware.sendMessage(
      ctx.chat.id,
      ctx.messenger,
      `${cache.config.language.usr_with_ticket} #T${ticket.id.toString().padStart(6, '0')} unbanned`
    );
  });
};

/**
 * Show the current marketplace lead fee.
 *
 * @param ctx - The bot context.
 */
const leadFeeCommand = async (ctx: Context): Promise<void> => {
  if (!ctx.session.admin) return;
  const settings = await getMarketplaceSettings();
  middleware.reply(
    ctx,
    `Current lead fee: ${settings.currency === 'EUR' ? '€' : `${settings.currency} `}${settings.leadFee.toFixed(2)}`
  );
};

/**
 * Update the marketplace lead fee.
 *
 * @param ctx - The bot context.
 */
const setLeadFeeCommand = async (ctx: Context): Promise<void> => {
  if (!ctx.session.admin) return;
  const input = (ctx.message.text || '').split(/\s+/).slice(1).join(' ');
  const fee = parseLeadFeeInput(input);
  if (fee === null) {
    middleware.reply(ctx, 'Usage: /setleadfee 0.50');
    return;
  }
  const settings = await setMarketplaceLeadFee(fee, ctx.from.id.toString());
  middleware.reply(
    ctx,
    `Lead fee updated to ${settings.currency === 'EUR' ? '€' : `${settings.currency} `}${settings.leadFee.toFixed(2)}`
  );
};

/**
 * Share the Mini App entry point.
 *
 * @param ctx - The bot context.
 */
const miniAppCommand = (ctx: Context): void => {
  if (!cache.config.web_app_url) {
    middleware.reply(ctx, 'Mini App URL is not configured yet. Set WEB_APP_URL or PUBLIC_URL to your public HTTPS app URL.');
    return;
  }
  if (!/^https:\/\//i.test(cache.config.web_app_url)) {
    middleware.reply(ctx, 'Mini App URL must use a public HTTPS address.');
    return;
  }
  middleware.reply(ctx, 'Open the Marketplace Mini App.', {
    parse_mode: cache.config.parse_mode,
    reply_markup: {
      inline_keyboard: [[{ text: 'Open Mini App', web_app: { url: cache.config.web_app_url } }]],
    },
  });
};

/**
 * Prompt the user to verify their Telegram phone number.
 *
 * @param ctx - The bot context.
 */
const verifyPhoneCommand = async (ctx: Context): Promise<void> => {
  if (ctx.chat.type !== 'private') {
    middleware.reply(ctx, cache.config.language.prvChatOnly);
    return;
  }

  const verification = await getPhoneVerificationSummary(ctx.from.id);
  if (verification.verified) {
    middleware.reply(
      ctx,
      `Your phone is already verified (${verification.phoneNumberMasked}). You can return to the Mini App and post requests.`
    );
    return;
  }

  middleware.reply(
    ctx,
    'To verify your phone for Marketplace requests, tap the button below and share your Telegram contact.',
    {
      parse_mode: cache.config.parse_mode,
      reply_markup: {
        keyboard: [[{ text: 'Verify phone number', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
};

/**
 * Accept a Telegram contact share and mark the user as phone verified.
 *
 * @param ctx - The bot context.
 */
const verifyPhoneContactCommand = async (ctx: Context): Promise<void> => {
  const contact = ctx.message.contact;
  if (!contact?.phone_number) {
    return;
  }
  if (contact.user_id && contact.user_id.toString() !== ctx.from.id.toString()) {
    middleware.reply(ctx, 'Please share your own Telegram contact to complete phone verification.');
    return;
  }

  const verification = await savePhoneVerification(ctx.from, contact.phone_number);
  middleware.reply(
    ctx,
    `Phone verified successfully (${verification.phoneNumberMasked}). You can now return to the Mini App and post requests.`,
    {
      parse_mode: cache.config.parse_mode,
      reply_markup: { remove_keyboard: true },
    }
  );
};

export {
  banCommand,
  openCommand,
  closeCommand,
  unbanCommand,
  clearCommand,
  reopenCommand,
  helpCommand,
  leadFeeCommand,
  setLeadFeeCommand,
  miniAppCommand,
  verifyPhoneCommand,
  verifyPhoneContactCommand,
};
