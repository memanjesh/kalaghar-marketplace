# Production deployment

## Architecture

1. **Static storefront:** deploy the repository root to GitHub Pages or a CDN.
2. **Authentication and database:** create a Supabase project. Run `db/schema.sql`, then `001_marketplace_v2.sql` and `002_operations_and_plus.sql` in order. Enable email verification and configure the allowed site URLs.
3. **Private API:** deploy `server/` to a Node 18+ host with HTTPS. Keep the Supabase service-role key and all payment/AI secrets on that host only.
4. **Object storage:** create private upload buckets for review evidence, verification documents and custom-request references; create a public or transformed-media bucket for approved product media.
5. **Background work:** use scheduled jobs for payout batches, reward expiry, abandoned-cart email (with consent), festival activation, analytics aggregation and stale quote expiry.
6. **Support and notifications:** connect ticket/customer replies to a transactional email provider, keep delivery/bounce records and configure support-domain SPF, DKIM and DMARC.

## Required configuration

Copy `server/.env.example` to the hosting provider's encrypted environment variables. In live mode, the server refuses to start without an origin allowlist and all three Supabase variables.

Set these browser-safe values in `assets/config.js` only after the API is deployed:

- `payments.paymentApiBase`: API origin, for example `https://api.kalaghar.com`
- `ai.listingAssistantEndpoint`: the same origin plus `/api/ai/listing-assistant`
- `database.supabaseUrl` and `database.supabaseAnonKey`: public project values only

Never put `SUPABASE_SERVICE_ROLE_KEY`, payment secrets or `OPENAI_API_KEY` in the static site.

## Payment launch gates

- Complete merchant onboarding and webhook/IP allowlisting with Khalti and eSewa.
- Confirm whether the selected international card provider can legally onboard the operating entity and settle funds for this marketplace structure.
- Configure `STRIPE_CURRENCY` and a reviewed `STRIPE_NPR_TO_CURRENCY_RATE`; the card option stays disabled when either is absent. Replace the fixed environment rate with a locked, auditable quote service before accepting multiple settlement currencies.
- Create orders in the shared database before calling `/api/pay/:provider/start`. In live mode the API ignores browser totals and recalculates the group total from stored orders owned by the authenticated buyer.
- Add signed provider webhooks and an asynchronous reconciliation job before handling real volume. Redirect verification is a customer-experience path, not the sole accounting record.
- Obtain legal/accounting advice for VAT invoices, refunds, seller agreements, marketplace liability, foreign-currency settlement and payout withholding in Nepal.

## Payout launch gates

The schema supports immutable payout batches and prevents one order from being paid twice. A provider transfer adapter is intentionally not included without an approved payout partner. Until one is onboarded, use dual-control manual transfers: one administrator creates a batch, another approves it, and reconciliation records the provider reference.

## Shipping launch gates

Replace illustrative rates with signed courier tariffs. Implement provider-specific label and webhook adapters, map events into `shipment_events`, and retain manual tracking entry as a fallback. Test remote-area surcharges, returns, fragile goods, export documentation and delivery proof.

Hotel delivery and pickup points must have a verified handoff procedure, named locations, hours, custody rules and proof of collection before administrators enable them publicly.

## Admin and support launch gates

- Provision administrators through Supabase Auth and `admin_members`; do not share the GitHub publishing token.
- Migration 002 preserves existing `profiles.role = 'admin'` accounts as `super_admin`. After verifying access, stop using the broad legacy profile role for new staff and create only scoped `admin_members` roles.
- Assign the smallest role needed. Test each role against server/API and RLS rules, not only the hidden/visible state of browser buttons.
- Route guest support creation and ticket tracking through a rate-limited server endpoint using a hashed tracking secret. Do not expose tickets by email plus predictable ID alone.
- Make production audit records append-only, define retention, and send high-risk actions such as refund, payout, suspension and permission changes to an alert channel.
- Connect public replies to verified email delivery and store delivery/bounce status. The preview intentionally saves replies without pretending an email was sent.

## Additional provider launch gates

- **Live shopping:** streaming vendor, moderation delay, replay consent and inventory reservation.
- **Subscriptions/group gifting/preorders:** payment-provider support for recurring charges or deposits, idempotency, refunds and reconciliation.
- **Affiliates:** published terms, attribution consent, fraud review, return-window qualification and payout/tax process.
- **AR/try-on:** approved provider, privacy review for uploaded images and accuracy disclaimers.
- **Customs estimates:** maintained tariff/classification source and clear distinction between estimates and binding charges.
- **Craft passports:** evidence standard, reviewer identity, revocation process and tamper-resistant public URLs/QR codes.

## AI launch gates

The AI endpoint is seller-authenticated when Supabase is configured, rate limited, and records a hashed-input audit entry. Sellers must review generated content. Add moderation and monitoring, document AI use in seller terms, and prohibit invented certifications, materials, origins and health claims.

## Release sequence

1. Apply database schema and migration in a staging Supabase project.
2. Wire the existing `KG.store` interface to Supabase Auth/PostgREST; keep local storage only as an explicit demo adapter.
3. Test buyer, seller and admin roles with separate accounts, including attempts to read another party's orders, messages, quotes and payouts.
4. Deploy the API in test mode and run Khalti/eSewa/Stripe sandbox flows, including duplicate submits, abandoned redirects, refunds and provider outages.
5. Configure storage validation, scanning/moderation, retention and deletion.
6. Test Support, Tracking, Customers, Moderation, Inventory, Staff roles, Feature controls and Audit with separate administrator accounts.
7. Run accessibility, mobile, PWA/offline, performance and end-to-end checkout tests.
8. Complete legal, merchant, courier and seller onboarding. Only then set `PAYMENT_MODE=live`.

## Verification

Run `npm test` and `npm run check` from the repository root. Also validate the SQL in a disposable Supabase project; local JavaScript tests cannot prove hosted RLS behavior.

