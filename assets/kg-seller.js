/* =====================================================================
   KALAGHAR SELLER DASHBOARD — listings (with Nepali voice input),
   orders & shipping, messages, earnings & cooperative splits,
   analytics, promoted listings, coupons, shop profile & certificates
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, C = KG.C, esc = KG.esc, ui = KG.ui;

    KG.openSellerDashboard = function (tab) {
        const u = KG.user();
        if (!u) { KG.requireLogin(function () { KG.openSellerDashboard(tab); }); return; }
        let s = KG.mySeller();
        if (!s) {
            const body = KG.modal('kgSeller', '<i class="fa-solid fa-store text-red-700 mr-1"></i>' + t('fSellerDash'),
                '<div class="text-center py-6"><p class="text-sm text-gray-700 dark:text-gray-300">' + KG.tx('Your account isn\'t set up as a seller yet.', 'तपाईंको खाता अझै विक्रेताको रूपमा छैन।') + '</p><button id="kgBecome" class="' + ui.btn + ' mt-4">' + KG.tx('Open my shop', 'मेरो पसल खोल्नुहोस्') + '</button></div>');
            body.querySelector('#kgBecome').addEventListener('click', function () {
                const users = KG.store.get('kg-users', []); const x = users.find(function (z) { return z.id === u.id; }); x.role = 'seller'; KG.store.set('kg-users', users);
                const existing = KG.sellers().find(function (z) { return z.email === u.email; });
                if (existing) { existing.userId = u.id; KG.saveSeller(existing); }
                else KG.saveSeller({ id: KG.uid('s-'), userId: u.id, shopName: u.name + "'s Shop", owner: u.name, email: u.email, region: 'kathmandu', craft: 'homedecor', type: 'individual', verified: false, status: 'pending', story: '', members: [], createdAt: KG.now() });
                KG.openSellerDashboard('profile');
            });
            return;
        }
        tab = tab || 'overview';
        const orders = sellerOrders(s.id);
        const threads = KG.threads().filter(function (th) { return th.sellerId === s.id; });
        const unread = threads.filter(function (th) { return th.unreadSeller; }).length;
        const toShip = orders.filter(function (o) { return o.status === 'paid'; }).length;
        const tabs = [
            ['overview', 'fa-chart-line', KG.tx('Overview', 'सारांश')],
            ['listings', 'fa-box-open', KG.tx('Listings', 'सूची')],
            ['orders', 'fa-truck-fast', KG.tx('Orders', 'अर्डर') + (toShip ? ' (' + toShip + ')' : '')],
            ['custom', 'fa-wand-magic-sparkles', KG.tx('Custom requests', 'अनुकूलित अनुरोध')],
            ['messages', 'fa-comments', KG.tx('Messages', 'सन्देश') + (unread ? ' (' + unread + ')' : '')],
            ['earnings', 'fa-wallet', KG.tx('Earnings', 'आम्दानी')],
            ['marketing', 'fa-bullhorn', KG.tx('Promote & coupons', 'प्रचार र कुपन')],
            ['profile', 'fa-id-card', KG.tx('Shop profile', 'पसल प्रोफाइल')]
        ].concat(KG.extraSellerTabs ? KG.extraSellerTabs(s) : []);
        const body = KG.modal('kgSeller', '<i class="fa-solid fa-store text-red-700 mr-1"></i>' + esc(s.shopName) + ' <span class="text-xs font-normal text-gray-500">· ' + t('fSellerDash') + '</span>',
            (s.status !== 'approved' ? '<div class="mb-4 text-xs bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-lg p-3"><i class="fa-solid fa-hourglass-half mr-1"></i>' + KG.tx('Your shop is awaiting verification. You can add listings now — they\'ll show the "Verified Artisan" badge once our team approves you.', 'तपाईंको पसल प्रमाणीकरणको प्रतीक्षामा छ। अहिले नै सूची थप्न सक्नुहुन्छ।') + '</div>' : '') +
            '<div class="flex flex-wrap gap-1.5 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">' + tabs.map(function (x) {
                return '<button class="text-xs font-semibold px-3 py-1.5 rounded-full ' + (x[0] === tab ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700') + '" onclick="KG.openSellerDashboard(\'' + x[0] + '\')"><i class="fa-solid ' + x[1] + ' mr-1"></i>' + x[2] + '</button>';
            }).join('') + '<button class="text-xs text-gray-500 hover:text-red-700 ml-auto" onclick="KG.closeModal(\'kgSeller\');KG.openShop(\'' + esc(s.id) + '\')"><i class="fa-solid fa-eye mr-1"></i>' + KG.tx('View my shop', 'मेरो पसल हेर्नुहोस्') + '</button></div>' +
            '<div id="kgSellerBody"></div>', 'full');
        const box = body.querySelector('#kgSellerBody');
        (Object.assign({ overview: overview, listings: listings, orders: ordersTab, custom: customRequests, messages: messagesTab, earnings: earnings, marketing: marketing, profile: profile }, KG.extraSellerRenderers || {})[tab] || overview)(box, s);
    };

    function sellerOrders(sid) { return KG.store.get('kg-orders', []).filter(function (o) { return o.sellerId === sid; }).reverse(); }
    function myProducts(sid) { return window.loadProducts().filter(function (p) { return p.sellerId === sid; }); }
    const stat = function (v, l, icon) { return '<div class="' + ui.card + ' p-4"><p class="' + ui.muted + '"><i class="fa-solid ' + icon + ' mr-1"></i>' + l + '</p><p class="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">' + v + '</p></div>'; };

    /* ---------------------------- overview / analytics ---------------------------- */
    function overview(box, s) {
        const ids = myProducts(s.id).map(function (p) { return p.id; });
        const since = Date.now() - 30 * 864e5;
        const ev = KG.store.get('kg-events', []).filter(function (e) { return ids.indexOf(e.p) > -1 && e.at >= since; });
        const count = function (type) { return ev.filter(function (e) { return e.t === type; }).length; };
        const orders = sellerOrders(s.id).filter(function (o) { return new Date(o.createdAt) >= since && ['cancelled', 'refunded'].indexOf(o.status) === -1; });
        const revenue = orders.reduce(function (a, o) { return a + o.goods - o.discount; }, 0);
        const views = count('view'), carts = count('cart'), buys = orders.length;
        const days = []; for (let i = 13; i >= 0; i--) days.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
        const perDay = days.map(function (d) { return { d: d, v: ev.filter(function (e) { return e.t === 'view' && new Date(e.at).toISOString().slice(0, 10) === d; }).length, s: orders.filter(function (o) { return o.createdAt.slice(0, 10) === d; }).length }; });
        const maxV = Math.max.apply(null, perDay.map(function (x) { return x.v; }).concat([1]));
        const top = ids.map(function (id) { return { p: KG.product(id), v: ev.filter(function (e) { return e.p === id && e.t === 'view'; }).length, f: ev.filter(function (e) { return e.p === id && e.t === 'fav'; }).length, c: ev.filter(function (e) { return e.p === id && e.t === 'cart'; }).length }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
        box.innerHTML = '<p class="' + ui.muted + ' mb-3">' + KG.tx('Last 30 days', 'पछिल्लो ३० दिन') + '</p>' +
            '<div class="grid grid-cols-2 lg:grid-cols-5 gap-3">' + stat(views, KG.tx('Views', 'हेराइ'), 'fa-eye') + stat(count('fav'), KG.tx('Favorites', 'मनपर्ने'), 'fa-heart') + stat(carts, KG.tx('Added to bag', 'झोलामा'), 'fa-bag-shopping') + stat(buys, KG.tx('Orders', 'अर्डर'), 'fa-receipt') + stat(KG.npr(revenue), KG.tx('Sales', 'बिक्री'), 'fa-sack-dollar') + '</div>' +
            '<div class="grid lg:grid-cols-2 gap-4 mt-4">' +
                '<div class="' + ui.card + ' p-4"><p class="text-sm font-bold mb-3">' + KG.tx('Shop views — last 14 days', 'पसल हेराइ — १४ दिन') + '</p><div class="flex items-end gap-1 h-32" role="img" aria-label="Daily views chart">' + perDay.map(function (x) {
                    return '<div class="flex-1 flex flex-col items-center justify-end h-full" title="' + x.d + ': ' + x.v + ' views, ' + x.s + ' orders"><div class="w-full bg-red-700/80 rounded-t" style="height:' + Math.max(2, x.v / maxV * 100) + '%"></div>' + (x.s ? '<div class="w-1.5 h-1.5 rounded-full bg-green-600 mt-0.5"></div>' : '<div class="h-2"></div>') + '</div>';
                }).join('') + '</div><p class="' + ui.muted + ' mt-2"><span class="inline-block w-2 h-2 bg-red-700/80 mr-1"></span>' + KG.tx('views', 'हेराइ') + ' <span class="inline-block w-2 h-2 rounded-full bg-green-600 ml-3 mr-1"></span>' + KG.tx('day with an order', 'अर्डर भएको दिन') + '</p></div>' +
                '<div class="' + ui.card + ' p-4"><p class="text-sm font-bold mb-3">' + KG.tx('Funnel', 'खरिद यात्रा') + '</p>' + funnel([[KG.tx('Viewed', 'हेरियो'), views], [KG.tx('Added to bag', 'झोलामा'), carts], [KG.tx('Ordered', 'अर्डर'), buys]]) +
                    '<p class="' + ui.muted + ' mt-3">' + KG.tx('Bags left without buying: ', 'नकिनी छोडिएका झोला: ') + '<strong>' + Math.max(0, carts - buys) + '</strong>' + KG.tx(' — shoppers get a gentle reminder when they return.', ' — फर्कँदा खरिदकर्तालाई सम्झाइन्छ।') + '</p></div>' +
            '</div>' +
            '<div class="' + ui.card + ' p-4 mt-4 overflow-x-auto"><p class="text-sm font-bold mb-2">' + KG.tx('Top listings', 'शीर्ष सूची') + '</p><table class="w-full text-sm min-w-[480px]"><thead><tr class="text-left text-xs text-gray-500"><th class="py-1">' + KG.tx('Item', 'वस्तु') + '</th><th>' + KG.tx('Views', 'हेराइ') + '</th><th>' + KG.tx('Favorites', 'मनपर्ने') + '</th><th>' + KG.tx('In bags', 'झोलामा') + '</th><th>' + KG.tx('Rating', 'मूल्याङ्कन') + '</th></tr></thead><tbody>' + top.map(function (x) {
                const r = KG.rating(x.p.id);
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="py-2">' + esc(x.p.name) + '</td><td>' + x.v + '</td><td>' + x.f + '</td><td>' + x.c + '</td><td>' + (r.count ? r.avg.toFixed(1) + ' ★ (' + r.count + ')' : '—') + '</td></tr>';
            }).join('') + '</tbody></table></div>' +
            starProgress(s);
    }
    function funnel(steps) {
        const max = Math.max(steps[0][1], 1);
        return steps.map(function (st, i) { return '<div class="mb-2"><div class="flex justify-between text-xs"><span>' + st[0] + '</span><span>' + st[1] + (i ? ' (' + (steps[0][1] ? Math.round(st[1] / steps[0][1] * 100) : 0) + '%)' : '') + '</span></div><div class="h-2.5 bg-gray-100 dark:bg-gray-800 rounded mt-1"><div class="h-2.5 bg-red-700 rounded" style="width:' + (st[1] / max * 100) + '%"></div></div></div>'; }).join('');
    }
    function starProgress(s) {
        const done = sellerOrders(s.id).filter(function (o) { return o.status === 'completed' || o.status === 'delivered'; }).length;
        const ids = myProducts(s.id).map(function (p) { return p.id; });
        const rv = KG.store.get('kg-reviews', []).filter(function (r) { return ids.indexOf(r.productId) > -1; });
        const avg = rv.length ? rv.reduce(function (a, r) { return a + r.rating; }, 0) / rv.length : 0;
        const ok = function (b) { return b ? '<i class="fa-solid fa-circle-check text-green-600 mr-1"></i>' : '<i class="fa-regular fa-circle text-gray-400 mr-1"></i>'; };
        return '<div class="' + ui.card + ' p-4 mt-4"><p class="text-sm font-bold"><i class="fa-solid fa-star text-amber-500 mr-1"></i>' + KG.tx('Star Artisan progress', 'स्टार शिल्पी प्रगति') + (KG.isStarSeller(s.id) ? ' — <span class="text-green-700">' + KG.tx('Earned!', 'प्राप्त!') + '</span>' : '') + '</p><ul class="text-xs text-gray-700 dark:text-gray-300 mt-2 space-y-1">' +
            '<li>' + ok(done >= 5) + KG.tx('5+ completed orders', '५+ पूरा अर्डर') + ' (' + done + ')</li><li>' + ok(rv.length && avg >= 4.5) + KG.tx('Average rating 4.5+', 'औसत ४.५+') + ' (' + (rv.length ? avg.toFixed(1) : '—') + ')</li><li>' + ok(true) + KG.tx('Ship every order within 3 days', '३ दिनभित्र पठाउने') + '</li><li>' + ok(true) + KG.tx('Reply to messages within 24 hours', '२४ घण्टाभित्र जवाफ') + '</li></ul></div>';
    }

    /* ---------------------------- listings ---------------------------- */
    function listings(box, s) {
        const prods = myProducts(s.id);
        box.innerHTML = '<div class="flex flex-wrap gap-2 mb-4"><button class="' + ui.btn + '" onclick="KG.editListing(null)"><i class="fa-solid fa-plus mr-1"></i>' + KG.tx('Add a listing', 'नयाँ सूची') + '</button><button class="' + ui.btn2 + '" onclick="KG.editListing(null, true)"><i class="fa-solid fa-microphone mr-1"></i>' + KG.tx('List by speaking Nepali', 'नेपालीमा बोलेर सूची') + '</button></div>' +
            (prods.length ? '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">' + prods.map(function (p) {
                const promoted = p.promotedUntil && new Date(p.promotedUntil) > new Date();
                return '<div class="' + ui.card + ' p-3 flex gap-3"><img src="' + esc(p.image) + '" alt="" class="w-20 h-20 rounded-lg object-cover"><div class="flex-1 min-w-0"><p class="text-sm font-semibold truncate">' + esc(p.name) + '</p><p class="text-xs text-red-700 dark:text-red-400 font-bold">' + KG.npr(p.price) + '</p><p class="' + ui.muted + '">' + KG.tx('Stock', 'स्टक') + ': ' + p.stock + (p.active === false ? ' · <span class="text-amber-700">' + KG.tx('Hidden', 'लुकाइएको') + '</span>' : '') + (promoted ? ' · <span class="text-blue-700">' + KG.tx('Promoted', 'प्रचारमा') + '</span>' : '') + (p.needsTranslation ? ' · <span class="text-amber-700">' + KG.tx('Awaiting English', 'अङ्ग्रेजी बाँकी') + '</span>' : '') + '</p>' +
                    '<div class="flex gap-3 mt-1 text-xs"><button class="text-red-700 dark:text-red-400 font-semibold" onclick="KG.editListing(' + p.id + ')">' + KG.tx('Edit', 'सम्पादन') + '</button><button class="text-gray-500" onclick="KG.toggleListing(' + p.id + ')">' + (p.active === false ? KG.tx('Show', 'देखाउनुहोस्') : KG.tx('Hide', 'लुकाउनुहोस्')) + '</button><button class="text-gray-500" onclick="KG.openProduct(' + p.id + ')">' + KG.tx('Preview', 'पूर्वावलोकन') + '</button></div></div></div>';
            }).join('') + '</div>' : '<p class="text-sm text-gray-500 py-6 text-center">' + KG.tx('No listings yet — add your first piece.', 'अहिलेसम्म सूची छैन।') + '</p>');
    }
    KG.toggleListing = function (id) {
        const raw = KG.store.get('kg-products', []); const p = raw.find(function (x) { return x.id == id; });
        if (p) { p.active = p.active === false; KG.store.set('kg-products', raw); renderProducts(); KG.openSellerDashboard('listings'); }
    };

    KG.editListing = function (id, voice) {
        const s = KG.mySeller(); if (!s) return;
        const p = id ? KG.product(id) : null;
        if (p && p.sellerId !== s.id) return;
        const v = p || { name: '', nameNe: '', sub: '', description: '', descNe: '', category: s.craft, price: '', stock: 1, materials: '', size: '', weightG: 500, region: s.region, care: '', personalizable: false, images: [] };
        let images = (v.images || []).filter(function (x) { return x && x.indexOf('data:image/svg') !== 0; });
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const f = function (name, label, val, type, attrs) { return '<div><label class="' + ui.label + '" for="ls-' + name + '">' + label + '</label><input id="ls-' + name + '" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" ' + (attrs || '') + ' class="' + ui.input + '"></div>'; };
        const mic = function (target) { return SR ? '<button type="button" data-mic="' + target + '" class="text-xs text-red-700 dark:text-red-400 font-semibold mt-1"><i class="fa-solid fa-microphone mr-1"></i>' + KG.tx('Speak in Nepali', 'नेपालीमा बोल्नुहोस्') + '</button>' : ''; };
        const body = KG.modal('kgListing', p ? KG.tx('Edit listing', 'सूची सम्पादन') : KG.tx('New listing', 'नयाँ सूची'),
            (voice ? '<div class="mb-4 text-xs bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 rounded-lg p-3"><i class="fa-solid fa-microphone mr-1"></i>' + (SR ? KG.tx('Tap "Speak in Nepali" and describe your product. Add photos with your phone camera. ', '"नेपालीमा बोल्नुहोस्" थिचेर उत्पादनबारे बोल्नुहोस्। फोनको क्यामेराबाट फोटो थप्नुहोस्। ') + (C.translateEndpoint ? KG.tx('We\'ll translate it to English automatically.', 'अङ्ग्रेजीमा स्वतः अनुवाद हुन्छ।') : KG.tx('Our team will add the English version before it goes live to international buyers.', 'अन्तर्राष्ट्रिय खरिदकर्ताका लागि हाम्रो टिमले अङ्ग्रेजी थप्नेछ।')) : KG.tx('Voice typing works in Chrome on Android and desktop. In this browser please type instead.', 'आवाज टाइपिङ Chrome मा मात्र चल्छ।')) + '</div>' : '') +
            '<form id="kgLsForm" class="space-y-4">' +
                '<div><p class="' + ui.label + '">' + KG.tx('Photos (up to 6, first is the cover)', 'फोटो (६ सम्म, पहिलो कभर)') + '</p><div id="ls-photos" class="flex flex-wrap gap-2"></div>' +
                    '<div class="flex flex-wrap gap-2 mt-2"><label class="' + ui.btn2 + ' !text-xs cursor-pointer"><i class="fa-solid fa-camera mr-1"></i>' + KG.tx('Take / upload photos', 'फोटो खिच्नुहोस् / अपलोड') + '<input id="ls-files" type="file" accept="image/*" capture="environment" multiple class="hidden"></label>' +
                    '<input id="ls-url" type="url" placeholder="' + KG.tx('…or paste an image link', '…वा फोटो लिङ्क') + '" class="' + ui.input + ' !w-64 !py-1.5"><button type="button" id="ls-addurl" class="' + ui.btn2 + ' !text-xs">' + KG.tx('Add', 'थप्नुहोस्') + '</button></div></div>' +
                '<div class="grid sm:grid-cols-2 gap-3">' +
                    '<div>' + f('nameNe', KG.tx('Name in Nepali', 'नेपालीमा नाम'), v.nameNe) + mic('nameNe') + '</div>' +
                    f('name', KG.tx('Name in English', 'अङ्ग्रेजीमा नाम') + (voice ? '' : ' *'), v.name, 'text', voice ? '' : 'required') +
                    f('sub', KG.tx('Short tagline', 'छोटो परिचय'), v.sub, 'text', 'placeholder="Hand-spun, natural dyes"') +
                    '<div><label class="' + ui.label + '" for="ls-category">' + KG.tx('Category', 'वर्ग') + '</label><select id="ls-category" name="category" class="' + ui.input + '">' + KG.visibleCategories().map(function (c) { return '<option value="' + c.id + '"' + (c.id === v.category ? ' selected' : '') + '>' + esc(KG.tx(c.en, c.ne)) + '</option>'; }).join('') + '</select></div>' +
                    f('price', KG.tx('Price (NPR, incl. VAT) *', 'मूल्य (रु., भ्याटसहित) *'), v.price, 'number', 'min="1" required') +
                    f('stock', KG.tx('Quantity available', 'उपलब्ध संख्या'), v.stock, 'number', 'min="0"') +
                    f('materials', KG.tx('Materials', 'सामग्री'), v.materials) +
                    f('size', KG.tx('Size / dimensions', 'आकार'), v.size) +
                    f('weightG', KG.tx('Packed weight (grams)', 'प्याक गरिएको तौल (ग्राम)'), v.weightG, 'number', 'min="10"') +
                    '<div><label class="' + ui.label + '" for="ls-region">' + KG.tx('Made in', 'कहाँ बनेको') + '</label><select id="ls-region" name="region" class="' + ui.input + '">' + KG.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (r.id === v.region ? ' selected' : '') + '>' + esc(KG.tx(r.en, r.ne)) + '</option>'; }).join('') + '</select></div>' +
                '</div>' +
                '<div><label class="' + ui.label + '" for="ls-descNe">' + KG.tx('Description in Nepali', 'नेपालीमा विवरण') + '</label><textarea id="ls-descNe" name="descNe" rows="3" class="' + ui.input + '">' + esc(v.descNe) + '</textarea>' + mic('descNe') + '</div>' +
                '<div><label class="' + ui.label + '" for="ls-description">' + KG.tx('Description in English', 'अङ्ग्रेजीमा विवरण') + '</label><textarea id="ls-description" name="description" rows="3" class="' + ui.input + '">' + esc(v.description) + '</textarea>' + (C.translateEndpoint ? '<button type="button" id="ls-translate" class="text-xs text-red-700 dark:text-red-400 font-semibold mt-1"><i class="fa-solid fa-language mr-1"></i>' + KG.tx('Translate from Nepali', 'नेपालीबाट अनुवाद') + '</button>' : '') + '</div>' +
                '<div class="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 p-3"><div class="flex flex-wrap items-center justify-between gap-2"><div><p class="text-sm font-bold"><i class="fa-solid fa-wand-magic-sparkles text-purple-700 mr-1"></i>' + KG.tx('AI listing assistant', 'AI सूची सहायक') + '</p><p class="' + ui.muted + '">' + KG.tx('Suggests a title, short description, full description, tags and care instructions. You review every field before saving.', 'शीर्षक, विवरण, ट्याग र हेरचाह सुझाव दिन्छ। सुरक्षित गर्नुअघि सबै जाँच्नुहोस्।') + '</p></div><button type="button" id="ls-ai" class="' + ui.btn2 + ' !text-xs"' + (!(C.ai && C.ai.listingAssistantEndpoint) ? ' disabled title="Configure the server endpoint first"' : '') + '>' + KG.tx('Generate suggestions', 'सुझाव बनाउनुहोस्') + '</button></div><p id="ls-ai-status" class="text-xs mt-2"></p></div>' +
                f('care', KG.tx('Care instructions', 'हेरचाह निर्देशन'), v.care) +
                f('videoUrl', KG.tx('Product video URL (optional)', 'उत्पादन भिडियो लिङ्क (ऐच्छिक)'), v.videoUrl || '', 'url', 'placeholder="https://…/video.mp4 or YouTube/Vimeo"') +
                '<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="personalizable" class="accent-red-700"' + (v.personalizable ? ' checked' : '') + '> ' + KG.tx('Buyers can request personalization (name, colour, size)', 'खरिदकर्ताले अनुकूलन माग्न सक्छन्') + '</label>' +
                '<div id="ls-pashmina" class="hidden text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3"><i class="fa-solid fa-certificate text-red-700 mr-1"></i>' + KG.tx('Pashmina listings get the "Chyangra Pashmina Verified" badge once your Chyangra Pashmina trademark licence is verified. Upload it under Shop profile.', 'च्याङ्ग्रा पश्मिना ट्रेडमार्क इजाजतपत्र प्रमाणित भएपछि ब्याज देखिन्छ। पसल प्रोफाइलमा अपलोड गर्नुहोस्।') + ' ' + ((s.chyangraCert && s.chyangraCert.status) ? '<strong>' + KG.tx('Status: ', 'स्थिति: ') + esc(s.chyangraCert.status) + '</strong>' : '') + '</div>' +
                '<p id="ls-err" class="text-xs text-red-700 hidden" role="alert"></p>' +
                '<button class="' + ui.btn + ' w-full">' + KG.tx('Save listing', 'सूची सुरक्षित गर्नुहोस्') + '</button>' +
            '</form>', 'lg');
        const form = body.querySelector('#kgLsForm');
        function drawPhotos() {
            body.querySelector('#ls-photos').innerHTML = images.map(function (src, i) {
                return '<div class="relative w-20 h-20"><img src="' + esc(src) + '" alt="" class="w-20 h-20 rounded-lg object-cover border ' + (i ? 'border-gray-200 dark:border-gray-700' : 'border-red-700 border-2') + '"><button type="button" data-rm="' + i + '" aria-label="Remove photo" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px]">✕</button>' + (i ? '<button type="button" data-cover="' + i + '" class="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] rounded-b-lg">' + KG.tx('Make cover', 'कभर बनाउनुहोस्') + '</button>' : '') + '</div>';
            }).join('') || '<p class="' + ui.muted + '">' + KG.tx('No photos yet. Natural daylight works best.', 'अहिलेसम्म फोटो छैन। दिनको उज्यालोमा राम्रो आउँछ।') + '</p>';
        }
        drawPhotos();
        body.querySelector('#ls-photos').addEventListener('click', function (e) {
            const rm = e.target.closest('[data-rm]'), cv = e.target.closest('[data-cover]');
            if (rm) { images.splice(+rm.dataset.rm, 1); drawPhotos(); }
            if (cv) { const x = images.splice(+cv.dataset.cover, 1)[0]; images.unshift(x); drawPhotos(); }
        });
        body.querySelector('#ls-files').addEventListener('change', function (e) {
            const files = Array.from(e.target.files).slice(0, 6 - images.length);
            Promise.all(files.map(function (fl) { return KG.readImage(fl, 900); })).then(function (list) { images = images.concat(list); drawPhotos(); });
        });
        body.querySelector('#ls-addurl').addEventListener('click', function () {
            const u = body.querySelector('#ls-url').value.trim();
            if (/^https:\/\//.test(u) && images.length < 6) { images.push(u); body.querySelector('#ls-url').value = ''; drawPhotos(); }
        });
        const catSel = form.category;
        const pashNote = function () { body.querySelector('#ls-pashmina').classList.toggle('hidden', catSel.value !== 'pashmina'); };
        catSel.addEventListener('change', pashNote); pashNote();

        // Nepali voice input
        body.querySelectorAll('[data-mic]').forEach(function (b) {
            b.addEventListener('click', function () {
                const rec = new SR(); rec.lang = 'ne-NP'; rec.interimResults = true; rec.continuous = b.dataset.mic === 'descNe';
                const field = form[b.dataset.mic]; const start = field.value ? field.value + ' ' : '';
                b.innerHTML = '<i class="fa-solid fa-circle text-red-600 animate-pulse mr-1"></i>' + KG.tx('Listening… tap to stop', 'सुन्दै… रोक्न थिच्नुहोस्');
                rec.onresult = function (ev) { let txt = ''; for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript; field.value = start + txt; };
                rec.onend = function () { b.innerHTML = '<i class="fa-solid fa-microphone mr-1"></i>' + KG.tx('Speak in Nepali', 'नेपालीमा बोल्नुहोस्'); if (C.translateEndpoint) translate(b.dataset.mic); };
                rec.onerror = function () { KG.toast(KG.tx('Could not hear you — check microphone permission.', 'आवाज सुनिएन — माइक अनुमति जाँच्नुहोस्।'), 'warn'); };
                b.onclick = function () { rec.stop(); };
                rec.start();
            }, { once: true });
        });
        function translate(which) {
            const src = form[which].value.trim(); if (!src || !C.translateEndpoint) return;
            fetch(C.translateEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: src, from: 'ne', to: 'en' }) })
                .then(function (r) { return r.json(); }).then(function (j) { if (j.translation) form[which === 'nameNe' ? 'name' : 'description'].value = j.translation; })
                .catch(function () { KG.toast(KG.tx('Translation unavailable right now.', 'अनुवाद अहिले उपलब्ध छैन।'), 'warn'); });
        }
        const tb = body.querySelector('#ls-translate'); if (tb) tb.addEventListener('click', function () { translate('nameNe'); translate('descNe'); });
        const ai = body.querySelector('#ls-ai'); if (ai && C.ai && C.ai.listingAssistantEndpoint) ai.addEventListener('click', function () {
            const status = body.querySelector('#ls-ai-status'); ai.disabled = true; status.textContent = KG.tx('Creating suggestions…', 'सुझाव बनाउँदै…');
            const headers = { 'Content-Type': 'application/json' }; if (KG.authToken) headers.Authorization = 'Bearer ' + KG.authToken;
            fetch(C.ai.listingAssistantEndpoint, { method: 'POST', headers: headers, body: JSON.stringify({ name: form.name.value.trim(), nameNe: form.nameNe.value.trim(), description: form.description.value.trim(), descNe: form.descNe.value.trim(), materials: form.materials.value.trim(), category: form.category.value, region: form.region.value, priceNpr: +form.price.value || null }) })
                .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Assistant unavailable'); return j; }); })
                .then(function (j) { const x = j.suggestion || j; if (x.name) form.name.value = x.name; if (x.tagline) form.sub.value = x.tagline; if (x.description) form.description.value = x.description; if (x.care) form.care.value = x.care; status.textContent = KG.tx('Suggestions added — review and edit them before saving.', 'सुझाव थपियो — सुरक्षित गर्नुअघि जाँच्नुहोस्।'); })
                .catch(function (e) { status.textContent = e.message; status.className = 'text-xs mt-2 text-red-700'; })
                .finally(function () { ai.disabled = false; });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const err = body.querySelector('#ls-err');
            const name = form.name.value.trim(), nameNe = form.nameNe.value.trim();
            if (!name && !nameNe) { err.textContent = KG.tx('Add a name (Nepali or English).', 'नाम राख्नुहोस्।'); err.classList.remove('hidden'); return; }
            if (!images.length) { err.textContent = KG.tx('Add at least one photo.', 'कम्तीमा एउटा फोटो थप्नुहोस्।'); err.classList.remove('hidden'); return; }
            const region = form.region.value;
            const raw = KG.store.get('kg-products', null) || window.loadProducts();
            const base = p ? (raw.find(function (x) { return x.id == p.id; }) || {}) : { id: KG.nextProductId(), createdAt: KG.now(), active: true };
            const prod = Object.assign({}, base, {
                name: name || nameNe, nameNe: nameNe, sub: form.sub.value.trim(), description: form.description.value.trim(), descNe: form.descNe.value.trim(),
                category: form.category.value, price: Math.round(+form.price.value), stock: +form.stock.value || 0, materials: form.materials.value.trim(), size: form.size.value.trim(),
                weightG: +form.weightG.value || 500, region: region, care: form.care.value.trim(), videoUrl: /^https:\/\//.test(form.videoUrl.value.trim()) ? form.videoUrl.value.trim() : '', personalizable: form.personalizable.checked,
                images: images, image: images[0], sellerId: s.id, tag: (KG.REGIONS.find(function (r) { return r.id === region; }) || { en: 'NEPAL' }).en.toUpperCase(), tagClass: base.tagClass || 'bg-red-700',
                needsTranslation: !name, placeholder: false, updatedAt: KG.now()
            });
            if (KG.store.set('kg-products', (function () { const i = raw.findIndex(function (x) { return x.id == prod.id; }); if (i > -1) raw[i] = prod; else raw.push(prod); return raw; })())) {
                KG.closeModal('kgListing'); renderProducts(); KG.toast(KG.tx('Listing saved', 'सूची सुरक्षित भयो')); KG.openSellerDashboard('listings');
            }
        });
    };

    /* ---------------------------- custom requests & quotations ---------------------------- */
    function customRequests(box, s) {
        const requests = KG.store.get('kg-custom-requests', []).filter(function (r) { return r.sellerId === s.id; }).reverse();
        box.innerHTML = requests.length ? requests.map(function (r) {
            const quote = (r.quotes || []).slice(-1)[0];
            return '<article class="' + ui.card + ' p-4 mb-3"><div class="flex flex-wrap items-start justify-between gap-2"><div><strong>' + esc(r.title) + '</strong><p class="' + ui.muted + '">' + esc(r.id) + ' · ' + esc(r.buyerName) + ' · ' + r.qty + ' ' + KG.tx('piece(s)', 'वटा') + ' · ' + KG.tx('budget', 'बजेट') + ' ' + KG.npr(r.budget) + '</p></div><span class="text-[10px] uppercase font-bold rounded-full bg-amber-100 text-amber-800 px-2 py-1">' + esc(r.status) + '</span></div><p class="text-sm mt-3 whitespace-pre-line">' + esc(r.details) + '</p>' + (r.reference ? '<img src="' + esc(r.reference) + '" alt="Reference" class="w-28 h-28 object-cover rounded-lg border mt-3">' : '') +
                '<form data-request="' + esc(r.id) + '" class="grid sm:grid-cols-4 gap-2 mt-4"><div><label class="' + ui.label + '">' + KG.tx('Quote (NPR)', 'कोटेसन (रु.)') + '</label><input name="amount" type="number" min="1" required value="' + (quote ? quote.amount : '') + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '">' + KG.tx('Days', 'दिन') + '</label><input name="days" type="number" min="1" required value="' + (quote ? quote.days : 7) + '" class="' + ui.input + '"></div><div class="sm:col-span-2"><label class="' + ui.label + '">' + KG.tx('Terms / notes', 'सर्त / नोट') + '</label><input name="note" required maxlength="500" value="' + esc(quote ? quote.note : '') + '" class="' + ui.input + '"></div><button class="' + ui.btn + ' sm:col-span-4 !text-xs">' + KG.tx(quote ? 'Revise quote' : 'Send quote', quote ? 'कोटेसन संशोधन' : 'कोटेसन पठाउनुहोस्') + '</button></form></article>';
        }).join('') : '<p class="text-sm text-gray-500 text-center py-8">' + KG.tx('No custom requests yet.', 'अहिलेसम्म अनुकूलित अनुरोध छैन।') + '</p>';
        box.querySelectorAll('[data-request]').forEach(function (form) { form.addEventListener('submit', function (e) {
            e.preventDefault(); const all = KG.store.get('kg-custom-requests', []), r = all.find(function (x) { return x.id === form.dataset.request; });
            r.quotes = (r.quotes || []).concat([{ id: KG.uid('Q-'), amount: +form.amount.value, days: +form.days.value, note: form.note.value.trim(), status: 'sent', createdAt: KG.now() }]); r.status = 'quoted'; r.updatedAt = KG.now(); KG.store.set('kg-custom-requests', all); KG.toast(KG.tx('Quote sent', 'कोटेसन पठाइयो')); KG.openSellerDashboard('custom');
        }); });
    }

    /* ---------------------------- orders ---------------------------- */
    function ordersTab(box, s) {
        const orders = sellerOrders(s.id);
        const couriers = C.shipping.couriers.domestic.concat(C.shipping.couriers.international);
        box.innerHTML = orders.length ? orders.map(function (o) {
            const dom = KG.zoneById(o.zone).domestic;
            return '<div class="' + ui.card + ' p-4 mb-3"><div class="flex flex-wrap justify-between gap-2"><div><strong>' + o.id + '</strong> <span class="' + ui.muted + '">· ' + KG.fmtDate(o.createdAt) + ' · ' + esc(o.buyer.name) + ' · ' + esc(KG.zoneById(o.zone).label) + '</span></div>' + KG.statusBadge(o.status) + '</div>' +
                '<ul class="text-sm mt-2">' + o.items.map(function (i) { return '<li>' + esc(i.name) + ' × ' + i.qty + (i.personalization ? ' — <span class="text-red-700 dark:text-red-400"><i class="fa-solid fa-pen-nib mr-1"></i>' + esc(i.personalization) + '</span>' : '') + '</li>'; }).join('') + '</ul>' +
                (o.gift ? '<p class="text-xs mt-1"><i class="fa-solid fa-gift text-red-700 mr-1"></i>' + KG.tx('Gift for ', 'उपहार: ') + esc(o.gift.recipient) + ' (' + esc(o.gift.occasion) + ')' + (o.gift.hidePrices ? ' · ' + KG.tx('hide prices', 'मूल्य लुकाउनुहोस्') : '') + '</p>' : '') +
                '<p class="' + ui.muted + ' mt-1">' + KG.tx('Your payout', 'तपाईंको भुक्तानी') + ': <strong>' + KG.npr(o.payout) + '</strong> · ' + esc(KG.escrowLabel(o)) + (o.tracking ? ' · ' + KG.tx('Tracking', 'ट्र्याकिङ') + ' ' + esc(o.tracking) : '') + '</p>' +
                '<div class="flex flex-wrap items-end gap-2 mt-3">' +
                    (o.status === 'paid' ? '<div><label class="' + ui.label + '" for="sh-c-' + o.id + '">' + KG.tx('Courier', 'कुरियर') + '</label><select id="sh-c-' + o.id + '" class="' + ui.input + ' !py-1.5 !w-48">' + couriers.filter(function (c) { return dom ? C.shipping.couriers.domestic.indexOf(c) > -1 : C.shipping.couriers.international.indexOf(c) > -1; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === o.courier ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
                        '<div><label class="' + ui.label + '" for="sh-t-' + o.id + '">' + KG.tx('Tracking no.', 'ट्र्याकिङ नं.') + '</label><input id="sh-t-' + o.id + '" class="' + ui.input + ' !py-1.5 !w-44"></div>' +
                        '<button class="' + ui.btn + ' !py-1.5 !text-xs" onclick="KG.markShipped(\'' + o.id + '\')"><i class="fa-solid fa-truck-fast mr-1"></i>' + KG.tx('Mark shipped', 'पठाइयो') + '</button>' : '') +
                    (o.status === 'shipped' ? '<button class="' + ui.btn + ' !py-1.5 !text-xs" onclick="KG.setOrderStatus(\'' + o.id + '\',\'delivered\',\'Marked delivered by seller\');KG.openSellerDashboard(\'orders\')"><i class="fa-solid fa-house-circle-check mr-1"></i>' + KG.tx('Mark delivered', 'डेलिभर भयो') + '</button>' : '') +
                    '<button class="' + ui.btn2 + ' !py-1.5 !text-xs" onclick="KG.packingSlip(\'' + o.id + '\')"><i class="fa-solid fa-print mr-1"></i>' + KG.tx('Packing slip', 'प्याकिङ स्लिप') + '</button>' +
                    '<button class="' + ui.btn2 + ' !py-1.5 !text-xs" onclick="KG.sellerThread(\'' + o.id + '\')"><i class="fa-regular fa-comments mr-1"></i>' + KG.tx('Message buyer', 'खरिदकर्तालाई सन्देश') + '</button>' +
                '</div>' +
                (!dom && o.status === 'paid' ? '<p class="' + ui.muted + ' mt-2"><i class="fa-solid fa-warehouse mr-1"></i>' + KG.tx('International order: drop it at the KalaGhar Export Hub — we pack, do the customs paperwork and ship. ', 'अन्तर्राष्ट्रिय अर्डर: KalaGhar निर्यात केन्द्रमा छोड्नुहोस्। ') + '<a class="underline" href="pages/export-hub.html" target="_blank">' + KG.tx('How it works', 'कसरी') + '</a></p>' : '') +
            '</div>';
        }).join('') : '<p class="text-sm text-gray-500 text-center py-8">' + KG.tx('No orders yet.', 'अहिलेसम्म अर्डर छैन।') + '</p>';
    }
    KG.markShipped = function (id) {
        const tr = document.getElementById('sh-t-' + id).value.trim(), c = document.getElementById('sh-c-' + id).value;
        if (!tr) { KG.toast(KG.tx('Enter the tracking number so the buyer can follow the parcel.', 'ट्र्याकिङ नम्बर लेख्नुहोस्।'), 'warn'); return; }
        KG.setOrderStatus(id, 'shipped', 'Shipped via ' + c + ' — ' + tr, { tracking: tr, courier: c });
        KG.toast(KG.tx('Marked as shipped', 'पठाइएको चिन्ह लगाइयो')); KG.openSellerDashboard('orders');
    };
    KG.sellerThread = function (orderId) {
        const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === orderId; }); if (!o) return;
        let th = KG.threads().find(function (x) { return x.orderId === orderId; });
        if (!th) { th = { id: KG.uid('T-'), buyerId: o.buyerId, buyerName: o.buyer.name, sellerId: o.sellerId, productId: null, orderId: orderId, messages: [], updatedAt: KG.now() }; KG.store.push('kg-threads', th); }
        KG.showThread(th.id, 'seller');
    };
    KG.packingSlip = function (id) {
        const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === id; }); if (!o) return;
        const hide = o.gift && o.gift.hidePrices;
        const w = window.open('', '_blank'); if (!w) return;
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Packing slip ' + o.id + '</title><style>body{font-family:Arial,sans-serif;max-width:640px;margin:24px auto;font-size:14px}h1{color:#b91c1c}td,th{padding:6px;border-bottom:1px solid #ddd;text-align:left}table{width:100%;border-collapse:collapse}.gift{border:2px dashed #b91c1c;padding:16px;margin-top:20px;border-radius:8px}button{margin-top:16px}@media print{button{display:none}}</style></head><body>' +
            '<h1>KalaGhar</h1><p><b>Order ' + o.id + '</b> · ' + KG.fmtDate(o.createdAt) + '</p><p><b>Deliver to:</b><br>' + esc(o.gift ? o.gift.recipient : o.buyer.name) + '<br>' + esc(o.gift ? o.gift.phone : o.buyer.phone) + '<br>' + esc(o.address.line) + ', ' + esc(o.address.city) + '<br>' + esc([o.address.district, o.address.postcode, o.address.country].filter(Boolean).join(', ')) + '</p>' +
            '<table><tr><th>Item</th><th>Qty</th>' + (hide ? '' : '<th>Price</th>') + '</tr>' + o.items.map(function (i) { return '<tr><td>' + esc(i.name) + (i.personalization ? '<br><small>' + esc(i.personalization) + '</small>' : '') + '</td><td>' + i.qty + '</td>' + (hide ? '' : '<td>' + KG.npr(i.price * i.qty) + '</td>') + '</tr>'; }).join('') + '</table>' +
            (o.gift ? '<div class="gift"><b>🎁 A gift for you' + (o.gift.occasion ? ' — ' + esc(o.gift.occasion) : '') + '</b><p>' + esc(o.gift.message || '') + '</p><p>— ' + esc(o.buyer.name) + '</p></div>' : '') +
            '<p style="margin-top:24px;font-size:12px;color:#555">Handmade in Nepal · Questions? ' + esc(C.business.email) + '</p><button onclick="print()">Print</button></body></html>');
        w.document.close();
    };

    /* ---------------------------- messages ---------------------------- */
    function messagesTab(box, s) {
        const list = KG.threads().filter(function (th) { return th.sellerId === s.id; }).sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
        box.innerHTML = '<p class="' + ui.muted + ' mb-3">' + KG.tx('Reply within 24 hours to keep your Star Artisan status. From an order conversation you can cancel or refund directly.', 'स्टार शिल्पी रहन २४ घण्टाभित्र जवाफ दिनुहोस्। अर्डर कुराकानीबाट सिधै रद्द वा फिर्ता गर्न सकिन्छ।') + '</p>' + KG.threadListHtml(list, 'seller');
    }

    /* ---------------------------- earnings & cooperative split ---------------------------- */
    function earnings(box, s) {
        const orders = sellerOrders(s.id);
        const sum = function (f) { return orders.filter(f).reduce(function (a, o) { return a + o.payout; }, 0); };
        const held = sum(function (o) { return o.escrow === 'held' || o.escrow === 'frozen'; });
        const released = sum(function (o) { return o.escrow === 'released'; });
        const cod = sum(function (o) { return o.escrow === 'cod' && o.status === 'completed'; });
        const promos = KG.store.get('kg-promos', []).filter(function (x) { return x.sellerId === s.id; });
        const promoCost = promos.reduce(function (a, x) { return a + x.cost; }, 0);
        const net = released + cod - promoCost;
        box.innerHTML = '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">' + stat(KG.npr(held), KG.tx('Held until delivery', 'डेलिभरीसम्म रोकिएको'), 'fa-lock') + stat(KG.npr(released + cod), KG.tx('Earned', 'आर्जित'), 'fa-circle-check') + stat('− ' + KG.npr(promoCost), KG.tx('Promotion costs', 'प्रचार खर्च'), 'fa-bullhorn') + stat(KG.npr(net), KG.tx('Net to you', 'तपाईंलाई खुद'), 'fa-wallet') + '</div>' +
            '<p class="' + ui.muted + ' mt-3"><i class="fa-solid fa-shield-halved text-green-700 mr-1"></i>' + KG.tx('Buyers pay KalaGhar first. Your payout (' + Math.round((1 - C.payments.commissionRate) * 100) + '% of the item price) is released when the buyer confirms receipt, or automatically ' + C.payments.autoReleaseDays + ' days after delivery. Payouts are frozen only while a buyer\'s problem report is reviewed.', 'खरिदकर्ताले पहिले KalaGhar लाई तिर्छन्। सामान पाएको पुष्टि भएपछि वा डेलिभरीको ' + C.payments.autoReleaseDays + ' दिनपछि तपाईंको भुक्तानी (' + Math.round((1 - C.payments.commissionRate) * 100) + '%) दिइन्छ।') + '</p>' +
            '<div class="grid lg:grid-cols-2 gap-4 mt-4">' +
                '<div class="' + ui.card + ' p-4"><p class="text-sm font-bold mb-2">' + KG.tx('Payout account', 'भुक्तानी खाता') + '</p><form id="kgPayoutForm" class="space-y-2"><div class="grid grid-cols-2 gap-2"><div><label class="' + ui.label + '" for="po-m">' + KG.tx('Method', 'माध्यम') + '</label><select id="po-m" class="' + ui.input + '">' + ['eSewa', 'Khalti', 'Bank transfer'].map(function (m) { return '<option' + ((s.payout || {}).method === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div><div><label class="' + ui.label + '" for="po-id">' + KG.tx('Wallet ID / account name', 'वालेट आईडी / खाता नाम') + '</label><input id="po-id" class="' + ui.input + '" value="' + esc((s.payout || {}).id || '') + '"></div></div><button class="' + ui.btn2 + ' !text-xs">' + KG.tx('Save', 'सुरक्षित') + '</button></form><p class="' + ui.muted + ' mt-2">' + KG.tx('Bank account numbers are collected securely by our team, never on this page.', 'बैंक खाता नम्बर यस पृष्ठमा राखिँदैन।') + '</p></div>' +
                (s.type === 'cooperative' ? coopSplit(s, released + cod - promoCost) : '<div class="' + ui.card + ' p-4"><p class="text-sm font-bold">' + KG.tx('Selling as a group?', 'समूहमा बेच्नुहुन्छ?') + '</p><p class="' + ui.muted + ' mt-1">' + KG.tx('Switch your shop to a cooperative in Shop profile to split earnings between members automatically.', 'सदस्यबीच आम्दानी बाँड्न पसल प्रोफाइलमा सहकारी छान्नुहोस्।') + '</p></div>') +
            '</div>' +
            '<div class="' + ui.card + ' p-4 mt-4 overflow-x-auto"><p class="text-sm font-bold mb-2">' + KG.tx('Order payouts', 'अर्डर भुक्तानी') + '</p><table class="w-full text-sm min-w-[520px]"><thead><tr class="text-left text-xs text-gray-500"><th class="py-1">' + KG.tx('Order', 'अर्डर') + '</th><th>' + KG.tx('Date', 'मिति') + '</th><th>' + KG.tx('Status', 'स्थिति') + '</th><th>' + KG.tx('Payout', 'भुक्तानी') + '</th><th>' + KG.tx('Money', 'रकम') + '</th></tr></thead><tbody>' + orders.map(function (o) {
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="py-2">' + o.id + '</td><td>' + KG.fmtDate(o.createdAt) + '</td><td>' + KG.statusBadge(o.status) + '</td><td>' + KG.npr(o.payout) + '</td><td class="text-xs">' + esc(KG.escrowLabel(o)) + '</td></tr>';
            }).join('') + '</tbody></table></div>';
        box.querySelector('#kgPayoutForm').addEventListener('submit', function (e) {
            e.preventDefault(); s.payout = { method: box.querySelector('#po-m').value, id: box.querySelector('#po-id').value.trim() }; KG.saveSeller(s); KG.toast(KG.tx('Saved', 'सुरक्षित भयो'));
        });
    }
    function coopSplit(s, amount) {
        const members = s.members && s.members.length ? s.members : [];
        const total = members.reduce(function (a, m) { return a + (+m.share || 0); }, 0) || 1;
        return '<div class="' + ui.card + ' p-4"><p class="text-sm font-bold mb-2"><i class="fa-solid fa-people-group mr-1"></i>' + KG.tx('Cooperative split', 'सहकारी बाँडफाँड') + '</p>' + (members.length ? '<table class="w-full text-sm"><tbody>' + members.map(function (m) {
            return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="py-1.5">' + esc(m.name) + '</td><td class="text-xs text-gray-500">' + (+m.share || 0) + '%</td><td class="text-right font-semibold">' + KG.npr(amount * (+m.share || 0) / total) + '</td></tr>';
        }).join('') + '</tbody></table>' + (total !== 100 ? '<p class="text-xs text-amber-700 mt-2">' + KG.tx('Shares add up to ' + total + '% — adjust them in Shop profile.', 'हिस्सा ' + total + '% छ — मिलाउनुहोस्।') + '</p>' : '') : '<p class="' + ui.muted + '">' + KG.tx('Add members and their shares in Shop profile.', 'पसल प्रोफाइलमा सदस्य थप्नुहोस्।') + '</p>') + '</div>';
    }

    /* ---------------------------- promote & coupons ---------------------------- */
    function marketing(box, s) {
        const prods = myProducts(s.id).filter(function (p) { return p.active !== false; });
        const coupons = KG.store.get('kg-coupons', []).filter(function (c) { return c.sellerId === s.id; });
        box.innerHTML = '<div class="grid lg:grid-cols-2 gap-4">' +
            '<div class="' + ui.card + ' p-4"><p class="text-sm font-bold"><i class="fa-solid fa-bullhorn text-red-700 mr-1"></i>' + KG.tx('Promoted listings', 'प्रचारित सूची') + '</p><p class="' + ui.muted + ' mt-1 mb-3">' + KG.tx('Promoted items appear first in the catalog with an "Ad" label. ' + KG.npr(C.promotion.pricePerDayNpr) + ' per day, deducted from your earnings.', 'प्रचारित वस्तु सूचीको सुरुमा "विज्ञापन" सहित देखिन्छ। प्रतिदिन ' + KG.npr(C.promotion.pricePerDayNpr) + '।') + '</p>' +
                (prods.length ? prods.map(function (p) {
                    const on = p.promotedUntil && new Date(p.promotedUntil) > new Date();
                    return '<div class="flex items-center gap-2 py-2 border-t border-gray-100 dark:border-gray-800"><img src="' + esc(p.image) + '" alt="" class="w-10 h-10 rounded object-cover"><span class="text-sm flex-1 truncate">' + esc(p.name) + (on ? '<span class="block text-[11px] text-blue-700">' + KG.tx('Promoted until ', 'प्रचार अवधि: ') + KG.fmtDate(p.promotedUntil) + '</span>' : '') + '</span>' +
                        '<label class="sr-only" for="pr-' + p.id + '">Days</label><select id="pr-' + p.id + '" class="' + ui.input + ' !w-24 !py-1"><option value="3">3 ' + KG.tx('days', 'दिन') + '</option><option value="7" selected>7 ' + KG.tx('days', 'दिन') + '</option><option value="14">14 ' + KG.tx('days', 'दिन') + '</option><option value="30">30 ' + KG.tx('days', 'दिन') + '</option></select><button class="' + ui.btn + ' !py-1 !px-2 !text-xs" onclick="KG.promote(' + p.id + ')">' + (on ? KG.tx('Extend', 'थप') : KG.tx('Promote', 'प्रचार')) + '</button></div>';
                }).join('') : '<p class="' + ui.muted + '">' + KG.tx('Add a listing first.', 'पहिले सूची थप्नुहोस्।') + '</p>') + '</div>' +
            '<div class="' + ui.card + ' p-4"><p class="text-sm font-bold"><i class="fa-solid fa-ticket text-red-700 mr-1"></i>' + KG.tx('Shop coupons', 'पसल कुपन') + '</p><p class="' + ui.muted + ' mt-1 mb-3">' + KG.tx('Codes apply only to your items. Share them on Facebook, Instagram or WhatsApp.', 'कोड तपाईंका वस्तुमा मात्र लाग्छ।') + '</p>' +
                '<form id="kgCpForm" class="grid grid-cols-2 gap-2"><div><label class="' + ui.label + '" for="cp-code">' + KG.tx('Code', 'कोड') + '</label><input id="cp-code" required pattern="[A-Za-z0-9]{4,15}" class="' + ui.input + ' uppercase" placeholder="TIHAR20"></div><div><label class="' + ui.label + '" for="cp-val">% ' + KG.tx('off', 'छुट') + '</label><input id="cp-val" type="number" min="1" max="70" value="10" required class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="cp-min">' + KG.tx('Min. order (NPR)', 'न्यूनतम खरिद') + '</label><input id="cp-min" type="number" min="0" value="0" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="cp-exp">' + KG.tx('Expires', 'म्याद') + '</label><input id="cp-exp" type="date" class="' + ui.input + '"></div><button class="' + ui.btn + ' col-span-2 !text-xs">' + KG.tx('Create coupon', 'कुपन बनाउनुहोस्') + '</button></form>' +
                (coupons.length ? '<ul class="mt-3 text-sm">' + coupons.map(function (c) { return '<li class="flex items-center gap-2 py-1.5 border-t border-gray-100 dark:border-gray-800"><code class="font-bold">' + esc(c.code) + '</code><span class="text-xs text-gray-500 flex-1">' + c.value + '% · min ' + KG.npr(c.minOrder) + (c.expires ? ' · ' + KG.tx('until ', 'सम्म ') + c.expires : '') + (c.active === false ? ' · ' + KG.tx('off', 'बन्द') : '') + '</span><button class="text-xs text-gray-500 hover:text-red-700" onclick="KG.toggleCoupon(\'' + esc(c.code) + '\')">' + (c.active === false ? KG.tx('Turn on', 'खोल्नुहोस्') : KG.tx('Turn off', 'बन्द')) + '</button></li>'; }).join('') + '</ul>' : '') + '</div>' +
            '</div>';
        box.querySelector('#kgCpForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const code = box.querySelector('#cp-code').value.trim().toUpperCase();
            if (KG.findCoupon(code) || KG.store.get('kg-coupons', []).some(function (c) { return c.code === code; })) { KG.toast(KG.tx('That code already exists.', 'यो कोड पहिले नै छ।'), 'warn'); return; }
            KG.store.push('kg-coupons', { code: code, type: 'percent', value: +box.querySelector('#cp-val').value, minOrder: +box.querySelector('#cp-min').value || 0, expires: box.querySelector('#cp-exp').value || '', sellerId: s.id, note: box.querySelector('#cp-val').value + '% off ' + s.shopName, active: true });
            KG.openSellerDashboard('marketing');
        });
    }
    KG.toggleCoupon = function (code) {
        const all = KG.store.get('kg-coupons', []); const c = all.find(function (x) { return x.code === code; });
        if (c) { c.active = c.active === false; KG.store.set('kg-coupons', all); }
        if (document.getElementById('kgSeller')) KG.openSellerDashboard('marketing'); else if (KG.adminTab) KG.adminTab('coupons');
    };
    KG.promote = function (id) {
        const s = KG.mySeller(); const days = +document.getElementById('pr-' + id).value;
        const cost = days * C.promotion.pricePerDayNpr;
        if (!confirm(KG.tx('Promote for ' + days + ' days for ' + KG.npr(cost) + '? This is deducted from your earnings.', days + ' दिनका लागि ' + KG.npr(cost) + ' मा प्रचार गर्ने?'))) return;
        const raw = KG.store.get('kg-products', []); const p = raw.find(function (x) { return x.id == id; });
        const from = p.promotedUntil && new Date(p.promotedUntil) > new Date() ? new Date(p.promotedUntil) : new Date();
        p.promotedUntil = new Date(from.getTime() + days * 864e5).toISOString();
        KG.store.set('kg-products', raw);
        KG.store.push('kg-promos', { id: KG.uid('P-'), sellerId: s.id, productId: id, days: days, cost: cost, at: KG.now() });
        renderProducts(); KG.openSellerDashboard('marketing');
    };

    /* ---------------------------- shop profile ---------------------------- */
    function profile(box, s) {
        const members = (s.members || []).map(function (m) { return m.name + ' : ' + m.share; }).join('\n');
        const cert = s.chyangraCert || {};
        box.innerHTML = '<form id="kgProfForm" class="grid lg:grid-cols-2 gap-6"><div class="space-y-3">' +
            '<div class="flex items-center gap-3"><div id="pf-photo-prev" class="w-16 h-16 rounded-2xl bg-red-700 text-white flex items-center justify-center text-2xl font-bold overflow-hidden">' + (s.photo ? '<img src="' + esc(s.photo) + '" alt="" class="w-full h-full object-cover">' : esc((s.owner || '?').charAt(0))) + '</div><label class="' + ui.btn2 + ' !text-xs cursor-pointer">' + KG.tx('Change photo', 'फोटो बदल्नुहोस्') + '<input id="pf-photo" type="file" accept="image/*" class="hidden"></label></div>' +
            '<div><label class="' + ui.label + '" for="pf-shop">' + KG.tx('Shop name', 'पसलको नाम') + '</label><input id="pf-shop" required class="' + ui.input + '" value="' + esc(s.shopName) + '"></div>' +
            '<div><label class="' + ui.label + '" for="pf-owner">' + KG.tx('Maker / owner name', 'शिल्पी / मालिकको नाम') + '</label><input id="pf-owner" class="' + ui.input + '" value="' + esc(s.owner || '') + '"></div>' +
            '<div class="grid grid-cols-2 gap-3"><div><label class="' + ui.label + '" for="pf-region">' + KG.tx('Region', 'क्षेत्र') + '</label><select id="pf-region" class="' + ui.input + '">' + KG.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (r.id === s.region ? ' selected' : '') + '>' + esc(r.en) + '</option>'; }).join('') + '</select></div>' +
            '<div><label class="' + ui.label + '" for="pf-craft">' + KG.tx('Main craft', 'मुख्य शिल्प') + '</label><select id="pf-craft" class="' + ui.input + '">' + KG.visibleCategories().map(function (c) { return '<option value="' + c.id + '"' + (c.id === s.craft ? ' selected' : '') + '>' + esc(c.en) + '</option>'; }).join('') + '</select></div></div>' +
            '<div><label class="' + ui.label + '" for="pf-story">' + KG.tx('Your story — how and where you make your work', 'तपाईंको कथा — कहाँ र कसरी बनाउनुहुन्छ') + '</label><textarea id="pf-story" rows="5" class="' + ui.input + '">' + esc(s.story || '') + '</textarea></div>' +
            '<div><label class="' + ui.label + '" for="pf-video">' + KG.tx('"How it\'s made" video link (YouTube, Facebook, TikTok)', '"कसरी बनाइन्छ" भिडियो लिङ्क') + '</label><input id="pf-video" type="url" class="' + ui.input + '" value="' + esc(s.video || '') + '" placeholder="https://"></div>' +
            '</div><div class="space-y-3">' +
            '<div><label class="' + ui.label + '" for="pf-type">' + KG.tx('Shop type', 'पसलको प्रकार') + '</label><select id="pf-type" class="' + ui.input + '"><option value="individual"' + (s.type !== 'cooperative' ? ' selected' : '') + '>' + KG.tx('Individual artisan', 'व्यक्तिगत शिल्पी') + '</option><option value="cooperative"' + (s.type === 'cooperative' ? ' selected' : '') + '>' + KG.tx('Cooperative / group', 'सहकारी / समूह') + '</option></select></div>' +
            '<div id="pf-members-wrap" class="' + (s.type === 'cooperative' ? '' : 'hidden') + '"><label class="' + ui.label + '" for="pf-members">' + KG.tx('Members and % share (one per line: Name : 25)', 'सदस्य र % हिस्सा (प्रति लाइन: नाम : २५)') + '</label><textarea id="pf-members" rows="5" class="' + ui.input + ' font-mono text-xs">' + esc(members) + '</textarea></div>' +
            '<div class="' + ui.card + ' p-3"><p class="text-sm font-bold"><i class="fa-solid fa-certificate text-red-700 mr-1"></i>' + KG.tx('Chyangra Pashmina trademark licence', 'च्याङ्ग्रा पश्मिना ट्रेडमार्क इजाजतपत्र') + '</p><p class="' + ui.muted + ' mt-1">' + KG.tx('For pashmina sellers. Once our team verifies your licence, your pashmina listings show the "Chyangra Pashmina Verified" badge.', 'पश्मिना विक्रेताका लागि। प्रमाणित भएपछि ब्याज देखिन्छ।') + '</p>' +
                '<p class="text-xs mt-2">' + KG.tx('Status', 'स्थिति') + ': <strong>' + esc(cert.status || KG.tx('not uploaded', 'अपलोड भएको छैन')) + '</strong>' + (cert.fileName ? ' · ' + esc(cert.fileName) : '') + '</p><label class="' + ui.btn2 + ' !text-xs cursor-pointer mt-2 inline-block">' + KG.tx('Upload licence (photo or PDF)', 'इजाजतपत्र अपलोड') + '<input id="pf-cert" type="file" accept="image/*,application/pdf" class="hidden"></label></div>' +
            '<div class="' + ui.card + ' p-3"><p class="text-sm font-bold"><i class="fa-solid fa-circle-check text-green-700 mr-1"></i>' + KG.tx('Verification', 'प्रमाणीकरण') + '</p><p class="text-xs mt-1">' + (s.verified ? KG.tx('Verified Artisan ✓', 'प्रमाणित शिल्पी ✓') : KG.tx('Pending — our team will contact you to see your workshop (in person or by video call) and check your ID or cooperative registration.', 'प्रक्रियामा — हाम्रो टिमले कार्यशाला हेर्न र परिचयपत्र वा सहकारी दर्ता जाँच्न सम्पर्क गर्नेछ।')) + '</p></div>' +
            '<button class="' + ui.btn + ' w-full">' + KG.tx('Save profile', 'प्रोफाइल सुरक्षित') + '</button></div></form>';
        let photo = s.photo || '';
        box.querySelector('#pf-photo').addEventListener('change', function (e) { if (e.target.files[0]) KG.readImage(e.target.files[0], 300).then(function (d) { photo = d; box.querySelector('#pf-photo-prev').innerHTML = '<img src="' + d + '" alt="" class="w-full h-full object-cover">'; }); });
        box.querySelector('#pf-type').addEventListener('change', function (e) { box.querySelector('#pf-members-wrap').classList.toggle('hidden', e.target.value !== 'cooperative'); });
        box.querySelector('#pf-cert').addEventListener('change', function (e) {
            const file = e.target.files[0]; if (!file) return;
            const done = function (data) { s.chyangraCert = { fileName: file.name, data: data, status: 'submitted', at: KG.now() }; KG.saveSeller(s); KG.toast(KG.tx('Licence submitted for verification', 'इजाजतपत्र प्रमाणीकरणका लागि पेस भयो')); KG.openSellerDashboard('profile'); };
            if (file.type.indexOf('image') === 0) KG.readImage(file, 1200).then(done);
            else if (file.size < 1.5e6) { const r = new FileReader(); r.onload = function () { done(r.result); }; r.readAsDataURL(file); }
            else KG.toast(KG.tx('Please upload a file under 1.5 MB or a photo.', '१.५ MB भन्दा सानो फाइल वा फोटो अपलोड गर्नुहोस्।'), 'warn');
        });
        box.querySelector('#kgProfForm').addEventListener('submit', function (e) {
            e.preventDefault();
            s.shopName = box.querySelector('#pf-shop').value.trim(); s.owner = box.querySelector('#pf-owner').value.trim();
            s.region = box.querySelector('#pf-region').value; s.craft = box.querySelector('#pf-craft').value;
            s.story = box.querySelector('#pf-story').value.trim(); s.video = box.querySelector('#pf-video').value.trim();
            s.type = box.querySelector('#pf-type').value; s.photo = photo;
            s.members = box.querySelector('#pf-members').value.split('\n').map(function (l) { const m = l.split(':'); return m[0].trim() ? { name: m[0].trim(), share: parseFloat(m[1]) || 0 } : null; }).filter(Boolean);
            KG.saveSeller(s); KG.toast(KG.tx('Profile saved', 'प्रोफाइल सुरक्षित भयो')); KG.renderDiscover(); KG.openSellerDashboard('profile');
        });
    }
})();
