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

## Never represented as live

- A browser-only order, payout, reward, verification, message or review is preview data and is not shared across devices.
- No card, Khalti or eSewa charge is initiated when `payments.paymentApiBase` is empty.
- No automated payout is sent by the current code. Admin “transferred” controls are reconciliation UI, not a provider transfer.
- The AI button remains disabled until a server endpoint is configured; it does not silently generate canned text.
- Shipping rates in `assets/config.js` are illustrative until courier contracts are signed.

