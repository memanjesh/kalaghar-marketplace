/* KalaGhar API: authenticated payment initiation/verification and AI listing help.
   Node 18+, zero runtime dependencies. Financial writes use the Supabase
   service role only on this server; browser callers never receive that key. */
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

try {
    fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(function (line) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
} catch (_) {}

const env = process.env;
const LIVE = env.PAYMENT_MODE === 'live';
const PORT = +env.PORT || 8787;
const PUBLIC_URL = (env.PUBLIC_URL || 'http://localhost:' + PORT).replace(/\/$/, '');
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGINS || '').split(',').map(function (x) { return x.trim().replace(/\/$/, ''); }).filter(Boolean);
const SUPABASE_READY = !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
const KHALTI_BASE = LIVE ? 'https://khalti.com/api/v2' : 'https://dev.khalti.com/api/v2';
const ESEWA_FORM = LIVE ? 'https://epay.esewa.com.np/api/epay/main/v2/form' : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_STATUS = LIVE ? 'https://esewa.com.np/api/epay/transaction/status/' : 'https://rc.esewa.com.np/api/epay/transaction/status/';
const ESEWA_CODE = env.ESEWA_PRODUCT_CODE || (LIVE ? '' : 'EPAYTEST');
const ESEWA_SECRET = env.ESEWA_SECRET_KEY || (LIVE ? '' : '8gBm/:&EnhH.1/q');
const STRIPE_CURRENCY = (env.STRIPE_CURRENCY || '').toLowerCase();
const STRIPE_NPR_RATE = +env.STRIPE_NPR_TO_CURRENCY_RATE || 0;
const pending = new Map(); // Preview fallback only; production attempts are persisted.
const rateBuckets = new Map();

if (LIVE && !SUPABASE_READY) throw new Error('Live payments require Supabase URL, anon key and service-role key');
if (LIVE && !ALLOWED_ORIGINS.length) throw new Error('Live mode requires an explicit ALLOWED_ORIGINS list');

const methods = { khalti: !!env.KHALTI_SECRET_KEY, esewa: !!(ESEWA_CODE && ESEWA_SECRET), card: !!(env.STRIPE_SECRET_KEY && STRIPE_CURRENCY && STRIPE_NPR_RATE > 0), cod: true };
function allowedOrigin(origin) { return !origin || (!LIVE && !ALLOWED_ORIGINS.length) || ALLOWED_ORIGINS.indexOf(origin.replace(/\/$/, '')) > -1; }
function json(res, status, obj, origin) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'" };
    if (origin && allowedOrigin(origin)) { headers['Access-Control-Allow-Origin'] = origin; headers.Vary = 'Origin'; headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Idempotency-Key'; headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'; }
    res.writeHead(status, headers); res.end(status === 204 ? '' : JSON.stringify(obj));
}
function readBody(req) {
    return new Promise(function (resolve, reject) {
        let data = '';
        req.on('data', function (chunk) { data += chunk; if (data.length > 32768) { reject(Object.assign(new Error('Request too large'), { status: 413 })); req.destroy(); } });
        req.on('end', function () { try { resolve(data ? JSON.parse(data) : {}); } catch (_) { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); } });
        req.on('error', reject);
    });
}
function validAmount(n) { return Number.isInteger(n) && n >= 10 && n <= 5000000; }
function safeReturnUrl(value) {
    try { const u = new URL(value); return ['https:', 'http:'].indexOf(u.protocol) > -1 && (!LIVE || ALLOWED_ORIGINS.indexOf(u.origin) > -1); } catch (_) { return false; }
}
function checkRate(req, key, limit) {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const now = Date.now(), id = key + ':' + ip, old = rateBuckets.get(id);
    if (!old || now - old.start > 60000) { rateBuckets.set(id, { start: now, count: 1 }); return; }
    old.count++; if (old.count > limit) throw Object.assign(new Error('Too many requests'), { status: 429 });
}
function bearer(req) { const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || ''); return m && m[1]; }
async function authUser(req) {
    if (!SUPABASE_READY) { if (LIVE) throw Object.assign(new Error('Authentication unavailable'), { status: 503 }); return null; }
    const token = bearer(req); if (!token) throw Object.assign(new Error('Sign in required'), { status: 401 });
    const r = await fetch(env.SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/user', { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token } });
    if (!r.ok) throw Object.assign(new Error('Invalid or expired session'), { status: 401 });
    return r.json();
}
async function db(table, query, options) {
    if (!SUPABASE_READY) throw Object.assign(new Error('Database is not configured'), { status: 503 });
    options = options || {};
    const url = env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + table + (query || '');
    const headers = Object.assign({ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }, options.headers || {});
    const r = await fetch(url, { method: options.method || 'GET', headers: headers, body: options.body == null ? undefined : JSON.stringify(options.body) });
    const text = await r.text(), value = text ? JSON.parse(text) : null;
    if (!r.ok) throw Object.assign(new Error(value && (value.message || value.hint) || 'Database request failed'), { status: 500 });
    return value;
}
async function sellerFor(userId) { const rows = await db('sellers', '?select=id,user_id,status&user_id=eq.' + encodeURIComponent(userId) + '&limit=1'); return rows[0] || null; }
async function paymentContext(req, body) {
    if (!body.groupId || !safeReturnUrl(body.returnUrl)) throw Object.assign(new Error('Invalid payment request'), { status: 400 });
    if (!SUPABASE_READY) {
        if (LIVE || !validAmount(body.amountNpr) || !Array.isArray(body.orderIds)) throw Object.assign(new Error('Database-backed order validation is required'), { status: 503 });
        return { groupId: body.groupId, amountNpr: body.amountNpr, orderIds: body.orderIds, buyer: body.buyer || {}, returnUrl: body.returnUrl, preview: true };
    }
    const user = await authUser(req);
    const rows = await db('orders', '?select=id,total,buyer_id,buyer,status&group_id=eq.' + encodeURIComponent(body.groupId));
    if (!rows.length || rows.some(function (o) { return o.buyer_id !== user.id || ['awaiting_payment','pending'].indexOf(o.status) < 0; })) throw Object.assign(new Error('Order group is unavailable'), { status: 403 });
    const amount = rows.reduce(function (sum, o) { return sum + o.total; }, 0);
    if (!validAmount(amount)) throw Object.assign(new Error('Invalid stored order total'), { status: 400 });
    return { groupId: body.groupId, amountNpr: amount, orderIds: rows.map(function (o) { return o.id; }), buyer: rows[0].buyer || {}, returnUrl: body.returnUrl, user: user };
}
async function saveAttempt(ctx, provider, ref, key, extra) {
    const row = { group_id: ctx.groupId, provider: provider, provider_reference: ref || null, amount_npr: ctx.amountNpr, status: 'pending', idempotency_key: key, raw_response: Object.assign({ returnUrl: ctx.returnUrl }, extra || {}) };
    if (!SUPABASE_READY) { pending.set(ref || ctx.groupId, row); return row; }
    const rows = await db('payment_attempts', '', { method: 'POST', headers: { Prefer: 'return=representation,resolution=ignore-duplicates' }, body: row });
    return rows && rows[0] || row;
}
async function updateAttempt(ref, status, raw) {
    if (!SUPABASE_READY) return;
    await db('payment_attempts', '?provider_reference=eq.' + encodeURIComponent(ref), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: status, raw_response: raw, updated_at: new Date().toISOString() } });
}
async function markOrdersPaid(attempt, reference) {
    if (!SUPABASE_READY || !attempt) return;
    await db('orders', '?group_id=eq.' + encodeURIComponent(attempt.group_id), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'paid', escrow: 'held', payment: { method: attempt.provider, status: 'paid', ref: reference }, } });
}
async function lookupAttempt(ref) {
    if (!SUPABASE_READY) return pending.get(ref) || null;
    const rows = await db('payment_attempts', '?select=*&provider_reference=eq.' + encodeURIComponent(ref) + '&limit=1'); return rows[0] || null;
}
function esewaSign(total, uuid) { return crypto.createHmac('sha256', ESEWA_SECRET).update('total_amount=' + total + ',transaction_uuid=' + uuid + ',product_code=' + ESEWA_CODE).digest('base64'); }

async function khaltiStart(ctx, key) {
    const r = await fetch(KHALTI_BASE + '/epayment/initiate/', { method: 'POST', headers: { Authorization: 'Key ' + env.KHALTI_SECRET_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ return_url: ctx.returnUrl, website_url: new URL(ctx.returnUrl).origin, amount: ctx.amountNpr * 100, purchase_order_id: ctx.groupId, purchase_order_name: 'KalaGhar order ' + ctx.orderIds.join(', '), customer_info: ctx.buyer }) });
    const value = await r.json(); if (!r.ok || !value.payment_url) throw Object.assign(new Error(value.detail || 'Khalti initiation failed'), { status: 502 });
    await saveAttempt(ctx, 'khalti', value.pidx, key, { paymentUrl: value.payment_url }); return { redirectUrl: value.payment_url };
}
async function khaltiVerify(body) {
    if (!body.pidx) return { paid: false }; const attempt = await lookupAttempt(body.pidx);
    const r = await fetch(KHALTI_BASE + '/epayment/lookup/', { method: 'POST', headers: { Authorization: 'Key ' + env.KHALTI_SECRET_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ pidx: body.pidx }) });
    const value = await r.json(), paid = r.ok && value.status === 'Completed' && !!attempt && attempt.amount_npr * 100 === value.total_amount;
    const ref = value.transaction_id || body.pidx; await updateAttempt(body.pidx, paid ? 'paid' : 'failed', value); if (paid) await markOrdersPaid(attempt, ref); return { paid: paid, ref: ref };
}
async function esewaStart(ctx, key) {
    const uuid = ctx.groupId + '-' + crypto.randomBytes(8).toString('hex'), total = String(ctx.amountNpr);
    await saveAttempt(ctx, 'esewa', uuid, key);
    const cb = PUBLIC_URL + '/api/pay/esewa/callback/' + encodeURIComponent(uuid);
    return { form: { action: ESEWA_FORM, fields: { amount: total, tax_amount: '0', total_amount: total, transaction_uuid: uuid, product_code: ESEWA_CODE, product_service_charge: '0', product_delivery_charge: '0', success_url: cb, failure_url: cb, signed_field_names: 'total_amount,transaction_uuid,product_code', signature: esewaSign(total, uuid) } } };
}
async function esewaVerify(body) {
    const attempt = await lookupAttempt(body.uuid); if (!attempt) return { paid: false };
    const url = ESEWA_STATUS + '?product_code=' + encodeURIComponent(ESEWA_CODE) + '&total_amount=' + attempt.amount_npr + '&transaction_uuid=' + encodeURIComponent(body.uuid);
    const value = await (await fetch(url)).json(), paid = value.status === 'COMPLETE', ref = value.ref_id || body.uuid; await updateAttempt(body.uuid, paid ? 'paid' : 'failed', value); if (paid) await markOrdersPaid(attempt, ref); return { paid: paid, ref: ref };
}
async function stripeStart(ctx, key) {
    const separator = ctx.returnUrl.indexOf('?') > -1 ? '&' : '?';
    const zeroDecimal = ['bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','vuv','xaf','xof','xpf'].indexOf(STRIPE_CURRENCY) > -1;
    const expectedMinor = Math.round(ctx.amountNpr * STRIPE_NPR_RATE * (zeroDecimal ? 1 : 100));
    if (expectedMinor < 1) throw Object.assign(new Error('Configured card exchange rate produces an invalid amount'), { status: 500 });
    const form = new URLSearchParams({ mode: 'payment', success_url: ctx.returnUrl + separator + 'session_id={CHECKOUT_SESSION_ID}', cancel_url: ctx.returnUrl + separator + 'cancelled=1', client_reference_id: ctx.groupId, customer_email: ctx.buyer.email || '', 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': STRIPE_CURRENCY, 'line_items[0][price_data][unit_amount]': String(expectedMinor), 'line_items[0][price_data][product_data][name]': 'KalaGhar order ' + ctx.orderIds.join(', ') });
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': key }, body: form });
    const value = await r.json(); if (!r.ok || !value.url) throw Object.assign(new Error(value.error && value.error.message || 'Stripe initiation failed'), { status: 502 });
    await saveAttempt(ctx, 'stripe', value.id, key, { checkoutUrl: value.url, currency: STRIPE_CURRENCY, expectedMinor: expectedMinor, rate: STRIPE_NPR_RATE }); return { redirectUrl: value.url };
}
async function stripeVerify(body) {
    if (!body.session_id) return { paid: false }; const attempt = await lookupAttempt(body.session_id);
    const value = await (await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(body.session_id), { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } })).json();
    const paid = value.payment_status === 'paid' && !!attempt && value.client_reference_id === attempt.group_id && value.currency === attempt.raw_response.currency && value.amount_total === attempt.raw_response.expectedMinor;
    const ref = value.payment_intent || value.id; await updateAttempt(body.session_id, paid ? 'paid' : 'failed', value); if (paid) await markOrdersPaid(attempt, ref); return { paid: paid, ref: ref };
}
const START = { khalti: khaltiStart, esewa: esewaStart, card: stripeStart }, VERIFY = { khalti: khaltiVerify, esewa: esewaVerify, card: stripeVerify };

async function listingAssistant(req, body) {
    checkRate(req, 'ai', 10); if (!env.OPENAI_API_KEY) throw Object.assign(new Error('AI listing assistant is not configured'), { status: 503 });
    let seller = null, user = null;
    if (SUPABASE_READY) { user = await authUser(req); seller = await sellerFor(user.id); if (!seller || seller.status === 'rejected') throw Object.assign(new Error('Seller account required'), { status: 403 }); }
    const input = ['Create an accurate ecommerce listing for a handmade Nepali product. Do not invent certifications, materials, origin, scarcity, medical claims, or cultural facts. Return concise JSON only.', JSON.stringify({ name: String(body.name || '').slice(0, 120), nameNe: String(body.nameNe || '').slice(0, 120), description: String(body.description || '').slice(0, 2000), descNe: String(body.descNe || '').slice(0, 2000), materials: String(body.materials || '').slice(0, 500), category: String(body.category || '').slice(0, 50), region: String(body.region || '').slice(0, 50), priceNpr: body.priceNpr || null })].join('\n');
    const schema = { type: 'object', additionalProperties: false, required: ['name','tagline','description','care','tags'], properties: { name: { type: 'string' }, tagline: { type: 'string' }, description: { type: 'string' }, care: { type: 'string' }, tags: { type: 'array', items: { type: 'string' }, maxItems: 12 } } };
    const r = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: 'Bearer ' + env.OPENAI_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: env.OPENAI_MODEL || 'gpt-6-astra', input: input, max_output_tokens: 900, text: { format: { type: 'json_schema', name: 'listing_suggestion', strict: true, schema: schema } } }) });
    const value = await r.json(); if (!r.ok) throw Object.assign(new Error(value.error && value.error.message || 'AI provider error'), { status: 502 });
    if (value.status !== 'completed') throw Object.assign(new Error('AI response was incomplete'), { status: 502 });
    let output = value.output_text, refusal = '';
    if (!output && value.output) value.output.some(function (item) { return (item.content || []).some(function (c) { if (c.refusal) { refusal = c.refusal; return true; } if (c.text) { output = c.text; return true; } return false; }); });
    if (refusal || !output) throw Object.assign(new Error(refusal ? 'The listing request was refused' : 'No listing suggestion was returned'), { status: 422 });
    const suggestion = JSON.parse(output);
    if (SUPABASE_READY && seller) await db('listing_assistant_runs', '', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { seller_id: seller.id, user_id: user.id, input_hash: crypto.createHash('sha256').update(input).digest('hex'), model: env.OPENAI_MODEL || 'gpt-6-astra', output: suggestion, status: 'succeeded' } });
    return { suggestion: suggestion, generated: true, requiresSellerReview: true };
}

function createApp() {
    return http.createServer(async function (req, res) {
        const origin = req.headers.origin, url = new URL(req.url, PUBLIC_URL);
        try {
            if (!allowedOrigin(origin)) return json(res, 403, { error: 'Origin not allowed' });
            if (req.method === 'OPTIONS') return json(res, 204, {}, origin);
            if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, mode: LIVE ? 'live' : 'test', database: SUPABASE_READY, ai: !!env.OPENAI_API_KEY }, origin);
            if (req.method === 'GET' && url.pathname === '/api/pay/methods') return json(res, 200, { methods: Object.keys(methods).filter(function (k) { return methods[k]; }), mode: LIVE ? 'live' : 'test', databaseValidated: SUPABASE_READY }, origin);
            let match = url.pathname.match(/^\/api\/pay\/esewa\/callback\/(.+)$/);
            if (req.method === 'GET' && match) { const uuid = decodeURIComponent(match[1]), attempt = await lookupAttempt(uuid), ret = attempt && attempt.raw_response && attempt.raw_response.returnUrl; if (!ret || !safeReturnUrl(ret)) return json(res, 400, { error: 'Unknown payment' }); res.writeHead(302, { Location: ret + (ret.indexOf('?') > -1 ? '&' : '?') + 'uuid=' + encodeURIComponent(uuid) }); return res.end(); }
            if (req.method === 'POST' && url.pathname === '/api/ai/listing-assistant') return json(res, 200, await listingAssistant(req, await readBody(req)), origin);
            match = url.pathname.match(/^\/api\/pay\/([a-z]+)\/(start|verify)$/);
            if (req.method === 'POST' && match) {
                checkRate(req, 'pay', 30); const method = match[1], action = match[2]; if (!methods[method] || !START[method]) throw Object.assign(new Error(method + ' is not configured'), { status: 400 });
                const body = await readBody(req);
                if (action === 'start') { const ctx = await paymentContext(req, body), key = String(req.headers['idempotency-key'] || body.idempotencyKey || ''); if (!/^[A-Za-z0-9._:-]{12,128}$/.test(key)) throw Object.assign(new Error('A valid Idempotency-Key is required'), { status: 400 }); return json(res, 200, await START[method](ctx, key), origin); }
                return json(res, 200, await VERIFY[method](body), origin);
            }
            return json(res, 404, { error: 'Not found' }, origin);
        } catch (error) { console.error(error); return json(res, error.status || 500, { error: error.status && error.status < 500 ? error.message : 'Request could not be completed' }, origin); }
    });
}

if (require.main === module) createApp().listen(PORT, function () { console.log('KalaGhar API on ' + PUBLIC_URL + ' (' + (LIVE ? 'LIVE' : 'test') + ')'); });
module.exports = { createApp: createApp, validAmount: validAmount, safeReturnUrl: safeReturnUrl, allowedOrigin: allowedOrigin };
