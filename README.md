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
- Complaints and protection cases, wholesale and workshop inquiries, translation queue
- Coupons, payouts to transfer, festival override, printable tourist QR codes, launch checklist
- Repository-backed Site Content editor for announcements, featured header navigation, footer sections, payment methods, legal links, and the dispatch banner
- Category manager for adding, renaming, hiding, and safely deleting storefront categories
- Responsive country, language, and currency preferences with matching regional flags

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
| `db/schema.sql` | Database for when you move to Supabase |

## Going live — checklist

The Admin panel has a **Launch checklist** tab that ticks these off automatically.

1. **Register** on the Department of Commerce e-commerce portal. Put the listing number, registration number, PAN/VAT and complaint officer in `assets/config.js`.
2. **Payments.** Open merchant accounts with Khalti and eSewa (and Stripe or your bank for international cards). Copy `server/.env.example` to `server/.env`, add the keys, and run the server (`node server.js`) on any Node 18 host. Then set `payments.paymentApiBase` in `config.js`. Until then checkout runs in **test mode** — orders are saved but no money is taken. Fonepay and ConnectIPS need their own merchant API access before they can be added to the server.
3. **Couriers.** Open business accounts with Nepal Can Move and Pathao, and replace the illustrative shipping rates in `config.js` with your contracted rates.
4. **Shared database.** Today, each visitor's data (accounts, orders, listings) stays in their own browser, which is fine for testing but not for real customers. Create a Supabase project, run `db/schema.sql`, and add the URL and key to `config.js`. The site's storage layer (`KG.store` in `kg-core.js`) is the single place to switch over, and the payment server must then read order totals from the database instead of trusting the browser.
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

For the full 20-feature delivery matrix, including what is only a preview and what still requires external onboarding, see [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md). Production infrastructure and launch gates are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
