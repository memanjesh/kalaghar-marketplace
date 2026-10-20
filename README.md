# KalaGhar (कलाघर) — Nepali Artisan Marketplace

An Etsy-style marketplace for handmade crafts from Nepal: buyers shop by craft or region, artisans run their own shops, and KalaGhar holds payments until orders arrive.

## What's on the site

**Shopping**
- Product pages with photo gallery and zoom, full details (materials, size, weight, origin, seller, delivery estimate, returns, care), VAT shown, personalization requests
- Prices in NPR with live conversion to USD, EUR, GBP, AUD, INR, JPY
- Favorites with shareable collection links
- Gift Mode (pick recipient, occasion and budget)
- Bag, checkout with coupons, shipping by weight and destination, optional insurance
- "Send a gift home to Nepal" for Nepalis abroad (card payment, recipient in Nepal, gift message, price-free packing slip)
- Orders split per artisan, electronic tax invoices, order tracking
- Verified-purchase reviews with photos
- Purchase Protection: money held until delivery, "Report a problem" freezes the payout
- Messages with makers; sellers can cancel or refund from the conversation
- Reminder when someone leaves items in their bag

**Discovery**
- Shop by Region map (Mustang, Palpa, Baglung, Kathmandu, Patan, Bhaktapur, Janakpur, Ilam)
- Meet the Makers and artisan shop pages
- Festival storefront that changes with the calendar (Teej, Dashain, Tihar, Holidays, Losar)
- New categories: Singing Bowls, Thangka & Paubha, Felt, Tea & Spices, Beads & Pote, Wood Carving, Rugs
- Craft workshop bookings, wholesale quote requests, live Impact figures
- Search-engine product data, shareable links (`#product-12`, `#shop-s-purna`, `#collection=1,4`)

**Sellers** (footer → Seller Dashboard, or sign up and tick "I'm an artisan")
- Listings with up to 6 photos (phone camera works), Nepali and English text, **list by speaking Nepali**
- Orders: mark shipped with courier and tracking, packing slips
- Earnings: held vs. released payouts, cooperative member splits, payout account
- Analytics: views, favorites, bag adds, orders, funnel, top listings, Star Artisan progress
- Promoted listings and shop coupons
- Shop profile, story, video, Chyangra Pashmina licence upload

**Admin** (header gear icon)
- Real orders with refunds and payout release, artisan approval and verification, licence checks
- Unified support inbox with SLA warnings, public replies/private notes, shipment control and exception tracking
- Customers, moderation, inventory, staff roles, operations settings and auditable admin actions
- Control panel for all 25 KalaGhar Plus features plus one request-review queue
- Complaints and protection cases, wholesale and workshop inquiries, translation queue
- Coupons, payouts to transfer, festival override, printable tourist QR codes, launch checklist
- Repository-backed Site Content editor for announcements, footer sections, payment methods, legal links, and the dispatch banner
- Full editor for the highlighted mobile shortcut strip: add, rename, hide, remove, duplicate, reorder, recolor, resize and retarget links
- Full editor for the floating Support, Call, WhatsApp, Chat and custom-link buttons, including visibility, order, icon, color, destination, size, spacing and screen position
- Category manager for adding, renaming, hiding, and safely deleting storefront categories
- Responsive country, language, and currency preferences with matching regional flags

**Admin-controlled features (publish once, every visitor sees them)**
- **Site theme** — choose **Classic** (the original look, default) or **Modern**, preview, then publish; switch back any time. Modern can be tuned piece by piece: heading/body fonts, Nepali pattern dividers (Dhaka, Mithila, Lokta), two products per row on phones, motion (fade-in, heart pop, photo flies into the bag), a phone tab bar, an illustrated region map, a calmer homepage (pick sections to hide), the "From the hills to your home" scroll story (edit steps and photos), maker videos per product (link or upload MP4/WebM), a customer photo wall (your photos plus 4–5★ review photos) and a dark gallery look for premium crafts or the whole catalog
Changes in these tabs preview instantly in your browser; the yellow bar's **Publish to all visitors** button saves them to `content/site-settings.json` on GitHub.
- **Homepage** — drag sections into any order, hide them, hide them on phones only, rename headings; "short homepage" preset
- **Hero slider** — Etsy-style top banner: add/duplicate/reorder slides, headline, text, button target, photo (URL or upload), style, start/end dates, auto-play speed, height
- **Launch mode** — one-click "launch set" for KalaGhar Plus (only services you can deliver), per-service Enabled / Coming soon / Hidden, hide the services hub
- **Shopping features** — switch variants, back-in-stock and price-drop alerts, product Q&A (with pre-approval) and seller vacation mode on/off; edit any product's stock and variants
- **Stock & price alerts** — subscribers, outbox of alert emails (send with one click from your email app), CSV export
- **Product Q&A** — approve, hide, delete or answer customer questions (sellers answer from their dashboard)
- **Seller vacations** — see who is away; start or end a shop's vacation
- **Product feeds** — Google Shopping and Instagram/Facebook catalog feeds, choose products, download or publish to `feeds/`
- **Google product pages** — publishes a real page per product (`p/…html`) with Google product data, plus `sitemap.xml` and `robots.txt`
- **Analytics** — Google Analytics 4, Plausible and Meta pixel with a cookie-consent banner; the Privacy Policy updates itself to match
- **Courier & labels** — book Nepal Can Move / Pathao / Export Hub pickups and print 4×6 or A6 labels with barcode and COD amount; sender details and defaults
- **Delivery estimates** — "Arrives Oct 28 – Nov 2" on product pages, bag, checkout and orders; default processing days, daily cut-off, weekly days off, Dashain/Tihar closures; per-shop processing time (sellers also set it per shop and per listing)
- **Checkout & gifting** — saved addresses (picker + address book), remembered payment method (card numbers are never stored), "Buy it again" on orders and the homepage, gift teaser emails to recipients with an editable template and send queue
- **Badges & filters** — Bestseller, "In N bags", "Popular now" and "Only N left" with thresholds and per-product Force/Hide; seller name, rating, sales and joining year on product cards; "Ships from" region filter and "Near me" sorting

**Legal pages** (`pages/`) — Terms, Privacy, Return & Refund, Delivery, Purchase Protection, Export Hub, plus the footer business details and complaint form required by the E-Commerce Act 2081. Have a lawyer in Nepal review them before launch.

## Files

| Path | What it is |
|---|---|
| `index.html` | The main page |
| `assets/config.js` | **Your business details, rates, payment and courier settings — edit this** |
| `assets/kg-*.js` | Feature code (core, shop, checkout, discover, seller, admin) |
| `content/site-content.json` | Published header, footer and dispatch-banner content |
| `pages/` | Policy pages |
| `server/` | Payment server for Khalti, eSewa and international cards |
| `db/schema.sql` + `db/migrations/` | Shared database, permissions, support and feature workflows for Supabase |

## Going live — checklist

The Admin panel has a **Launch checklist** tab that ticks these off automatically.

1. **Register** on the Department of Commerce e-commerce portal. Put the listing number, registration number, PAN/VAT and complaint officer in `assets/config.js`.
2. **Payments.** Open merchant accounts with Khalti and eSewa (and Stripe or your bank for international cards). Copy `server/.env.example` to `server/.env`, add the keys, and run the server (`node server.js`) on any Node 18 host. Then set `payments.paymentApiBase` in `config.js`. Until then checkout runs in **test mode** — orders are saved but no money is taken. Fonepay and ConnectIPS need their own merchant API access before they can be added to the server.
3. **Couriers.** Open business accounts with Nepal Can Move and Pathao, and replace the illustrative shipping rates in `config.js` with your contracted rates.
4. **Shared database.** Today, each visitor's data (accounts, orders, listings) stays in their own browser, which is fine for testing but not for real customers. Create a Supabase project; run `db/schema.sql`, `db/migrations/001_marketplace_v2.sql`, then `db/migrations/002_operations_and_plus.sql`; and add the URL and public key to `config.js`. The site's storage layer (`KG.store` in `kg-core.js`) is the single place to switch over, and the payment server must then read order totals from the database instead of trusting the browser.
5. **Admin publishing.** Create a fine-grained GitHub personal access token restricted to this repository with **Contents: Read and write** permission. Open Admin in the footer and use that token to publish header, footer and dispatch-banner changes. The token is kept only in memory and is cleared on logout or refresh; it is never written to storage or the repository.
6. **Replace sample content.** Sample artisans and new-category products are marked "sample" / "Photo coming soon".
7. Update the domain in `sitemap.xml` and the festival dates in `config.js` each year.

## Run locally

Any static server works, e.g. `python3 -m http.server` in this folder, then open http://localhost:8000.

## Site-content admin

The public page loads `content/site-content.json`, so editable content and categories have a safe static fallback and remain fast on GitHub Pages. The admin flow verifies the supplied token directly with GitHub, confirms write access to `memanjesh/kalaghar-marketplace`, then updates only that JSON file through GitHub's Contents API. Every publish creates an auditable commit and triggers the normal GitHub Pages deployment.

For the narrowest access, create a fine-grained token with:

- Repository access: **Only select repositories → `kalaghar-marketplace`**
- Repository permissions: **Contents → Read and write**
- A short expiration date, rotated regularly

Do not share the token or paste it anywhere except the site's Admin login. Because the live storefront currently uses GitHub Pages, this repository-backed model provides persistent edits without publishing an admin password in client-side code.

## Verification

Run `npm test` for the content-security and page checks, and `npm run check` for JavaScript syntax checks. The payment service has no third-party runtime dependencies and remains under `server/`.

For the original 20-feature matrix, the additional 25-feature expansion, admin coverage, and the exact boundary between preview and live services, see [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md). Production infrastructure and launch gates are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
