# KalaGhar marketplace implementation status

This document deliberately distinguishes a **working storefront preview** from a **production-live service**. GitHub Pages can run the preview UI, but multi-user commerce requires the shared backend described in `DEPLOYMENT.md`.

| # | Capability | Storefront / dashboard implementation | Production status |
|---|---|---|---|
| 1 | Individual artisan storefronts | Shop pages, story, region, craft, products, badges, share and favorite-shop controls | Shared seller/profile tables and RLS are ready; real sellers must be onboarded |
| 2 | Advanced seller dashboard | Listings, orders, messages, earnings, promotions, profile, verification and custom-request tabs | Connect UI storage adapter to Supabase before seller launch |
| 3 | Marketplace checkout and seller payouts | Cart splits into seller orders; VAT, shipping, insurance, coupons and payout calculations are shown | Payment server validates stored totals in live mode; merchant and payout-provider onboarding is still required |
| 4 | Customer photo reviews | Delivered-order-only review flow with optional photo | Supabase review policy enforces verified purchase; object storage/moderation must be configured |
| 5 | Advanced search/filtering | Text, category, region, price range, rating, verified, customizable, stock and sorting | PostgreSQL full-text index is included in migration |
| 6 | Wishlists/favorite shops | Product collections, shareable wishlists and favorite artisan shops | `product_favorites` and `shop_favorites` tables/RLS included |
| 7 | Buyer–seller messaging | Product/order threads, unread state and order actions | Thread/message RLS exists; add realtime subscription and abuse controls before launch |
| 8 | Personalization/made-to-order | Per-item personalization plus dedicated custom request/quote workflow | Versioned `custom_quotes` model included; accepted quote checkout needs the shared adapter |
| 9 | Multi-currency pricing | NPR base prices with USD/EUR/GBP/AUD/INR/JPY display conversion | Charge currency and exchange rate are recorded; settlement remains NPR by default |
| 10 | Diaspora-to-Nepal gifts | International buyer, Nepal recipient, message, packaging and price-free slip | International card merchant and domestic courier accounts required |
| 11 | Order tracking | Buyer timeline, tracking number/link, seller dispatch controls and shipment event schema | Courier API/webhook credentials required for automatic events |
| 12 | Verified sellers/authenticity | Verified Artisan, Star Artisan, Chyangra licence and craft passport UI | Evidence table and admin-only review fields included; manual/KYC policy required |
| 13 | Coupons/promos | Site and shop coupons, promoted listings, expiry/minimums | Server-side coupon redemption/usage limits must replace preview calculations |
| 14 | Festival marketplace | Date-based Teej, Dashain, Tihar, holiday and Losar storefront with admin override | `festival_campaigns` supports production scheduling |
| 15 | AI product listing assistant | Seller button fills title, tagline, description and care fields for review | Live only after server `OPENAI_API_KEY`, Supabase Auth and endpoint URL are configured |
| 16 | Custom requests/quotations | Buyer request form, reference image, budget/date/quantity and seller quote revisions | Shared request/quote schema and party-scoped RLS included |
| 17 | Product videos | Seller video URL field and product-page playback/link | Use trusted media hosting/transcoding and moderation for uploads |
| 18 | Loyalty/referral rewards | Points summary, referral code and preview redemption coupon | Immutable ledger/referral tables included; awards/redemptions must run server-side |
| 19 | Wholesale/bulk orders | B2B form, quantities, customization/export details and admin status | CRM/email routing and commercial terms remain business setup |
| 20 | Artisan sales analytics | Views, favorites, bag adds, orders, conversion funnel, top listings and revenue | Shared event schema/index included; consent, retention and scheduled aggregation required |

## Additional 25-feature expansion

Every item below has a public entry point in the **KalaGhar Plus** hub and an administrator-controlled state (`Enabled`, `Coming soon`, or `Hidden`). Requests appear in **Admin → Feature requests**, where staff can search, assign and change status. Existing workflows link to their specialized admin area.

| # | Additional capability | Implemented now | Required before production-live use |
|---|---|---|---|
| 1 | Buyer Protection | Support/case intake, evidence, tracked status, replies and admin resolution workflow | Shared adapter, refund provider integration and approved case policy |
| 2 | Digital Craft Passport | Product passport display plus typed passport/origin/verification schema | Evidence collection, reviewer procedure and signed public QR records |
| 3 | Bookable Artisan Experiences | Workshop catalog, booking request and admin inquiry controls | Availability calendar, payment, cancellation and host onboarding |
| 4 | Live Workshop Shopping | Session catalog, reminders and admin-managed session/request records | Approved streaming provider, chat moderation and live inventory reservation |
| 5 | Gift Registries | Registry creation, occasions, event date and share code | Shared registry adapter and privacy/share controls |
| 6 | Group Gifting | Group-contribution flag and payment-linked contribution schema | Verified contribution payment flow and refunds |
| 7 | Corporate Gifting | Business, quantity, deadline and branding request form | Quoting, contracts, invoicing and fulfilment operations |
| 8 | Monthly Craft Box | Plan/frequency/preferences request flow | Recurring billing, plan inventory, skip/pause and cancellation handling |
| 9 | Limited Drops & Preorders | Drop cards, waitlist, inventory/deposit data model | Atomic reservation service, verified deposits and oversell protection |
| 10 | Repair, Restoration & Resale | Service intake covering repair, restoration, cleaning and resale | Inspection, pricing, shipping and resale policy |
| 11 | Room Preview & Try-On | Upload-and-drag room visualization clearly labelled approximate | Scale calibration and specialist AR/try-on provider for advanced use |
| 12 | Measurement Profiles | Private on-device measurement/fit profile plus owner-scoped schema | Shared encrypted storage and explicit artisan-sharing consent |
| 13 | Language & Voice Access | English/Nepali interface plus regional-language preference capture | Human-reviewed regional translations and voice accessibility testing |
| 14 | Low-Internet App | Web manifest, install prompt and network-first offline shell | Production cache/version policy, offline QA and real device icons |
| 15 | Local QR & Pay on Delivery | QR/COD discovery linked to checkout and admin readiness controls | Licensed merchant accounts and verified server callbacks |
| 16 | Pickup & Hotel Delivery | Checkout fulfilment choice plus special-instructions and request flows | Approved pickup locations, hotel handoff policy and proof of collection |
| 17 | Creator Affiliates | Application, referral link/code and attribution schema | Terms, consent, fraud controls, qualification and payouts |
| 18 | Craft Encyclopedia | Craft learning cards linked to relevant catalog categories | Reviewed editorial content, sources and admin publishing workflow |
| 19 | Community Collections | Collections built from favorites with public/private setting | Shared adapter, moderation and abuse reporting |
| 20 | Impact Dashboard | Existing order-derived dashboard linked from Plus hub | Verified baseline methodology and scheduled aggregation |
| 21 | Seller Team Accounts | Seller invitations and role selection plus permission schema | Authenticated invitation acceptance and server-enforced permissions |
| 22 | Marketplace Trust Center | Support reporting, moderation queue, review controls and audit trail | Moderation policy, trained reviewers and appeals process |
| 23 | Landed-Cost Calculator | Transparent planning range for shipping/duty/tax | Customs classification/data provider; never treat the preview as a quote |
| 24 | Wholesale Export Workspace | Existing inquiry flow plus milestone/evidence schema | Contract, sample, inspection, export-document and freight operations |
| 25 | KalaGhar Studio Services | Requests for photography, translation, packaging, listings, export and catalogs | Pricing, capacity, file delivery and service terms |

## Expanded admin operations

- **Support:** unified inbox, search, status, priority, assignee, tags, SLA warnings, public replies and private notes.
- **Tracking:** courier, tracking number, shipment state, estimated delivery, customer-visible events and exception queue.
- **Customers:** registered and guest buyers, order value, support history and private admin notes.
- **Moderation:** review visibility, trust reports, listing/seller escalation and policy reminder.
- **Inventory:** search, price, stock and storefront visibility.
- **Staff access:** pending role invitations for support, order operations, trust, sellers, finance, marketing, content and analytics.
- **Operations:** response targets, fulfilment mode, pause/maintenance controls and integration health.
- **Audit log:** action, administrator, entity, timestamp, detail and JSON export.
- **All features:** availability and custom description for each of the 25 additional features, plus links to related admin queues.
- **Feature requests:** one searchable workflow for new service applications and requests.
- **Highlighted mobile shortcut strip:** rename, add, remove, hide/show, duplicate, reorder, bold, icon, destination, color, size, spacing, strip visibility and background/theme settings.

## Never represented as live

- A browser-only order, payout, reward, verification, message or review is preview data and is not shared across devices.
- No card, Khalti or eSewa charge is initiated when `payments.paymentApiBase` is empty.
- No automated payout is sent by the current code. Admin “transferred” controls are reconciliation UI, not a provider transfer.
- The AI button remains disabled until a server endpoint is configured; it does not silently generate canned text.
- Shipping rates in `assets/config.js` are illustrative until courier contracts are signed.
- “Enabled” in the feature console means enabled in the storefront preview; it does not certify that a provider-backed service is legally or operationally live.

