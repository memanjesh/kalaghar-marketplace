'use strict';
// Admin-controlled settings: defaults, safety checks and wiring of the new feature modules.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = function (f) { return fs.readFileSync(path.join(root, f), 'utf8'); };

function loadSettings() {
    const store = {};
    const KG = { esc: String, ui: {}, store: { get: function (k, d) { return k in store ? store[k] : d; }, set: function (k, v) { store[k] = v; } } };
    const sandbox = { window: { KG: KG }, document: { dispatchEvent: function () {}, addEventListener: function () {}, querySelectorAll: function () { return []; } }, CustomEvent: function () {}, localStorage: { removeItem: function () {} }, fetch: function () { return Promise.reject(); } };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(read('assets/kg-settings.js'), sandbox);
    return KG;
}

test('published settings file is valid and matches the sanitizer', function () {
    const KG = loadSettings();
    const published = JSON.parse(read('content/site-settings.json'));
    assert.deepEqual(JSON.parse(JSON.stringify(KG.sanitizeSettings(published))), published);
    assert.ok(published.home.sections.length >= 19);
});

test('analytics IDs and links are strictly validated before reaching the page', function () {
    const KG = loadSettings();
    const s = KG.sanitizeSettings({ marketing: { ga4Id: '"><script>x</script>', metaPixelId: 'abc', plausibleDomain: 'evil.com/<x>', siteUrl: 'javascript:alert(1)' }, courier: { bookingEndpoint: 'http://insecure.example' }, hero: { slides: [{ title: 'x', image: 'javascript:alert(1)' }] } });
    assert.equal(s.marketing.ga4Id, '');
    assert.equal(s.marketing.metaPixelId, '');
    assert.equal(s.marketing.plausibleDomain, '');
    assert.match(s.marketing.siteUrl, /^https:\/\//);
    assert.equal(s.courier.bookingEndpoint, '');
    assert.equal(s.hero.slides[0].image, '');
    const ok = KG.sanitizeSettings({ marketing: { ga4Id: 'G-ABC1234', metaPixelId: '123456789012', plausibleDomain: 'memanjesh.github.io' } });
    assert.equal(ok.marketing.ga4Id, 'G-ABC1234');
    assert.equal(ok.marketing.metaPixelId, '123456789012');
});

test('unknown homepage sections are dropped and missing ones restored', function () {
    const KG = loadSettings();
    const s = KG.sanitizeSettings({ home: { sections: [{ key: 'faq', visible: false }, { key: 'not-a-section' }] } });
    assert.equal(s.home.sections.find(function (x) { return x.key === 'faq'; }).visible, false);
    assert.ok(!s.home.sections.some(function (x) { return x.key === 'not-a-section'; }));
    assert.ok(s.home.sections.some(function (x) { return x.key === 'marketplace'; }));
});

test('new homepage sections slot in after their usual neighbour, keeping a saved order', function () {
    const KG = loadSettings();
    const saved = KG.HOME_SECTIONS.filter(function (x) { return x.key !== 'kgBuyAgain'; }).map(function (x) { return { key: x.key }; }).reverse();
    const keys = KG.sanitizeSettings({ home: { sections: saved } }).home.sections.map(function (x) { return x.key; });
    assert.equal(keys.indexOf('kgBuyAgain'), keys.indexOf('kgDiscoveryShelf') + 1);
    assert.equal(keys[0], saved[0].key);
});

test('delivery, checkout and badge settings are clamped and validated', function () {
    const KG = loadSettings();
    const s = KG.sanitizeSettings({ delivery: { processingMin: 5, processingMax: 2, cutoffHour: 99, nonWorkingDays: [6, 6, 9, '0'], holidays: ['2026-10-22', 'nope'] }, discovery: { badgeOverrides: { 12: { force: ['bestseller', 'evil'], hide: ['lowStock'] }, 'x<y': { force: ['inCarts'] } } }, buyer: { teaserBody: 7 } });
    assert.equal(s.delivery.processingMax, 5);
    assert.equal(s.delivery.cutoffHour, 23);
    assert.deepEqual(JSON.parse(JSON.stringify(s.delivery.nonWorkingDays)), [6, 0]);
    assert.deepEqual(JSON.parse(JSON.stringify(s.delivery.holidays)), ['2026-10-22']);
    assert.deepEqual(JSON.parse(JSON.stringify(s.discovery.badgeOverrides)), { 12: { force: ['bestseller'], hide: ['lowStock'] } });
    assert.equal(typeof s.buyer.teaserBody, 'string');
});

test('every new feature module is loaded, started and has admin tabs', function () {
    const html = read('index.html'), init = read('assets/kg-init.js');
    ['kg-settings', 'kg-home', 'kg-commerce', 'kg-marketing', 'kg-shipping', 'kg-buyer', 'kg-signals', 'kg-modern', 'kg-footer', 'kg-layout', 'kg-i18n'].forEach(function (m) { assert.match(html, new RegExp('assets/' + m + '\\.js\\?v=')); });
    ['initCommerce', 'initShipping', 'initMarketing', 'initHome', 'initBuyer', 'initSignals', 'initModern', 'initFooter', 'initLayout', 'initI18n', 'initSettings'].forEach(function (f) { assert.match(init, new RegExp('KG\\.' + f + '\\(\\)')); });
    const tabs = ['home-layout', 'hero-slider', 'plus-launch', 'shop-features', 'alerts', 'qa', 'vacations', 'feeds', 'seo-pages', 'analytics', 'shipping-labels', 'delivery', 'checkout-gifting', 'shopping-signals', 'site-theme', 'footer', 'layout'];
    const all = ['kg-home', 'kg-commerce', 'kg-marketing', 'kg-shipping', 'kg-buyer', 'kg-signals', 'kg-modern', 'kg-footer', 'kg-layout'].map(function (m) { return read('assets/' + m + '.js'); }).join('\n');
    tabs.forEach(function (t) { assert.match(all, new RegExp("addAdminTab\\('" + t + "'")); });
});

test('privacy policy cookie wording follows the analytics settings', function () {
    assert.match(read('pages/privacy.html'), /id="kgTrackerStatement"/);
    assert.match(read('pages/page.js'), /site-settings\.json/);
});

test('site theme defaults to Classic and theme inputs are validated', function () {
    const KG = loadSettings();
    assert.equal(JSON.parse(read('content/site-settings.json')).theme.active, 'classic');
    const s = KG.sanitizeSettings({ theme: { active: 'evil', modern: { headingFont: '<x>', gallery: 'nope', videos: { 1: 'javascript:alert(1)', 2: 'https://cdn.example.com/clip.mp4', 3: 'https://x.com/a.mp4"onerror=1' }, photos: [{ image: 'javascript:1' }, { image: 'https://x.com/p.jpg', productId: 'abc' }], calmHidden: ['faq', 'not-a-section'], storySteps: [{ title: 'A', image: 'data:text/html,x' }] } } });
    assert.equal(s.theme.active, 'classic');
    assert.equal(s.theme.modern.headingFont, 'fraunces');
    assert.equal(s.theme.modern.gallery, 'premium');
    assert.deepEqual(JSON.parse(JSON.stringify(s.theme.modern.videos)), { 2: 'https://cdn.example.com/clip.mp4' });
    assert.equal(s.theme.modern.photos.length, 1);
    assert.equal(s.theme.modern.photos[0].productId, null);
    assert.deepEqual(JSON.parse(JSON.stringify(s.theme.modern.calmHidden)), ['faq']);
    assert.equal(s.theme.modern.storySteps[0].image, '');
    assert.equal(KG.sanitizeSettings({ theme: { active: 'modern' } }).theme.active, 'modern');
});

test('footer defaults to Classic, links and socials are validated', function () {
    const KG = loadSettings();
    const pub = JSON.parse(read('content/site-settings.json'));
    assert.equal(pub.footer.style, 'classic');
    assert.equal(pub.footer.adminLink, false);
    assert.equal(pub.footer.columns.length, 3);
    const f = KG.sanitizeSettings({ footer: { style: 'clean', palette: 'neon', columns: [{ title: 'A', links: [{ text: 'x', href: 'javascript:alert(1)' }, { text: 'y', href: 'kg:track' }, { text: 'z', href: 'pages/terms.html' }, { text: 'w', href: 'https://example.com/"><script>' }] }], socials: { instagram: 'javascript:1', facebook: 'https://facebook.com/kalaghar' }, trustItems: [{ icon: 'fa-x" onload="1', text: 'Hi' }] } }).footer;
    assert.equal(f.style, 'clean');
    assert.equal(f.palette, 'cream');
    assert.deepEqual(f.columns[0].links.map(function (l) { return l.href; }), ['#', 'kg:track', 'pages/terms.html', '#']);
    assert.equal(f.socials.instagram, '');
    assert.equal(f.socials.facebook, 'https://facebook.com/kalaghar');
    assert.equal(f.trustItems[0].icon, 'fa-star');
});

test('layout defaults every area to Classic and only accepts classic/clean', function () {
    const KG = loadSettings();
    const defaults = KG.sanitizeSettings(KG.SETTINGS_DEFAULTS);
    KG.LAYOUT_AREAS.forEach(function (a) { assert.equal(defaults.layout[a], 'classic', a); });
    // The published file may use Clean (the owner chooses in Admin) but must stay valid
    const pub = JSON.parse(read('content/site-settings.json'));
    KG.LAYOUT_AREAS.forEach(function (a) { assert.ok(['classic', 'clean'].indexOf(pub.layout[a]) > -1, a); });
    const l = KG.sanitizeSettings({ layout: { home: 'clean', cards: 'weird', perPage: 999, underPrice: -5 } }).layout;
    assert.equal(l.home, 'clean');
    assert.equal(l.cards, 'classic');
    assert.equal(l.perPage, 48);
    assert.equal(l.underPrice, 100);
});
