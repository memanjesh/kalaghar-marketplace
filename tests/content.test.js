'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadContentManager() {
    const listeners = {};
    const sandbox = {
        window: { addEventListener: function () {}, dispatchEvent: function () {} },
        document: {
            addEventListener: function (name, fn) { listeners[name] = fn; },
            querySelectorAll: function () { return []; },
            getElementById: function () { return null; }
        },
        CustomEvent: function () {},
        TextEncoder,
        TextDecoder,
        Uint8Array,
        fetch: function () { throw new Error('Unexpected network request'); },
        atob,
        btoa,
        console
    };
    const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'kg-content.js'), 'utf8');
    vm.runInNewContext(source, sandbox, { filename: 'kg-content.js' });
    return sandbox.window.KG_CONTENT;
}

test('content manager exposes safe defaults with the FAQ label', function () {
    const manager = loadContentManager();
    const defaults = manager.defaults();
    assert.equal(defaults.footer.items.some(function (item) { return item.text === 'FAQ'; }), true);
    assert.equal(defaults.footer.items.some(function (item) { return item.href === '#support'; }), true);
    assert.equal(defaults.dispatch.items[0].text.includes('1–2 business days'), true);
    assert.equal(defaults.header.featuredLinks.length, 8);
    assert.equal(defaults.catalog.categories.length, 16);
    assert.equal(defaults.footer.bottom.payments.length, 7);
});

test('content validation clamps sizes and rejects unsafe colors and links', function () {
    const manager = loadContentManager();
    const value = manager.defaults();
    value.header.brand.fontSize = 999;
    value.header.brand.color = 'red; background:url(javascript:alert(1))';
    value.footer.items[0].href = 'javascript:alert(1)';
    value.footer.items[0].text = '<img src=x onerror=alert(1)>';
    value.catalog.categories[0].icon = 'fa-gem" onclick="alert(1)';
    value.header.featuredLinks[0].action = 'javascript';
    const clean = manager.apply(value);
    assert.equal(clean.header.brand.fontSize, 48);
    assert.equal(clean.header.brand.color, '#111827');
    assert.equal(clean.footer.items[0].href, '#');
    assert.equal(clean.footer.items[0].text, '<img src=x onerror=alert(1)>');
    assert.equal(clean.catalog.categories[0].icon, 'fa-border-all');
    assert.equal(clean.header.featuredLinks[0].action, 'section');
});

test('authentication secrets are memory-only', function () {
    const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'kg-content.js'), 'utf8');
    assert.doesNotMatch(source, /localStorage\.setItem[^\n]*(token|auth)/i);
    assert.doesNotMatch(source, /sessionStorage\.setItem[^\n]*(token|auth)/i);
});
