/* =====================================================================
   KALAGHAR GROWTH FEATURES — advanced discovery, followed shops,
   custom requests, loyalty and referrals.

   Browser storage is intentionally a preview adapter. The production data
   model and RLS policies live in db/migrations/001_marketplace_v2.sql.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;

    KG.marketFilters = { min: 0, max: 0, rating: 0, verified: false, personalizable: false, inStock: false, sort: 'featured' };

    function productForCard(card) { return KG.product(+card.dataset.productId); }
    function matches(p, card, q) {
        const f = KG.marketFilters, seller = KG.seller(p.sellerId), rating = KG.rating(p.id).avg;
        const category = typeof activeCategory === 'undefined' ? 'all' : activeCategory;
        return (category === 'all' || card.dataset.category === category) &&
            (!KG.activeRegion || card.dataset.region === KG.activeRegion) &&
            (!q || card.dataset.search.indexOf(q) > -1) &&
            (!f.min || p.price >= f.min) && (!f.max || p.price <= f.max) &&
            (!f.rating || rating >= f.rating) && (!f.verified || !!(seller && seller.verified)) &&
            (!f.personalizable || !!p.personalizable) && (!f.inStock || p.stock > 0);
    }
    function compare(a, b) {
        const f = KG.marketFilters.sort, ar = KG.rating(a.id), br = KG.rating(b.id);
        if (f === 'price-asc') return a.price - b.price;
        if (f === 'price-desc') return b.price - a.price;
        if (f === 'rating') return br.avg - ar.avg || br.count - ar.count;
        if (f === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || +b.id - +a.id;
        return Number(!!(b.promotedUntil && new Date(b.promotedUntil) > new Date())) - Number(!!(a.promotedUntil && new Date(a.promotedUntil) > new Date()));
    }
    KG.applyAdvancedFilters = function () {
        const grid = document.getElementById('productGrid'); if (!grid) return;
        const q = ((document.getElementById('searchInput') || {}).value || '').toLowerCase().trim();
        const cards = Array.from(grid.querySelectorAll('.product-card'));
        cards.sort(function (a, b) { return compare(productForCard(a), productForCard(b)); }).forEach(function (card) { grid.appendChild(card); });
        let shown = 0;
        cards.forEach(function (card) { const ok = matches(productForCard(card), card, q); card.style.display = ok ? '' : 'none'; if (ok) shown++; });
        const count = document.getElementById('kgResultCount'); if (count) count.textContent = shown + ' ' + KG.tx(shown === 1 ? 'item' : 'items', 'वस्तु');
        const note = document.getElementById('kgFilterNote');
        if (note) {
            const active = KG.marketFilters.min || KG.marketFilters.max || KG.marketFilters.rating || KG.marketFilters.verified || KG.marketFilters.personalizable || KG.marketFilters.inStock;
            if (active) { note.innerHTML = KG.tx('Advanced filters applied', 'उन्नत फिल्टर लागू') + ' · ' + shown + ' ' + KG.tx('items', 'वस्तु') + ' <button class="underline ml-2 font-semibold" onclick="KG.clearAdvancedFilters()">' + KG.tx('Clear', 'हटाउनुहोस्') + '</button>'; note.classList.remove('hidden'); }
        }
    };
    KG.clearAdvancedFilters = function () {
        KG.marketFilters = { min: 0, max: 0, rating: 0, verified: false, personalizable: false, inStock: false, sort: 'featured' };
        const form = document.getElementById('kgAdvancedFilters'); if (form) form.reset();
        KG.applyAdvancedFilters();
    };
    function installFilters() {
        const grid = document.getElementById('productGrid'); if (!grid || document.getElementById('kgAdvancedFilters')) return;
        grid.insertAdjacentHTML('beforebegin', '<form id="kgAdvancedFilters" class="mb-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3" aria-label="Product filters">' +
            '<div class="flex flex-wrap items-end gap-2"><div><label class="' + ui.label + '" for="kgMinPrice">' + KG.tx('Min NPR', 'न्यूनतम रु.') + '</label><input id="kgMinPrice" type="number" min="0" class="' + ui.input + ' !w-28 !py-1.5"></div>' +
            '<div><label class="' + ui.label + '" for="kgMaxPrice">' + KG.tx('Max NPR', 'अधिकतम रु.') + '</label><input id="kgMaxPrice" type="number" min="0" class="' + ui.input + ' !w-28 !py-1.5"></div>' +
            '<div><label class="' + ui.label + '" for="kgMinRating">' + KG.tx('Rating', 'मूल्याङ्कन') + '</label><select id="kgMinRating" class="' + ui.input + ' !w-32 !py-1.5"><option value="0">' + KG.tx('Any rating', 'सबै') + '</option><option value="4">4★ & up</option><option value="4.5">4.5★ & up</option></select></div>' +
            '<label class="kg-filter-check"><input id="kgVerifiedOnly" type="checkbox"> <span>' + KG.tx('Verified', 'प्रमाणित') + '</span></label><label class="kg-filter-check"><input id="kgCustomOnly" type="checkbox"> <span>' + KG.tx('Customizable', 'अनुकूलन') + '</span></label><label class="kg-filter-check"><input id="kgStockOnly" type="checkbox"> <span>' + KG.tx('In stock', 'स्टकमा') + '</span></label>' +
            '<div class="sm:ml-auto"><label class="' + ui.label + '" for="kgSort">' + KG.tx('Sort', 'क्रम') + '</label><select id="kgSort" class="' + ui.input + ' !w-40 !py-1.5"><option value="featured">' + KG.tx('Featured', 'विशेष') + '</option><option value="newest">' + KG.tx('Newest', 'नयाँ') + '</option><option value="rating">' + KG.tx('Top rated', 'उच्च मूल्याङ्कन') + '</option><option value="price-asc">' + KG.tx('Price: low to high', 'मूल्य: कमदेखि बढी') + '</option><option value="price-desc">' + KG.tx('Price: high to low', 'मूल्य: बढीदेखि कम') + '</option></select></div><strong id="kgResultCount" class="text-xs text-gray-500 pb-2"></strong></div></form>');
        const form = document.getElementById('kgAdvancedFilters');
        form.addEventListener('input', function () {
            KG.marketFilters = { min: +form.querySelector('#kgMinPrice').value || 0, max: +form.querySelector('#kgMaxPrice').value || 0, rating: +form.querySelector('#kgMinRating').value || 0, verified: form.querySelector('#kgVerifiedOnly').checked, personalizable: form.querySelector('#kgCustomOnly').checked, inStock: form.querySelector('#kgStockOnly').checked, sort: form.querySelector('#kgSort').value };
            KG.applyAdvancedFilters();
        });
    }

    KG.followedShops = function () { return KG.store.get('kg-followed-shops', []); };
    KG.isShopFollowed = function (id) { return KG.followedShops().indexOf(id) > -1; };
    KG.toggleShopFollow = function (id) {
        const list = KG.followedShops(), i = list.indexOf(id);
        if (i > -1) list.splice(i, 1); else list.push(id);
        KG.store.set('kg-followed-shops', list);
        KG.toast(i > -1 ? KG.tx('Shop removed from favorites', 'पसल मनपर्नेबाट हटाइयो') : KG.tx('Shop saved to favorites', 'पसल मनपर्नेमा राखियो'));
        KG.openShop(id);
    };
    KG.followShopButton = function (id) {
        const on = KG.isShopFollowed(id);
        return '<button class="' + ui.btn2 + ' !text-xs" onclick="KG.toggleShopFollow(\'' + esc(id) + '\')"><i class="fa-' + (on ? 'solid' : 'regular') + ' fa-heart mr-1 ' + (on ? 'text-red-600' : '') + '"></i>' + KG.tx(on ? 'Following' : 'Favorite shop', on ? 'मनपर्ने पसल' : 'पसल मनपराउनुहोस्') + '</button>';
    };

    KG.openCustomRequest = function (productId, sellerId) {
        if (!KG.user()) { KG.requireLogin(function () { KG.openCustomRequest(productId, sellerId); }); return; }
        const p = productId ? KG.product(productId) : null, s = KG.seller(sellerId || (p && p.sellerId));
        const body = KG.modal('kgCustomRequest', '<i class="fa-solid fa-wand-magic-sparkles text-red-700 mr-1"></i>' + KG.tx('Request a custom piece', 'अनुकूलित वस्तु अनुरोध'),
            '<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">' + KG.tx('Describe what you need. The artisan can reply with a price, timeline and revision notes before you accept.', 'आफूलाई चाहिएको वस्तु वर्णन गर्नुहोस्। शिल्पीले मूल्य र समयसहित जवाफ दिन सक्छन्।') + '</p><form class="space-y-3"><div class="grid sm:grid-cols-2 gap-3">' +
            '<div><label class="' + ui.label + '" for="cr-seller">' + KG.tx('Artisan', 'शिल्पी') + '</label><select id="cr-seller" required class="' + ui.input + '">' + KG.sellers().filter(function (x) { return x.status === 'approved'; }).map(function (x) { return '<option value="' + esc(x.id) + '"' + (s && x.id === s.id ? ' selected' : '') + '>' + esc(x.shopName) + '</option>'; }).join('') + '</select></div>' +
            '<div><label class="' + ui.label + '" for="cr-title">' + KG.tx('What would you like?', 'के चाहनुहुन्छ?') + '</label><input id="cr-title" required maxlength="100" class="' + ui.input + '" value="' + esc(p ? 'Custom ' + p.name : '') + '"></div>' +
            '<div><label class="' + ui.label + '" for="cr-budget">' + KG.tx('Budget (NPR)', 'बजेट (रु.)') + '</label><input id="cr-budget" type="number" min="500" required class="' + ui.input + '" value="' + (p ? p.price : '') + '"></div>' +
            '<div><label class="' + ui.label + '" for="cr-qty">' + KG.tx('Quantity', 'परिमाण') + '</label><input id="cr-qty" type="number" min="1" value="1" required class="' + ui.input + '"></div>' +
            '<div><label class="' + ui.label + '" for="cr-due">' + KG.tx('Needed by', 'चाहिने मिति') + '</label><input id="cr-due" type="date" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="cr-file">' + KG.tx('Reference image', 'सन्दर्भ फोटो') + '</label><input id="cr-file" type="file" accept="image/*" class="text-xs"></div></div>' +
            '<div><label class="' + ui.label + '" for="cr-details">' + KG.tx('Colours, size, materials and other details', 'रङ, आकार, सामग्री र विवरण') + '</label><textarea id="cr-details" minlength="20" maxlength="2000" rows="5" required class="' + ui.input + '"></textarea></div><button class="' + ui.btn + ' w-full">' + KG.tx('Send request', 'अनुरोध पठाउनुहोस्') + '</button></form>', 'lg');
        let reference = '';
        body.querySelector('#cr-file').addEventListener('change', function (e) { if (e.target.files[0]) KG.readImage(e.target.files[0], 900).then(function (x) { reference = x; }); });
        body.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault(); const u = KG.user();
            const request = KG.store.push('kg-custom-requests', { id: KG.uid('CR-'), buyerId: u.id, buyerName: u.name, sellerId: body.querySelector('#cr-seller').value, productId: p ? p.id : null, title: body.querySelector('#cr-title').value.trim(), details: body.querySelector('#cr-details').value.trim(), budget: +body.querySelector('#cr-budget').value, qty: +body.querySelector('#cr-qty').value, neededBy: body.querySelector('#cr-due').value || null, reference: reference, status: 'requested', quotes: [], createdAt: KG.now(), updatedAt: KG.now() });
            KG.closeModal('kgCustomRequest'); KG.toast(KG.tx('Request sent. The artisan will reply with a quote.', 'अनुरोध पठाइयो। शिल्पीले कोटेसन पठाउनेछन्।')); KG.openCustomRequestStatus(request.id);
        });
    };
    KG.openCustomRequestStatus = function (id) {
        const r = KG.store.get('kg-custom-requests', []).find(function (x) { return x.id === id; }); if (!r) return;
        const quotes = r.quotes || [], latest = quotes[quotes.length - 1];
        KG.modal('kgCustomStatus', esc(r.title), '<p class="text-xs text-gray-500">' + esc(r.id) + ' · ' + esc((KG.seller(r.sellerId) || {}).shopName || '') + ' · ' + esc(r.status) + '</p><p class="text-sm mt-3 whitespace-pre-line">' + esc(r.details) + '</p>' +
            (latest ? '<div class="mt-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4"><p class="font-bold">' + KG.tx('Artisan quote', 'शिल्पीको कोटेसन') + ': ' + KG.npr(latest.amount) + '</p><p class="text-sm mt-1">' + esc(latest.note) + '</p><p class="text-xs text-gray-500 mt-1">' + latest.days + ' ' + KG.tx('days', 'दिन') + '</p><p class="text-xs mt-3">' + KG.tx('Acceptance and payment become binding only after the secure shared backend and payment provider are enabled.', 'सुरक्षित साझा ब्याकएन्ड र भुक्तानी प्रदायक सक्रिय भएपछि मात्र स्वीकार र भुक्तानी बाध्यकारी हुन्छ।') + '</p></div>' : '<p class="text-sm text-gray-500 mt-4">' + KG.tx('Waiting for the artisan to quote.', 'शिल्पीको कोटेसन पर्खिँदै।') + '</p>'), 'md');
    };

    KG.loyalty = function () {
        const u = KG.user(); if (!u) return { earned: 0, spent: 0, balance: 0, code: '' };
        const completed = KG.myOrders().filter(function (o) { return o.status === 'completed'; }).reduce(function (sum, o) { return sum + Math.floor(o.total / 100); }, 0);
        const reviewBonus = KG.store.get('kg-reviews', []).filter(function (r) { return r.userId === u.id; }).length * 25;
        const referrals = KG.store.get('kg-referrals', []).filter(function (r) { return r.referrerId === u.id && r.status === 'qualified'; }).length * 250;
        const spent = KG.store.get('kg-loyalty-redemptions', []).filter(function (r) { return r.userId === u.id; }).reduce(function (sum, r) { return sum + r.points; }, 0);
        return { earned: completed + reviewBonus + referrals, spent: spent, balance: completed + reviewBonus + referrals - spent, code: 'KG' + u.id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase() };
    };
    KG.openRewards = function () {
        if (!KG.user()) { KG.requireLogin(KG.openRewards); return; }
        const l = KG.loyalty();
        const body = KG.modal('kgRewards', '<i class="fa-solid fa-seedling text-green-700 mr-1"></i>' + KG.tx('KalaGhar Rewards', 'KalaGhar पुरस्कार'),
            '<div class="grid grid-cols-3 gap-2 text-center"><div class="' + ui.card + ' p-3"><strong class="text-xl">' + l.balance + '</strong><small class="block text-gray-500">' + KG.tx('points', 'अंक') + '</small></div><div class="' + ui.card + ' p-3"><strong class="text-xl">' + l.earned + '</strong><small class="block text-gray-500">' + KG.tx('earned', 'कमाएको') + '</small></div><div class="' + ui.card + ' p-3"><strong class="text-xl">' + l.spent + '</strong><small class="block text-gray-500">' + KG.tx('redeemed', 'प्रयोग') + '</small></div></div>' +
            '<div class="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4"><p class="font-bold">' + KG.tx('Your referral code', 'तपाईंको रेफरल कोड') + '</p><div class="flex gap-2 mt-2"><code class="flex-1 bg-white dark:bg-gray-900 rounded p-2">' + esc(l.code) + '</code><button id="kgCopyReferral" class="' + ui.btn2 + ' !py-1.5">' + KG.tx('Copy', 'कपी') + '</button></div><p class="' + ui.muted + ' mt-2">' + KG.tx('You and your friend each earn 250 points after their first completed order. Fraud checks apply.', 'साथीको पहिलो अर्डर पूरा भएपछि दुवैले २५० अंक पाउनुहुन्छ।') + '</p></div>' +
            '<button id="kgRedeem" class="' + ui.btn + ' w-full mt-4"' + (l.balance < 500 ? ' disabled title="500 points required"' : '') + '>' + KG.tx('Redeem 500 points for NPR 250', '५०० अंकबाट रु. २५० लिनुहोस्') + '</button><p class="' + ui.muted + ' mt-2">' + KG.tx('In preview mode this creates a one-time local coupon. Production redemption is atomic in the database migration.', 'प्रिभ्यू मोडमा यसले एकपटक प्रयोग हुने स्थानीय कुपन बनाउँछ।') + '</p>', 'md');
        body.querySelector('#kgCopyReferral').addEventListener('click', function () { navigator.clipboard.writeText(l.code); KG.toast(KG.tx('Referral code copied', 'रेफरल कोड कपी भयो')); });
        body.querySelector('#kgRedeem').addEventListener('click', function () {
            if (l.balance < 500) return;
            const code = 'REWARD' + Date.now().toString(36).toUpperCase();
            KG.store.push('kg-loyalty-redemptions', { id: KG.uid('LR-'), userId: KG.user().id, points: 500, coupon: code, createdAt: KG.now() });
            KG.store.push('kg-coupons', { code: code, type: 'fixed', value: 250, minOrder: 1000, note: 'KalaGhar Rewards', active: true, once: true });
            KG.closeModal('kgRewards'); KG.toast(KG.tx('Reward ready. Coupon: ', 'पुरस्कार तयार। कुपन: ') + code);
        });
    };

    KG.initGrowth = function () {
        installFilters();
        const old = KG.applyFilters;
        KG.applyFilters = function () { if (old) old(); KG.applyAdvancedFilters(); };
        KG.applyAdvancedFilters();
    };
})();
