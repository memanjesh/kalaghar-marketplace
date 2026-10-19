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
    assert.match(html, /prefers-reduced-motion:\s*reduce/);
    assert.match(html, />FAQ<\/a>/);
    assert.equal((html.match(/class="kg-payment-tile/g) || []).length, 7);
});

test('content file is valid and includes visible defaults', function () {
    const content = JSON.parse(fs.readFileSync(path.join(root, 'content', 'site-content.json'), 'utf8'));
    assert.equal(content.header.items.length >= 1, true);
    assert.equal(content.dispatch.visible, true);
    assert.equal(content.footer.items[0].text, 'FAQ');
});
