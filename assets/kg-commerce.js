/* =====================================================================
   KALAGHAR COMMERCE — #4 product variants, #5 back-in-stock & price-drop
   alerts, #7 product Q&A, #8 seller vacation mode.
   Every feature has an on/off switch and a queue in Admin.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const on = function (k) { return KG.setting('shopping.' + k) !== false; };

    /* ---------------------------- product helpers ---------------------------- */
    function rawList() { return KG.store.get('kg-products', null) || window.loadProducts(); }
    function updateRaw(id, fn) {
        const raw = rawList(), p = raw.find(function (x) { return x.id == id; });
        if (!p) return null; fn(p); KG.store.set('kg-products', raw); return p;
    }
    KG.updateRawProduct = updateRaw;

    /* =================== #4 VARIANTS =================== */
    KG.hasVariants = function (p) { return on('variants') && p && Array.isArray(p.variants) && p.variants.length > 0 && Array.isArray(p.options) && p.options.length > 0; };
    KG.variantOf = function (p, key) { return KG.hasVariants(p) ? p.variants.find(function (v) { return v.key === key; }) : null; };
    KG.variantLabel = function (p, key) {
        if (!key || !KG.hasVariants(p)) return '';
        const vals = key.split('|');
        return p.options.map(function (o, i) { return o.name + ': ' + (vals[i] || ''); }).join(', ');
    };
    // A copy of the product priced and named for one variant (used by the bag and orders)
    KG.withVariant = function (p, key) {
        const v = KG.variantOf(p, key);
        if (!v) return p;
        return Object.assign({}, p, { price: v.price, stock: v.stock, name: p.name + ' — ' + key.split('|').join(' / '), variantKey: key, sku: v.sku || '' });
    };
    KG.availableStock = function (p, key) {
        if (KG.hasVariants(p)) { const v = KG.variantOf(p, key); return v ? v.stock : p.variants.reduce(function (s, x) { return s + Math.max(0, x.stock); }, 0); }
        return p.stock == null ? 99 : p.stock;
    };
    function combos(options) {
        return options.reduce(function (acc, o) { const out = []; acc.forEach(function (a) { o.values.forEach(function (v) { out.push(a.concat([v])); }); }); return out; }, [[]]).map(function (a) { return a.join('|'); });
    }
    // Keep variant rows in sync with option values; keep prices/stock already entered
    KG.buildVariants = function (options, old, basePrice, baseStock) {
        old = old || [];
        return combos(options).map(function (key) {
            const prev = old.find(function (v) { return v.key === key; });
            return prev || { key: key, price: basePrice || 0, stock: baseStock == null ? 1 : baseStock, sku: '' };
        });
    };
    KG.applyVariants = function (id, options, variants) {
        return updateRaw(id, function (p) {
            const clean = (options || []).map(function (o) { return { name: String(o.name || '').trim().slice(0, 30), values: (o.values || []).map(function (v) { return String(v).trim().slice(0, 30); }).filter(Boolean).slice(0, 20) }; }).filter(function (o) { return o.name && o.values.length; }).slice(0, 2);
            if (!clean.length) { delete p.options; delete p.variants; return; }
            const before = p.variants || [];
            p.options = clean;
            p.variants = KG.buildVariants(clean, (variants || before), p.price, p.stock).map(function (v) {
                const given = (variants || []).find(function (x) { return x.key === v.key; }) || v;
                return { key: v.key, price: Math.max(1, Math.round(+given.price || p.price)), stock: Math.max(0, Math.round(+given.stock || 0)), sku: String(given.sku || '').slice(0, 40) };
            });
            p.price = Math.min.apply(null, p.variants.map(function (v) { return v.price; }));
            p.stock = p.variants.reduce(function (s, v) { return s + v.stock; }, 0);
        });
    };

    // Editor used by both the seller listing form and the admin inventory tab
    function variantEditor(p) {
        const opts = (p.options && p.options.length ? p.options : []).map(function (o) { return { name: o.name, values: o.values.slice() }; });
        const state = { options: opts, variants: (p.variants || []).map(function (v) { return Object.assign({}, v); }) };
        const wrap = document.createElement('div');
        wrap.className = 'kg-variant-editor';
        function draw() {
            state.variants = KG.buildVariants(state.options.filter(function (o) { return o.name && o.values.length; }), state.variants, p.price, p.stock);
            wrap.innerHTML = '<div class="flex flex-wrap items-center justify-between gap-2"><p class="text-sm font-bold"><i class="fa-solid fa-layer-group text-red-700 mr-1"></i>Variants <span class="font-normal ' + ui.muted + '">— sizes, colours or materials with their own price and stock</span></p>' +
                (state.options.length < 2 ? '<button type="button" data-add-opt class="' + ui.btn2 + ' !py-1 !text-xs"><i class="fa-solid fa-plus mr-1"></i>Add option</button>' : '') + '</div>' +
                state.options.map(function (o, i) {
                    return '<div class="grid sm:grid-cols-[150px_1fr_auto] gap-2 mt-2 items-end"><div><label class="' + ui.label + '">Option name</label><input data-opt-name="' + i + '" value="' + esc(o.name) + '" placeholder="Size" list="kgOptNames" class="' + ui.input + ' !py-1.5"></div>' +
                        '<div><label class="' + ui.label + '">Values (comma separated)</label><input data-opt-values="' + i + '" value="' + esc(o.values.join(', ')) + '" placeholder="S, M, L, XL" class="' + ui.input + ' !py-1.5"></div>' +
                        '<button type="button" data-del-opt="' + i + '" class="' + ui.btn2 + ' !py-1.5 !text-xs" aria-label="Remove option">Remove</button></div>';
                }).join('') +
                '<datalist id="kgOptNames"><option value="Size"><option value="Colour"><option value="Material"><option value="Length"><option value="Style"></datalist>' +
                (state.variants.length && state.options.some(function (o) { return o.values.length; }) ? '<div class="overflow-x-auto mt-3"><table class="w-full text-xs min-w-[420px]"><thead><tr class="text-left text-gray-500"><th class="py-1">Variant</th><th>Price (NPR)</th><th>Stock</th><th>SKU (optional)</th></tr></thead><tbody>' + state.variants.map(function (v, i) {
                    return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="py-1.5 pr-2 font-semibold">' + esc(v.key.split('|').join(' / ')) + '</td><td class="pr-2"><input data-v-price="' + i + '" type="number" min="1" value="' + v.price + '" class="' + ui.input + ' !py-1 !w-28"></td><td class="pr-2"><input data-v-stock="' + i + '" type="number" min="0" value="' + v.stock + '" class="' + ui.input + ' !py-1 !w-20"></td><td><input data-v-sku="' + i + '" value="' + esc(v.sku || '') + '" class="' + ui.input + ' !py-1 !w-32"></td></tr>';
                }).join('') + '</tbody></table><p class="' + ui.muted + ' mt-1">Set stock to 0 to show a variant as sold out. The listing shows the lowest variant price.</p></div>' : '');
            const addOpt = wrap.querySelector('[data-add-opt]');
            if (addOpt) addOpt.onclick = function () { state.options.push({ name: state.options.length ? 'Colour' : 'Size', values: [] }); draw(); };
            wrap.querySelectorAll('[data-del-opt]').forEach(function (b) { b.onclick = function () { state.options.splice(+b.dataset.delOpt, 1); draw(); }; });
            wrap.querySelectorAll('[data-opt-name]').forEach(function (x) { x.onchange = function () { state.options[+x.dataset.optName].name = x.value.trim(); draw(); }; });
            wrap.querySelectorAll('[data-opt-values]').forEach(function (x) { x.onchange = function () { state.options[+x.dataset.optValues].values = x.value.split(',').map(function (v) { return v.trim(); }).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 20); draw(); }; });
            ['price', 'stock', 'sku'].forEach(function (k) {
                wrap.querySelectorAll('[data-v-' + k + ']').forEach(function (x) { x.oninput = function () { const v = state.variants[+x.getAttribute('data-v-' + k)]; v[k] = k === 'sku' ? x.value : Number(x.value); }; });
            });
        }
        draw();
        return { el: wrap, value: function () { return { options: state.options.filter(function (o) { return o.name && o.values.length; }), variants: state.variants }; } };
    }
    KG.variantEditor = variantEditor;

    // Seller listing form: add the variant editor and save it with the listing
    function hookListingEditor() {
        const orig = KG.editListing; if (!orig) return;
        KG.editListing = function (id, voice) {
            const r = orig.apply(this, arguments);
            const form = document.getElementById('kgLsForm');
            if (!form || !on('variants')) return r;
            const s = KG.mySeller(); const existing = id ? KG.product(id) : null;
            const ed = variantEditor(existing || { price: 0, stock: 1 });
            ed.el.classList.add(ui.card.split(' ')[0], 'p-3', 'rounded-2xl', 'border', 'border-gray-200', 'dark:border-gray-800');
            const err = form.querySelector('#ls-err'); (err || form.lastElementChild).before(ed.el);
            const beforeIds = window.loadProducts().map(function (p) { return p.id; });
            form.addEventListener('submit', function () {
                // The original handler has just saved the listing; attach variants to it
                setTimeout(function () {
                    let pid = id;
                    if (!pid) { const mine = window.loadProducts().filter(function (p) { return s && p.sellerId === s.id && beforeIds.indexOf(p.id) === -1; }); if (mine.length) pid = mine[mine.length - 1].id; }
                    if (!pid) return;
                    const v = ed.value(); KG.applyVariants(pid, v.options, v.variants);
                    if (window.renderProducts) renderProducts();
                }, 0);
            });
            return r;
        };
    }

    /* ---------------------------- product page additions ---------------------------- */
    function hookProductPage() {
        const orig = KG.openProduct;
        KG.openProduct = function (id) {
            const r = orig.apply(this, arguments);
            const modal = document.getElementById('kgProduct'); const p = KG.product(id);
            if (!modal || !p) return r;
            decorateProductPage(modal, p);
            return r;
        };
        const add = KG.addProductWithOptions;
        KG.addProductWithOptions = function (id) {
            const p = KG.product(id), modal = document.getElementById('kgProduct');
            if (!KG.hasVariants(p)) return add.apply(this, arguments);
            const key = modal && modal.dataset.variant;
            if (!key || key.split('|').length < p.options.length || key.split('|').some(function (x) { return !x; })) { KG.toast('Please choose ' + p.options.map(function (o) { return o.name.toLowerCase(); }).join(' and ') + '.', 'warn'); const sel = modal && modal.querySelector('.kg-variant-picker'); if (sel) sel.classList.add('kg-shake'); setTimeout(function () { if (sel) sel.classList.remove('kg-shake'); }, 500); return; }
            const qty = modal.querySelector('#kgQty'), personal = modal.querySelector('#kgPersonal'), pack = modal.querySelector('input[name="kgPackaging"]:checked');
            KG.addToCart(id, qty ? +qty.value : 1, personal ? personal.value : '', false, pack ? pack.value : 'heritage', key);
        };
    }
    function decorateProductPage(modal, p) {
        const qtyRow = modal.querySelector('#kgQty') && modal.querySelector('#kgQty').parentNode;
        const priceEl = modal.querySelector('.text-2xl.font-extrabold');
        const vac = KG.vacationOf(p.sellerId);
        // Vacation mode
        if (vac && qtyRow) {
            qtyRow.querySelectorAll('button').forEach(function (b) { if (/addProductWithOptions/.test(b.getAttribute('onclick') || '')) { b.disabled = true; b.classList.add('opacity-50', 'cursor-not-allowed'); b.innerHTML = '<i class="fa-solid fa-umbrella-beach mr-1"></i>' + KG.tx('Shop is on a break', 'पसल बिदामा छ'); } });
            qtyRow.insertAdjacentHTML('beforebegin', vacationNotice(vac));
        }
        // Variants
        if (KG.hasVariants(p) && qtyRow) {
            const sel = {};
            const picker = document.createElement('div'); picker.className = 'kg-variant-picker mt-4 space-y-3';
            qtyRow.before(picker);
            const draw = function () {
                const key = p.options.map(function (o) { return sel[o.name] || ''; }).join('|');
                modal.dataset.variant = key;
                const chosen = KG.variantOf(p, key);
                picker.innerHTML = p.options.map(function (o, oi) {
                    return '<div><p class="' + ui.label + '">' + esc(o.name) + (sel[o.name] ? ': <span class="font-normal">' + esc(sel[o.name]) + '</span>' : '') + '</p><div class="flex flex-wrap gap-2" role="radiogroup" aria-label="' + esc(o.name) + '">' + o.values.map(function (v) {
                        // A value is sold out if every variant using it (with the other choices made) has no stock
                        const left = p.variants.filter(function (x) { const parts = x.key.split('|'); return parts[oi] === v && p.options.every(function (o2, j) { return j === oi || !sel[o2.name] || parts[j] === sel[o2.name]; }); }).reduce(function (s, x) { return s + x.stock; }, 0);
                        const active = sel[o.name] === v;
                        return '<button type="button" role="radio" aria-checked="' + active + '" data-opt="' + esc(o.name) + '" data-val="' + esc(v) + '" class="kg-chip-opt' + (active ? ' is-on' : '') + (left ? '' : ' is-out') + '">' + esc(v) + (left ? '' : ' <span class="sr-only">(sold out)</span>') + '</button>';
                    }).join('') + '</div></div>';
                }).join('') +
                (chosen ? '<p class="text-xs font-semibold ' + (chosen.stock ? (chosen.stock <= 3 ? 'text-amber-700' : 'text-green-700') : 'text-red-700') + '">' + (chosen.stock ? (chosen.stock <= 3 ? KG.tx('Only ' + chosen.stock + ' left', 'केवल ' + chosen.stock + ' बाँकी') : KG.tx('In stock', 'स्टकमा छ')) : KG.tx('Sold out', 'सकियो')) + '</p>' : '');
                if (priceEl) priceEl.textContent = KG.npr(chosen ? chosen.price : p.price);
                picker.querySelectorAll('[data-opt]').forEach(function (b) { b.onclick = function () { sel[b.dataset.opt] = sel[b.dataset.opt] === b.dataset.val ? '' : b.dataset.val; draw(); alertButtons(); }; });
            };
            if (p.options.every(function (o) { return o.values.length === 1; })) p.options.forEach(function (o) { sel[o.name] = o.values[0]; });
            draw();
            if (priceEl && !modal.dataset.variant.replace(/\|/g, '')) { const hi = Math.max.apply(null, p.variants.map(function (v) { return v.price; })); if (hi > p.price) priceEl.textContent = KG.tx('From ', 'देखि ') + KG.npr(p.price); }
        }
        // Alerts (#5)
        const alertBox = document.createElement('div'); alertBox.className = 'kg-alert-box mt-3 flex flex-wrap gap-2';
        if (qtyRow) qtyRow.after(alertBox);
        function alertButtons() {
            const key = modal.dataset.variant || '';
            const stock = KG.availableStock(p, KG.hasVariants(p) ? key : '');
            const fullyChosen = !KG.hasVariants(p) || (key.split('|').length === p.options.length && key.split('|').every(Boolean));
            let h = '';
            if (on('backInStock') && fullyChosen && stock <= 0 && !vac) h += '<button type="button" data-alert="stock" class="' + ui.btn + ' !text-xs !py-2"><i class="fa-regular fa-bell mr-1"></i>' + KG.tx('Email me when it\'s back', 'फेरि आएपछि खबर गर्नुहोस्') + '</button>';
            if (on('priceDrop')) h += '<button type="button" data-alert="price" class="text-xs font-semibold text-red-700 dark:text-amber-300 hover:underline"><i class="fa-solid fa-arrow-trend-down mr-1"></i>' + KG.tx('Alert me if the price drops', 'मूल्य घटे खबर गर्नुहोस्') + '</button>';
            alertBox.innerHTML = h;
            alertBox.querySelectorAll('[data-alert]').forEach(function (b) { b.onclick = function () { KG.subscribeAlert(p.id, b.dataset.alert, KG.hasVariants(p) ? key : ''); }; });
            // Sold out: swap the add button state
            if (qtyRow && !vac) qtyRow.querySelectorAll('button').forEach(function (b) {
                if (!/addProductWithOptions/.test(b.getAttribute('onclick') || '')) return;
                const out = fullyChosen && stock <= 0;
                b.disabled = out; b.classList.toggle('opacity-50', out);
                if (out) { b.dataset.orig = b.dataset.orig || b.innerHTML; b.innerHTML = KG.tx('Sold out', 'सकियो'); } else if (b.dataset.orig) b.innerHTML = b.dataset.orig;
            });
        }
        alertButtons();
        // Q&A (#7)
        if (on('qa')) {
            const anchor = modal.querySelector('#kgReviews');
            const qa = document.createElement('section'); qa.id = 'kgQA'; qa.className = 'mt-6 border-t border-gray-100 dark:border-gray-800 pt-4';
            if (anchor) anchor.after(qa); else modal.querySelector('.kg-modal-body').appendChild(qa);
            renderQA(qa, p);
        }
    }

    KG.canAddToCart = function (p, variant, silent) {
        const vac = KG.vacationOf(p.sellerId);
        if (vac) { if (!silent) KG.toast(KG.tx('This shop is on a break until ', 'यो पसल बिदामा छ: ') + (vac.returnDate || KG.tx('further notice', 'थप सूचनासम्म')), 'warn'); return false; }
        if (KG.hasVariants(p)) {
            if (!variant) { if (!silent) { KG.toast(KG.tx('Choose an option first.', 'पहिले विकल्प छान्नुहोस्।'), 'warn'); KG.openProduct(p.id); } return false; }
            const v = KG.variantOf(p, variant); if (!v || v.stock <= 0) { if (!silent) KG.toast(KG.tx('That option is sold out.', 'त्यो विकल्प सकियो।'), 'warn'); return false; }
            return true;
        }
        if (p.stock != null && p.stock <= 0) { if (!silent) KG.toast(KG.tx('Sold out.', 'सकियो।'), 'warn'); return false; }
        return true;
    };

    // Reduce stock when an order is placed
    KG.onOrdersPlaced = function (orders) {
        const raw = rawList();
        orders.forEach(function (o) {
            o.items.forEach(function (it) {
                const p = raw.find(function (x) { return x.id == it.productId; }); if (!p) return;
                if (it.variant && Array.isArray(p.variants)) { const v = p.variants.find(function (x) { return x.key === it.variant; }); if (v) v.stock = Math.max(0, v.stock - it.qty); p.stock = p.variants.reduce(function (s, x) { return s + x.stock; }, 0); }
                else { const cur = p.stock != null ? p.stock : (KG.product(p.id) || {}).stock; if (cur != null) p.stock = Math.max(0, cur - it.qty); }
            });
        });
        KG.store.set('kg-products', raw);
    };

    /* ---------------------------- catalog cards ---------------------------- */
    function decorateCards() {
        document.querySelectorAll('#productGrid .product-card').forEach(function (card) {
            const fav = card.querySelector('[data-fav]'); if (!fav) return;
            const p = KG.product(+fav.dataset.fav); if (!p) return;
            card.querySelectorAll('.kg-card-flag').forEach(function (x) { x.remove(); });
            const media = fav.parentNode;
            const flag = function (cls, html) { media.insertAdjacentHTML('beforeend', '<span class="kg-card-flag ' + cls + '">' + html + '</span>'); };
            if (KG.vacationOf(p.sellerId)) flag('kg-flag-vac', '<i class="fa-solid fa-umbrella-beach mr-1"></i>' + KG.tx('On a break', 'बिदामा'));
            else if (KG.availableStock(p, '') <= 0) flag('kg-flag-out', KG.tx('Sold out', 'सकियो'));
            if (KG.hasVariants(p)) {
                const hi = Math.max.apply(null, p.variants.map(function (v) { return v.price; }));
                const price = card.querySelector('.text-red-700, .text-red-400');
                if (price && hi > p.price && price.textContent.indexOf(KG.tx('From', 'देखि')) !== 0) price.textContent = KG.tx('From ', 'देखि ') + price.textContent;
                const sub = card.querySelector('p'); if (sub && !card.querySelector('.kg-card-opts')) sub.insertAdjacentHTML('afterend', '<p class="kg-card-opts text-[11px] text-gray-500 dark:text-gray-400">' + esc(p.options.map(function (o) { return o.values.length + ' ' + o.name.toLowerCase() + (o.values.length > 1 ? 's' : ''); }).join(' · ')) + '</p>');
            }
        });
    }

    /* =================== #5 BACK-IN-STOCK & PRICE-DROP ALERTS =================== */
    KG.subscribeAlert = function (productId, type, variant) {
        const p = KG.product(productId); if (!p) return;
        const u = KG.user();
        const finish = function (email) {
            email = String(email || '').trim().toLowerCase();
            if (!/^\S+@\S+\.\S+$/.test(email)) return KG.toast(KG.tx('Please enter a valid email.', 'सही इमेल लेख्नुहोस्।'), 'warn');
            const all = KG.store.get('kg-alerts', []);
            if (all.some(function (a) { return a.status === 'active' && a.productId == productId && a.type === type && (a.variant || '') === (variant || '') && a.email === email; })) return KG.toast(KG.tx('You\'re already on the list.', 'तपाईं पहिले नै सूचीमा हुनुहुन्छ।'));
            const vp = KG.withVariant(p, variant);
            all.push({ id: KG.uid('AL-'), type: type, productId: +productId, variant: variant || '', email: email, userId: u ? u.id : null, basePrice: vp.price, status: 'active', createdAt: KG.now() });
            KG.store.set('kg-alerts', all); KG.closeModal('kgAlertAsk');
            KG.toast(type === 'stock' ? KG.tx('We\'ll email you when it\'s back.', 'फेरि आएपछि इमेल गर्नेछौं।') : KG.tx('We\'ll let you know if the price drops.', 'मूल्य घटे खबर गर्नेछौं।'));
        };
        if (u) return finish(u.email);
        const body = KG.modal('kgAlertAsk', type === 'stock' ? KG.tx('Back-in-stock alert', 'स्टक सूचना') : KG.tx('Price-drop alert', 'मूल्य घट्दा सूचना'),
            '<form class="space-y-3"><p class="text-sm">' + esc(p.name) + (variant ? ' — ' + esc(variant.split('|').join(' / ')) : '') + '</p><div><label class="' + ui.label + '" for="al-email">' + KG.tx('Your email', 'तपाईंको इमेल') + '</label><input id="al-email" type="email" required class="' + ui.input + '"></div><p class="' + ui.muted + '">' + KG.tx('One email, then the alert ends. We never share your address.', 'एउटा इमेल मात्र। तपाईंको ठेगाना कसैलाई दिइँदैन।') + '</p><button class="' + ui.btn + ' w-full">' + KG.tx('Notify me', 'खबर गर्नुहोस्') + '</button></form>');
        body.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); finish(body.querySelector('#al-email').value); });
    };
    // Check every active alert against current stock and prices
    KG.checkAlerts = function () {
        const all = KG.store.get('kg-alerts', []); let changed = false;
        const minPct = KG.setting('shopping.priceDropMinPercent') || 5;
        all.forEach(function (a) {
            if (a.status !== 'active') return;
            const p0 = KG.product(a.productId); if (!p0) return;
            const p = KG.withVariant(p0, a.variant), stock = KG.availableStock(p0, a.variant);
            let fire = null;
            if (a.type === 'stock' && on('backInStock') && stock > 0 && !KG.vacationOf(p0.sellerId)) fire = { subject: 'Back in stock: ' + p.name, body: 'Good news — ' + p.name + ' is available again at ' + KG.npr(p.price) + '. Handmade pieces sell quickly.' };
            if (a.type === 'price' && on('priceDrop') && p.price <= a.basePrice * (1 - minPct / 100)) fire = { subject: 'Price drop: ' + p.name, body: p.name + ' dropped from ' + KG.npr(a.basePrice) + ' to ' + KG.npr(p.price) + '.' };
            if (!fire) return;
            changed = true; a.status = 'sent'; a.firedAt = KG.now();
            const link = (KG.setting('marketing.siteUrl') || '') + '#product-' + p0.id;
            KG.store.push('kg-outbox', { id: KG.uid('MSG-'), to: a.email, subject: fire.subject, body: fire.body + '\n\n' + link, alertId: a.id, status: 'queued', createdAt: KG.now() });
            KG.store.push('kg-notifications', { id: KG.uid('N-'), userId: a.userId, email: a.email, title: fire.subject, text: fire.body, productId: p0.id, read: false, createdAt: KG.now() });
        });
        if (changed) { KG.store.set('kg-alerts', all); updateBell(); }
    };
    // Buyer notification centre (in the account menu)
    function myNotes() { const u = KG.user(); if (!u) return []; return KG.store.get('kg-notifications', []).filter(function (n) { return n.userId === u.id || n.email === u.email; }); }
    function updateBell() {
        const btn = document.getElementById('userStatusLabel'); if (!btn) return;
        const host = btn.closest('button'); if (!host) return;
        let dot = document.getElementById('kgNoteDot');
        const n = myNotes().filter(function (x) { return !x.read; }).length;
        if (!dot) { host.classList.add('relative'); host.insertAdjacentHTML('beforeend', '<span id="kgNoteDot" class="kg-note-dot hidden" aria-hidden="true"></span>'); dot = document.getElementById('kgNoteDot'); }
        dot.classList.toggle('hidden', !n); host.title = n ? n + ' new alert' + (n > 1 ? 's' : '') : '';
    }
    KG.openNotifications = function () {
        const list = myNotes().slice().reverse();
        KG.modal('kgNotes', '<i class="fa-regular fa-bell text-red-700 mr-1"></i>' + KG.tx('Your alerts', 'तपाईंका सूचना'), list.length ? '<ul class="divide-y divide-gray-100 dark:divide-gray-800">' + list.map(function (n) {
            return '<li class="py-3"><button type="button" class="text-left w-full" onclick="KG.closeModal(\'kgNotes\');KG.openProduct(' + n.productId + ')"><strong class="text-sm block">' + esc(n.title) + '</strong><span class="text-xs text-gray-600 dark:text-gray-400">' + esc(n.text) + '</span><span class="block text-[11px] text-gray-400 mt-0.5">' + KG.fmtDate(n.createdAt) + '</span></button></li>';
        }).join('') + '</ul>' : '<p class="text-sm text-gray-500 text-center py-8">' + KG.tx('No alerts yet. Use "Email me when it\'s back" or "Alert me if the price drops" on any product.', 'अहिलेसम्म सूचना छैन।') + '</p>');
        const all = KG.store.get('kg-notifications', []); const u = KG.user();
        all.forEach(function (n) { if (u && (n.userId === u.id || n.email === u.email)) n.read = true; }); KG.store.set('kg-notifications', all); updateBell();
    };
    function hookAccount() {
        const orig = KG.openAccount; if (!orig) return;
        KG.openAccount = function () {
            const r = orig.apply(this, arguments);
            const m = document.getElementById('kgAccount');
            if (m && !m.querySelector('[data-kg-alerts]')) {
                const bar = m.querySelector('.kg-modal-body > div'); const n = myNotes().filter(function (x) { return !x.read; }).length;
                if (bar) bar.insertAdjacentHTML('beforeend', '<button data-kg-alerts class="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800" onclick="KG.closeModal(\'kgAccount\');KG.openNotifications()"><i class="fa-regular fa-bell mr-1"></i>' + KG.tx('Alerts', 'सूचना') + (n ? ' (' + n + ')' : '') + '</button>');
            }
            return r;
        };
    }

    /* =================== #7 PRODUCT Q&A =================== */
    function questions(pid) { return KG.store.get('kg-questions', []).filter(function (q) { return pid == null || q.productId == pid; }); }
    function renderQA(box, p) {
        const u = KG.user(), seller = KG.mySeller();
        const list = questions(p.id).filter(function (q) { return q.status === 'published' || (u && q.userId === u.id); }).reverse();
        const canAnswer = seller && seller.id === p.sellerId;
        box.innerHTML = '<h4 class="font-bold text-sm text-gray-900 dark:text-white mb-1"><i class="fa-regular fa-circle-question mr-1"></i>' + KG.tx('Questions about this item', 'यस वस्तुबारे प्रश्न') + (list.length ? ' (' + list.length + ')' : '') + '</h4>' +
            '<p class="' + ui.muted + ' mb-3">' + KG.tx('Ask the maker about size, materials, care or shipping. Answers are public so they help other shoppers too.', 'आकार, सामग्री, हेरचाह वा ढुवानीबारे सोध्नुहोस्। उत्तर सबैले देख्छन्।') + '</p>' +
            (list.length ? list.map(function (q) {
                return '<div class="py-3 border-b border-gray-50 dark:border-gray-800/60"><p class="text-sm"><strong>Q:</strong> ' + esc(q.question) + (q.status !== 'published' ? ' <span class="text-[10px] font-bold text-amber-700 uppercase">' + KG.tx('Awaiting review', 'समीक्षामा') + '</span>' : '') + '</p><p class="text-[11px] text-gray-400">' + esc(q.name) + ' · ' + KG.fmtDate(q.createdAt) + '</p>' +
                    (q.answer ? '<p class="text-sm mt-1.5 pl-3 border-l-2 border-amber-500"><strong>' + KG.tx('A', 'उ') + ' (' + esc((KG.seller(q.sellerId) || {}).shopName || 'Maker') + '):</strong> ' + esc(q.answer) + '</p>' : (canAnswer ? '<form class="mt-2 flex gap-2" data-answer="' + esc(q.id) + '"><label class="sr-only" for="ans-' + esc(q.id) + '">Answer</label><input id="ans-' + esc(q.id) + '" required maxlength="600" class="' + ui.input + ' !py-1.5" placeholder="Write your answer"><button class="' + ui.btn + ' !py-1.5 !text-xs">Answer</button></form>' : '<p class="text-xs text-gray-500 mt-1">' + KG.tx('The maker hasn\'t answered yet.', 'शिल्पीले अझै उत्तर दिएका छैनन्।') + '</p>')) + '</div>';
            }).join('') : '') +
            '<form id="kgAsk" class="mt-3 flex gap-2"><label class="sr-only" for="kgAskInput">Your question</label><input id="kgAskInput" required minlength="5" maxlength="400" class="' + ui.input + '" placeholder="' + KG.tx('Ask a question…', 'प्रश्न सोध्नुहोस्…') + '"><button class="' + ui.btn2 + ' shrink-0">' + KG.tx('Ask', 'सोध्नुहोस्') + '</button></form>';
        box.querySelector('#kgAsk').addEventListener('submit', function (e) {
            e.preventDefault();
            const text = box.querySelector('#kgAskInput').value.trim();
            if (!KG.user()) return KG.requireLogin(function () { KG.openProduct(p.id); });
            const me = KG.user(), needs = KG.setting('shopping.qaRequireApproval') !== false;
            KG.store.push('kg-questions', { id: KG.uid('Q-'), productId: p.id, sellerId: p.sellerId, userId: me.id, name: me.name.split(' ')[0], question: text, answer: '', status: needs ? 'pending' : 'published', createdAt: KG.now() });
            KG.toast(needs ? KG.tx('Thanks! Your question will appear after a quick review.', 'धन्यवाद! समीक्षापछि प्रश्न देखिनेछ।') : KG.tx('Question posted. We\'ve let the maker know.', 'प्रश्न पोस्ट भयो।'));
            renderQA(box, p);
        });
        box.querySelectorAll('[data-answer]').forEach(function (f) {
            f.addEventListener('submit', function (e) { e.preventDefault(); KG.answerQuestion(f.dataset.answer, f.querySelector('input').value); renderQA(box, p); });
        });
    }
    KG.answerQuestion = function (id, text) {
        text = String(text || '').trim().slice(0, 600); if (!text) return;
        KG.store.update('kg-questions', id, { answer: text, answeredAt: KG.now() });
        KG.toast(KG.tx('Answer published.', 'उत्तर प्रकाशित भयो।'));
    };
    function sellerQuestionsTab(box, s) {
        const list = questions().filter(function (q) { return q.sellerId === s.id; }).reverse();
        const open = list.filter(function (q) { return !q.answer; });
        box.innerHTML = '<p class="' + ui.muted + ' mb-3">' + KG.tx('Answer quickly — buyers who get answers are far more likely to buy. Questions awaiting KalaGhar review are marked.', 'छिटो उत्तर दिनुहोस्।') + '</p>' +
            (list.length ? list.map(function (q) {
                const p = KG.product(q.productId) || { name: '' };
                return '<div class="' + ui.card + ' p-4 mb-3"><p class="text-xs text-gray-500">' + esc(p.name) + ' · ' + esc(q.name) + ' · ' + KG.fmtDate(q.createdAt) + (q.status !== 'published' ? ' · <span class="text-amber-700 font-semibold">' + esc(q.status) + '</span>' : '') + '</p><p class="text-sm mt-1"><strong>Q:</strong> ' + esc(q.question) + '</p>' +
                    (q.answer ? '<p class="text-sm mt-1 pl-3 border-l-2 border-amber-500">' + esc(q.answer) + '</p>' : '<form class="mt-2 flex gap-2" data-sq="' + esc(q.id) + '"><input required maxlength="600" aria-label="Answer" class="' + ui.input + ' !py-1.5" placeholder="Your answer"><button class="' + ui.btn + ' !py-1.5 !text-xs">Answer</button></form>') + '</div>';
            }).join('') : '<p class="text-sm text-gray-500 text-center py-8">' + KG.tx('No questions yet.', 'अहिलेसम्म प्रश्न छैन।') + '</p>');
        box.querySelectorAll('[data-sq]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); KG.answerQuestion(f.dataset.sq, f.querySelector('input').value); KG.openSellerDashboard('questions'); }); });
        return open.length;
    }

    /* =================== #8 SELLER VACATION MODE =================== */
    KG.vacationOf = function (sellerId) {
        if (!on('vacation')) return null;
        const s = KG.seller(sellerId); const v = s && s.vacation;
        if (!v || !v.on) return null;
        if (v.returnDate && v.returnDate < KG.today()) return null;   // ends automatically on the return date
        return v;
    };
    function vacationNotice(v) {
        return '<div class="kg-vacation-note mt-4"><i class="fa-solid fa-umbrella-beach"></i><div><strong>' + KG.tx('This shop is taking a short break', 'यो पसल केही समय बिदामा छ') + (v.returnDate ? KG.tx(' — back ' + KG.fmtDate(v.returnDate), ' — फर्किने मिति ' + KG.fmtDate(v.returnDate)) : '') + '</strong>' + (v.message ? '<p>' + esc(v.message) + '</p>' : '') + '<p class="text-[11px] opacity-80">' + KG.tx('You can still save it to favorites or message the maker.', 'मनपर्नेमा राख्न वा शिल्पीलाई सन्देश पठाउन सक्नुहुन्छ।') + '</p></div></div>';
    }
    function sellerVacationTab(box, s) {
        const v = Object.assign({ on: false, message: '', returnDate: '', autoReply: true }, s.vacation || {});
        box.innerHTML = '<form id="kgVacForm" class="' + ui.card + ' p-5 space-y-4 max-w-xl">' +
            KG.adminField.toggle('on', KG.tx('Vacation mode', 'बिदा मोड'), v.on, KG.tx('Pauses new orders. Your listings stay visible and buyers can favorite them.', 'नयाँ अर्डर रोकिन्छ। सूची देखिइरहन्छ।')) +
            '<div><label class="' + ui.label + '" for="vac-ret">' + KG.tx('Back on (optional — vacation ends automatically)', 'फर्किने मिति (ऐच्छिक)') + '</label><input id="vac-ret" name="returnDate" type="date" min="' + KG.today() + '" value="' + esc(v.returnDate) + '" class="' + ui.input + '"></div>' +
            '<div><label class="' + ui.label + '" for="vac-msg">' + KG.tx('Message to buyers', 'खरिदकर्तालाई सन्देश') + '</label><textarea id="vac-msg" name="message" rows="3" maxlength="300" class="' + ui.input + '" placeholder="' + KG.tx('Away for Dashain — new pieces coming soon!', 'दशैंको बिदामा — चाँडै नयाँ सामान!') + '">' + esc(v.message) + '</textarea></div>' +
            KG.adminField.toggle('autoReply', KG.tx('Auto-reply to messages', 'सन्देशमा स्वतः जवाफ'), v.autoReply, KG.tx('Buyers who message you see your vacation note.', '')) +
            '<button class="' + ui.btn + ' w-full">' + KG.tx('Save', 'सुरक्षित') + '</button>' +
            (KG.setting('shopping.vacation') === false ? '<p class="text-xs text-amber-700">' + KG.tx('Vacation mode is currently switched off by KalaGhar.', 'बिदा मोड KalaGhar ले बन्द गरेको छ।') + '</p>' : '') + '</form>';
        box.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault(); const f = e.target;
            s.vacation = { on: f.on.checked, returnDate: f.returnDate.value, message: f.message.value.trim().slice(0, 300), autoReply: f.autoReply.checked, updatedAt: KG.now() };
            KG.saveSeller(s); KG.toast(s.vacation.on ? KG.tx('Vacation mode is on.', 'बिदा मोड सुरु भयो।') : KG.tx('Your shop is open again.', 'पसल फेरि खुल्यो।'));
            renderProducts(); KG.openSellerDashboard('vacation');
        });
    }
    function hookShopPage() {
        const orig = KG.openShop; if (!orig) return;
        KG.openShop = function (id) {
            const r = orig.apply(this, arguments); const v = KG.vacationOf(id); const m = document.getElementById('kgShop');
            if (v && m) m.querySelector('.kg-modal-body').insertAdjacentHTML('afterbegin', vacationNotice(v));
            return r;
        };
        const thread = KG.showThread;
        if (thread) KG.showThread = function (tid, side) {
            const th = KG.threads().find(function (x) { return x.id === tid; });
            const v = th && KG.vacationOf(th.sellerId);
            const r = thread.apply(this, arguments);
            if (v && v.autoReply !== false && side === 'buyer') { const box = document.getElementById('kgMsgs'); if (box) box.insertAdjacentHTML('afterbegin', '<p class="text-center text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2"><i class="fa-solid fa-umbrella-beach mr-1"></i>' + KG.tx('Auto-reply: the maker is on a break', 'स्वतः जवाफ: शिल्पी बिदामा') + (v.returnDate ? ' (' + KG.fmtDate(v.returnDate) + ')' : '') + (v.message ? ' — ' + esc(v.message) : '') + '</p>'); }
            return r;
        };
    }

    /* =================== ADMIN TABS =================== */
    function settingsCard(title, html) { return '<div class="' + ui.card + ' p-4"><h4 class="font-bold mb-3">' + title + '</h4>' + html + '</div>'; }
    function renderShopFeatures(el) {
        const st = KG.setting('shopping'), A = KG.adminField;
        const prods = window.loadProducts();
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Shopping features</h3><p class="' + ui.muted + ' mb-4">Switch each feature on or off for every visitor (publish to apply). Queues for each feature are in the tabs next to this one.</p>' +
            '<form id="sf-form" class="grid md:grid-cols-2 gap-4 mb-6">' +
                settingsCard('<i class="fa-solid fa-layer-group text-red-700 mr-1"></i>Product variants', A.toggle('variants', 'Allow variants (size, colour…)', st.variants, 'Off: products sell as single items again')) +
                settingsCard('<i class="fa-regular fa-bell text-red-700 mr-1"></i>Stock & price alerts', A.toggle('backInStock', 'Back-in-stock alerts', st.backInStock) + '<div class="h-3"></div>' + A.toggle('priceDrop', 'Price-drop alerts', st.priceDrop) + '<div class="mt-3">' + A.text('priceDropMinPercent', 'Only alert when the price drops by at least (%)', st.priceDropMinPercent, 'type="number" min="1" max="90"') + '</div>') +
                settingsCard('<i class="fa-regular fa-circle-question text-red-700 mr-1"></i>Product Q&A', A.toggle('qa', 'Show questions on product pages', st.qa) + '<div class="h-3"></div>' + A.toggle('qaRequireApproval', 'Review questions before they go public', st.qaRequireApproval, 'Recommended: stops spam and personal details')) +
                settingsCard('<i class="fa-solid fa-umbrella-beach text-red-700 mr-1"></i>Seller vacation mode', A.toggle('vacation', 'Let sellers pause their shop', st.vacation, 'Off: every shop is open, whatever sellers set')) +
            '</form>' +
            '<h4 class="font-bold mb-2">Variants & stock by product</h4><div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-sm min-w-[620px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3">Product</th><th>Shop</th><th>Variants</th><th>Stock</th><th>Price</th><th></th></tr></thead><tbody>' + prods.map(function (p) {
                const stock = KG.availableStock(p, '');
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3"><strong>' + esc(p.name) + '</strong></td><td class="text-xs">' + esc((KG.seller(p.sellerId) || {}).shopName || '') + '</td><td class="text-xs">' + (p.options && p.options.length ? esc(p.options.map(function (o) { return o.name + ' (' + o.values.length + ')'; }).join(', ')) : '—') + '</td><td class="' + (stock <= 0 ? 'text-red-700 font-bold' : stock <= 3 ? 'text-amber-700 font-semibold' : '') + '">' + stock + '</td><td>' + KG.npr(p.price) + '</td><td class="pr-3"><button type="button" data-ve="' + p.id + '" class="' + ui.btn2 + ' !py-1 !text-xs">Edit stock & variants</button></td></tr>';
            }).join('') + '</tbody></table></div>';
        KG.bindSettingsForm(el.querySelector('#sf-form'), 'shopping', function () { renderProducts(); });
        el.querySelectorAll('[data-ve]').forEach(function (b) { b.addEventListener('click', function () { openVariantModal(+b.dataset.ve, function () { renderShopFeatures(el); }); }); });
    }
    function openVariantModal(id, done) {
        const p = KG.product(id);
        const body = KG.modal('kgVarAdmin', 'Stock & variants — ' + esc(p.name), '<div class="grid sm:grid-cols-2 gap-3 mb-4"><div><label class="' + ui.label + '" for="va-price">Base price (NPR)</label><input id="va-price" type="number" min="1" value="' + p.price + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="va-stock">Stock (when there are no variants)</label><input id="va-stock" type="number" min="0" value="' + (p.stock == null ? 0 : p.stock) + '" class="' + ui.input + '"></div></div><div id="va-ed"></div><button type="button" id="va-save" class="' + ui.btn + ' w-full mt-4">Save</button>', 'lg');
        const ed = variantEditor(p); body.querySelector('#va-ed').appendChild(ed.el);
        body.querySelector('#va-save').addEventListener('click', function () {
            updateRaw(id, function (x) { x.price = Math.max(1, Math.round(+body.querySelector('#va-price').value)); x.stock = Math.max(0, Math.round(+body.querySelector('#va-stock').value)); });
            const v = ed.value(); KG.applyVariants(id, v.options, v.variants);
            if (window.KG_ADMIN_AUDIT) window.KG_ADMIN_AUDIT('product.variants_updated', 'product', String(id), '');
            KG.closeModal('kgVarAdmin'); renderProducts(); KG.toast('Saved.'); if (done) done();
        });
    }
    function renderAlertsAdmin(el) {
        const alerts = KG.store.get('kg-alerts', []).slice().reverse(), outbox = KG.store.get('kg-outbox', []).slice().reverse();
        const queued = outbox.filter(function (m) { return m.status === 'queued'; });
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Stock & price alerts</h3><p class="' + ui.muted + ' mb-4">Shoppers ask to be told when an item is back or cheaper. When it happens, a message is queued here. Automatic sending needs an email service on the server; until then, send from your email app with one click.</p>' +
            '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">' + [['Waiting (stock)', alerts.filter(function (a) { return a.status === 'active' && a.type === 'stock'; }).length], ['Waiting (price)', alerts.filter(function (a) { return a.status === 'active' && a.type === 'price'; }).length], ['Messages to send', queued.length], ['Sent', outbox.length - queued.length]].map(function (x) { return '<div class="' + ui.card + ' p-4"><p class="' + ui.muted + '">' + x[0] + '</p><p class="text-2xl font-extrabold">' + x[1] + '</p></div>'; }).join('') + '</div>' +
            '<div class="flex flex-wrap gap-2 mb-3"><button type="button" id="al-check" class="' + ui.btn2 + ' !text-xs"><i class="fa-solid fa-rotate mr-1"></i>Check stock & prices now</button><button type="button" id="al-csv" class="' + ui.btn2 + ' !text-xs"><i class="fa-solid fa-file-csv mr-1"></i>Download subscribers (CSV)</button></div>' +
            '<h4 class="font-bold mb-2">Outbox</h4>' + (outbox.length ? outbox.map(function (m) {
                return '<div class="' + ui.card + ' p-3 mb-2 flex flex-wrap items-center gap-3"><span class="flex-1 min-w-[220px]"><strong class="text-sm">' + esc(m.subject) + '</strong><span class="block text-xs text-gray-500">' + esc(m.to) + ' · ' + KG.fmtDate(m.createdAt) + '</span></span>' +
                    (m.status === 'queued' ? '<a class="' + ui.btn + ' !py-1 !text-xs" href="mailto:' + encodeURIComponent(m.to) + '?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.body) + '" data-mail="' + esc(m.id) + '">Send email</a><button type="button" data-sent="' + esc(m.id) + '" class="' + ui.btn2 + ' !py-1 !text-xs">Mark sent</button>' : '<span class="text-xs text-green-700"><i class="fa-solid fa-check"></i> Sent</span>') + '</div>';
            }).join('') : '<p class="text-sm text-gray-500 mb-4">Nothing to send.</p>') +
            '<h4 class="font-bold mt-5 mb-2">Subscriptions</h4><div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-sm min-w-[560px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3">Product</th><th>Type</th><th>Email</th><th>Since</th><th>Status</th><th></th></tr></thead><tbody>' + (alerts.length ? alerts.map(function (a) {
                const p = KG.product(a.productId) || { name: '#' + a.productId };
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3">' + esc(p.name) + (a.variant ? ' <span class="text-xs text-gray-500">(' + esc(a.variant.split('|').join(' / ')) + ')</span>' : '') + '</td><td>' + (a.type === 'stock' ? 'Back in stock' : 'Price drop') + '</td><td class="text-xs">' + esc(a.email) + '</td><td class="text-xs">' + KG.fmtDate(a.createdAt) + '</td><td class="text-xs">' + esc(a.status) + '</td><td class="pr-3">' + (a.status === 'active' ? '<button type="button" data-cancel="' + esc(a.id) + '" class="text-xs text-red-700">Remove</button>' : '') + '</td></tr>';
            }).join('') : '<tr><td colspan="6" class="p-4 text-sm text-gray-500">No subscriptions yet.</td></tr>') + '</tbody></table></div>';
        el.querySelector('#al-check').addEventListener('click', function () { KG.checkAlerts(); renderAlertsAdmin(el); KG.toast('Checked.'); });
        el.querySelector('#al-csv').addEventListener('click', function () {
            const rows = [['type', 'product', 'variant', 'email', 'status', 'created']].concat(alerts.map(function (a) { return [a.type, (KG.product(a.productId) || {}).name || a.productId, a.variant, a.email, a.status, a.createdAt]; }));
            KG.downloadText('kalaghar-alert-subscribers.csv', rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
        });
        const markSent = function (mid) { KG.store.update('kg-outbox', mid, { status: 'sent', sentAt: KG.now() }); };
        el.querySelectorAll('[data-sent]').forEach(function (b) { b.addEventListener('click', function () { markSent(b.dataset.sent); renderAlertsAdmin(el); }); });
        el.querySelectorAll('[data-mail]').forEach(function (a) { a.addEventListener('click', function () { setTimeout(function () { if (confirm('Did the email send? Mark it as sent.')) { markSent(a.dataset.mail); renderAlertsAdmin(el); } }, 800); }); });
        el.querySelectorAll('[data-cancel]').forEach(function (b) { b.addEventListener('click', function () { KG.store.update('kg-alerts', b.dataset.cancel, { status: 'removed' }); renderAlertsAdmin(el); }); });
    }
    function renderQAAdmin(el) {
        const all = questions().slice().reverse();
        const filter = el.dataset.f || 'pending';
        const list = all.filter(function (q) { return filter === 'all' || q.status === filter || (filter === 'unanswered' && !q.answer && q.status === 'published'); });
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Product Q&A</h3><p class="' + ui.muted + ' mb-3">Approve, hide or answer customer questions. Turn Q&A or pre-approval on/off in the Shopping features tab.</p>' +
            '<div class="flex flex-wrap gap-2 mb-4">' + [['pending', 'Needs review'], ['unanswered', 'Unanswered'], ['published', 'Published'], ['hidden', 'Hidden'], ['all', 'All']].map(function (x) { const n = all.filter(function (q) { return x[0] === 'all' || q.status === x[0] || (x[0] === 'unanswered' && !q.answer && q.status === 'published'); }).length; return '<button type="button" data-f="' + x[0] + '" class="text-xs font-semibold px-3 py-1.5 rounded-full ' + (filter === x[0] ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-800') + '">' + x[1] + ' (' + n + ')</button>'; }).join('') + '</div>' +
            (list.length ? list.map(function (q) {
                const p = KG.product(q.productId) || { name: '' };
                return '<div class="' + ui.card + ' p-4 mb-3"><p class="text-xs text-gray-500">' + esc(p.name) + ' · ' + esc(q.name) + ' · ' + KG.fmtDate(q.createdAt) + ' · <strong>' + esc(q.status) + '</strong></p><p class="text-sm mt-1"><strong>Q:</strong> ' + esc(q.question) + '</p>' + (q.answer ? '<p class="text-sm mt-1 pl-3 border-l-2 border-amber-500">' + esc(q.answer) + '</p>' : '') +
                    '<div class="flex flex-wrap gap-2 mt-3">' + (q.status !== 'published' ? '<button data-q="' + esc(q.id) + '" data-to="published" class="' + ui.btn + ' !py-1 !text-xs">Approve</button>' : '') + (q.status !== 'hidden' ? '<button data-q="' + esc(q.id) + '" data-to="hidden" class="' + ui.btn2 + ' !py-1 !text-xs">Hide</button>' : '') +
                    '<button data-qa-answer="' + esc(q.id) + '" class="' + ui.btn2 + ' !py-1 !text-xs">' + (q.answer ? 'Edit answer' : 'Answer as KalaGhar') + '</button><button data-q-del="' + esc(q.id) + '" class="text-xs text-red-700 ml-auto">Delete</button></div></div>';
            }).join('') : '<p class="text-sm text-gray-500 py-6 text-center">Nothing here.</p>');
        el.querySelectorAll('[data-f]').forEach(function (b) { b.addEventListener('click', function () { el.dataset.f = b.dataset.f; renderQAAdmin(el); }); });
        el.querySelectorAll('[data-q]').forEach(function (b) { b.addEventListener('click', function () { KG.store.update('kg-questions', b.dataset.q, { status: b.dataset.to, reviewedAt: KG.now() }); renderQAAdmin(el); }); });
        el.querySelectorAll('[data-q-del]').forEach(function (b) { b.addEventListener('click', function () { if (!confirm('Delete this question?')) return; KG.store.set('kg-questions', questions().filter(function (q) { return q.id !== b.dataset.qDel; })); renderQAAdmin(el); }); });
        el.querySelectorAll('[data-qa-answer]').forEach(function (b) { b.addEventListener('click', function () { const q = questions().find(function (x) { return x.id === b.dataset.qaAnswer; }); const a = prompt('Answer (shown publicly):', q.answer || ''); if (a != null) { KG.store.update('kg-questions', q.id, { answer: a.trim().slice(0, 600), answeredAt: KG.now(), status: 'published' }); renderQAAdmin(el); } }); });
    }
    function renderVacationsAdmin(el) {
        const sellers = KG.sellers();
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Seller vacations</h3><p class="' + ui.muted + ' mb-4">' + (on('vacation') ? 'Vacation mode is on. Sellers set it in their dashboard; you can set or end it for any shop here.' : '<span class="text-amber-700 font-semibold">Vacation mode is switched off site-wide (Shopping features tab), so all shops are open.</span>') + '</p>' +
            '<div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-sm min-w-[620px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3">Shop</th><th>Status</th><th>Back on</th><th>Message</th><th></th></tr></thead><tbody>' + sellers.map(function (s) {
                const v = s.vacation || {}, active = !!KG.vacationOf(s.id);
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3"><strong>' + esc(s.shopName) + '</strong></td><td>' + (active ? '<span class="text-amber-700 font-semibold"><i class="fa-solid fa-umbrella-beach mr-1"></i>On a break</span>' : v.on ? '<span class="text-gray-500">Ended (date passed)</span>' : '<span class="text-green-700">Open</span>') + '</td><td class="text-xs">' + esc(v.returnDate || '—') + '</td><td class="text-xs max-w-xs truncate">' + esc(v.message || '') + '</td><td class="pr-3 text-right"><button type="button" data-vac="' + esc(s.id) + '" class="' + ui.btn2 + ' !py-1 !text-xs">' + (v.on ? 'End vacation' : 'Set vacation') + '</button></td></tr>';
            }).join('') + '</tbody></table></div>';
        el.querySelectorAll('[data-vac]').forEach(function (b) {
            b.addEventListener('click', function () {
                const s = KG.seller(b.dataset.vac);
                if (s.vacation && s.vacation.on) s.vacation = Object.assign({}, s.vacation, { on: false });
                else { const until = prompt('Back on date (YYYY-MM-DD), or leave blank:', ''); if (until === null) return; s.vacation = { on: true, returnDate: /^\d{4}-\d{2}-\d{2}$/.test(until.trim()) ? until.trim() : '', message: 'This shop is taking a short break.', autoReply: true, setByAdmin: true }; }
                KG.saveSeller(s); if (window.KG_ADMIN_AUDIT) window.KG_ADMIN_AUDIT('seller.vacation', 'seller', s.id, s.vacation.on ? 'on' : 'off');
                renderProducts(); renderVacationsAdmin(el);
            });
        });
    }

    KG.downloadText = KG.downloadText || function (name, text, type) {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: (type || 'text/plain') + ';charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };

    KG.addAdminTab('shop-features', 'Shopping features', renderShopFeatures);
    KG.addAdminTab('alerts', 'Stock & price alerts', renderAlertsAdmin);
    KG.addAdminTab('qa', 'Product Q&A', renderQAAdmin);
    KG.addAdminTab('vacations', 'Seller vacations', renderVacationsAdmin);

    KG.extraSellerTabs = function (s) {
        const open = questions().filter(function (q) { return q.sellerId === s.id && !q.answer && q.status !== 'hidden'; }).length;
        const tabs = [];
        if (on('qa')) tabs.push(['questions', 'fa-circle-question', KG.tx('Questions', 'प्रश्न') + (open ? ' (' + open + ')' : '')]);
        if (on('vacation')) tabs.push(['vacation', 'fa-umbrella-beach', KG.tx('Vacation', 'बिदा') + (KG.vacationOf(s.id) ? ' •' : '')]);
        return tabs;
    };
    KG.extraSellerRenderers = { questions: sellerQuestionsTab, vacation: sellerVacationTab };

    KG.initCommerce = function () {
        hookProductPage(); hookListingEditor(); hookAccount(); hookShopPage();
        const render = window.renderProducts;
        window.renderProducts = function () { render.apply(this, arguments); decorateCards(); };
        // Re-check alerts whenever products change
        const set = KG.store.set;
        KG.store.set = function (key) { const r = set.apply(this, arguments); if (key === 'kg-products' || key === 'kg-sellers') setTimeout(KG.checkAlerts, 0); return r; };
        KG.onSettings(function () { renderProducts(); });
        const refresh = KG.refreshAccountLabel;
        KG.refreshAccountLabel = function () { refresh.apply(this, arguments); updateBell(); };
        KG.checkAlerts(); updateBell(); decorateCards();
    };
})();
