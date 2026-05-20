import * as db from './db';
import cache from './cache';
import * as staff from './staff';
import * as users from './users';
import * as middleware from './middleware';
import { Addon, Category, Context } from './interfaces';
import { ISupportee } from './db';

/**
 * Routes a free-text message to a configured category or subgroup.
 */
type CategoryRoute = {
  group: string;
  category: string;
  tag: string;
  matchLength?: number;
  priority?: number;
};

const normalizeText = (value: string = ''): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const toSearchTokens = (...values: (string | string[] | undefined)[]): string[] => {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeText(value))
    .filter(Boolean);
};

const getSubgroupDisplayName = (
  category: Category,
  subgroup: Category['subgroups'][number],
): string => `${category.name}: ${subgroup.name}`;

const hasKeywordMatch = (message: string, tokens: string[]): boolean =>
  tokens.some((token) => message.includes(token));

const getLongestMatchLength = (message: string, tokens: string[]): number => {
  return tokens
    .filter((token) => message.includes(token))
    .reduce((longest, token) => Math.max(longest, token.length), 0);
};

const findCategoryRoute = (message: string): CategoryRoute | null => {
  const normalizedMessage = normalizeText(message);
  const { categories } = cache.config;
  const matches: CategoryRoute[] = [];

  if (!normalizedMessage || !Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  for (const category of categories) {
    const subgroups = Array.isArray(category.subgroups) ? category.subgroups : [];
    for (const subgroup of subgroups) {
      if (!subgroup?.group_id) continue;

      const subgroupTokens = toSearchTokens(
        getSubgroupDisplayName(category, subgroup),
        subgroup.name,
        subgroup.keywords,
      );

      if (hasKeywordMatch(normalizedMessage, subgroupTokens)) {
        matches.push({
          group: subgroup.group_id,
          category: subgroup.name,
          tag: category.tag || '',
          matchLength: getLongestMatchLength(normalizedMessage, subgroupTokens),
          priority: 2,
        });
      }
    }
  }

  for (const category of categories) {
    if (!category?.group_id) continue;

    const categoryTokens = toSearchTokens(category.name, category.keywords);
    if (hasKeywordMatch(normalizedMessage, categoryTokens)) {
      matches.push({
        group: category.group_id,
        category: category.name,
        tag: category.tag || '',
        matchLength: getLongestMatchLength(normalizedMessage, categoryTokens),
        priority: 1,
      });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  matches.sort((a, b) =>
    (b.matchLength || 0) - (a.matchLength || 0) ||
    (b.priority || 0) - (a.priority || 0));

  const bestMatch = matches[0];
  return {
    group: bestMatch.group,
    category: bestMatch.category,
    tag: bestMatch.tag,
  };
};

const applyCategoryRoute = (ctx: Context): boolean => {
  if (ctx.session.admin || ctx.session.group) {
    return false;
  }

  const route = findCategoryRoute(ctx.message.text);
  if (!route) {
    return false;
  }

  ctx.session.group = route.group;
  ctx.session.groupCategory = route.category;
  ctx.session.groupTag = route.tag;
  return true;
};

/**
 * Determines if a category keyboard should be shown.
 *
 * @param ctx - The message context.
 * @param matchedRoute - Whether a keyword route was found for the message.
 * @returns True if the keyboard should be shown, false otherwise.
 */
const shouldReplyWithCategoryKeyboard = (ctx: Context, matchedRoute: boolean): boolean => {
  const { categories } = cache.config;
  return Array.isArray(categories) &&
    categories.length > 0 &&
    !matchedRoute &&
    !ctx.session.admin &&
    !ctx.session.group;
};

/**
 * Handles incoming text messages.
 *
 * @param bot - Instance of the Telegram addon.
 * @param ctx - The context of the message.
 * @param keys - Keyboard keys to use for replies.
 */
export function handleText(bot: Addon, ctx: Context, keys: any[] = []) {
  // Handle private replies via staff
  if (ctx.session.mode === 'private_reply') {
    return staff.privateReply(ctx);
  }

  const matchedRoute = applyCategoryRoute(ctx);

  // If conditions met, reply with the category keyboard
  if (shouldReplyWithCategoryKeyboard(ctx, matchedRoute)) {
    return middleware.reply(ctx, cache.config.language.services, {
      reply_markup: { keyboard: keys },
    });
  }

  // In all other cases, process the ticket
  return ticketHandler(bot, ctx);
}

/**
 * Determines whether to forward the message or to handle it as a ticket.
 *
 * @param bot - Instance of the Telegram addon.
 * @param ctx - The context of the message.
 */
export async function ticketHandler(bot: Addon, ctx: Context): Promise<ISupportee | null> {
  const { chat, message, session, messenger } = ctx;
  // For private chats, check for an existing ticket; otherwise, create one.
  if (chat.type === 'private') {
    const ticket = await db.getTicketByUserId(message.from.id, session.groupCategory)
    if (!ticket) {
      db.add(message.from.id, 'open', session.groupCategory, messenger);
    }
    users.chat(ctx, message.chat);
    return ticket;
  }

  // For non-private chats, use the staff chat handler.
  staff.chat(ctx);
}
