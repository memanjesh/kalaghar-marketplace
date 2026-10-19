/* =====================================================================
   KALAGHAR SHOPPING SIGNALS — #11 "Ships from" & "Near me" filter,
   #4 popularity badges (Bestseller, In N bags, Popular now, Only N left),
   #3 seller info on product cards. Everything switched from Admin.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const S = function (k) { return KG.setting('discovery.' + k); };
    const BADGES = ['bestseller', 'inCarts', 'popularNow', 'lowStock'];
    const BADGE_LABEL = { bestseller: 'Bestseller', inCarts: 'In N bags', popularNow: 'Popular now', lowStock: 'Only N left' };

    /* =================== #4 POPULARITY SIGNALS =================== */
    // Counts come from real orders and shopper activity (per browser until the shared database is connected).
    function stats() {
        const now = Date.now(), out = {};
        const get = function (id) { return out[id] || (out[id] = { sales30: 0, salesAll: 0, carts7: 0, views48: 0 }); };
        KG.store.get('kg-orders', []).forEach(function (o) {
            if (['cancelled', 'refunded', 'awaiting_payment'].indexOf(o.status) > -1) return;
            const recent = now - new Date(o.createdAt) < 30 * 864e5;
            (o.items || []).forEach(function (it) { const s = get(it.productId); s.salesAll += it.qty || 1; if (recent) s.sales30 += it.qty || 1; });
        });
        KG.store.get('kg-events', []).forEach(function (e) {
            if (e.t === 'cart' && now - e.at < 7 * 864e5) get(e.p).carts7++;
            if (e.t === 'view' && now - e.at < 48 * 36e5) get(e.p).views48++;
        });
        return out;
    }
    KG.productStats = stats;
    KG.popularityFor = function (p, st) {
        if (!p) return [];
        const s = (st || stats())[p.id] || { sales30: 0, carts7: 0, views48: 0 };
        const ov = (S('badgeOverrides') || {})[p.id] || { force: [], hide: [] };
        const on = function (k) { return S(k) && ov.hide.indexOf(k) === -1; };
        const forced = function (k) { return ov.force.indexOf(k) > -1; };
        const stock = KG.availableStock ? KG.availableStock(p, '') : p.stock;
        const out = [];
        if (on('bestseller') && (forced('bestseller') || s.sales30 >= S('bestsellerMinSales'))) out.push({ id: 'bestseller', icon: 'fa-award', text: KG.tx('Bestseller', 'बेस्टसेलर') });
        if (on('popularNow') && (forced('popularNow') || s.views48 >= S('popularViews'))) out.push({ id: 'popularNow', icon: 'fa-fire', text: KG.tx('Popular now', 'अहिले लोकप्रिय') });
        if (on('inCarts') && (forced('inCarts') || s.carts7 >= S('inCartsMin'))) { const n = Math.max(s.carts7, S('inCartsMin')); out.push({ id: 'inCarts', icon: 'fa-bag-shopping', text: n >= 20 ? KG.tx('In 20+ bags', '२०+ झोलामा') : KG.tx('In ' + n + ' bags', n + ' झोलामा') }); }
        if (on('lowStock') && stock > 0 && (stock <= S('lowStockMax') || (forced('lowStock') && stock < 10))) out.push({ id: 'lowStock', icon: 'fa-hourglass-half', text: stock === 1 ? KG.tx('Only 1 left', 'केवल १ बाँकी') : KG.tx('Only ' + stock + ' left', 'केवल ' + stock + ' बाँकी') });
        return out;
    };
    function signalHtml(list) { return list.map(function (b) { return '<span class="kg-signal kg-signal-' + b.id + '"><i class="fa-solid ' + b.icon + '"></i>' + esc(b.text) + '</span>'; }).join(''); }

    /* =================== #3 SELLER INFO ON CARDS =================== */
    function sellerFacts(sellerId, st) {
        const s = KG.seller(sellerId); if (!s) return null;
        const prods = KG.products().filter(function (p) { return p.sellerId === sellerId; });
        let sum = 0, n = 0, sales = 0;
        prods.forEach(function (p) { const r = KG.rating(p.id); sum += r.avg * r.count; n += r.count; sales += ((st[p.id] || {}).salesAll || 0); });
        const year = s.since ? +s.since : s.createdAt ? new Date(s.createdAt).getFullYear() : null;
        return { s: s, rating: n ? sum / n : 0, reviews: n, sales: sales + (+s.salesOffset || 0), year: year };
    }
    KG.sellerFacts = function (id) { return sellerFacts(id, stats()); };
    function sellerLine(p, st, cache) {
        if (!S('sellerOnCards')) return '';
        const f = cache[p.sellerId] || (cache[p.sellerId] = sellerFacts(p.sellerId, st)); if (!f) return '';
        const bits = [];
        if (S('cardRating') && f.reviews) bits.push('<span><i class="fa-solid fa-star text-amber-500"></i> ' + f.rating.toFixed(1) + '</span>');
        if (S('cardSales') && f.sales) bits.push('<span>' + f.sales.toLocaleString() + ' ' + KG.tx(f.sales === 1 ? 'sale' : 'sales', 'बिक्री') + '</span>');
        if (S('cardSince') && f.year) bits.push('<span>' + KG.tx('Since ', '') + f.year + KG.tx('', ' देखि') + '</span>');
        return '<p class="kg-card-seller">' + (S('cardShopName') ? '<button type="button" onclick="event.stopPropagation();KG.openShop(\'' + esc(p.sellerId) + '\')" title="' + KG.tx('Visit shop', 'पसल हेर्नुहोस्') + '">' + (f.s.verified ? '<i class="fa-solid fa-circle-check text-green-700 mr-0.5"></i>' : '') + esc(f.s.shopName) + '</button>' : '') + bits.join('<span aria-hidden="true">·</span>') + '</p>';
    }
    function decorateCards() {
        const st = stats(), cache = {};
        document.querySelectorAll('#productGrid .product-card').forEach(function (card) {
            const p = KG.product(+card.dataset.productId); if (!p) return;
            card.querySelectorAll('.kg-card-seller,.kg-signals').forEach(function (x) { x.remove(); });
            const title = card.querySelector('h3'); if (!title) return;
            const line = sellerLine(p, st, cache);
            if (line) title.insertAdjacentHTML('afterend', line);
            const sig = KG.popularityFor(p, st);
            if (sig.length) { const priceRow = card.querySelector('.mt-auto'); (priceRow || title).insertAdjacentHTML('beforebegin', '<div class="kg-signals">' + signalHtml(sig) + '</div>'); }
        });
    }
    function decorateProduct(id) {
        const m = document.getElementById('kgProduct'), p = KG.product(id); if (!m || !p) return;
        const sig = KG.popularityFor(p); if (!sig.length || m.querySelector('.kg-signals')) return;
        const anchor = m.querySelector('#kgQty') && m.querySelector('#kgQty').parentNode; if (!anchor) return;
        anchor.insertAdjacentHTML('beforebegin', '<div class="kg-signals mb-3">' + signalHtml(sig) + '</div>');
    }

    /* =================== #11 SHIPS FROM / NEAR ME =================== */
    let shipsFrom = '', near = null;   // near = { lat, lon }
    function distKm(a, b) {
        const R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
        const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R * Math.asin(Math.sqrt(h));
    }
    function regionOf(p) { const id = p.region || (KG.seller(p.sellerId) || {}).region; return KG.REGIONS.find(function (r) { return r.id === id; }); }
    KG.nearestRegion = function (pos) { return KG.REGIONS.slice().sort(function (a, b) { return distKm(pos, a) - distKm(pos, b); })[0]; };
    function installShipsFrom() {
        const form = document.getElementById('kgAdvancedFilters'); if (!form) return;
        let box = form.querySelector('#kgShipsFromBox');
        const want = S('shipsFromFilter') || S('nearMe');
        if (!want) { if (box) box.remove(); shipsFrom = ''; near = null; return; }
        if (!box) {
            const row = form.querySelector('.flex'); if (!row) return;
            box = document.createElement('div'); box.id = 'kgShipsFromBox'; box.className = 'flex items-end gap-2';
            const sortBox = form.querySelector('#kgSort') && form.querySelector('#kgSort').parentNode;
            row.insertBefore(box, sortBox || null);
        }
        box.innerHTML = (S('shipsFromFilter') ? '<div><label class="' + ui.label + '" for="kgShipsFrom">' + KG.tx('Ships from', 'यहाँबाट पठाइन्छ') + '</label><select id="kgShipsFrom" class="' + ui.input + ' !w-40 !py-1.5"><option value="">' + KG.tx('Anywhere in Nepal', 'नेपालभर') + '</option>' + KG.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (r.id === shipsFrom ? ' selected' : '') + '>' + esc(KG.tx(r.en, r.ne)) + '</option>'; }).join('') + '</select></div>' : '') +
            (S('nearMe') ? '<button type="button" id="kgNearMe" class="kg-filter-check' + (near ? ' kg-near-on' : '') + '" aria-pressed="' + (near ? 'true' : 'false') + '"><i class="fa-solid fa-location-crosshairs"></i> <span>' + (near ? KG.tx('Nearest first', 'नजिकको पहिले') : KG.tx('Near me', 'मेरो नजिक')) + '</span></button>' : '');
        const sel = box.querySelector('#kgShipsFrom');
        if (sel) sel.addEventListener('change', function () { shipsFrom = sel.value; KG.applyAdvancedFilters(); });
        const nb = box.querySelector('#kgNearMe');
        if (nb) nb.addEventListener('click', function () {
            if (near) { near = null; installShipsFrom(); KG.applyAdvancedFilters(); return; }
            const done = function (pos) { near = pos; installShipsFrom(); KG.applyAdvancedFilters(); const r = KG.nearestRegion(pos); KG.toast(KG.tx('Showing makers nearest you first (closest: ' + r.en + ')', 'नजिकका शिल्पी पहिले देखाइँदै (' + r.ne + ')')); };
            if (!navigator.geolocation) return KG.toast(KG.tx('Location isn\'t available in this browser — pick a region instead.', 'स्थान उपलब्ध छैन — क्षेत्र छान्नुहोस्।'), 'warn');
            navigator.geolocation.getCurrentPosition(function (g) { done({ lat: g.coords.latitude, lon: g.coords.longitude }); },
                function () { KG.toast(KG.tx('We couldn\'t get your location — pick a region from "Ships from" instead.', 'स्थान पाइएन — "यहाँबाट पठाइन्छ" बाट छान्नुहोस्।'), 'warn'); }, { timeout: 8000, maximumAge: 6e5 });
        });
    }
    function hookFilters() {
        const apply = KG.applyAdvancedFilters;
        KG.applyAdvancedFilters = function () {
            apply.apply(this, arguments);
            const grid = document.getElementById('productGrid'); if (!grid) return;
            const cards = Array.from(grid.querySelectorAll('.product-card'));
            if (near && S('nearMe')) {
                const d = function (c) { const r = regionOf(KG.product(+c.dataset.productId) || {}); return r ? distKm(near, r) : 1e9; };
                cards.slice().sort(function (a, b) { return d(a) - d(b); }).forEach(function (c) { grid.appendChild(c); });
            }
            let shown = 0;
            cards.forEach(function (c) {
                if (shipsFrom && S('shipsFromFilter') && c.style.display !== 'none') { const r = regionOf(KG.product(+c.dataset.productId) || {}); if (!r || r.id !== shipsFrom) c.style.display = 'none'; }
                if (c.style.display !== 'none') shown++;
            });
            const count = document.getElementById('kgResultCount'); if (count) count.textContent = shown + ' ' + KG.tx(shown === 1 ? 'item' : 'items', 'वस्तु');
        };
        const clear = KG.clearAdvancedFilters;
        KG.clearAdvancedFilters = function () { shipsFrom = ''; near = null; installShipsFrom(); return clear.apply(this, arguments); };
    }

    /* =================== ADMIN =================== */
    function renderSignalsAdmin(el, query) {
        const A = KG.adminField, d = KG.setting('discovery'), st = stats();
        query = query || '';
        const prods = KG.products().filter(function (p) { return !query || p.name.toLowerCase().indexOf(query.toLowerCase()) > -1; });
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Shopping signals</h3><p class="' + ui.muted + ' mb-4">Etsy-style badges, seller details on cards and the "Ships from / Near me" filter. Badges are calculated from real orders, bag-adds and views. Until the shared database is connected those counts come from activity in each visitor\'s own browser, so use <strong>Force</strong> below to show a badge you know is true.</p>' +
            '<form id="sg-form" class="grid lg:grid-cols-3 gap-4"><div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Popularity badges</p>' +
                A.toggle('bestseller', 'Bestseller', d.bestseller) + A.text('bestsellerMinSales', 'Sold at least … in 30 days', d.bestsellerMinSales, 'type="number" min="1" max="1000"') +
                A.toggle('inCarts', '"In N bags"', d.inCarts) + A.text('inCartsMin', 'Added to bags at least … times in 7 days', d.inCartsMin, 'type="number" min="1" max="1000"') + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">&nbsp;</p>' + A.toggle('popularNow', '"Popular now"', d.popularNow) + A.text('popularViews', 'Viewed at least … times in 48 hours', d.popularViews, 'type="number" min="1" max="10000"') +
                A.toggle('lowStock', '"Only N left"', d.lowStock) + A.text('lowStockMax', 'Show when stock is … or fewer', d.lowStockMax, 'type="number" min="1" max="20"') + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Seller info on product cards</p>' + A.toggle('sellerOnCards', 'Show seller line', d.sellerOnCards) + A.toggle('cardShopName', 'Shop name (opens the shop)', d.cardShopName) + A.toggle('cardRating', 'Shop rating', d.cardRating) + A.toggle('cardSales', 'Number of sales', d.cardSales) + A.toggle('cardSince', '"Since 2026" (year the shop joined)', d.cardSince) +
                    '<p class="font-bold text-sm pt-2 border-t border-gray-100 dark:border-gray-800">Filters</p>' + A.toggle('shipsFromFilter', '"Ships from" region filter', d.shipsFromFilter) + A.toggle('nearMe', '"Near me" (uses the shopper\'s location, with permission)', d.nearMe) + '</div></form>' +
            '<div class="flex flex-wrap items-end gap-3 mt-6 mb-2"><h4 class="font-bold">Badges by product</h4><input id="sg-q" type="search" value="' + esc(query) + '" placeholder="Search products" class="' + ui.input + ' !w-56 !py-1.5 ml-auto" aria-label="Search products"></div>' +
            '<div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-xs min-w-[860px]"><thead><tr class="text-left text-gray-500"><th class="p-3">Product</th><th>Sold 30d</th><th>Bags 7d</th><th>Views 48d</th><th>Stock</th><th>Showing now</th>' + BADGES.map(function (b) { return '<th class="text-center">' + BADGE_LABEL[b] + '</th>'; }).join('') + '</tr></thead><tbody>' +
            prods.map(function (p) {
                const s = st[p.id] || { sales30: 0, carts7: 0, views48: 0 }, ov = (d.badgeOverrides || {})[p.id] || { force: [], hide: [] };
                const now = KG.popularityFor(p, st).map(function (b) { return b.text; }).join(', ') || '—';
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3 font-semibold">' + esc(p.name) + '</td><td>' + s.sales30 + '</td><td>' + s.carts7 + '</td><td>' + s.views48 + '</td><td>' + (KG.availableStock ? KG.availableStock(p, '') : p.stock) + '</td><td class="text-gray-600 dark:text-gray-400">' + esc(now) + '</td>' +
                    BADGES.map(function (b) { const v = ov.force.indexOf(b) > -1 ? 'force' : ov.hide.indexOf(b) > -1 ? 'hide' : ''; return '<td class="text-center"><select data-ov="' + p.id + '" data-badge="' + b + '" class="' + ui.input + ' !w-24 !py-0.5 !text-xs" aria-label="' + BADGE_LABEL[b] + ' for ' + esc(p.name) + '"><option value="">Auto</option><option value="force"' + (v === 'force' ? ' selected' : '') + '>Force</option><option value="hide"' + (v === 'hide' ? ' selected' : '') + '>Hide</option></select></td>'; }).join('') + '</tr>';
            }).join('') + '</tbody></table></div><p class="' + ui.muted + ' mt-2">"Only N left" is never forced on sold-out items, and always uses the real stock number.</p>' +
            '<h4 class="font-bold mt-6 mb-2">Shop details shown on cards</h4><div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-sm min-w-[560px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3">Shop</th><th>Rating</th><th>Sales counted</th><th>Earlier sales (before KalaGhar)</th><th>On KalaGhar since</th></tr></thead><tbody>' +
            KG.sellers().map(function (s) {
                const f = sellerFacts(s.id, st) || {};
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3">' + esc(s.shopName) + '</td><td>' + (f.reviews ? f.rating.toFixed(1) + ' (' + f.reviews + ')' : '—') + '</td><td>' + (f.sales || 0) + '</td><td><input data-soff="' + esc(s.id) + '" type="number" min="0" value="' + (+s.salesOffset || 0) + '" class="' + ui.input + ' !w-24 !py-1"></td><td><input data-since="' + esc(s.id) + '" type="number" min="1990" max="2100" placeholder="' + (s.createdAt ? new Date(s.createdAt).getFullYear() : '') + '" value="' + esc(s.since || '') + '" class="' + ui.input + ' !w-24 !py-1"></td></tr>';
            }).join('') + '</tbody></table></div><p class="' + ui.muted + ' mt-2">Only add earlier sales you can evidence (e.g. a seller\'s previous Etsy or Daraz shop) — buyers rely on these numbers.</p>';
        KG.bindSettingsForm(el.querySelector('#sg-form'), 'discovery', function () { renderSignalsAdmin(el, query); });
        el.querySelectorAll('[data-ov]').forEach(function (sel) {
            sel.addEventListener('change', function () {
                const id = sel.dataset.ov, b = sel.dataset.badge;
                KG.updateSettings(function (s) {
                    const map = s.discovery.badgeOverrides || (s.discovery.badgeOverrides = {});
                    const o = map[id] || { force: [], hide: [] };
                    o.force = o.force.filter(function (x) { return x !== b; }); o.hide = o.hide.filter(function (x) { return x !== b; });
                    if (sel.value) o[sel.value].push(b);
                    if (o.force.length || o.hide.length) map[id] = o; else delete map[id];
                });
                renderSignalsAdmin(el, query);
            });
        });
        const q = el.querySelector('#sg-q'); let t;
        q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { renderSignalsAdmin(el, q.value); const n = el.querySelector('#sg-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
        el.querySelectorAll('[data-soff],[data-since]').forEach(function (i) {
            i.addEventListener('change', function () {
                const s = KG.seller(i.dataset.soff || i.dataset.since); if (!s) return;
                if (i.dataset.soff) s.salesOffset = Math.max(0, Math.round(+i.value || 0));
                else { const y = Math.round(+i.value); if (y >= 1990 && y <= 2100) s.since = y; else delete s.since; }
                KG.saveSeller(s); if (window.renderProducts) window.renderProducts(); renderSignalsAdmin(el, query);
            });
        });
    }

    KG.addAdminTab('shopping-signals', 'Badges & filters', renderSignalsAdmin);
    KG.initSignals = function () {
        hookFilters();
        const render = window.renderProducts;
        window.renderProducts = function () { render.apply(this, arguments); decorateCards(); };
        const op = KG.openProduct;
        KG.openProduct = function (id) { const r = op.apply(this, arguments); decorateProduct(id); return r; };
        installShipsFrom(); decorateCards();
        KG.onSettings(function () { installShipsFrom(); if (window.renderProducts) window.renderProducts(); });
    };
})();
