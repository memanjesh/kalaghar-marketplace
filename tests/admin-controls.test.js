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
    assert.equal(s.home.sections[0].key, 'faq');
    assert.equal(s.home.sections[0].visible, false);
    assert.ok(!s.home.sections.some(function (x) { return x.key === 'not-a-section'; }));
    assert.ok(s.home.sections.some(function (x) { return x.key === 'marketplace'; }));
});

test('every new feature module is loaded, started and has admin tabs', function () {
    const html = read('index.html'), init = read('assets/kg-init.js');
    ['kg-settings', 'kg-home', 'kg-commerce', 'kg-marketing', 'kg-shipping'].forEach(function (m) { assert.match(html, new RegExp('assets/' + m + '\\.js\\?v=')); });
    ['initCommerce', 'initShipping', 'initMarketing', 'initHome', 'initSettings'].forEach(function (f) { assert.match(init, new RegExp('KG\\.' + f + '\\(\\)')); });
    const tabs = ['home-layout', 'hero-slider', 'plus-launch', 'shop-features', 'alerts', 'qa', 'vacations', 'feeds', 'seo-pages', 'analytics', 'shipping-labels'];
    const all = ['kg-home', 'kg-commerce', 'kg-marketing', 'kg-shipping'].map(function (m) { return read('assets/' + m + '.js'); }).join('\n');
    tabs.forEach(function (t) { assert.match(all, new RegExp("addAdminTab\\('" + t + "'")); });
});

test('privacy policy cookie wording follows the analytics settings', function () {
    assert.match(read('pages/privacy.html'), /id="kgTrackerStatement"/);
    assert.match(read('pages/page.js'), /site-settings\.json/);
});
