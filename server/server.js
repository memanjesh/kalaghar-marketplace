/* =====================================================================
   KalaGhar payment server
   ---------------------------------------------------------------------
   Keeps merchant secret keys off the public website. Node 18+, no
   dependencies. Start with:  node server.js   (reads .env in this folder)

   Routes (called by assets/kg-checkout.js):
     GET  /api/pay/methods              -> which methods are configured
     POST /api/pay/:method/start        -> begin a payment
     POST /api/pay/:method/verify       -> confirm a payment after return
     GET  /api/pay/esewa/callback/:id   -> eSewa redirects here

   IMPORTANT before real launch: amounts currently come from the browser.
   Once the shared database is connected, look the order total up from
   the database here instead of trusting `amountNpr` from the request.
   ===================================================================== */
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// --- tiny .env loader ---
try {
    fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(function (line) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
} catch (e) { /* no .env file */ }

const env = process.env;
const LIVE = env.PAYMENT_MODE === 'live';
const PORT = +env.PORT || 8787;
const PUBLIC_URL = (env.PUBLIC_URL || 'http://localhost:' + PORT).replace(/\/$/, '');
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGINS || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);

const KHALTI_BASE = LIVE ? 'https://khalti.com/api/v2' : 'https://dev.khalti.com/api/v2';
const ESEWA_FORM = LIVE ? 'https://epay.esewa.com.np/api/epay/main/v2/form' : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_STATUS = LIVE ? 'https://esewa.com.np/api/epay/transaction/status/' : 'https://rc.esewa.com.np/api/epay/transaction/status/';
const ESEWA_CODE = env.ESEWA_PRODUCT_CODE || (LIVE ? '' : 'EPAYTEST');
const ESEWA_SECRET = env.ESEWA_SECRET_KEY || (LIVE ? '' : '8gBm/:&EnhH.1/q'); // public sandbox key

// Pending payments (in memory). Move to the database for production.
const pending = new Map();

const methods = {
    khalti: !!env.KHALTI_SECRET_KEY,
    esewa: !!(ESEWA_CODE && ESEWA_SECRET),
    card: !!env.STRIPE_SECRET_KEY,
    cod: true
};

function send(res, status, obj, origin) {
    const headers = { 'Content-Type': 'application/json' };
    if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.indexOf(origin) > -1)) {
        headers['Access-Control-Allow-Origin'] = origin; headers['Vary'] = 'Origin';
        headers['Access-Control-Allow-Headers'] = 'Content-Type'; headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS';
    }
    res.writeHead(status, headers); res.end(JSON.stringify(obj));
}
function readBody(req) {
    return new Promise(function (resolve, reject) {
        let d = ''; req.on('data', function (c) { d += c; if (d.length > 1e5) req.destroy(); });
        req.on('end', function () { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { reject(e); } });
    });
}
function validAmount(n) { return Number.isFinite(n) && n >= 10 && n <= 5000000; }

/* ---------------------------- Khalti ---------------------------- */
async function khaltiStart(b) {
    const r = await fetch(KHALTI_BASE + '/epayment/initiate/', {
        method: 'POST', headers: { Authorization: 'Key ' + env.KHALTI_SECRET_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            return_url: b.returnUrl, website_url: new URL(b.returnUrl).origin,
            amount: Math.round(b.amountNpr * 100), purchase_order_id: b.groupId, purchase_order_name: 'KalaGhar order ' + b.orderIds.join(', '),
            customer_info: { name: b.buyer.name, email: b.buyer.email, phone: b.buyer.phone }
        })
    });
    const j = await r.json();
    if (!j.payment_url) throw new Error(j.detail || JSON.stringify(j));
    pending.set(b.groupId, { method: 'khalti', amount: b.amountNpr, pidx: j.pidx });
    return { redirectUrl: j.payment_url };
}
async function khaltiVerify(q) {
    const p = pending.get(q.group);
    const pidx = q.pidx || (p && p.pidx);
    if (!pidx) return { paid: false };
    const r = await fetch(KHALTI_BASE + '/epayment/lookup/', { method: 'POST', headers: { Authorization: 'Key ' + env.KHALTI_SECRET_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ pidx: pidx }) });
    const j = await r.json();
    const ok = j.status === 'Completed' && (!p || Math.round(p.amount * 100) === j.total_amount);
    return { paid: ok, ref: j.transaction_id || pidx };
}

/* ---------------------------- eSewa (EPG v2) ---------------------------- */
function esewaSign(total, uuid) {
    return crypto.createHmac('sha256', ESEWA_SECRET).update('total_amount=' + total + ',transaction_uuid=' + uuid + ',product_code=' + ESEWA_CODE).digest('base64');
}
function esewaStart(b) {
    const uuid = b.groupId + '-' + Date.now();
    const total = String(Math.round(b.amountNpr));
    pending.set(uuid, { method: 'esewa', amount: +total, group: b.groupId, returnUrl: b.returnUrl });
    const cb = PUBLIC_URL + '/api/pay/esewa/callback/' + encodeURIComponent(uuid);
    return { form: { action: ESEWA_FORM, fields: {
        amount: total, tax_amount: '0', total_amount: total, transaction_uuid: uuid, product_code: ESEWA_CODE,
        product_service_charge: '0', product_delivery_charge: '0', success_url: cb, failure_url: cb,
        signed_field_names: 'total_amount,transaction_uuid,product_code', signature: esewaSign(total, uuid)
    } } };
}
async function esewaVerify(q) {
    const uuid = q.uuid; const p = pending.get(uuid);
    if (!p) return { paid: false };
    const url = ESEWA_STATUS + '?product_code=' + encodeURIComponent(ESEWA_CODE) + '&total_amount=' + p.amount + '&transaction_uuid=' + encodeURIComponent(uuid);
    const j = await (await fetch(url)).json();
    return { paid: j.status === 'COMPLETE', ref: j.ref_id || uuid };
}

/* ---------------------------- International cards (Stripe Checkout) ---------------------------- */
async function stripeStart(b) {
    const form = new URLSearchParams({
        mode: 'payment',
        success_url: b.returnUrl + '&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: b.returnUrl + '&cancelled=1',
        client_reference_id: b.groupId,
        customer_email: b.buyer.email || '',
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': (env.STRIPE_CURRENCY || 'npr').toLowerCase(),
        'line_items[0][price_data][unit_amount]': String(Math.round(b.amountNpr * 100)),
        'line_items[0][price_data][product_data][name]': 'KalaGhar order ' + b.orderIds.join(', ')
    });
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
    const j = await r.json();
    if (!j.url) throw new Error((j.error && j.error.message) || 'Stripe error');
    pending.set(b.groupId, { method: 'card', amount: b.amountNpr, session: j.id });
    return { redirectUrl: j.url };
}
async function stripeVerify(q) {
    if (!q.session_id) return { paid: false };
    const j = await (await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(q.session_id), { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } })).json();
    return { paid: j.payment_status === 'paid' && j.client_reference_id === q.group, ref: j.payment_intent || j.id };
}

/* ---------------------------- router ---------------------------- */
const START = { khalti: khaltiStart, esewa: esewaStart, card: stripeStart };
const VERIFY = { khalti: khaltiVerify, esewa: esewaVerify, card: stripeVerify };

http.createServer(async function (req, res) {
    const origin = req.headers.origin;
    const url = new URL(req.url, PUBLIC_URL);
    try {
        if (req.method === 'OPTIONS') return send(res, 204, {}, origin);
        if (req.method === 'GET' && url.pathname === '/api/pay/methods') return send(res, 200, { methods: Object.keys(methods).filter(function (k) { return methods[k]; }), mode: LIVE ? 'live' : 'test' }, origin);

        // eSewa sends the buyer back here with ?data=<base64 JSON>
        let m = url.pathname.match(/^\/api\/pay\/esewa\/callback\/(.+)$/);
        if (req.method === 'GET' && m) {
            const uuid = decodeURIComponent(m[1]); const p = pending.get(uuid);
            if (!p) { res.writeHead(400); return res.end('Unknown payment'); }
            res.writeHead(302, { Location: p.returnUrl + '&uuid=' + encodeURIComponent(uuid) }); return res.end();
        }

        m = url.pathname.match(/^\/api\/pay\/([a-z]+)\/(start|verify)$/);
        if (req.method === 'POST' && m) {
            const method = m[1], action = m[2];
            if (!methods[method] || !START[method]) return send(res, 400, { error: method + ' is not set up on the payment server yet' }, origin);
            const b = await readBody(req);
            if (action === 'start') {
                if (!validAmount(b.amountNpr) || !b.groupId || !b.returnUrl) return send(res, 400, { error: 'Invalid payment request' }, origin);
                return send(res, 200, await START[method](b), origin);
            }
            return send(res, 200, await VERIFY[method](b), origin);
        }
        send(res, 404, { error: 'Not found' }, origin);
    } catch (e) {
        console.error(e);
        send(res, 500, { error: e.message }, origin);
    }
}).listen(PORT, function () {
    console.log('KalaGhar payment server on ' + PUBLIC_URL + ' (' + (LIVE ? 'LIVE' : 'test') + ' mode). Methods: ' + Object.keys(methods).filter(function (k) { return methods[k]; }).join(', '));
});
