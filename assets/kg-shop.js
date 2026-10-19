/* =====================================================================
   KALAGHAR SHOP — product cards, product page, favorites, Gift Mode,
   currency selector, shipping calculator
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, C = KG.C, esc = KG.esc, ui = KG.ui;

    KG.activeRegion = null;

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
        KG.updateFavCount(); KG.updateLocaleLabel();
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
        history.replaceState(null, '', '#product-' + p.id);
        const s = KG.seller(p.sellerId) || {};
        const r = KG.rating(p.id);
        const badges = KG.badgesFor(p);
        const reviews = KG.reviews(p.id).slice().reverse();
        const dom = KG.zoneById('np-valley');
        const vat = C.tax.pricesIncludeVat ? p.price - p.price / (1 + C.tax.vatRate) : 0;
        const title = KG.lang() === 'ne' && p.nameNe ? p.nameNe : p.name;
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
                    '<div class="flex items-center gap-2 mt-4">' +
                        '<label class="sr-only" for="kgQty">Quantity</label>' +
                        '<input id="kgQty" type="number" min="1" max="' + (p.stock || 99) + '" value="1" class="' + ui.input + ' !w-20 text-center">' +
                        '<button class="' + ui.btn + ' flex-1" onclick="KG.addToCart(' + p.id + ', +document.getElementById(\'kgQty\').value, (document.getElementById(\'kgPersonal\')||{}).value)"><i class="fa-solid fa-bag-shopping mr-1"></i>' + t('addToBag') + '</button>' +
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
            moreFromShop(p), 'xl');

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
        const state = { who: null, occ: null, max: 10000 };
        const chip = function (group, x) { return '<button type="button" data-' + group + '="' + x.id + '" class="kg-chip text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 hover:border-red-700">' + esc(KG.tx(x.en, x.ne)) + '</button>'; };
        const body = KG.modal('kgGift', '<i class="fa-solid fa-gift text-red-700 mr-1"></i>' + t('kgGiftMode'),
            '<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">' + KG.tx('Tell us who it\'s for and we\'ll suggest handmade gifts from Nepal.', 'कसका लागि हो भन्नुहोस्, हामी नेपाली हस्तकलाका उपहार सुझाउँछौं।') + '</p>' +
            '<p class="' + ui.label + '">' + KG.tx('Who is it for?', 'कसका लागि?') + '</p><div class="flex flex-wrap gap-2 mb-4">' + RECIPIENTS.map(function (x) { return chip('who', x); }).join('') + '</div>' +
            '<p class="' + ui.label + '">' + KG.tx('Occasion', 'अवसर') + '</p><div class="flex flex-wrap gap-2 mb-4">' + OCCASIONS.map(function (x) { return chip('occ', x); }).join('') + '</div>' +
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
                if (p.personalizable) s += 0.5;
                s += KG.rating(p.id).avg / 5;
                return { p: p, s: s };
            });
            const needsMatch = (who && who.cats.length) || (occ && occ.cats.length);
            list = list.filter(function (x) { return !needsMatch || x.s >= 2; })
              .sort(function (a, b) { return b.s - a.s; }).slice(0, 8).map(function (x) { return x.p; });
            body.querySelector('#kgGiftResults').innerHTML = list.length
                ? '<p class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">' + KG.tx('Gift ideas', 'उपहार सुझाव') + '</p>' + KG.miniGrid(list)
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
        const cats = [{ id: 'all', en: 'All Crafts', ne: 'सबै शिल्प' }].concat(KG.CATEGORIES);
        panel.innerHTML = '<div class="max-w-[1440px] mx-auto px-4 lg:px-8"><div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex overflow-hidden max-h-[70vh]">' +
            '<ul class="w-72 shrink-0 border-r border-gray-100 dark:border-gray-800 py-2 overflow-y-auto">' + cats.map(function (c) {
                return '<li><button type="button" role="menuitem" data-cat="' + c.id + '" class="kg-catitem w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-gray-800 dark:text-gray-100"><i class="fa-solid ' + (CAT_ICONS[c.id] || 'fa-border-all') + ' w-4 text-center text-gray-500"></i><span class="flex-1">' + esc(KG.tx(c.en, c.ne)) + '</span><i class="fa-solid fa-chevron-right text-[10px] text-gray-400"></i></button></li>';
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
        const cats = [{ id: 'all', en: 'All Crafts', ne: 'सबै शिल्प' }].concat(KG.CATEGORIES);
        KG.modal('kgCatDrawer', KG.tx('Categories', 'वर्गहरू'), '<ul class="-mx-5 -my-2">' + cats.map(function (c) {
            return '<li><button type="button" onclick="KG.goCategory(\'' + c.id + '\')" class="w-full flex items-center gap-3 px-5 py-3 text-left text-sm border-b border-gray-100 dark:border-gray-800 hover:bg-amber-50 dark:hover:bg-gray-800"><i class="fa-solid ' + (CAT_ICONS[c.id] || 'fa-border-all') + ' w-5 text-center text-red-700 dark:text-amber-300"></i><span class="flex-1 font-medium">' + esc(KG.tx(c.en, c.ne)) + '</span><i class="fa-solid fa-chevron-right text-xs text-gray-400"></i></button></li>';
        }).join('') + '</ul>', 'md');
    }
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

    // Lift the floating call / WhatsApp / chat buttons above the footer's bottom bar
    KG.watchFloat = function () {
        const fl = document.getElementById('kgFloat'), bar = document.querySelector('footer .bg-black\\/15');
        if (!fl || !bar || !('IntersectionObserver' in window)) return;
        new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { fl.style.transform = e.isIntersecting ? 'translateY(-' + (bar.offsetHeight + 4) + 'px)' : ''; });
        }).observe(bar);
    };

    /* ---------------------------- language / currency (footer, like Etsy) ---------------------------- */
    KG.updateLocaleLabel = function () {
        const el = document.getElementById('kgLocaleLabel');
        if (el) el.textContent = KG.tx('Nepal', 'नेपाल') + ' | ' + (KG.lang() === 'ne' ? 'नेपाली' : 'English') + ' | ' + KG.cur;
    };
    KG.openLocale = function () {
        const body = KG.modal('kgLocale', KG.tx('Update your settings', 'सेटिङ अद्यावधिक'),
            '<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">' + KG.tx('Set where you live, what language you speak and the currency you use.', 'भाषा र मुद्रा छान्नुहोस्।') + '</p>' +
            '<div class="space-y-4"><div><label class="' + ui.label + '" for="lc-lang">' + KG.tx('Language', 'भाषा') + '</label><select id="lc-lang" class="' + ui.input + '"><option value="en">English</option><option value="ne">नेपाली (Nepali)</option></select></div>' +
            '<div><label class="' + ui.label + '" for="lc-cur">' + KG.tx('Currency', 'मुद्रा') + '</label><select id="lc-cur" class="' + ui.input + '">' + Object.keys(C.currency.fallbackRates).map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select></div>' +
            '<p class="' + ui.muted + '">' + KG.tx('Prices are charged in NPR. Other currencies are estimates.', 'मूल्य NPR मा लिइन्छ। अन्य मुद्रा अनुमान मात्र हुन्।') + '</p>' +
            '<div class="flex gap-2 justify-end"><button type="button" data-close class="' + ui.btn2 + '">' + KG.tx('Cancel', 'रद्द') + '</button><button type="button" id="lc-save" class="' + ui.btn + '">' + KG.tx('Save', 'सुरक्षित') + '</button></div></div>');
        body.querySelector('#lc-lang').value = KG.lang(); body.querySelector('#lc-cur').value = KG.cur;
        body.querySelector('#lc-save').addEventListener('click', function () {
            const l = body.querySelector('#lc-lang').value, c = body.querySelector('#lc-cur').value;
            KG.closeModal('kgLocale');
            KG.cur = c; KG.store.set('kg-currency', c);
            if (typeof selectLang === 'function') selectLang(l); else applyLang(l);
            calcShipping(); KG.updateLocaleLabel();
        });
    };

    KG.initShop = function () {
        upgradeHeader(); wireCatMenu(); upgradeShippingCalculator(); KG.watchFloat();
        KG.alignFeatured(); setTimeout(KG.alignFeatured, 600); if (document.fonts) document.fonts.ready.then(KG.alignFeatured);
        const pf = document.getElementById('pfCategory');
        if (pf && !pf.dataset.kg) { pf.dataset.kg = '1'; KG.CATEGORIES.filter(function (c) { return c.isNew; }).forEach(function (c) { pf.insertAdjacentHTML('beforeend', '<option value="' + c.id + '">' + esc(c.en) + '</option>'); }); }
        KG.updateFavCount();
        renderProducts(); calcShipping();
    };
})();
