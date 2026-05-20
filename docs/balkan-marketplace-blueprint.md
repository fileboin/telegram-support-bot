# Balkan Marketplace Bot Blueprint

This repository is a support and request-routing bot, not a full marketplace engine.
That makes it a good fit for the **intake, moderation, FAQ, and urgent dispatch** layer
of your concept, while listings, payments, refunds, and wallet accounting still need
separate services or custom add-ons.

The companion example config lives at
[`config/examples/balkan-marketplace.config.yaml`](../config/examples/balkan-marketplace.config.yaml).

## What this bot can already support

The current codebase is useful for the following parts of your concept:

- **Telegram-first onboarding** with low friction entry
- **Urgent request intake** from plain-text user messages
- **Keyword-based routing** into provider or moderator groups
- **Manual moderation and review** before staff or providers respond
- **Basic anti-spam controls** and posting throttling
- **FAQ / policy answers** through static autoreplies
- **LLM fallback answers** grounded in a configured knowledge base
- **Staff reply workflows** for follow-up, clarification, and private replies

## What still needs custom development

These parts are outside the scope of the current bot and should be built as separate
services, add-ons, or back-office tooling:

- **Structured classifieds storage** for offers, listings, edits, expiration, and search indexes
- **User-facing marketplace browsing** beyond chat-based keyword routing
- **Trusted seller scoring logic** and automated verification workflows
- **Wallet ledger and balance accounting**
- **Refund execution**
- **Voucher / PayPal / crypto payment processing**
- **Premium billing rules** for boosts, pins, VIP placement, and repost credits
- **Localized UI switching** beyond the static language copy configured per deployment

## Concept-to-feature mapping

### 1. Free ads

Use the bot as a moderated intake channel:

- users submit their ad or request in chat
- staff reviews quality and spam risk
- staff forwards or republishes valid offers into the correct provider or listing channel

This matches your "free but slower and moderated" philosophy without forcing payment.

### 2. Premium features

This bot can **explain** premium options, route premium support requests, and guide
users through manual fulfillment. It does **not** bill or track those features by itself.

Recommended pattern:

- keep premium rules in `llm_knowledge` and `autoreply`
- route premium questions into a dedicated support group
- let staff apply boosts or publish promoted listings through external tooling

### 3. Urgent request system

This is the best fit for the existing architecture.

Examples:

- `AC repair Brcko`
- `Plumber Sarajevo today`
- `Moving service Novi Sad`
- `Apartment Banja Luka`

With keyword routing enabled, the bot can assign these requests to the right internal
group before creating the ticket.

### 4. Search-first UX

Your concept says users should be able to type natural queries instead of navigating
deep menus. This branch adds optional `keywords` arrays on categories and subgroups so
the bot can match free text like:

- `ac repair`
- `air conditioner service`
- `plumber`
- `wallet refund`

If nothing matches, the user still falls back to the category keyboard.

### 5. Trust and verified sellers

The current bot can support the **communication layer** of trust:

- explain verification policy
- collect documents or profile information
- route verification requests to staff
- answer questions about the badge system

The actual badge assignment, review state machine, and fraud controls should live in a
separate admin system.

### 6. Wallet, refunds, and Balkan-friendly payments

At present, this bot can only act as the **support and policy interface** for:

- balance refunds
- crypto withdrawal requests
- voucher top-up instructions
- PayPal / crypto support questions

It cannot safely maintain balances or execute payouts without a dedicated transaction
service behind it.

## Suggested MVP architecture

Keep the first release simple and split responsibilities:

### Bot layer (this repo)

- conversation entry point
- service/category selection
- keyword-based request routing
- moderation queue
- staff/provider notifications
- FAQ / LLM answers

### Marketplace service layer (new system)

- listings database
- seller profiles and trust levels
- wallet balances
- payments and refunds
- premium feature entitlements
- searchable marketplace inventory

### Optional integration points

- webhook from marketplace service into Telegram bot for status updates
- admin dashboard for moderators
- payment provider adapters for vouchers, PayPal, or crypto
- city-specific or category-specific dispatch rules

## Recommended category design

Because the native routing model assigns a message to one group at a time, keep the
first version simple:

1. Use **top-level categories** for business domains:
   - Urgent Services
   - Apartments
   - Marketplace Support
2. Use **subgroups** for the highest-value dispatch dimension:
   - service type, or
   - city, or
   - provider pool

If you need both city and service type as first-class structured filters, extend the
data model instead of trying to encode everything into the existing group selection.

## Rollout checklist

1. Copy the example config into your own `config.yaml`
2. Replace all bot tokens, owner IDs, and Telegram group IDs
3. Tune category and subgroup keywords for local spelling and slang
4. Rewrite `llm_knowledge` with your final policy language
5. Add exact refund and payment rules only after the backend exists
6. Create separate provider/moderator groups for urgent categories
7. Test real user phrases in your target languages

## Important limitation

This setup gives you a strong **Telegram intake MVP** for a Balkan marketplace concept,
but it is not the entire product. Treat it as the trusted front door and routing layer,
then connect it to dedicated marketplace, wallet, and payment services as the next step.
