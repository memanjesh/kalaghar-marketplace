'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('all inline JavaScript parses', function () {
    const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi), function (match) { return match[1]; }).filter(function (source) { return source.trim(); });
    scripts.forEach(function (source, index) { assert.doesNotThrow(function () { new vm.Script(source, { filename: 'inline-' + index + '.js' }); }); });
});

test('admin demo credentials are not published', function () {
    assert.doesNotMatch(html, /KalaGhar@2026/);
    assert.doesNotMatch(html, /const\s+ADMIN_CREDS/);
    assert.match(html, /GitHub access token/);
});

test('editable content hooks and accessible animation are present', function () {
    assert.match(html, /id="kgAnnouncementTrack"/);
    assert.match(html, /id="kgDispatchNotice"/);
    assert.match(html, /id="kgFooterHelpLinks"/);
    assert.match(html, /id="kgFooterCopyright"/);
    assert.match(html, /id="kgPaymentMethods"/);
    assert.match(html, /id="kgFooterUtilityLinks"/);
    assert.match(html, /id="kgLocaleFlag"/);
    assert.match(html, /id="kgCategoryTiles"/);
    assert.match(html, /prefers-reduced-motion:\s*reduce/);
    assert.match(html, />FAQ<\/a>/);
    assert.equal((html.match(/class="kg-payment-tile/g) || []).length, 7);
});

test('content file is valid and includes visible defaults', function () {
    const content = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site-content.json'), 'utf8'));
    assert.equal(content.header.items.length >= 1, true);
    assert.equal(content.dispatch.visible, true);
    assert.equal(content.footer.items.some(function (item) { return item.text === 'FAQ'; }), true);
    assert.equal(content.footer.items.some(function (item) { return item.href === '#support'; }), true);
    assert.equal(content.header.featuredLinks.length, 8);
    assert.equal(content.catalog.categories.length, 16);
    assert.equal(content.footer.bottom.links.some(function (link) { return link.id === 'admin'; }), true);
});

test('mobile layout includes scrollable navigation and edge-safe footer rules', function () {
    const css = fs.readFileSync(path.join(root, 'assets', 'kg.css'), 'utf8');
    const admin = fs.readFileSync(path.join(root, 'assets', 'kg-admin.js'), 'utf8');
    assert.match(css, /@media \(max-width: 1023px\)/);
    assert.match(css, /\.kg-footer-bottom-grid/);
    assert.match(html, /kg-catnav overflow-x-auto/);
    assert.match(admin, /tabBar\.classList\.add\('overflow-x-auto'\)/);
});

test('guided shopping features are wired into products and checkout', function () {
    const shop = fs.readFileSync(path.join(root, 'assets', 'kg-shop.js'), 'utf8');
    const checkout = fs.readFileSync(path.join(root, 'assets', 'kg-checkout.js'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'assets', 'kg.css'), 'utf8');
    assert.match(html, /id="kgDiscoveryShelf"/);
    assert.match(shop, /KalaGhar Craft Passport/);
    assert.match(shop, /Signature Box/);
    assert.match(shop, /kgGiftDestination/);
    assert.match(shop, /kg-mobile-buybar/);
    assert.match(checkout, /packaging: l\.packaging/);
    assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.kg-mobile-buybar/);
});

test('all twenty marketplace capabilities have working UI or provider-ready boundaries', function () {
    const core = fs.readFileSync(path.join(root, 'assets', 'kg-core.js'), 'utf8');
    const shop = fs.readFileSync(path.join(root, 'assets', 'kg-shop.js'), 'utf8');
    const checkout = fs.readFileSync(path.join(root, 'assets', 'kg-checkout.js'), 'utf8');
    const seller = fs.readFileSync(path.join(root, 'assets', 'kg-seller.js'), 'utf8');
    const discover = fs.readFileSync(path.join(root, 'assets', 'kg-discover.js'), 'utf8');
    const growth = fs.readFileSync(path.join(root, 'assets', 'kg-growth.js'), 'utf8');
    const schema = fs.readFileSync(path.join(root, 'db', 'migrations', '001_marketplace_v2.sql'), 'utf8');
    [
        [discover, /KG\.openShop/], [seller, /openSellerDashboard/], [checkout, /startPayment/],
        [checkout, /KG\.writeReview/], [growth, /kgAdvancedFilters/], [growth, /followedShops/],
        [checkout, /KG\.openThread/], [shop, /kgPersonal/], [core, /currency/],
        [discover, /Send a gift home/], [checkout, /trackingUrl/], [core, /Verified Artisan/],
        [seller, /Shop coupons/], [discover, /Festival Storefront/], [seller, /AI listing assistant/],
        [growth, /openCustomRequest/], [seller, /videoUrl/], [growth, /KG\.loyalty/],
        [discover, /kgWholesaleForm/], [seller, /Top listings/]
    ].forEach(function (entry) { assert.match(entry[0], entry[1]); });
    assert.match(schema, /payment_attempts/);
    assert.match(schema, /loyalty_ledger/);
    assert.match(schema, /custom_quotes/);
    assert.match(schema, /enable row level security/);
});

test('pending registration and complaint officer strip is absent from the storefront footer', function () {
    const discover = fs.readFileSync(path.join(root, 'assets', 'kg-discover.js'), 'utf8');
    assert.doesNotMatch(discover, /id="kgBizStrip"/);
    assert.doesNotMatch(html, /Reg\. No\. pending/);
});

test('support, shipment and complete admin operations controls are wired', function () {
    const operations = fs.readFileSync(path.join(root, 'assets', 'kg-operations.js'), 'utf8');
    [/'support', 'Support'/, /'tracking', 'Tracking'/, /'customers', 'Customers'/, /'moderation', 'Moderation'/,
        /'inventory', 'Inventory'/, /'staff', 'Staff access'/, /'operations', 'Operations'/, /'audit', 'Audit log'/
    ].forEach(function (pattern) { assert.match(operations, pattern); });
    assert.match(operations, /KG\.openSupportCenter/);
    assert.match(operations, /shipmentEvents/);
    assert.match(operations, /firstResponseHours/);
    assert.match(operations, /KG_ADMIN_AUDIT/);
});

test('all 25 expansion features have public entry points and admin controls', function () {
    const platform = fs.readFileSync(path.join(root, 'assets', 'kg-platform.js'), 'utf8');
    const ids = Array.from(platform.matchAll(/\{ id: (\d+), icon:/g), function (match) { return Number(match[1]); });
    assert.deepEqual(ids, Array.from({ length: 25 }, function (_, index) { return index + 1; }));
    assert.match(platform, /Control every customer feature/);
    assert.match(platform, /Feature requests/);
    assert.match(platform, /KG\.openPlusFeature/);
    assert.match(platform, /data-feature-state/);
});

test('highlighted mobile shortcut strip is fully editable from admin', function () {
    const admin = fs.readFileSync(path.join(root, 'assets', 'kg-admin.js'), 'utf8');
    const contentManager = fs.readFileSync(path.join(root, 'assets', 'kg-content.js'), 'utf8');
    const content = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site-content.json'), 'utf8'));
    assert.equal(content.header.featuredNav.visible, true);
    assert.match(admin, /highlighted horizontal strip below the mobile header/);
    assert.match(admin, /move-featured/);
    assert.match(admin, /duplicate-featured/);
    assert.match(admin, /kgFeaturedVisible/);
    assert.match(contentManager, /Open Support Center|item\.action === 'support'/);
    assert.match(contentManager, /featuredNav\.useThemeBackground/);
});

test('production migration covers operations and feature workflows', function () {
    const schema = fs.readFileSync(path.join(root, 'db', 'migrations', '002_operations_and_plus.sql'), 'utf8');
    ['admin_members', 'support_tickets', 'support_messages', 'moderation_cases', 'feature_catalog', 'feature_requests',
        'craft_passports', 'live_sessions', 'gift_registries', 'subscriptions', 'product_drops', 'service_requests',
        'size_profiles', 'pickup_locations', 'affiliate_accounts', 'community_collections', 'seller_team_members',
        'landed_cost_quotes', 'wholesale_milestones'
    ].forEach(function (table) { assert.match(schema, new RegExp('create table if not exists ' + table)); });
    assert.match(schema, /has_admin_permission/);
    assert.match(schema, /enable row level security/);
    assert.match(schema, /select id, 'super_admin' from profiles where role='admin'/);
    assert.match(schema, /users join drop waitlists[\s\S]*status='waitlist'[\s\S]*payment_attempt_id is null/);
    assert.match(schema, /users create service requests[\s\S]*status='new'[\s\S]*quote_npr is null/);
    assert.match(schema, /users create affiliate application[\s\S]*status='applied'[\s\S]*commission_rate is null/);
});

test('installable low-bandwidth shell and fulfillment choices are present', function () {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
    const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    const checkout = fs.readFileSync(path.join(root, 'assets', 'kg-checkout.js'), 'utf8');
    assert.equal(manifest.display, 'standalone');
    assert.match(worker, /kalaghar-shell-v2/);
    assert.match(checkout, /value="hotel"/);
    assert.match(checkout, /value="pickup"/);
    assert.match(checkout, /fulfillment:/);
});

test('FAQ navigation has a real anchor for the services shelf and footer link', function () {
    assert.match(html, /<section id="faq"/);
    assert.match(html, /href="#faq"/);
});
