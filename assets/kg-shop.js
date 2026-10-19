/* =====================================================================
   KALAGHAR SHOP — product cards, product page, favorites, Gift Mode,
   currency selector, shipping calculator
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, C = KG.C, esc = KG.esc, ui = KG.ui;

    KG.activeRegion = null;

    /* ---------------------------- discovery helpers ---------------------------- */
    KG.PACKAGING = [
        { id: 'heritage', name: 'Heritage Wrap', detail: 'Lokta paper · Dhaka ribbon', icon: 'fa-scroll' },
        { id: 'signature', name: 'Signature Box', detail: 'Keepsake box · gift card', icon: 'fa-box-open' },
        { id: 'eco', name: 'Minimal Eco Wrap', detail: 'Recycled paper · jute twine', icon: 'fa-leaf' }
    ];
    KG.packaging = function (id) { return KG.PACKAGING.find(function (x) { return x.id === id; }) || KG.PACKAGING[0]; };
    KG.recentIds = function () { return KG.store.get('kg-recent-products', []); };
    KG.rememberProduct = function (id) {
        const ids = KG.recentIds().filter(function (x) { return +x !== +id; });
        ids.unshift(+id); KG.store.set('kg-recent-products', ids.slice(0, 12));
        KG.renderDiscoveryShelf();
    };
    KG.renderDiscoveryShelf = function () {
        const el = document.getElementById('kgDiscoveryShelf'); if (!el) return;
        const all = KG.products();
        const recent = KG.recentIds().map(function (id) { return KG.product(id); }).filter(Boolean).slice(0, 6);
        const signals = recent.concat(KG.favs().map(function (id) { return KG.product(id); }).filter(Boolean));
        const cats = signals.map(function (p) { return p.category; });
        const regions = signals.map(function (p) { return p.region; });
        const excluded = recent.map(function (p) { return +p.id; });
        const picks = all.map(function (p) {
            let score = (cats.indexOf(p.category) > -1 ? 3 : 0) + (regions.indexOf(p.region) > -1 ? 1.5 : 0) + KG.rating(p.id).avg / 5;
            if (p.personalizable) score += .25;
            return { p: p, score: score };
        }).filter(function (x) { return excluded.indexOf(+x.p.id) < 0; })
          .sort(function (a, b) { return b.score - a.score || a.p.price - b.p.price; }).slice(0, 6).map(function (x) { return x.p; });
        function rail(list) {
            return '<div class="kg-discovery-rail">' + list.map(function (p) {
                return '<button type="button" onclick="KG.openProduct(' + p.id + ')" class="kg-discovery-card group"><img src="' + esc(p.image) + '" alt="" loading="lazy"><span><strong>' + esc(KG.lang() === 'ne' && p.nameNe ? p.nameNe : p.name) + '</strong><small>' + esc(KG.catName(p.category)) + ' · ' + KG.npr(p.price) + '</small></span></button>';
            }).join('') + '</div>';
        }
        el.innerHTML = '<div class="flex items-end justify-between gap-3 mb-5"><div><span class="kg-eyebrow text-xs uppercase tracking-[.18em] font-extrabold">Made for your journey</span><h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">' + KG.tx('Your KalaGhar edit', 'तपाईंको कलाघर संग्रह') + '</h2><p class="text-xs text-gray-500 dark:text-gray-400 mt-1">' + KG.tx('A private, on-device selection based on crafts you explore and save.', 'तपाईंले हेर्नुभएको र रोज्नुभएको शिल्पमा आधारित।') + '</p></div></div>' +
            (recent.length ? '<div class="mb-7"><h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3"><i class="fa-regular fa-clock mr-1.5 text-red-700"></i>' + KG.tx('Recently viewed', 'हालसालै हेरिएका') + '</h3>' + rail(recent) + '</div>' : '') +
            '<div><h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3"><i class="fa-solid fa-wand-magic-sparkles mr-1.5 text-amber-600"></i>' + KG.tx('Picked for you', 'तपाईंका लागि छानिएका') + '</h3>' + rail(picks.length ? picks : all.slice(0, 6)) + '</div>';
    };

    /* ---------------------------- favorites ---------------------------- */
    KG.favs = function () { return KG.store.get('kg-favs', []); };
    KG.isFav = function (id) { return KG.favs().indexOf(+id) > -1; };
    KG.toggleFav = function (id, ev) {
        if (ev) { ev.stopPropagation(); ev.preventDefault(); }
        id = +id; const f = KG.favs(); const i = f.indexOf(id);
        if (i > -1) f.splice(i, 1); else { f.push(id); KG.track('fav', id); }
        KG.store.set('kg-favs', f);
        document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) {
            b.innerHTML = '<i class="fa-' + (i > -1 ? 'regular' : 'solid') + ' fa-heart"></i>';
            b.classList.toggle('text-red-600', i === -1);
        });
        KG.updateFavCount(); KG.updateLocaleLabel(); KG.renderDiscoveryShelf();
        KG.toast(i > -1 ? KG.tx('Removed from favorites', 'मनपर्नेबाट हटाइयो') : KG.tx('Saved to favorites', 'मनपर्नेमा राखियो'));
    };
    KG.updateFavCount = function () {
        const el = document.getElementById('kgFavCount'); if (!el) return;
        const n = KG.favs().length; el.textContent = n; el.classList.toggle('hidden', !n);
    };

    /* ---------------------------- product cards ---------------------------- */
    function cardHtml(p) {
        const r = KG.rating(p.id);
        const badges = KG.badgesFor(p);
        const promoted = p.promotedUntil && new Date(p.promotedUntil) > new Date();
        const title = KG.lang() === 'ne' && p.nameNe ? p.nameNe : p.name;
        return '<div class="product-card bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition flex flex-col" data-category="' + esc(p.category) + '" data-region="' + esc(p.region) + '" data-search="' + esc((p.name + ' ' + p.sub + ' ' + p.materials + ' ' + KG.catName(p.category) + ' ' + KG.regionName(p.region) + ' ' + (p.nameNe || '')).toLowerCase()) + '">' +
            '<div class="aspect-[4/3] overflow-hidden relative cursor-pointer" onclick="KG.openProduct(' + p.id + ')">' +
                '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">' +
                '<span class="kg-grad absolute top-2 left-2 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow">' + esc(p.tag || '') + '</span>' +
                (promoted ? '<span class="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">' + KG.tx('Ad', 'विज्ञापन') + '</span>' : '') +
                '<button type="button" data-fav="' + p.id + '" onclick="KG.toggleFav(' + p.id + ', event)" aria-label="Save to favorites" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow ' + (KG.isFav(p.id) ? 'text-red-600' : 'text-gray-600 dark:text-gray-300') + ' hover:text-red-600"><i class="fa-' + (KG.isFav(p.id) ? 'solid' : 'regular') + ' fa-heart"></i></button>' +
            '</div>' +
            '<div class="p-4 flex flex-col flex-1">' +
                '<h3 class="font-bold text-gray-900 dark:text-white text-sm group-hover:text-red-700 dark:group-hover:text-red-400 transition cursor-pointer" onclick="KG.openProduct(' + p.id + ')">' + esc(title) + '</h3>' +
                '<p class="text-xs text-gray-500 dark:text-gray-400 mb-1">' + esc(p.sub) + '</p>' +
                '<p class="text-[11px] text-gray-500 dark:text-gray-400"><i class="fa-solid fa-location-dot mr-1 text-red-700/70"></i>' + esc(KG.regionName(p.region)) + '</p>' +
                (r.count ? '<div class="mt-1 flex items-center gap-1">' + KG.stars(r.avg) + '<span class="text-[11px] text-gray-500">(' + r.count + ')</span></div>' : '') +
                (badges.length ? '<div class="flex flex-wrap gap-1 mt-2">' + badges.map(function (b) { return KG.badgeHtml(b, true); }).join('') + '</div>' : '') +
                '<div class="flex items-end justify-between mt-auto pt-3 gap-2">' +
                    '<div class="leading-tight">' + KG.priceHtml(p.price) + '</div>' +
                    '<button onclick="KG.addToCart(' + p.id + ')" class="kg-btn-soft px-3 py-2 rounded-full text-xs font-semibold transition shrink-0">' + t('addToBag') + '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    window.renderProducts = function () {
        const grid = document.getElementById('productGrid'); if (!grid) return;
        const now = new Date();
        const list = KG.products().slice().sort(function (a, b) {
            const pa = a.promotedUntil && new Date(a.promotedUntil) > now ? 1 : 0;
            const pb = b.promotedUntil && new Date(b.promotedUntil) > now ? 1 : 0;
            return pb - pa;
        });
        grid.innerHTML = list.length ? list.map(cardHtml).join('') : '<p class="col-span-full text-center text-sm text-gray-500 py-10">' + KG.tx('No products yet.', 'अहिलेसम्म कुनै उत्पादन छैन।') + '</p>';
        KG.applyFilters();
        KG.renderDiscoveryShelf();
    };
    KG.applyFilters = function () {
        const q = ((document.getElementById('searchInput') || {}).value || '').toLowerCase().trim();
        let shown = 0;
        document.querySelectorAll('#productGrid .product-card').forEach(function (card) {
            const ok = (activeCategory === 'all' || card.dataset.category === activeCategory) &&
                       (!KG.activeRegion || card.dataset.region === KG.activeRegion) &&
                       (!q || card.dataset.search.indexOf(q) > -1);
            card.style.display = ok ? '' : 'none'; if (ok) shown++;
        });
        const note = document.getElementById('kgFilterNote');
        if (note) {
            const parts = [];
            if (activeCategory !== 'all') parts.push('<strong>' + esc(KG.catName(activeCategory)) + '</strong>');
            if (KG.activeRegion) parts.push('<i class="fa-solid fa-location-dot mx-1"></i><strong>' + esc(KG.regionName(KG.activeRegion)) + '</strong>');
            if (parts.length) {
                note.innerHTML = KG.tx('Showing ', 'देखाउँदै: ') + parts.join(' · ') + ' · ' + shown + ' ' + KG.tx('items', 'वस्तु') + ' <button class="underline ml-2 font-semibold" onclick="KG.filterRegion(null);filterCategory(\'all\')">' + KG.tx('Clear', 'हटाउनुहोस्') + '</button>';
                note.classList.remove('hidden');
            } else note.classList.add('hidden');
        }
    };
    const origFilter = window.filterCategory;
    // Header category nav: Etsy-style underline for the active category
    KG.styleCats = function (cat) {
        document.querySelectorAll('.cat-btn').forEach(function (b) {
            const on = (b.getAttribute('onclick') || '').indexOf("'" + cat + "'") > -1;
            b.classList.remove('bg-red-700', 'text-white', 'bg-gray-100', 'dark:bg-gray-800', 'active');
            b.classList.toggle('kg-cat-on', on);
            b.setAttribute('aria-current', on ? 'true' : 'false');
        });
    };
    window.filterCategory = function (cat) {
        origFilter(cat); KG.styleCats(cat); KG.applyFilters();
        if (cat === 'all') document.getElementById('marketplace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.filterProductsBySearch = function () { KG.applyFilters(); };
    KG.filterRegion = function (id) {
        KG.activeRegion = id; KG.applyFilters();
        if (id) document.getElementById('marketplace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* ---------------------------- product page ---------------------------- */
    KG.openProduct = function (id) {
        const p = KG.product(id); if (!p) return;
        KG.track('view', p.id);
        KG.rememberProduct(p.id);
        history.replaceState(null, '', '#product-' + p.id);
        const s = KG.seller(p.sellerId) || {};
        const r = KG.rating(p.id);
        const badges = KG.badgesFor(p);
        const reviews = KG.reviews(p.id).slice().reverse();
        const dom = KG.zoneById('np-valley');
        const vat = C.tax.pricesIncludeVat ? p.price - p.price / (1 + C.tax.vatRate) : 0;
        const title = KG.lang() === 'ne' && p.nameNe ? p.nameNe : p.name;
        const technique = { pashmina: 'Hand-combed & hand-finished', dhaka: 'Handloom geometric weave', lokta: 'Bark-fibre sheet making', metal: 'Lost-wax casting & hand finishing', singingbowl: 'Hand-hammering & tonal tuning', thangka: 'Mineral-pigment hand painting', felt: 'Wet felting by hand', tea: 'Small-batch orthodox processing', beads: 'Traditional bead stringing', wood: 'Hand carving', rugs: 'Tibetan hand-knotting' }[p.category] || 'Handmade craft process';
        const makingTime = { pashmina: '4–7 days', dhaka: '3–6 days', lokta: '2–4 days', metal: '2–5 weeks', singingbowl: '5–10 days', thangka: '3–8 weeks', felt: '1–3 days', tea: 'Seasonal harvest', beads: '1–2 days', wood: '1–3 weeks', rugs: '4–10 weeks' }[p.category] || 'Varies by piece';
        const passportId = 'KG-' + String(p.region || 'NP').slice(0, 3).toUpperCase() + '-' + String(p.id).padStart(4, '0');
        const rows = [
            [KG.tx('Materials', 'सामग्री'), p.materials],
            [KG.tx('Size', 'आकार'), p.size],
            [KG.tx('Weight', 'तौल'), p.weightG ? (p.weightG >= 1000 ? (p.weightG / 1000) + ' kg' : p.weightG + ' g') : ''],
            [KG.tx('Country of origin', 'उत्पत्तिको देश'), p.origin + ' — ' + KG.regionName(p.region)],
            [KG.tx('Seller', 'विक्रेता'), '<button class="text-red-700 dark:text-red-400 font-semibold hover:underline" onclick="KG.openShop(\'' + esc(p.sellerId) + '\')">' + esc(s.shopName || '') + '</button>'],
            [KG.tx('Care', 'हेरचाह'), p.care],
            [KG.tx('Best before', 'प्रयोग अवधि'), p.expiry],
            [KG.tx('Delivery estimate', 'डेलिभरी अनुमान'), KG.tx('Kathmandu Valley ', 'काठमाडौं उपत्यका ') + dom.days + KG.tx(' days · Outside Valley ', ' दिन · उपत्यका बाहिर ') + KG.zoneById('np-outside').days + KG.tx(' days · International 5–14 days', ' दिन · अन्तर्राष्ट्रिय ५–१४ दिन')],
            [KG.tx('Returns', 'फिर्ता'), KG.tx('Exchange or refund within ' + C.protection.returnWindowDays + ' days for faulty or misdescribed items. ', C.protection.returnWindowDays + ' दिनभित्र त्रुटिपूर्ण वा फरक वस्तु साट्न वा रकम फिर्ता। ') + '<a class="underline" href="pages/returns.html" target="_blank">' + KG.tx('Policy', 'नीति') + '</a>'],
            [KG.tx('Payment', 'भुक्तानी'), C.payments.methods.map(function (m) { return m.name; }).join(', ')]
        ].filter(function (x) { return x[1]; });

        const imgs = p.images;
        const body = KG.modal('kgProduct', esc(title),
            '<div class="grid md:grid-cols-2 gap-6">' +
                '<div>' +
                    '<div id="kgZoom" class="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 aspect-[4/3] cursor-zoom-in bg-gray-100 dark:bg-gray-800">' +
                        '<img id="kgMainImg" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '" class="w-full h-full object-cover transition-transform duration-150">' +
                        '<span class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded"><i class="fa-solid fa-magnifying-glass-plus mr-1"></i>' + KG.tx('Hover or tap to zoom', 'जुम गर्न राख्नुहोस्') + '</span>' +
                    '</div>' +
                    (imgs.length > 1 ? '<div class="flex gap-2 mt-2 overflow-x-auto">' + imgs.map(function (src, i) {
                        return '<button type="button" data-thumb="' + i + '" class="w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 ' + (i ? 'border-transparent' : 'border-red-700') + '"><img src="' + esc(src) + '" alt="" class="w-full h-full object-cover"></button>';
                    }).join('') + '</div>' : '') +
                    (p.placeholder ? '<p class="text-[11px] text-amber-700 dark:text-amber-400 mt-2"><i class="fa-solid fa-camera mr-1"></i>' + KG.tx('Sample listing — real product photos coming soon.', 'नमूना सूची — वास्तविक फोटो चाँडै।') + '</p>' : '') +
                '</div>' +
                '<div>' +
                    '<p class="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">' + esc(KG.catName(p.category)) + '</p>' +
                    '<h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">' + esc(title) + '</h2>' +
                    '<p class="text-sm text-gray-600 dark:text-gray-300 mt-1">' + esc(p.sub) + '</p>' +
                    '<div class="flex items-center gap-2 mt-2">' + (r.count ? KG.stars(r.avg, 'text-sm') + '<a href="#kgReviews" class="text-xs text-gray-500 underline">' + r.avg.toFixed(1) + ' · ' + r.count + ' ' + KG.tx('reviews', 'समीक्षा') + '</a>' : '<span class="text-xs text-gray-500">' + KG.tx('No reviews yet', 'अहिलेसम्म समीक्षा छैन') + '</span>') + '</div>' +
                    (badges.length ? '<div class="flex flex-wrap gap-1.5 mt-3">' + badges.map(function (b) { return KG.badgeHtml(b); }).join('') + '</div>' : '') +
                    '<div class="mt-4">' + KG.priceHtml(p.price, 'text-2xl font-extrabold text-red-700 dark:text-red-400') + '</div>' +
                    '<p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">' + (C.tax.pricesIncludeVat ? KG.tx('Price includes ' + Math.round(C.tax.vatRate * 100) + '% VAT (' + KG.npr(vat) + '). ', 'मूल्यमा ' + Math.round(C.tax.vatRate * 100) + '% भ्याट समावेश (' + KG.npr(vat) + ')। ') : '') + KG.tx('Shipping calculated at checkout. No hidden charges.', 'ढुवानी शुल्क चेकआउटमा देखिन्छ। कुनै लुकेको शुल्क छैन।') + '</p>' +
                    (p.description ? '<p class="text-sm text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-line">' + esc(KG.lang() === 'ne' && p.descNe ? p.descNe : p.description) + '</p>' : '') +
                    (p.personalizable ? '<div class="mt-4"><label class="' + ui.label + '" for="kgPersonal"><i class="fa-solid fa-pen-nib mr-1 text-red-700"></i>' + KG.tx('Personalization (optional)', 'आफ्नो अनुरोध (ऐच्छिक)') + '</label><textarea id="kgPersonal" rows="2" maxlength="200" placeholder="' + KG.tx('e.g. initials to embroider, preferred colour, size', 'जस्तै: नाम/अक्षर, रङ, साइज') + '" class="' + ui.input + '"></textarea><p class="' + ui.muted + ' mt-1">' + KG.tx('Custom items may take 3–7 extra days.', 'अनुकूलित वस्तुमा ३–७ दिन थप लाग्न सक्छ।') + '</p></div>' : '') +
                    '<div class="mt-4"><div class="flex items-center justify-between gap-3 mb-2"><label class="' + ui.label + ' !mb-0">' + KG.tx('Gift presentation', 'उपहार प्याकेजिङ') + '</label><span class="text-[10px] uppercase tracking-wider text-gray-400">' + KG.tx('Included', 'समावेश') + '</span></div><div class="kg-packaging-grid">' + KG.PACKAGING.map(function (x, i) {
                        return '<label class="kg-packaging-choice"><input type="radio" name="kgPackaging" value="' + x.id + '"' + (i ? '' : ' checked') + '><span class="kg-packaging-art"><i class="fa-solid ' + x.icon + '"></i></span><span><strong>' + esc(x.name) + '</strong><small>' + esc(x.detail) + '</small></span></label>';
                    }).join('') + '</div></div>' +
                    '<div class="flex items-center gap-2 mt-4">' +
                        '<label class="sr-only" for="kgQty">Quantity</label>' +
                        '<input id="kgQty" type="number" min="1" max="' + (p.stock || 99) + '" value="1" class="' + ui.input + ' !w-20 text-center">' +
                        '<button class="' + ui.btn + ' flex-1" onclick="KG.addProductWithOptions(' + p.id + ')"><i class="fa-solid fa-bag-shopping mr-1"></i>' + t('addToBag') + '</button>' +
                        '<button type="button" data-fav="' + p.id + '" onclick="KG.toggleFav(' + p.id + ', event)" aria-label="Save to favorites" class="' + ui.btn2 + ' ' + (KG.isFav(p.id) ? 'text-red-600' : '') + '"><i class="fa-' + (KG.isFav(p.id) ? 'solid' : 'regular') + ' fa-heart"></i></button>' +
                    '</div>' +
                    '<div class="flex flex-wrap gap-2 mt-3">' +
                        '<button class="' + ui.btn2 + ' !text-xs" onclick="KG.openThread({sellerId:\'' + esc(p.sellerId) + '\', productId:' + p.id + '})"><i class="fa-regular fa-comments mr-1"></i>' + KG.tx('Message the maker', 'शिल्पीलाई सन्देश') + '</button>' +
                        '<button class="' + ui.btn2 + ' !text-xs" onclick="KG.shareProduct(' + p.id + ')"><i class="fa-solid fa-share-nodes mr-1"></i>' + KG.tx('Share', 'सेयर') + '</button>' +
                        '<button class="' + ui.btn2 + ' !text-xs" onclick="KG.giftThis(' + p.id + ')"><i class="fa-solid fa-gift mr-1"></i>' + KG.tx('Send as gift to Nepal', 'नेपालमा उपहार पठाउनुहोस्') + '</button>' +
                    '</div>' +
                    '<p class="text-[11px] text-green-700 dark:text-green-400 mt-3"><i class="fa-solid fa-shield-halved mr-1"></i>' + KG.tx('Covered by KalaGhar Purchase Protection — your payment is held until you receive your order. ', 'KalaGhar खरिद सुरक्षा — सामान नपाएसम्म तपाईंको रकम सुरक्षित राखिन्छ। ') + '<a class="underline" href="pages/purchase-protection.html" target="_blank">' + KG.tx('Learn more', 'थप जानकारी') + '</a></p>' +
                '</div>' +
            '</div>' +
            '<section class="kg-passport mt-7" aria-labelledby="kgPassportTitle"><div class="kg-passport-seal"><i class="fa-solid fa-fingerprint"></i></div><div class="min-w-0"><div class="flex flex-wrap items-center justify-between gap-2"><div><p class="text-[10px] uppercase tracking-[.2em] font-extrabold text-amber-700 dark:text-amber-300">Traceable craft story</p><h4 id="kgPassportTitle" class="font-extrabold text-lg text-gray-900 dark:text-white">KalaGhar Craft Passport</h4></div><code class="kg-passport-id">' + passportId + '</code></div><div class="kg-passport-facts"><span><small>Maker</small><strong>' + esc(s.shopName || 'KalaGhar artisan') + '</strong></span><span><small>Place</small><strong>' + esc(KG.regionName(p.region)) + ', Nepal</strong></span><span><small>Technique</small><strong>' + esc(technique) + '</strong></span><span><small>Making time</small><strong>' + esc(makingTime) + '</strong></span></div><p class="text-[11px] text-gray-500 dark:text-gray-400 mt-3"><i class="fa-solid fa-circle-check text-green-600 mr-1"></i>' + (s.verified ? 'Maker profile verified by KalaGhar. ' : 'Maker profile review in progress. ') + 'Passport details follow this listing from maker to delivery.</p></div></section>' +
            '<div class="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">' +
                '<h4 class="font-bold text-sm text-gray-900 dark:text-white mb-2">' + KG.tx('Product details', 'उत्पादन विवरण') + '</h4>' +
                '<dl class="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">' + rows.map(function (x) {
                    return '<div class="flex gap-2 border-b border-gray-50 dark:border-gray-800/60 pb-1.5"><dt class="w-36 shrink-0 text-gray-500 dark:text-gray-400 text-xs pt-0.5">' + x[0] + '</dt><dd class="text-gray-800 dark:text-gray-200 text-xs">' + (x[0] === KG.tx('Seller', 'विक्रेता') || x[0] === KG.tx('Returns', 'फिर्ता') ? x[1] : esc(x[1])) + '</dd></div>';
                }).join('') + '</dl>' +
            '</div>' +
            '<div id="kgReviews" class="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">' +
                '<h4 class="font-bold text-sm text-gray-900 dark:text-white mb-1">' + KG.tx('Reviews', 'समीक्षा') + (r.count ? ' (' + r.count + ')' : '') + '</h4>' +
                '<p class="' + ui.muted + ' mb-3"><i class="fa-solid fa-circle-check text-green-600 mr-1"></i>' + KG.tx('Only buyers who received this item can review it.', 'यो वस्तु पाएका खरिदकर्ताले मात्र समीक्षा लेख्न सक्छन्।') + '</p>' +
                (reviews.length ? reviews.map(function (rv) {
                    return '<div class="py-3 border-b border-gray-50 dark:border-gray-800/60">' +
                        '<div class="flex items-center gap-2">' + KG.stars(rv.rating) + '<span class="text-xs font-semibold text-gray-800 dark:text-gray-200">' + esc(rv.name) + '</span><span class="text-[10px] text-green-700 dark:text-green-400 font-semibold"><i class="fa-solid fa-check"></i> ' + KG.tx('Verified purchase', 'प्रमाणित खरिद') + '</span><span class="text-[11px] text-gray-400 ml-auto">' + KG.fmtDate(rv.createdAt) + '</span></div>' +
                        '<p class="text-sm text-gray-700 dark:text-gray-300 mt-1">' + esc(rv.text) + '</p>' +
                        (rv.photo ? '<img src="' + esc(rv.photo) + '" alt="Buyer photo" class="mt-2 w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700">' : '') +
                    '</div>';
                }).join('') : '<p class="text-sm text-gray-500">' + KG.tx('No reviews yet — be the first after your order arrives.', 'अहिलेसम्म समीक्षा छैन।') + '</p>') +
            '</div>' +
            moreFromShop(p) +
            '<div class="kg-mobile-buybar"><div><small>' + KG.tx('Handmade in Nepal', 'नेपालमा हस्तनिर्मित') + '</small><strong>' + KG.npr(p.price) + '</strong></div><button type="button" onclick="KG.addProductWithOptions(' + p.id + ')"><i class="fa-solid fa-bag-shopping mr-1"></i>' + t('addToBag') + '</button></div>', 'xl');

        // gallery + zoom
        const zoom = body.querySelector('#kgZoom'), main = body.querySelector('#kgMainImg');
        zoom.addEventListener('mousemove', function (e) {
            const b = zoom.getBoundingClientRect();
            main.style.transformOrigin = ((e.clientX - b.left) / b.width * 100) + '% ' + ((e.clientY - b.top) / b.height * 100) + '%';
            main.style.transform = 'scale(2)';
        });
        zoom.addEventListener('mouseleave', function () { main.style.transform = ''; });
        zoom.addEventListener('click', function () { main.style.transform = main.style.transform ? '' : 'scale(2)'; });
        body.querySelectorAll('[data-thumb]').forEach(function (b) {
            b.addEventListener('click', function () {
                main.src = imgs[+b.dataset.thumb];
                body.querySelectorAll('[data-thumb]').forEach(function (x) { x.classList.replace('border-red-700', 'border-transparent'); });
                b.classList.replace('border-transparent', 'border-red-700');
            });
        });
    };
    KG.addProductWithOptions = function (id) {
        const modal = document.getElementById('kgProduct');
        const qty = modal && modal.querySelector('#kgQty');
        const personal = modal && modal.querySelector('#kgPersonal');
        const pack = modal && modal.querySelector('input[name="kgPackaging"]:checked');
        KG.addToCart(id, qty ? +qty.value : 1, personal ? personal.value : '', false, pack ? pack.value : 'heritage');
    };
    function moreFromShop(p) {
        const more = KG.products().filter(function (x) { return x.sellerId === p.sellerId && x.id !== p.id; }).slice(0, 4);
        if (!more.length) return '';
        return '<div class="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4"><h4 class="font-bold text-sm text-gray-900 dark:text-white mb-3">' + KG.tx('More from this shop', 'यस पसलका अरू') + '</h4>' + KG.miniGrid(more) + '</div>';
    }
    KG.miniGrid = function (list) {
        return '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">' + list.map(function (x) {
            return '<button type="button" onclick="KG.openProduct(' + x.id + ')" class="text-left group"><div class="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"><img src="' + esc(x.image) + '" alt="" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition"></div><p class="text-xs font-semibold mt-1 text-gray-800 dark:text-gray-200 line-clamp-2">' + esc(x.name) + '</p><p class="text-xs text-red-700 dark:text-red-400 font-bold">' + KG.npr(x.price) + '</p></button>';
        }).join('') + '</div>';
    };
    KG.shareProduct = function (id) {
        const url = location.origin + location.pathname + '#product-' + id;
        const p = KG.product(id);
        if (navigator.share) navigator.share({ title: p.name, text: p.sub, url: url }).catch(function () {});
        else navigator.clipboard.writeText(url).then(function () { KG.toast(KG.tx('Link copied', 'लिङ्क कपी भयो')); });
    };

    /* ---------------------------- favorites view ---------------------------- */
    KG.openFavorites = function (sharedIds) {
        const ids = sharedIds || KG.favs();
        const list = ids.map(function (id) { return KG.product(id); }).filter(Boolean);
        const shared = !!sharedIds;
        const body = KG.modal('kgFavsModal', shared ? KG.tx('Shared collection', 'सेयर गरिएको संग्रह') : '<i class="fa-solid fa-heart text-red-600 mr-1"></i>' + t('kgFavs'),
            (list.length ? KG.miniGrid(list) : '<p class="text-sm text-gray-500 text-center py-8">' + KG.tx('Tap the heart on any item to save it here.', 'कुनै पनि वस्तुमा मुटु थिचेर यहाँ राख्नुहोस्।') + '</p>') +
            (list.length && !shared ? '<div class="flex flex-wrap gap-2 mt-5"><button class="' + ui.btn + '" onclick="KG.shareFavs()"><i class="fa-solid fa-link mr-1"></i>' + KG.tx('Share this collection', 'संग्रह सेयर गर्नुहोस्') + '</button><button class="' + ui.btn2 + '" onclick="KG.favsToCart()">' + KG.tx('Add all to bag', 'सबै झोलामा') + '</button></div>' : '') +
            (shared && list.length ? '<button class="' + ui.btn2 + ' mt-5" onclick="KG.store.set(\'kg-favs\', Array.from(new Set(KG.favs().concat([' + ids.join(',') + ']))));KG.updateFavCount();KG.toast(KG.tx(\'Saved to your favorites\',\'मनपर्नेमा राखियो\'))"><i class="fa-regular fa-heart mr-1"></i>' + KG.tx('Save all to my favorites', 'सबै मनपर्नेमा राख्नुहोस्') + '</button>' : ''), 'xl');
        return body;
    };
    KG.shareFavs = function () {
        const url = location.origin + location.pathname + '#collection=' + KG.favs().join(',');
        navigator.clipboard.writeText(url).then(function () { KG.toast(KG.tx('Collection link copied — send it to anyone', 'संग्रहको लिङ्क कपी भयो')); });
    };
    KG.favsToCart = function () { KG.favs().forEach(function (id) { KG.addToCart(id, 1, '', true); }); KG.toast(KG.tx('Added to your bag', 'झोलामा थपियो')); };

    /* ---------------------------- Gift Mode ---------------------------- */
    const RECIPIENTS = [
        { id: 'mother', en: 'Mother', ne: 'आमा', cats: ['pashmina', 'dhaka', 'beads', 'tea', 'clothes'] },
        { id: 'father', en: 'Father', ne: 'बुबा', cats: ['dhaka', 'tea', 'metal', 'singingbowl', 'lokta'] },
        { id: 'partner', en: 'Partner', ne: 'जीवनसाथी', cats: ['pashmina', 'beads', 'accessories', 'felt', 'thangka'] },
        { id: 'friend', en: 'Friend', ne: 'साथी', cats: ['felt', 'lokta', 'bags', 'accessories', 'tea'] },
        { id: 'colleague', en: 'Colleague / Client', ne: 'सहकर्मी', cats: ['lokta', 'tea', 'singingbowl', 'homedecor'] },
        { id: 'home', en: 'New home', ne: 'नयाँ घर', cats: ['homedecor', 'wood', 'rugs', 'metal', 'thangka'] },
        { id: 'self', en: 'Myself', ne: 'आफैं', cats: [] }
    ];
    const OCCASIONS = [
        { id: 'dashain', en: 'Dashain', ne: 'दशैं', cats: ['pashmina', 'dhaka', 'clothes', 'metal'] },
        { id: 'tihar', en: 'Tihar', ne: 'तिहार', cats: ['homedecor', 'beads', 'tea', 'accessories'] },
        { id: 'birthday', en: 'Birthday', ne: 'जन्मदिन', cats: [] },
        { id: 'wedding', en: 'Wedding', ne: 'विवाह', cats: ['pashmina', 'beads', 'metal', 'rugs', 'thangka'] },
        { id: 'christmas', en: 'Christmas / Holidays', ne: 'क्रिसमस', cats: ['felt', 'pashmina', 'singingbowl', 'tea'] },
        { id: 'thanks', en: 'Thank you', ne: 'धन्यवाद', cats: ['lokta', 'tea', 'felt'] },
        { id: 'wellness', en: 'Wellness / Meditation', ne: 'ध्यान', cats: ['singingbowl', 'thangka', 'felt'] }
    ];
    KG.openGiftMode = function () {
        const state = { who: null, occ: null, max: 10000, craft: '', destination: 'nepal', personal: false };
        const chip = function (group, x) { return '<button type="button" data-' + group + '="' + x.id + '" class="kg-chip text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 hover:border-red-700">' + esc(KG.tx(x.en, x.ne)) + '</button>'; };
        const body = KG.modal('kgGift', '<i class="fa-solid fa-gift text-red-700 mr-1"></i>' + t('kgGiftMode'),
            '<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">' + KG.tx('Tell us who it\'s for and we\'ll suggest handmade gifts from Nepal.', 'कसका लागि हो भन्नुहोस्, हामी नेपाली हस्तकलाका उपहार सुझाउँछौं।') + '</p>' +
            '<p class="' + ui.label + '">' + KG.tx('Who is it for?', 'कसका लागि?') + '</p><div class="flex flex-wrap gap-2 mb-4">' + RECIPIENTS.map(function (x) { return chip('who', x); }).join('') + '</div>' +
            '<p class="' + ui.label + '">' + KG.tx('Occasion', 'अवसर') + '</p><div class="flex flex-wrap gap-2 mb-4">' + OCCASIONS.map(function (x) { return chip('occ', x); }).join('') + '</div>' +
            '<div class="grid sm:grid-cols-3 gap-3 mb-4"><div><label class="' + ui.label + '" for="kgGiftCraft">' + KG.tx('Preferred craft', 'मनपर्ने शिल्प') + '</label><select id="kgGiftCraft" class="' + ui.input + '"><option value="">' + KG.tx('Surprise me', 'आश्चर्य दिनुहोस्') + '</option>' + KG.visibleCategories().map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(KG.tx(c.en, c.ne)) + '</option>'; }).join('') + '</select></div><div><label class="' + ui.label + '" for="kgGiftDestination">' + KG.tx('Deliver to', 'डेलिभरी स्थान') + '</label><select id="kgGiftDestination" class="' + ui.input + '"><option value="nepal">Nepal</option><option value="international">International</option></select></div><label class="kg-gift-personal"><input id="kgGiftPersonal" type="checkbox" class="accent-red-700"><span><strong>' + KG.tx('Personalizable only', 'अनुकूलित मात्र') + '</strong><small>' + KG.tx('Names, colours or sizes', 'नाम, रङ वा साइज') + '</small></span></label></div>' +
            '<label class="' + ui.label + '" for="kgGiftBudget">' + KG.tx('Budget up to', 'बजेट') + ' <span id="kgGiftBudgetVal" class="text-red-700 dark:text-red-400">' + KG.npr(10000) + '</span></label>' +
            '<input id="kgGiftBudget" type="range" min="500" max="30000" step="500" value="10000" class="w-full accent-red-700 mb-5">' +
            '<div id="kgGiftResults"></div>', 'xl');
        function render() {
            let list = KG.products().filter(function (p) { return p.price <= state.max; });
            const who = RECIPIENTS.find(function (x) { return x.id === state.who; });
            const occ = OCCASIONS.find(function (x) { return x.id === state.occ; });
            list = list.map(function (p) {
                let s = 0;
                if (who && who.cats.indexOf(p.category) > -1) s += 2;
                if (occ && occ.cats.indexOf(p.category) > -1) s += 2;
                if (state.craft && p.category === state.craft) s += 4;
                if (p.personalizable) s += 0.5;
                if (state.destination === 'international') s += (p.weightG || 500) <= 1000 ? 1 : -.5;
                s += KG.rating(p.id).avg / 5;
                const why = [];
                if (who && who.cats.indexOf(p.category) > -1) why.push(KG.tx('fits recipient', 'प्राप्तकर्तालाई सुहाउँछ'));
                if (occ && occ.cats.indexOf(p.category) > -1) why.push(KG.tx('occasion match', 'अवसर मिल्दो'));
                if (state.craft && p.category === state.craft) why.push(KG.tx('your craft choice', 'तपाईंको शिल्प'));
                if (p.personalizable) why.push(KG.tx('personalizable', 'अनुकूलित गर्न मिल्ने'));
                if (state.destination === 'international' && (p.weightG || 500) <= 1000) why.push(KG.tx('easy to ship', 'पठाउन सजिलो'));
                return { p: p, s: s, why: why };
            });
            const needsMatch = (who && who.cats.length) || (occ && occ.cats.length);
            list = list.filter(function (x) { return (!state.personal || x.p.personalizable) && (!needsMatch || x.s >= 2); })
              .sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
            body.querySelector('#kgGiftResults').innerHTML = list.length
                ? '<p class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">' + KG.tx('Best matches for you', 'तपाईंका उत्कृष्ट मिलान') + '</p><div class="grid grid-cols-2 sm:grid-cols-4 gap-3">' + list.map(function (x) { return '<button type="button" onclick="KG.openProduct(' + x.p.id + ')" class="kg-gift-result group"><img src="' + esc(x.p.image) + '" alt="" loading="lazy"><strong>' + esc(x.p.name) + '</strong><span>' + KG.npr(x.p.price) + '</span><small>' + esc((x.why.length ? x.why : [KG.tx('within your budget', 'तपाईंको बजेटमा')]).slice(0, 2).join(' · ')) + '</small></button>'; }).join('') + '</div>'
                : '<p class="text-sm text-gray-500">' + KG.tx('No matches in this budget — try raising it.', 'यो बजेटमा केही भेटिएन।') + '</p>';
        }
        body.addEventListener('click', function (e) {
            const b = e.target.closest('.kg-chip'); if (!b) return;
            const g = b.dataset.who ? 'who' : 'occ';
            state[g] = state[g] === b.dataset[g] ? null : b.dataset[g];
            body.querySelectorAll('[data-' + g + ']').forEach(function (x) {
                const on = x.dataset[g] === state[g];
                x.classList.toggle('bg-red-700', on); x.classList.toggle('text-white', on); x.classList.toggle('border-red-700', on);
            });
            render();
        });
        body.querySelector('#kgGiftBudget').addEventListener('input', function (e) {
            state.max = +e.target.value; body.querySelector('#kgGiftBudgetVal').textContent = KG.npr(state.max); render();
        });
        body.querySelector('#kgGiftCraft').addEventListener('change', function (e) { state.craft = e.target.value; render(); });
        body.querySelector('#kgGiftDestination').addEventListener('change', function (e) { state.destination = e.target.value; render(); });
        body.querySelector('#kgGiftPersonal').addEventListener('change', function (e) { state.personal = e.target.checked; render(); });
        render();
    };

    /* ---------------------------- shipping ---------------------------- */
    KG.zoneById = function (id) { return C.shipping.zones.find(function (z) { return z.id === id; }) || C.shipping.zones[0]; };
    KG.shippingCost = function (zoneId, goodsNpr, weightG) {
        const z = KG.zoneById(zoneId);
        if (z.domestic && goodsNpr >= C.shipping.freeDomesticOver) return 0;
        const kg = Math.max(0.5, (weightG || 500) / 1000);
        return Math.round(z.base + z.perKg * Math.max(0, Math.ceil((kg - 0.5) * 2) / 2));
    };
    window.calcShipping = function () {
        const sel = document.getElementById('shippingDest'), valEl = document.getElementById('shippingValue'), out = document.getElementById('shippingResult');
        if (!sel || !out) return;
        const zone = KG.zoneById(sel.value);
        const val = parseFloat(valEl.value) || 0;
        const wEl = document.getElementById('kgShipWeight');
        const w = wEl ? (parseFloat(wEl.value) || 0.5) * 1000 : 500;
        const cost = KG.shippingCost(zone.id, val, w);
        let msg;
        if (zone.domestic && cost === 0) msg = '🚚 ' + KG.tx('Free delivery! Arrives in ', 'निःशुल्क डेलिभरी! ') + zone.days + KG.tx(' business days.', ' कार्यदिवसमा पुग्छ।');
        else {
            msg = (zone.domestic ? '📦 ' : '✈️ ') + esc(zone.label) + ': <strong>' + KG.npr(cost) + '</strong>' + (KG.cur !== 'NPR' ? ' (≈ ' + KG.fx(cost) + ')' : '') + ', ' + zone.days + KG.tx(' business days.', ' कार्यदिवस।');
            if (zone.domestic) msg += ' ' + KG.tx('Add ', 'निःशुल्क डेलिभरीका लागि ') + KG.npr(C.shipping.freeDomesticOver - val) + KG.tx(' more for free delivery.', ' थप्नुहोस्।');
            else msg += '<br><span class="opacity-80">' + KG.tx('Import duties in your country may apply and are paid on delivery.', 'तपाईंको देशको भन्सार शुल्क लाग्न सक्छ।') + '</span>';
        }
        out.innerHTML = '<div class="' + (zone.domestic ? (cost === 0 ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200') : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200') + ' border rounded p-3 text-xs">' + msg + '</div>';
    };
    function upgradeShippingCalculator() {
        const sel = document.getElementById('shippingDest'); if (!sel || sel.dataset.kg) return;
        sel.dataset.kg = '1';
        sel.innerHTML = C.shipping.zones.map(function (z) { return '<option value="' + z.id + '">' + esc(z.label) + '</option>'; }).join('');
        const valEl = document.getElementById('shippingValue');
        const grid = valEl.closest('.grid');
        grid.classList.replace('sm:grid-cols-2', 'sm:grid-cols-3');
        const w = document.createElement('div');
        w.innerHTML = '<label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1" for="kgShipWeight">' + KG.tx('Parcel weight (kg)', 'पार्सल तौल (केजी)') + '</label><input id="kgShipWeight" type="number" min="0.1" step="0.1" value="0.5" oninput="calcShipping()" class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded p-2 text-sm">';
        grid.appendChild(w);
        const note = document.createElement('p');
        note.className = 'text-[11px] text-gray-500 dark:text-gray-400 mt-2';
        note.innerHTML = KG.tx('Domestic delivery by Nepal Can Move or Pathao. International parcels ship through the KalaGhar Export Hub with tracking. ', 'नेपालभित्र Nepal Can Move वा Pathao मार्फत। अन्तर्राष्ट्रिय पार्सल KalaGhar निर्यात केन्द्रबाट ट्र्याकिङसहित। ') + '<a class="underline" href="pages/delivery.html" target="_blank">' + KG.tx('Delivery policy', 'डेलिभरी नीति') + '</a>';
        document.getElementById('shippingResult').after(note);
    }

    /* ---------------------------- header controls ---------------------------- */
    function upgradeHeader() {
        const heart = document.querySelector('header a .fa-heart');
        if (heart) {
            const a = heart.closest('a'); a.classList.add('relative'); a.setAttribute('aria-label', 'Favorites');
            a.addEventListener('click', function (e) { e.preventDefault(); KG.openFavorites(); });
            a.insertAdjacentHTML('beforeend', '<span id="kgFavCount" class="hidden absolute top-0.5 right-0.5 kg-grad text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">0</span>');
        }
        const bag = document.getElementById('cartCounter');
        if (bag) { const a = bag.closest('a'); a.setAttribute('aria-label', 'Shopping bag'); a.addEventListener('click', function (e) { e.preventDefault(); KG.openCart(); }); }

        // account button → account menu when signed in
        const acct = document.getElementById('userStatusLabel');
        if (acct) {
            const btn = acct.closest('button');
            btn.removeAttribute('onclick');
            btn.addEventListener('click', function () { if (KG.user()) KG.openAccount(); else openModal('customerAuthModal'); });
        }

        // filter note above product grid
        const grid = document.getElementById('productGrid');
        if (grid && !document.getElementById('kgFilterNote')) grid.insertAdjacentHTML('beforebegin', '<div id="kgFilterNote" class="hidden mb-4 text-sm bg-amber-50 dark:bg-gray-900 border border-amber-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"></div>');
    }

    /* ---------------------------- categories bar ---------------------------- */
    /* ---------------------------- Etsy-style Categories menu ---------------------------- */
    const CAT_ICONS = { pashmina: 'fa-mitten', dhaka: 'fa-shirt', lokta: 'fa-book', metal: 'fa-om', singingbowl: 'fa-bell', thangka: 'fa-palette', felt: 'fa-circle', tea: 'fa-mug-hot', beads: 'fa-gem', wood: 'fa-tree', rugs: 'fa-rug', shoes: 'fa-shoe-prints', bags: 'fa-bag-shopping', homedecor: 'fa-couch', clothes: 'fa-vest', accessories: 'fa-glasses' };
    function visibleCategories() { return typeof KG.visibleCategories === 'function' ? KG.visibleCategories() : KG.CATEGORIES.filter(function (category) { return category.visible !== false; }); }
    KG.goCategory = function (id) { KG.closeCatMenu(); KG.closeModal('kgCatDrawer'); KG.activeRegion = null; filterCategory(id); document.getElementById('marketplace').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    function catPreview(id) {
        const list = KG.products().filter(function (p) { return id === 'all' || p.category === id; }).slice(0, 6);
        const title = id === 'all' ? KG.tx('All Crafts', 'सबै शिल्प') : KG.catName(id);
        return '<div class="flex items-center justify-between mb-4"><h3 class="text-lg font-bold text-gray-900 dark:text-white">' + esc(title) + '</h3>' +
            '<button class="text-sm font-semibold text-red-700 dark:text-amber-300 hover:underline" onclick="KG.goCategory(\'' + id + '\')">' + KG.tx('See all', 'सबै हेर्नुहोस्') + ' <i class="fa-solid fa-arrow-right text-xs"></i></button></div>' +
            (list.length ? '<div class="grid grid-cols-3 gap-4">' + list.map(function (p) {
                return '<button type="button" class="text-left group" onclick="KG.closeCatMenu();KG.openProduct(' + p.id + ')"><div class="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800"><img src="' + esc(p.image) + '" alt="" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-300"></div><p class="text-xs font-semibold mt-1.5 text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:underline">' + esc(p.name) + '</p></button>';
            }).join('') + '</div>' : '<p class="text-sm text-gray-500">' + KG.tx('New pieces coming soon.', 'नयाँ वस्तु चाँडै आउँदैछन्।') + '</p>');
    }
    function buildCatMenu() {
        const panel = document.getElementById('kgCatPanel'), btn = document.getElementById('kgCatBtn');
        if (!panel || !btn) return;
        const cats = [{ id: 'all', en: 'All Crafts', ne: 'सबै शिल्प' }].concat(visibleCategories());
        panel.innerHTML = '<div class="max-w-[1440px] mx-auto px-4 lg:px-8"><div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex overflow-hidden max-h-[70vh]">' +
            '<ul class="w-72 shrink-0 border-r border-gray-100 dark:border-gray-800 py-2 overflow-y-auto">' + cats.map(function (c) {
                return '<li><button type="button" role="menuitem" data-cat="' + c.id + '" class="kg-catitem w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-gray-800 dark:text-gray-100"><i class="fa-solid ' + (c.icon || CAT_ICONS[c.id] || 'fa-border-all') + ' w-4 text-center text-gray-500"></i><span class="flex-1">' + esc(KG.tx(c.en, c.ne)) + '</span><i class="fa-solid fa-chevron-right text-[10px] text-gray-400"></i></button></li>';
            }).join('') + '</ul><div id="kgCatPreview" class="flex-1 p-6 overflow-y-auto"></div></div></div>';
        const show = function (id) {
            panel.querySelectorAll('.kg-catitem').forEach(function (b) { b.classList.toggle('kg-catitem-on', b.dataset.cat === id); });
            panel.querySelector('#kgCatPreview').innerHTML = catPreview(id);
        };
        panel.querySelectorAll('.kg-catitem').forEach(function (b) {
            b.addEventListener('mouseenter', function () { show(b.dataset.cat); });
            b.addEventListener('focus', function () { show(b.dataset.cat); });
            b.addEventListener('click', function () { KG.goCategory(b.dataset.cat); });
        });
        show('all');
    }
    KG.closeCatMenu = function () {
        const panel = document.getElementById('kgCatPanel'), btn = document.getElementById('kgCatBtn');
        if (panel) panel.classList.add('hidden'); if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('bg-gray-100', 'dark:bg-gray-800'); }
    };
    function openCatDrawer() {
        const cats = [{ id: 'all', en: 'All Crafts', ne: 'सबै शिल्प' }].concat(visibleCategories());
        KG.modal('kgCatDrawer', KG.tx('Categories', 'वर्गहरू'), '<ul class="-mx-5 -my-2">' + cats.map(function (c) {
            return '<li><button type="button" onclick="KG.goCategory(\'' + c.id + '\')" class="w-full flex items-center gap-3 px-5 py-3 text-left text-sm border-b border-gray-100 dark:border-gray-800 hover:bg-amber-50 dark:hover:bg-gray-800"><i class="fa-solid ' + (c.icon || CAT_ICONS[c.id] || 'fa-border-all') + ' w-5 text-center text-red-700 dark:text-amber-300"></i><span class="flex-1 font-medium">' + esc(KG.tx(c.en, c.ne)) + '</span><i class="fa-solid fa-chevron-right text-xs text-gray-400"></i></button></li>';
        }).join('') + '</ul>', 'md');
    }
    function renderCategoryTiles() {
        const host = document.getElementById('kgCategoryTiles'); if (!host) return;
        host.innerHTML = visibleCategories().map(function (category) {
            const products = KG.products().filter(function (product) { return product.category === category.id; });
            const image = products.length ? products[0].image : KG.placeholder(category.en, '#7c2d12', '#d97706', '✦');
            return '<button type="button" onclick="KG.goCategory(\'' + category.id + '\')" class="kg-cattile group flex flex-col items-center text-center">' +
                '<span class="block w-full aspect-square rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-amber-500 group-focus-visible:ring-amber-500 shadow-md transition"><img src="' + esc(image) + '" alt="" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition duration-300"></span>' +
                '<span class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug group-hover:text-red-700 dark:group-hover:text-amber-300">' + esc(KG.tx(category.en, category.ne)) + '</span>' +
                '<span class="text-[11px] text-gray-500 dark:text-gray-400">' + products.length + ' ' + KG.tx(products.length === 1 ? 'item' : 'items', 'वस्तु') + '</span></button>';
        }).join('');
    }
    KG.refreshCategoryUI = function () {
        renderCategoryTiles();
        const panel = document.getElementById('kgCatPanel'); if (panel && !panel.classList.contains('hidden')) buildCatMenu();
        const pf = document.getElementById('pfCategory');
        if (pf) {
            const selected = pf.value;
            pf.innerHTML = visibleCategories().map(function (category) { return '<option value="' + esc(category.id) + '">' + esc(category.en) + '</option>'; }).join('');
            if (visibleCategories().some(function (category) { return category.id === selected; })) pf.value = selected;
        }
    };
    function wireCatMenu() {
        const panel = document.getElementById('kgCatPanel'), btn = document.getElementById('kgCatBtn');
        if (!panel || !btn || btn.dataset.kg) return;
        btn.dataset.kg = '1';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (window.innerWidth < 768) return openCatDrawer();
            const open = panel.classList.contains('hidden');
            if (open) { buildCatMenu(); panel.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true'); btn.classList.add('bg-gray-100', 'dark:bg-gray-800'); }
            else KG.closeCatMenu();
        });
        document.addEventListener('click', function (e) { if (!panel.classList.contains('hidden') && !panel.contains(e.target)) KG.closeCatMenu(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') KG.closeCatMenu(); });
        window.addEventListener('scroll', function () { if (window.scrollY > 600) KG.closeCatMenu(); }, { passive: true });
    }

    /* ---------------------------- Etsy-style featured row ---------------------------- */
    KG.renderFeatured = function () {
        // The row itself is in index.html; here we only update the seasonal link and labels
        const li = document.getElementById('kgFestivalItem'); if (!li) return;
        const f = KG.activeFestival ? KG.activeFestival() : null;
        li.classList.toggle('hidden', !f);
        if (f) li.querySelector('button').textContent = KG.tx(f.name + ' Gifts', f.ne + 'का उपहार');
        const g = document.querySelector('#kgFeatured li:first-child button');
        if (g) g.innerHTML = '<i class="fa-solid fa-gift mr-1.5"></i>' + KG.tx('Gifts', 'उपहार');
    };

    // Etsy lines the row up with the search bar: first link starts under its left edge
    KG.alignFeatured = function () {
        const ul = document.getElementById('kgFeatured'), input = document.getElementById('searchInput');
        if (!ul || !input) return;
        const nav = ul.parentElement;
        if (window.innerWidth < 768) { ul.style.marginLeft = ''; ul.style.marginRight = ''; return; }
        ul.style.marginLeft = '0'; ul.style.marginRight = '0';
        // Line "Gifts" up with the Categories button's icon
        const cat = document.getElementById('kgCatBtn');
        const anchor = cat && cat.offsetParent ? cat.getBoundingClientRect().left + parseFloat(getComputedStyle(cat).paddingLeft) : input.parentElement.getBoundingClientRect().left + 14;
        const want = Math.round(anchor - nav.getBoundingClientRect().left) - 2;   // -2 = the link's own side padding
        const fit = nav.clientWidth - ul.scrollWidth - 16;                  // …but never push links off the right edge
        ul.style.marginLeft = Math.max(0, Math.min(want, fit)) + 'px';
    };
    window.addEventListener('resize', function () { KG.alignFeatured(); });

    // The footer already contains phone and WhatsApp links, so hide the floating
    // support cluster while the footer is visible instead of covering legal text.
    KG.watchFloat = function () {
        const fl = document.getElementById('kgFloat'), footer = document.querySelector('footer');
        if (!fl || !footer || !('IntersectionObserver' in window)) return;
        new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { fl.classList.toggle('kg-float-in-footer', e.isIntersecting); });
        }, { threshold: 0.08 }).observe(footer);
    };

    /* ---------------------------- language / currency (footer, like Etsy) ---------------------------- */
    const LOCALES = [
        { code: 'NP', en: 'Nepal', ne: 'नेपाल', currency: 'NPR' },
        { code: 'US', en: 'United States', ne: 'संयुक्त राज्य', currency: 'USD' },
        { code: 'GB', en: 'United Kingdom', ne: 'बेलायत', currency: 'GBP' },
        { code: 'AU', en: 'Australia', ne: 'अस्ट्रेलिया', currency: 'AUD' },
        { code: 'IN', en: 'India', ne: 'भारत', currency: 'INR' },
        { code: 'JP', en: 'Japan', ne: 'जापान', currency: 'JPY' },
        { code: 'DE', en: 'Germany', ne: 'जर्मनी', currency: 'EUR' },
        { code: 'FR', en: 'France', ne: 'फ्रान्स', currency: 'EUR' }
    ];
    function currentLocale() {
        const code = KG.store.get('kg-country', 'NP');
        return LOCALES.find(function (item) { return item.code === code; }) || LOCALES[0];
    }
    KG.updateLocaleLabel = function () {
        const locale = currentLocale();
        const el = document.getElementById('kgLocaleLabel'), flag = document.getElementById('kgLocaleFlag');
        if (el) el.textContent = (KG.lang() === 'ne' ? locale.ne : locale.en) + ' · ' + (KG.lang() === 'ne' ? 'नेपाली' : 'English') + ' · ' + KG.cur;
        if (flag) flag.src = 'https://flagcdn.com/24x18/' + locale.code.toLowerCase() + '.png';
    };
    KG.openLocale = function () {
        const body = KG.modal('kgLocale', KG.tx('Update your settings', 'सेटिङ अद्यावधिक'),
            '<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">' + KG.tx('Set where you live, what language you speak and the currency you use.', 'भाषा र मुद्रा छान्नुहोस्।') + '</p>' +
            '<div class="space-y-4"><div><label class="' + ui.label + '" for="lc-country">' + KG.tx('Country or region', 'देश वा क्षेत्र') + '</label><select id="lc-country" class="' + ui.input + '">' + LOCALES.map(function (item) { return '<option value="' + item.code + '">' + (KG.lang() === 'ne' ? item.ne : item.en) + '</option>'; }).join('') + '</select></div>' +
            '<div><label class="' + ui.label + '" for="lc-lang">' + KG.tx('Language', 'भाषा') + '</label><select id="lc-lang" class="' + ui.input + '"><option value="en">English</option><option value="ne">नेपाली (Nepali)</option></select></div>' +
            '<div><label class="' + ui.label + '" for="lc-cur">' + KG.tx('Currency', 'मुद्रा') + '</label><select id="lc-cur" class="' + ui.input + '">' + Object.keys(C.currency.fallbackRates).map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select></div>' +
            '<p class="' + ui.muted + '">' + KG.tx('Prices are charged in NPR. Other currencies are estimates.', 'मूल्य NPR मा लिइन्छ। अन्य मुद्रा अनुमान मात्र हुन्।') + '</p>' +
            '<div class="flex gap-2 justify-end"><button type="button" data-close class="' + ui.btn2 + '">' + KG.tx('Cancel', 'रद्द') + '</button><button type="button" id="lc-save" class="' + ui.btn + '">' + KG.tx('Save', 'सुरक्षित') + '</button></div></div>');
        body.querySelector('#lc-country').value = currentLocale().code;
        body.querySelector('#lc-lang').value = KG.lang(); body.querySelector('#lc-cur').value = KG.cur;
        body.querySelector('#lc-country').addEventListener('change', function (event) {
            const selected = LOCALES.find(function (item) { return item.code === event.target.value; });
            if (selected) body.querySelector('#lc-cur').value = selected.currency;
        });
        body.querySelector('#lc-save').addEventListener('click', function () {
            const country = body.querySelector('#lc-country').value, l = body.querySelector('#lc-lang').value, c = body.querySelector('#lc-cur').value;
            KG.closeModal('kgLocale');
            KG.store.set('kg-country', country); KG.setCurrency(c);
            if (typeof selectLang === 'function') selectLang(l); else applyLang(l);
            calcShipping(); KG.updateLocaleLabel();
        });
    };

    KG.initShop = function () {
        upgradeHeader(); wireCatMenu(); upgradeShippingCalculator(); KG.watchFloat();
        KG.alignFeatured(); setTimeout(KG.alignFeatured, 600); if (document.fonts) document.fonts.ready.then(KG.alignFeatured);
        const pf = document.getElementById('pfCategory');
        if (pf) KG.refreshCategoryUI();
        KG.updateFavCount();
        renderProducts(); calcShipping();
    };
})();
