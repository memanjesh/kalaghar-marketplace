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
    assert.equal(content.footer.items[0].text, 'FAQ');
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
