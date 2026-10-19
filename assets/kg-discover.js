/* =====================================================================
   KALAGHAR DISCOVER — region map, artisan shops, festival storefront,
   impact, workshops, wholesale, complaints, footer legal info,
   search-engine data, shareable links
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, C = KG.C, esc = KG.esc, ui = KG.ui;

    /* ---------------------------- region map ---------------------------- */
    // Simplified outline of Nepal (lon, lat) — stylised, not survey-accurate.
    const OUTLINE = [[80.06, 28.84], [80.4, 29.6], [80.9, 30.1], [81.4, 30.4], [82.1, 30.2], [82.8, 29.7], [83.5, 29.3], [84.1, 28.9], [84.8, 28.6], [85.3, 28.3], [86.0, 27.95], [86.6, 28.1], [87.2, 27.85], [88.1, 27.9], [88.2, 27.1], [88.0, 26.4], [87.0, 26.4], [86.0, 26.6], [85.2, 26.8], [84.6, 27.35], [83.4, 27.45], [82.7, 27.5], [81.9, 27.9], [81.0, 28.4]];
    const W = 800, H = 380, LON0 = 79.8, LON1 = 88.5, LAT0 = 26.1, LAT1 = 30.7;
    const px = function (lon) { return (lon - LON0) / (LON1 - LON0) * W; };
    const py = function (lat) { return H - (lat - LAT0) / (LAT1 - LAT0) * H; };

    function regionSection() {
        const pts = OUTLINE.map(function (p) { return px(p[0]).toFixed(1) + ',' + py(p[1]).toFixed(1); }).join(' ');
        const pins = KG.REGIONS.map(function (r) {
            const x = px(r.lon), y = py(r.lat);
            const lblLeft = r.id === 'patan';
            return '<g class="kg-pin cursor-pointer" data-region="' + r.id + '" tabindex="0" role="button" aria-label="' + esc(r.en) + '">' +
                '<circle cx="' + x + '" cy="' + y + '" r="14" class="fill-red-700/15"></circle>' +
                '<circle cx="' + x + '" cy="' + y + '" r="6.5" class="fill-red-700 stroke-white dark:stroke-gray-900" stroke-width="2"></circle>' +
                '<text x="' + (lblLeft ? x - 12 : x + 12) + '" y="' + (r.id === 'kathmandu' ? y - 10 : r.id === 'patan' ? y + 16 : y + 4) + '" text-anchor="' + (lblLeft ? 'end' : 'start') + '" class="fill-gray-800 dark:fill-gray-100 text-[13px] font-semibold" style="paint-order:stroke" stroke="var(--kg-halo)" stroke-width="4">' + esc(KG.regionName(r.id)) + '</text></g>';
        }).join('');
        return '<section id="regions" class="max-w-7xl mx-auto px-4 py-12">' +
            '<div class="text-center mb-6"><span class="kg-eyebrow font-bold text-xs uppercase tracking-widest">' + KG.tx('Map of makers', 'शिल्पीको नक्सा') + '</span><h2 class="' + ui.h2 + ' mt-1" data-i18n="kgRegionsTitle">' + t('kgRegionsTitle') + '</h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1" data-i18n="kgRegionsSub">' + t('kgRegionsSub') + '</p></div>' +
            '<div class="grid lg:grid-cols-3 gap-6 items-start">' +
                '<div class="lg:col-span-2 ' + ui.card + ' p-3"><svg viewBox="0 0 ' + W + ' ' + H + '" class="w-full h-auto" role="img" aria-label="Map of Nepal with craft regions"><polygon points="' + pts + '" class="fill-amber-50 dark:fill-gray-800 stroke-amber-700/60 dark:stroke-gray-600" stroke-width="2" stroke-linejoin="round"></polygon>' + pins + '</svg></div>' +
                '<div id="kgRegionInfo" class="' + ui.card + ' p-5"></div>' +
            '</div></section>';
    }
    function showRegion(id) {
        const r = KG.REGIONS.find(function (x) { return x.id === id; }) || KG.REGIONS[0];
        document.querySelectorAll('.kg-pin').forEach(function (g) { g.querySelector('circle:nth-child(2)').setAttribute('r', g.dataset.region === r.id ? '9' : '6.5'); });
        const count = KG.products().filter(function (p) { return p.region === r.id; }).length;
        const box = document.getElementById('kgRegionInfo'); if (!box) return;
        box.innerHTML = '<p class="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400"><i class="fa-solid fa-location-dot mr-1"></i>' + KG.tx('Region', 'क्षेत्र') + '</p>' +
            '<h3 class="text-xl font-extrabold text-gray-900 dark:text-white mt-1">' + esc(KG.regionName(r.id)) + '</h3>' +
            '<p class="text-sm text-gray-600 dark:text-gray-300 mt-2">' + esc(r.blurb) + '</p>' +
            '<div class="flex flex-wrap gap-1.5 mt-3">' + r.crafts.map(function (c) { return '<span class="text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">' + esc(KG.catName(c)) + '</span>'; }).join('') + '</div>' +
            '<button class="' + ui.btn + ' w-full mt-5" onclick="KG.filterRegion(\'' + r.id + '\')">' + KG.tx('Shop ' + count + ' item' + (count === 1 ? '' : 's') + ' from ' + r.en, KG.regionName(r.id) + 'का ' + count + ' वस्तु हेर्नुहोस्') + '</button>';
    }

    /* ---------------------------- makers / shops ---------------------------- */
    function makersSection() {
        const sellers = KG.sellers().filter(function (s) { return s.status === 'approved' || KG.products().some(function (p) { return p.sellerId === s.id; }); });
        return '<section id="makers" class="bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800 py-12 px-4"><div class="max-w-7xl mx-auto">' +
            '<div class="flex flex-wrap items-end justify-between gap-3 mb-6"><div><h2 class="' + ui.h2 + '" data-i18n="kgMakersTitle">' + t('kgMakersTitle') + '</h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1" data-i18n="kgMakersSub">' + t('kgMakersSub') + '</p></div>' +
            '<button class="' + ui.btn2 + '" onclick="openModal(\'artisanModal\')"><i class="fa-solid fa-store mr-1"></i>' + KG.tx('Open your shop', 'आफ्नो पसल खोल्नुहोस्') + '</button></div>' +
            '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">' + sellers.map(function (s) {
                const prods = KG.products().filter(function (p) { return p.sellerId === s.id; });
                const cover = s.cover || (prods[0] && prods[0].image) || '';
                return '<button class="text-left ' + ui.card + ' overflow-hidden group hover:shadow-lg transition" onclick="KG.openShop(\'' + esc(s.id) + '\')">' +
                    '<div class="h-28 bg-amber-100 dark:bg-gray-800 overflow-hidden">' + (cover ? '<img src="' + esc(cover) + '" alt="" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition">' : '') + '</div>' +
                    '<div class="p-4"><div class="flex items-center gap-2"><div class="w-9 h-9 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-sm -mt-9 border-2 border-white dark:border-gray-900 overflow-hidden">' + (s.photo ? '<img src="' + esc(s.photo) + '" alt="" class="w-full h-full object-cover">' : esc((s.owner || s.shopName || '?').charAt(0))) + '</div></div>' +
                    '<p class="font-bold text-sm text-gray-900 dark:text-white mt-1">' + esc(s.shopName) + (s.verified ? ' <i class="fa-solid fa-circle-check text-green-600 text-xs" title="Verified Artisan"></i>' : '') + '</p>' +
                    '<p class="' + ui.muted + '"><i class="fa-solid fa-location-dot mr-1"></i>' + esc(KG.regionName(s.region)) + ' · ' + prods.length + ' ' + KG.tx('items', 'वस्तु') + (s.type === 'cooperative' ? ' · ' + KG.tx('Cooperative', 'सहकारी') : '') + '</p>' +
                    '<p class="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">' + esc(s.story || '') + '</p></div></button>';
            }).join('') + '</div></div></section>';
    }
    KG.openShop = function (sellerId) {
        const s = KG.seller(sellerId); if (!s) return;
        history.replaceState(null, '', '#shop-' + s.id);
        const prods = KG.products().filter(function (p) { return p.sellerId === s.id; });
        const ids = prods.map(function (p) { return p.id; });
        const rv = KG.store.get('kg-reviews', []).filter(function (r) { return ids.indexOf(r.productId) > -1; });
        const avg = rv.length ? rv.reduce(function (a, r) { return a + r.rating; }, 0) / rv.length : 0;
        const sales = KG.store.get('kg-orders', []).filter(function (o) { return o.sellerId === s.id && ['completed', 'delivered', 'shipped', 'paid'].indexOf(o.status) > -1; }).length;
        KG.modal('kgShop', esc(s.shopName),
            '<div class="flex flex-col sm:flex-row gap-5">' +
                '<div class="w-24 h-24 rounded-2xl bg-red-700 text-white flex items-center justify-center text-4xl font-bold overflow-hidden shrink-0">' + (s.photo ? '<img src="' + esc(s.photo) + '" alt="" class="w-full h-full object-cover">' : esc((s.owner || s.shopName).charAt(0))) + '</div>' +
                '<div class="flex-1"><div class="flex flex-wrap gap-1.5">' +
                    (s.verified ? KG.badgeHtml({ en: 'Verified Artisan', ne: 'प्रमाणित शिल्पी', icon: 'fa-circle-check', cls: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800' }) : '') +
                    (KG.isStarSeller(s.id) ? KG.badgeHtml({ en: 'Star Artisan', ne: 'स्टार शिल्पी', icon: 'fa-star', cls: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800' }) : '') +
                    (s.type === 'cooperative' ? KG.badgeHtml({ en: 'Cooperative', ne: 'सहकारी', icon: 'fa-people-group', cls: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800' }) : '') + '</div>' +
                    '<p class="text-sm text-gray-500 dark:text-gray-400 mt-2"><i class="fa-solid fa-location-dot mr-1"></i>' + esc(KG.regionName(s.region)) + ', Nepal · ' + esc(KG.catName(s.craft)) + ' · ' + sales + ' ' + KG.tx('sales', 'बिक्री') + (rv.length ? ' · ' + KG.stars(avg) + ' (' + rv.length + ')' : '') + '</p>' +
                    '<p class="text-sm text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-line">' + esc(s.story || KG.tx('This artisan hasn\'t written their story yet.', 'यी शिल्पीले कथा लेखेका छैनन्।')) + '</p>' +
                    (s.type === 'cooperative' && s.members && s.members.length ? '<p class="' + ui.muted + ' mt-2"><i class="fa-solid fa-people-group mr-1"></i>' + KG.tx('Members: ', 'सदस्य: ') + s.members.map(function (m) { return esc(m.name); }).join(', ') + '</p>' : '') +
                    (s.video ? '<a class="text-xs text-red-700 underline mt-2 inline-block" href="' + esc(s.video) + '" target="_blank" rel="noopener"><i class="fa-solid fa-play mr-1"></i>' + KG.tx('Watch how it\'s made', 'कसरी बनाइन्छ हेर्नुहोस्') + '</a>' : '') +
                    '<div class="flex gap-2 mt-4"><button class="' + ui.btn2 + ' !text-xs" onclick="KG.openThread({sellerId:\'' + esc(s.id) + '\'})"><i class="fa-regular fa-comments mr-1"></i>' + KG.tx('Message', 'सन्देश') + '</button><button class="' + ui.btn2 + ' !text-xs" onclick="navigator.clipboard.writeText(location.origin+location.pathname+\'#shop-' + esc(s.id) + '\');KG.toast(\'Link copied\')"><i class="fa-solid fa-link mr-1"></i>' + KG.tx('Share shop', 'पसल सेयर') + '</button></div>' +
                    (s.sample ? '<p class="text-[11px] text-amber-700 dark:text-amber-400 mt-3">' + KG.tx('Sample profile — replace with the real artisan\'s details in the Admin panel.', 'नमूना प्रोफाइल।') + '</p>' : '') +
                '</div>' +
            '</div>' +
            '<h4 class="font-bold text-sm text-gray-900 dark:text-white mt-6 mb-3">' + KG.tx('Items from this shop', 'यस पसलका वस्तु') + ' (' + prods.length + ')</h4>' +
            (prods.length ? KG.miniGrid(prods) : '<p class="text-sm text-gray-500">' + KG.tx('No items listed yet.', 'अहिलेसम्म वस्तु छैन।') + '</p>'), 'xl');
    };

    /* ---------------------------- festival storefront ---------------------------- */
    KG.activeFestival = function () {
        const override = KG.store.get('kg-festival-override', '');
        if (override === 'none') return null;
        if (override) return C.festivals.find(function (f) { return f.id === override; }) || null;
        const md = KG.today().slice(5);
        return C.festivals.find(function (f) { return f.start <= f.end ? (md >= f.start && md <= f.end) : (md >= f.start || md <= f.end); }) || null;
    };
    function festivalSection() {
        const f = KG.activeFestival(); if (!f) return '';
        const picks = KG.products().filter(function (p) { return f.categories.indexOf(p.category) > -1; }).slice(0, 4);
        return '<section id="festival" class="max-w-7xl mx-auto px-4 pt-8"><div class="rounded-2xl bg-gradient-to-r ' + f.color + ' text-white p-6 md:p-8">' +
            '<div class="flex flex-wrap items-end justify-between gap-3 mb-5"><div><p class="text-xs font-bold uppercase tracking-widest opacity-90"><i class="fa-solid fa-sparkles mr-1"></i>' + KG.tx('Festival Storefront', 'चाडपर्व पसल') + '</p><h2 class="text-2xl md:text-3xl font-extrabold mt-1">' + esc(KG.tx(f.name + ' Gifts', f.ne + 'का उपहार')) + '</h2><p class="text-sm opacity-90 mt-1">' + KG.tx('Handpicked for the season — plus we deliver gifts to family anywhere in Nepal.', 'यो चाडका लागि छानिएका — नेपालभर परिवारसम्म उपहार पुर्‍याउँछौं।') + '</p></div>' +
            '<button class="bg-white text-red-800 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50" onclick="KG.openGiftMode()"><i class="fa-solid fa-gift mr-1"></i>' + t('kgGiftMode') + '</button></div>' +
            '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">' + picks.map(function (p) {
                return '<button class="text-left bg-white/10 hover:bg-white/20 rounded-2xl overflow-hidden transition" onclick="KG.openProduct(' + p.id + ')"><div class="aspect-[4/3]"><img src="' + esc(p.image) + '" alt="" loading="lazy" class="w-full h-full object-cover"></div><div class="p-2"><p class="text-xs font-semibold line-clamp-1">' + esc(p.name) + '</p><p class="text-xs font-bold">' + KG.npr(p.price) + '</p></div></button>';
            }).join('') + '</div></div></section>';
    }

    /* ---------------------------- diaspora gifting band ---------------------------- */
    function diasporaSection() {
        return '<section id="send-home" class="max-w-7xl mx-auto px-4 py-10"><div class="kg-grad text-white rounded-2xl p-6 md:p-8 grid md:grid-cols-3 gap-6 items-center shadow-lg">' +
            '<div class="md:col-span-2"><span class="text-white/90 font-bold text-xs uppercase tracking-widest"><i class="fa-solid fa-plane-arrival mr-1"></i>' + KG.tx('For Nepalis abroad', 'विदेशमा रहेका नेपालीका लागि') + '</span>' +
            '<h2 class="text-2xl md:text-3xl font-extrabold mt-1" data-i18n="kgDiasporaTitle">' + t('kgDiasporaTitle') + '</h2><p class="text-sm text-white/90 mt-2" data-i18n="kgDiasporaSub">' + t('kgDiasporaSub') + '</p>' +
            '<ul class="text-sm text-white/95 mt-3 space-y-1"><li><i class="fa-solid fa-check text-amber-200 mr-1"></i>' + KG.tx('Pay with an international card', 'अन्तर्राष्ट्रिय कार्डबाट भुक्तानी') + '</li><li><i class="fa-solid fa-check text-amber-200 mr-1"></i>' + KG.tx('Delivered in 1–5 days by local courier, no customs', 'स्थानीय कुरियरबाट १–५ दिनमा, भन्सार छैन') + '</li><li><i class="fa-solid fa-check text-amber-200 mr-1"></i>' + KG.tx('Gift message and price-free packing slip', 'उपहार सन्देश र मूल्य नभएको स्लिप') + '</li></ul></div>' +
            '<div class="flex flex-col gap-2"><button class="' + ui.btn + '" onclick="KG.giftThis()"><i class="fa-solid fa-gift mr-1"></i>' + KG.tx('Send a gift home', 'घरमा उपहार पठाउनुहोस्') + '</button><button class="' + ui.btn2 + '" onclick="KG.openGiftMode()">' + KG.tx('Get gift ideas', 'उपहार सुझाव') + '</button></div></div></section>';
    }
    KG.giftThis = function (productId) {
        if (productId) { KG.addToCart(productId, 1, '', true); }
        if (!KG.cart().length) { KG.toast(KG.tx('Add a gift to your bag first — try Gift Mode.', 'पहिले झोलामा उपहार थप्नुहोस्।'), 'warn'); KG.openGiftMode(); return; }
        KG.closeModal('kgProduct'); KG.openCheckout({ gift: true });
    };

    /* ---------------------------- workshops ---------------------------- */
    const WORKSHOPS = [
        { id: 'w-pottery', en: 'Pottery at Bhaktapur Pottery Square', ne: 'भक्तपुर पोटरी स्क्वायरमा माटोका भाँडा', region: 'bhaktapur', hours: 3, price: 3500, max: 6, photo: '6638540', img: ['Pottery', '#7c2d12', '#c2410c', '◍'] },
        { id: 'w-thangka', en: 'Thangka painting basics', ne: 'थाङ्का चित्रकलाको आधार', region: 'kathmandu', hours: 4, price: 5500, max: 5, photo: '11501256', img: ['Thangka', '#1e3a8a', '#b45309', '☸'] },
        { id: 'w-dhaka', en: 'Weave on a Dhaka loom', ne: 'ढाका तानमा बुन्नुहोस्', region: 'palpa', hours: 3, price: 3000, max: 4, photo: '6634704', img: ['Dhaka Loom', '#92400e', '#be123c', '▤'] },
        { id: 'w-bowl', en: 'Singing bowl sound session & making demo', ne: 'सिंगिङ बोल ध्वनि सत्र', region: 'patan', hours: 2, price: 2500, max: 10, photo: '6252095', img: ['Singing Bowl', '#78350f', '#ca8a04', '◎'] },
        { id: 'w-felt', en: 'Felt-making for families', ne: 'परिवारका लागि फेल्ट बनाउने', region: 'kathmandu', hours: 2, price: 2000, max: 12, photo: '10474348', img: ['Felt', '#be123c', '#f59e0b', '●'] },
        { id: 'w-lokta', en: 'Make your own lokta paper', ne: 'आफ्नै लोक्ता कागज बनाउनुहोस्', region: 'kathmandu', hours: 2, price: 1800, max: 8, photo: '4115784', img: ['Lokta Paper', '#166534', '#a16207', '▭'] }
    ];
    function workshopsSection() {
        return '<section id="workshops" class="max-w-7xl mx-auto px-4 py-12"><div class="mb-6"><span class="kg-eyebrow font-bold text-xs uppercase tracking-widest">' + KG.tx('Visiting Nepal?', 'नेपाल आउँदै हुनुहुन्छ?') + '</span><h2 class="' + ui.h2 + ' mt-1" data-i18n="kgWorkshopsTitle">' + t('kgWorkshopsTitle') + '</h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1" data-i18n="kgWorkshopsSub">' + t('kgWorkshopsSub') + '</p></div>' +
            '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">' + WORKSHOPS.map(function (w) {
                return '<div class="' + ui.card + ' overflow-hidden flex flex-col"><div class="aspect-[4/3] overflow-hidden"><img src="' + KG.photo(w.photo) + '" alt="' + esc(w.en) + '" loading="lazy" class="w-full h-full object-cover hover:scale-105 transition duration-300"></div><div class="p-4 flex flex-col flex-1"><p class="font-bold text-sm text-gray-900 dark:text-white">' + esc(KG.tx(w.en, w.ne)) + '</p><p class="' + ui.muted + ' mt-1"><i class="fa-solid fa-location-dot mr-1"></i>' + esc(KG.regionName(w.region)) + ' · <i class="fa-regular fa-clock mx-1"></i>' + w.hours + ' ' + KG.tx('hours', 'घण्टा') + ' · ' + KG.tx('up to ', 'अधिकतम ') + w.max + ' ' + KG.tx('people', 'जना') + '</p><div class="flex items-center justify-between mt-auto pt-3"><div>' + KG.priceHtml(w.price) + '<span class="' + ui.muted + '"> / ' + KG.tx('person', 'जना') + '</span></div><button class="' + ui.btn + ' !py-1.5 !text-xs" onclick="KG.bookWorkshop(\'' + w.id + '\')">' + KG.tx('Book', 'बुक') + '</button></div></div></div>';
            }).join('') + '</div></section>';
    }
    KG.bookWorkshop = function (id) {
        const w = WORKSHOPS.find(function (x) { return x.id === id; }); const u = KG.user();
        const min = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
        const body = KG.modal('kgBook', esc(KG.tx(w.en, w.ne)),
            '<form class="space-y-3"><div class="grid sm:grid-cols-2 gap-3">' +
            '<div><label class="' + ui.label + '" for="bk-name">' + KG.tx('Name', 'नाम') + '</label><input id="bk-name" required class="' + ui.input + '" value="' + esc(u ? u.name : '') + '"></div>' +
            '<div><label class="' + ui.label + '" for="bk-email">' + KG.tx('Email', 'इमेल') + '</label><input id="bk-email" type="email" required class="' + ui.input + '" value="' + esc(u ? u.email : '') + '"></div>' +
            '<div><label class="' + ui.label + '" for="bk-date">' + KG.tx('Preferred date', 'मिति') + '</label><input id="bk-date" type="date" min="' + min + '" required class="' + ui.input + '"></div>' +
            '<div><label class="' + ui.label + '" for="bk-people">' + KG.tx('People', 'जना') + '</label><input id="bk-people" type="number" min="1" max="' + w.max + '" value="2" required class="' + ui.input + '"></div></div>' +
            '<div><label class="' + ui.label + '" for="bk-note">' + KG.tx('Notes (hotel, language, children…)', 'टिप्पणी') + '</label><textarea id="bk-note" rows="2" class="' + ui.input + '"></textarea></div>' +
            '<p id="bk-total" class="text-sm font-semibold"></p><p class="' + ui.muted + '">' + KG.tx('This is a booking request — the artisan confirms the time by email, then you pay. Free cancellation up to 48 hours before.', 'यो बुकिङ अनुरोध हो — शिल्पीले समय पुष्टि गरेपछि तिर्नुहोस्। ४८ घण्टाअघिसम्म निःशुल्क रद्द।') + '</p>' +
            '<button class="' + ui.btn + ' w-full">' + KG.tx('Request booking', 'बुकिङ अनुरोध') + '</button></form>');
        const f = body.querySelector('form');
        const upd = function () { body.querySelector('#bk-total').textContent = KG.tx('Total: ', 'जम्मा: ') + KG.npr(w.price * (+f.querySelector('#bk-people').value || 1)); };
        f.addEventListener('input', upd); upd();
        f.addEventListener('submit', function (e) {
            e.preventDefault();
            KG.store.push('kg-bookings', { id: KG.uid('B-'), workshopId: w.id, workshop: w.en, name: f.querySelector('#bk-name').value.trim(), email: f.querySelector('#bk-email').value.trim(), date: f.querySelector('#bk-date').value, people: +f.querySelector('#bk-people').value, note: f.querySelector('#bk-note').value.trim(), total: w.price * +f.querySelector('#bk-people').value, status: 'requested', createdAt: KG.now() });
            KG.closeModal('kgBook'); KG.toast(KG.tx('Booking request sent! We\'ll confirm by email.', 'बुकिङ अनुरोध पठाइयो!'));
        });
    };

    /* ---------------------------- impact ---------------------------- */
    function impactSection() {
        const orders = KG.store.get('kg-orders', []);
        const released = orders.filter(function (o) { return o.escrow === 'released' || (o.escrow === 'cod' && o.status === 'completed'); });
        const paid = C.impact.baselinePaidToArtisansNpr + released.reduce(function (s, o) { return s + o.payout; }, 0);
        const sellers = KG.sellers().filter(function (s) { return s.status === 'approved' && !s.sample; }).length + C.impact.baselineArtisans;
        const byRegion = {};
        released.forEach(function (o) { const s = KG.seller(o.sellerId); const r = s ? s.region : 'kathmandu'; byRegion[r] = (byRegion[r] || 0) + o.payout; });
        const coops = KG.sellers().filter(function (s) { return s.type === 'cooperative' && !s.sample; }).length;
        const stat = function (v, l) { return '<div class="' + ui.card + ' p-5 text-center"><p class="text-3xl font-extrabold text-red-700 dark:text-red-400">' + v + '</p><p class="text-xs text-gray-600 dark:text-gray-400 mt-1">' + l + '</p></div>'; };
        const max = Math.max.apply(null, Object.values(byRegion).concat([1]));
        return '<section id="impact" class="bg-amber-50 dark:bg-gray-900 border-y border-amber-200 dark:border-gray-800 py-12 px-4"><div class="max-w-7xl mx-auto">' +
            '<div class="text-center mb-6"><h2 class="' + ui.h2 + '" data-i18n="kgImpactTitle">' + t('kgImpactTitle') + '</h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">' + KG.tx('Live figures from orders on KalaGhar. ' + Math.round((1 - C.payments.commissionRate) * 100) + '% of every sale goes to the maker.', 'KalaGhar का अर्डरबाट प्रत्यक्ष तथ्याङ्क। हरेक बिक्रीको ' + Math.round((1 - C.payments.commissionRate) * 100) + '% शिल्पीलाई।') + '</p></div>' +
            '<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">' + stat(KG.npr(paid), KG.tx('Paid to artisans', 'शिल्पीलाई भुक्तानी')) + stat(sellers, KG.tx('Artisans selling', 'बिक्री गर्ने शिल्पी')) + stat(coops, KG.tx('Cooperatives', 'सहकारी')) + stat(released.length, KG.tx('Orders completed', 'पूरा अर्डर')) + '</div>' +
            (Object.keys(byRegion).length ? '<div class="' + ui.card + ' p-5 mt-4"><p class="text-sm font-bold mb-3">' + KG.tx('Paid to artisans by region', 'क्षेत्र अनुसार भुक्तानी') + '</p>' + Object.keys(byRegion).sort(function (a, b) { return byRegion[b] - byRegion[a]; }).map(function (r) {
                return '<div class="flex items-center gap-3 text-xs mb-2"><span class="w-24 shrink-0">' + esc(KG.regionName(r)) + '</span><div class="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded"><div class="h-3 bg-red-700 rounded" style="width:' + (byRegion[r] / max * 100).toFixed(1) + '%"></div></div><span class="w-28 text-right">' + KG.npr(byRegion[r]) + '</span></div>';
            }).join('') + '</div>' : '<p class="text-center ' + ui.muted + ' mt-4">' + KG.tx('Figures update as orders are completed.', 'अर्डर पूरा हुँदै जाँदा तथ्याङ्क अद्यावधिक हुन्छ।') + '</p>') +
            '</div></section>';
    }

    /* ---------------------------- wholesale ---------------------------- */
    function wholesaleSection() {
        return '<section id="wholesale" class="max-w-7xl mx-auto px-4 py-12"><div class="' + ui.card + ' p-6 md:p-8 grid md:grid-cols-2 gap-8">' +
            '<div><span class="kg-eyebrow font-bold text-xs uppercase tracking-widest"><i class="fa-solid fa-boxes-stacked mr-1"></i>B2B</span><h2 class="' + ui.h2 + ' mt-1" data-i18n="kgWholesaleTitle">' + t('kgWholesaleTitle') + '</h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-2" data-i18n="kgWholesaleSub">' + t('kgWholesaleSub') + '</p>' +
            '<ul class="text-sm text-gray-700 dark:text-gray-300 mt-4 space-y-2"><li><i class="fa-solid fa-tags text-red-700 mr-2"></i>' + KG.tx('Tiered pricing from 20 pieces', '२० थानदेखि छुट मूल्य') + '</li><li><i class="fa-solid fa-palette text-red-700 mr-2"></i>' + KG.tx('Custom colours, sizes and private labels', 'आफ्नै रङ, साइज र लेबल') + '</li><li><i class="fa-solid fa-file-contract text-red-700 mr-2"></i>' + KG.tx('Certificate of Origin and export paperwork handled', 'उत्पत्ति प्रमाणपत्र र निर्यात कागजात') + '</li><li><i class="fa-solid fa-ship text-red-700 mr-2"></i>' + KG.tx('Air or sea freight via our Export Hub', 'निर्यात केन्द्रबाट हवाई वा समुद्री ढुवानी') + '</li></ul></div>' +
            '<form id="kgWholesaleForm" class="space-y-3"><div class="grid sm:grid-cols-2 gap-3">' +
                '<div><label class="' + ui.label + '" for="ws-name">' + KG.tx('Your name', 'नाम') + '</label><input id="ws-name" required class="' + ui.input + '"></div>' +
                '<div><label class="' + ui.label + '" for="ws-company">' + KG.tx('Business name', 'व्यवसाय') + '</label><input id="ws-company" required class="' + ui.input + '"></div>' +
                '<div><label class="' + ui.label + '" for="ws-email">' + KG.tx('Email', 'इमेल') + '</label><input id="ws-email" type="email" required class="' + ui.input + '"></div>' +
                '<div><label class="' + ui.label + '" for="ws-country">' + KG.tx('Country', 'देश') + '</label><input id="ws-country" required class="' + ui.input + '"></div>' +
                '<div><label class="' + ui.label + '" for="ws-cat">' + KG.tx('Products', 'उत्पादन') + '</label><select id="ws-cat" class="' + ui.input + '">' + KG.CATEGORIES.map(function (c) { return '<option value="' + c.id + '">' + esc(c.en) + '</option>'; }).join('') + '</select></div>' +
                '<div><label class="' + ui.label + '" for="ws-qty">' + KG.tx('Quantity', 'परिमाण') + '</label><input id="ws-qty" type="number" min="10" value="50" required class="' + ui.input + '"></div></div>' +
                '<div><label class="' + ui.label + '" for="ws-msg">' + KG.tx('Details', 'विवरण') + '</label><textarea id="ws-msg" rows="3" class="' + ui.input + '" placeholder="' + KG.tx('Colours, timeline, packaging, budget…', 'रङ, समय, प्याकेजिङ, बजेट…') + '"></textarea></div>' +
                '<button class="' + ui.btn + ' w-full">' + KG.tx('Request a quote', 'कोटेसन माग्नुहोस्') + '</button></form>' +
            '</div></section>';
    }

    /* ---------------------------- complaints ---------------------------- */
    KG.openComplaint = function (orderId) {
        const b = C.business, u = KG.user();
        history.replaceState(null, '', '#complaint');
        const body = KG.modal('kgComplaint', '<i class="fa-solid fa-scale-balanced text-red-700 mr-1"></i>' + t('kgComplaint'),
            '<p class="text-sm text-gray-600 dark:text-gray-300 mb-3">' + KG.tx('Tell us what went wrong. Our complaint officer reviews every complaint and replies within 3 business days.', 'के गलत भयो भन्नुहोस्। गुनासो अधिकारीले ३ कार्यदिवसभित्र जवाफ दिनुहुन्छ।') + '</p>' +
            '<div class="text-xs bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 mb-4"><strong>' + KG.tx('Complaint officer', 'गुनासो सुन्ने अधिकारी') + ':</strong> ' + (b.complaintOfficer.name ? esc(b.complaintOfficer.name) : '<em>' + KG.tx('to be appointed', 'नियुक्त हुन बाँकी') + '</em>') + ' · ' + esc(b.complaintOfficer.email) + ' · ' + esc(b.complaintOfficer.phone) + '</div>' +
            '<form class="space-y-3"><div class="grid sm:grid-cols-2 gap-3">' +
                '<div><label class="' + ui.label + '" for="cp-name">' + KG.tx('Name', 'नाम') + ' *</label><input id="cp-name" required class="' + ui.input + '" value="' + esc(u ? u.name : '') + '"></div>' +
                '<div><label class="' + ui.label + '" for="cp-email">' + KG.tx('Email', 'इमेल') + ' *</label><input id="cp-email" type="email" required class="' + ui.input + '" value="' + esc(u ? u.email : '') + '"></div>' +
                '<div><label class="' + ui.label + '" for="cp-phone">' + KG.tx('Phone', 'फोन') + '</label><input id="cp-phone" type="tel" class="' + ui.input + '"></div>' +
                '<div><label class="' + ui.label + '" for="cp-order">' + KG.tx('Order number (if any)', 'अर्डर नम्बर') + '</label><input id="cp-order" class="' + ui.input + '" value="' + esc(orderId || '') + '" placeholder="KG-1001"></div>' +
                '<div class="sm:col-span-2"><label class="' + ui.label + '" for="cp-type">' + KG.tx('Type', 'प्रकार') + '</label><select id="cp-type" class="' + ui.input + '"><option value="delivery">' + KG.tx('Delivery / delay', 'डेलिभरी / ढिलाइ') + '</option><option value="product">' + KG.tx('Product quality / not as described', 'गुणस्तर / विवरण नमिलेको') + '</option><option value="refund">' + KG.tx('Refund / payment', 'रकम फिर्ता / भुक्तानी') + '</option><option value="seller">' + KG.tx('Seller conduct', 'विक्रेताको व्यवहार') + '</option><option value="privacy">' + KG.tx('Privacy / my data', 'गोपनीयता / मेरो डाटा') + '</option><option value="other">' + KG.tx('Other', 'अन्य') + '</option></select></div></div>' +
                '<div><label class="' + ui.label + '" for="cp-text">' + KG.tx('What happened?', 'के भयो?') + ' *</label><textarea id="cp-text" required minlength="10" rows="4" class="' + ui.input + '"></textarea></div>' +
                '<div><label class="' + ui.label + '" for="cp-file">' + KG.tx('Photo or screenshot (optional)', 'फोटो (ऐच्छिक)') + '</label><input id="cp-file" type="file" accept="image/*" class="text-xs"></div>' +
                '<button class="' + ui.btn + ' w-full">' + KG.tx('Submit complaint', 'गुनासो पेस गर्नुहोस्') + '</button>' +
                '<p class="' + ui.muted + '">' + KG.tx('If we can\'t resolve it, you may take the matter to the Department of Commerce, Supplies and Consumer Protection.', 'समाधान नभए वाणिज्य, आपूर्ति तथा उपभोक्ता संरक्षण विभागमा जान सक्नुहुन्छ।') + '</p></form>' +
            '<div class="border-t border-gray-100 dark:border-gray-800 mt-5 pt-4"><p class="' + ui.label + '">' + KG.tx('Already filed? Check status', 'स्थिति जाँच्नुहोस्') + '</p><div class="flex gap-2"><label class="sr-only" for="cp-ref">Reference</label><input id="cp-ref" class="' + ui.input + '" placeholder="C-…"><button type="button" id="cp-check" class="' + ui.btn2 + '">' + KG.tx('Check', 'जाँच') + '</button></div><p id="cp-status" class="text-sm mt-2"></p></div>');
        let photo = '';
        body.querySelector('#cp-file').addEventListener('change', function (e) { if (e.target.files[0]) KG.readImage(e.target.files[0], 700).then(function (d) { photo = d; }); });
        body.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            const c = KG.store.push('kg-complaints', { id: 'C-' + Date.now().toString(36).toUpperCase(), kind: 'general', type: body.querySelector('#cp-type').value, name: body.querySelector('#cp-name').value.trim(), email: body.querySelector('#cp-email').value.trim(), phone: body.querySelector('#cp-phone').value.trim(), orderId: body.querySelector('#cp-order').value.trim(), text: body.querySelector('#cp-text').value.trim(), photo: photo, status: 'open', createdAt: KG.now(), replies: [] });
            body.innerHTML = '<div class="text-center py-6"><i class="fa-solid fa-circle-check text-4xl text-green-600"></i><p class="font-bold mt-3">' + KG.tx('Complaint received', 'गुनासो प्राप्त भयो') + '</p><p class="text-sm mt-1">' + KG.tx('Your reference number is', 'तपाईंको सन्दर्भ नम्बर') + ' <strong>' + c.id + '</strong>.</p><p class="' + ui.muted + ' mt-2">' + KG.tx('Keep this number to check the status.', 'स्थिति जाँच्न यो नम्बर राख्नुहोस्।') + '</p></div>';
        });
        body.querySelector('#cp-check').addEventListener('click', function () {
            const ref = body.querySelector('#cp-ref').value.trim().toUpperCase();
            const c = KG.store.get('kg-complaints', []).find(function (x) { return x.id.toUpperCase() === ref; });
            body.querySelector('#cp-status').innerHTML = c ? '<strong>' + esc(c.status.toUpperCase()) + '</strong>' + (c.resolution ? ' — ' + esc(c.resolution) : '') : KG.tx('Reference not found on this device.', 'यो सन्दर्भ भेटिएन।');
        });
    };

    /* ---------------------------- footer legal block ---------------------------- */
    function upgradeFooter() {
        // Registration details required by the E-Commerce Act 2081, shown in the footer
        const b = C.business, pend = KG.tx('pending', 'प्रक्रियामा');
        const slot = document.getElementById('kgBizSlot'); if (!slot) return;
        slot.innerHTML = '<div id="kgBizStrip" class="max-w-7xl mx-auto px-4 pb-6 text-[11px] text-amber-50/60 leading-relaxed border-t border-white/10 pt-5">' +
            '<p><strong class="text-amber-50/85">' + esc(b.legalName || b.name) + '</strong> · ' + esc(b.address) +
            ' · ' + KG.tx('Reg. No.', 'दर्ता नं.') + ' ' + esc(b.registrationNo || pend) + ' · PAN/VAT ' + esc(b.pan || pend) +
            ' · ' + KG.tx('E-commerce portal listing', 'ई-कमर्स पोर्टल सूचीकरण') + ' ' + esc(b.docListingNo || pend) + (b.specialPermits ? ' · ' + esc(b.specialPermits) : '') + '</p>' +
            '<p>' + KG.tx('Complaint officer', 'गुनासो सुन्ने अधिकारी') + ': ' + esc(b.complaintOfficer.name || KG.tx('to be appointed', 'नियुक्त हुन बाँकी')) + ' · <a class="underline" href="mailto:' + esc(b.complaintOfficer.email) + '">' + esc(b.complaintOfficer.email) + '</a> · ' + esc(b.complaintOfficer.phone) + '</p></div>';
    }

    /* ---------------------------- search-engine data ---------------------------- */
    function structuredData() {
        const old = document.getElementById('kgLd'); if (old) old.remove();
        const base = location.origin + location.pathname;
        const items = KG.products().map(function (p, i) {
            const r = KG.rating(p.id);
            const prod = { '@type': 'Product', name: p.name, description: p.sub + (p.materials ? '. ' + p.materials : ''), image: p.placeholder ? undefined : p.images, sku: 'KG-' + p.id, category: KG.CATEGORIES.find(function (c) { return c.id === p.category; }) ? KG.CATEGORIES.find(function (c) { return c.id === p.category; }).en : p.category,
                countryOfOrigin: 'NP', brand: { '@type': 'Brand', name: (KG.seller(p.sellerId) || {}).shopName || 'KalaGhar' }, url: base + '#product-' + p.id,
                offers: { '@type': 'Offer', price: p.price, priceCurrency: 'NPR', availability: 'https://schema.org/InStock', url: base + '#product-' + p.id } };
            if (r.count) prod.aggregateRating = { '@type': 'AggregateRating', ratingValue: r.avg.toFixed(1), reviewCount: r.count };
            return { '@type': 'ListItem', position: i + 1, item: prod };
        });
        const ld = [
            { '@context': 'https://schema.org', '@type': 'Organization', name: 'KalaGhar', alternateName: 'कलाघर', url: base, email: C.business.email, telephone: C.business.phone, address: { '@type': 'PostalAddress', addressLocality: 'Kathmandu', addressCountry: 'NP' } },
            { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Handmade crafts from Nepal', itemListElement: items }
        ];
        const s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'kgLd'; s.textContent = JSON.stringify(ld);
        document.head.appendChild(s);
    }

    /* ---------------------------- shareable links ---------------------------- */
    KG.route = function () {
        const h = decodeURIComponent(location.hash || '');
        let m;
        if ((m = h.match(/^#product-(\d+)/))) KG.openProduct(+m[1]);
        else if ((m = h.match(/^#shop-(.+)$/))) KG.openShop(m[1]);
        else if ((m = h.match(/^#collection=([\d,]+)/))) KG.openFavorites(m[1].split(',').map(Number));
        else if (h === '#complaint') KG.openComplaint();
        else if (h === '#seller') KG.openSellerDashboard();
        else if (h === '#account') KG.openAccount();
        else if (h === '#gift') KG.openGiftMode();
    };

    /* ---------------------------- artisan application ---------------------------- */
    function upgradeArtisanModal() {
        const m = document.getElementById('artisanModal'); if (!m) return;
        const form = m.querySelector('form');
        const sel = form.querySelector('select');
        sel.innerHTML = '<option value="">Select…</option>' + KG.CATEGORIES.map(function (c) { return '<option value="' + c.id + '">' + esc(c.en) + '</option>'; }).join('');
        const emailWrap = form.querySelector('input[type=email]').parentNode;
        emailWrap.insertAdjacentHTML('afterend',
            '<div class="grid grid-cols-2 gap-3"><div><label class="' + ui.label + '" for="ap-region">' + KG.tx('Region', 'क्षेत्र') + '</label><select id="ap-region" class="' + ui.input + '">' + KG.REGIONS.map(function (r) { return '<option value="' + r.id + '">' + esc(r.en) + '</option>'; }).join('') + '<option value="other">Other</option></select></div>' +
            '<div><label class="' + ui.label + '" for="ap-type">' + KG.tx('I am', 'म') + '</label><select id="ap-type" class="' + ui.input + '"><option value="individual">' + KG.tx('An individual artisan', 'व्यक्तिगत शिल्पी') + '</option><option value="cooperative">' + KG.tx('A cooperative / group', 'सहकारी / समूह') + '</option></select></div></div>' +
            '<div><label class="' + ui.label + '" for="ap-phone">' + KG.tx('Phone / WhatsApp', 'फोन / ह्वाट्सएप') + '</label><input id="ap-phone" type="tel" required class="' + ui.input + '"></div>' +
            '<p class="' + ui.muted + '">' + KG.tx('Can\'t type easily? After applying you can list products by speaking in Nepali.', 'टाइप गर्न गाह्रो? आवेदनपछि नेपालीमा बोलेर उत्पादन राख्न सक्नुहुन्छ।') + '</p>');
        form.onsubmit = function (e) {
            e.preventDefault();
            const name = form.querySelector('input[type=text]').value.trim(), email = form.querySelector('input[type=email]').value.trim().toLowerCase();
            const u = KG.user();
            const s = { id: KG.uid('s-'), userId: u && u.email === email ? u.id : null, shopName: name, owner: name, email: email, phone: form.querySelector('#ap-phone').value.trim(), region: form.querySelector('#ap-region').value, craft: sel.value || 'homedecor', type: form.querySelector('#ap-type').value, verified: false, status: 'pending', story: '', members: [], createdAt: KG.now() };
            const existing = KG.sellers().find(function (x) { return x.email === email; });
            if (existing) { KG.toast(KG.tx('An application with this email already exists.', 'यो इमेलको आवेदन पहिले नै छ।'), 'warn'); return; }
            KG.saveSeller(s);
            if (u && u.email === email) { const users = KG.store.get('kg-users', []); const x = users.find(function (z) { return z.id === u.id; }); x.role = 'seller'; KG.store.set('kg-users', users); }
            form.reset(); closeModal('artisanModal');
            KG.modal('kgApplied', KG.tx('Application received', 'आवेदन प्राप्त भयो'),
                '<p class="text-sm">' + KG.tx('Thank you! Our team will verify your workshop within 3 business days.', 'धन्यवाद! हाम्रो टिमले ३ कार्यदिवसभित्र प्रमाणित गर्नेछ।') + '</p>' +
                (s.userId ? '<button class="' + ui.btn + ' w-full mt-4" onclick="KG.closeModal(\'kgApplied\');KG.openSellerDashboard()">' + KG.tx('Set up my shop now', 'अहिले पसल सेटअप गर्नुहोस्') + '</button>'
                          : '<p class="text-sm mt-2">' + KG.tx('Create an account with ', 'आफ्नो पसल सेटअप गर्न ') + '<strong>' + esc(email) + '</strong>' + KG.tx(' and tick "I\'m an artisan" to set up your shop while you wait.', ' इमेलबाट खाता बनाउनुहोस् र "म शिल्पी हुँ" छान्नुहोस्।') + '</p><button class="' + ui.btn + ' w-full mt-4" onclick="KG.closeModal(\'kgApplied\');openModal(\'customerAuthModal\');switchAuthTab(\'signup\')">' + KG.tx('Create account', 'खाता बनाउनुहोस्') + '</button>'));
        };
    }

    /* ---------------------------- mount ---------------------------- */
    KG.renderDiscover = function () {
        const anchor = document.getElementById('marketplace');
        ['festival', 'regions', 'makers', 'send-home', 'workshops', 'impact', 'wholesale'].forEach(function (id) { const el = document.getElementById(id); if (el) el.remove(); });
        const fest = festivalSection();
        if (fest) document.querySelector('[data-i18n-html="dispatch"]').insertAdjacentHTML('afterend', fest);
        anchor.insertAdjacentHTML('afterend', regionSection() + makersSection() + diasporaSection());
        const faq = document.querySelector('[data-i18n="faqTitle"]').closest('section');
        faq.insertAdjacentHTML('beforebegin', workshopsSection() + impactSection() + wholesaleSection());
        document.querySelectorAll('.kg-pin').forEach(function (g) {
            g.addEventListener('click', function () { showRegion(g.dataset.region); });
            g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showRegion(g.dataset.region); } });
        });
        showRegion(KG.activeRegion || 'mustang');
        const wf = document.getElementById('kgWholesaleForm');
        wf.addEventListener('submit', function (e) {
            e.preventDefault();
            KG.store.push('kg-wholesale', { id: KG.uid('W-'), name: wf.querySelector('#ws-name').value.trim(), company: wf.querySelector('#ws-company').value.trim(), email: wf.querySelector('#ws-email').value.trim(), country: wf.querySelector('#ws-country').value.trim(), category: wf.querySelector('#ws-cat').value, qty: +wf.querySelector('#ws-qty').value, message: wf.querySelector('#ws-msg').value.trim(), status: 'new', createdAt: KG.now() });
            wf.reset(); KG.toast(KG.tx('Thanks! We\'ll send a quote within 2 business days.', 'धन्यवाद! २ कार्यदिवसभित्र कोटेसन पठाउँछौं।'));
        });
        structuredData();
    };

    KG.initDiscover = function () {
        upgradeFooter(); upgradeArtisanModal(); KG.renderDiscover();
        window.addEventListener('hashchange', KG.route);
        setTimeout(KG.route, 50);
    };
})();
