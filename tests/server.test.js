'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const serverPath = path.join(__dirname, '..', 'server', 'server.js');
const api = require(serverPath);

test('payment amount validation rejects coercion and unsafe values', function () {
    assert.equal(api.validAmount(10), true);
    assert.equal(api.validAmount(5000000), true);
    assert.equal(api.validAmount('1000'), false);
    assert.equal(api.validAmount(9), false);
    assert.equal(api.validAmount(5000001), false);
    assert.equal(api.validAmount(100.5), false);
});

test('return URLs permit web URLs and reject executable or malformed schemes', function () {
    assert.equal(api.safeReturnUrl('https://example.com/payment-return'), true);
    assert.equal(api.safeReturnUrl('http://localhost:8000/?payment=return'), true);
    assert.equal(api.safeReturnUrl('javascript:alert(1)'), false);
    assert.equal(api.safeReturnUrl('not a url'), false);
});

test('server module exports a create function without listening on import', function () {
    const instance = api.createApp();
    assert.equal(typeof instance.listen, 'function');
    instance.close();
});
