/* =====================================================================
   KALAGHAR CHECKOUT — bag, checkout, coupons, payments, held payouts,
   orders, invoices, buyer account, reviews, protection cases, messaging
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, C = KG.C, esc = KG.esc, ui = KG.ui;

    /* ---------------------------- bag ---------------------------- */
    KG.cart = function () { return KG.store.get('kg-cart', []); };
    function saveCart(c) { KG.store.set('kg-cart', c); KG.store.set('kg-cart-ts', Date.now()); updateCartCount(); }
    function updateCartCount() {
        const n = KG.cart().reduce(function (s, l) { return s + l.qty; }, 0);
        const el = document.getElementById('cartCounter'); if (el) el.textContent = n;
        window.cartCount = n;
    }
    KG.updateCartCount = updateCartCount;
    KG.addToCart = function (id, qty, personalization, silent) {
        const p = KG.product(id); if (!p) return;
        qty = Math.max(1, +qty || 1);
        const c = KG.cart();
        const line = c.find(function (l) { return l.productId == id && (l.personalization || '') === (personalization || ''); });
        if (line) line.qty += qty; else c.push({ productId: +id, qty: qty, personalization: (personalization || '').trim() });
        saveCart(c); KG.track('cart', +id);
        if (!silent) KG.toast((KG.lang() === 'ne' && p.nameNe ? p.nameNe : p.name) + ' — ' + KG.tx('added to bag', 'झोलामा थपियो'));
    };
    // keep the old global working (used by older markup)
    window.addToCart = function (nameOrId) {
        const p = typeof nameOrId === 'number' ? KG.product(nameOrId) : KG.products().find(function (x) { return x.name === nameOrId; });
        if (p) KG.addToCart(p.id);
    };
    KG.setQty = function (i, q) { const c = KG.cart(); if (!c[i]) return; if (q <= 0) c.splice(i, 1); else c[i].qty = q; saveCart(c); KG.openCart(); };

    function cartLines() {
        return KG.cart().map(function (l) { const p = KG.product(l.productId); return p ? Object.assign({}, l, { p: p, total: p.price * l.qty }) : null; }).filter(Boolean);
    }

    KG.openCart = function () {
        const lines = cartLines();
        const sub = lines.reduce(function (s, l) { return s + l.total; }, 0);
        KG.modal('kgCart', '<i class="fa-solid fa-bag-shopping text-red-700 mr-1"></i>' + t('kgBag'),
            lines.length ? (
                '<div class="divide-y divide-gray-100 dark:divide-gray-800">' + lines.map(function (l, i) {
                    return '<div class="flex gap-3 py-3">' +
                        '<img src="' + esc(l.p.image) + '" alt="" class="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700">' +
                        '<div class="flex-1 min-w-0"><button class="text-sm font-semibold text-gray-900 dark:text-white hover:text-red-700 text-left" onclick="KG.closeModal(\'kgCart\');KG.openProduct(' + l.p.id + ')">' + esc(l.p.name) + '</button>' +
                            '<p class="' + ui.muted + '">' + esc((KG.seller(l.p.sellerId) || {}).shopName || '') + '</p>' +
                            (l.personalization ? '<p class="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5"><i class="fa-solid fa-pen-nib mr-1"></i>' + esc(l.personalization) + '</p>' : '') +
                            '<div class="flex items-center gap-2 mt-1.5"><button class="w-7 h-7 rounded border border-gray-300 dark:border-gray-700" aria-label="Decrease" onclick="KG.setQty(' + i + ',' + (l.qty - 1) + ')">−</button><span class="text-sm w-6 text-center">' + l.qty + '</span><button class="w-7 h-7 rounded border border-gray-300 dark:border-gray-700" aria-label="Increase" onclick="KG.setQty(' + i + ',' + (l.qty + 1) + ')">+</button><button class="text-xs text-gray-500 hover:text-red-700 ml-2" onclick="KG.setQty(' + i + ',0)">' + KG.tx('Remove', 'हटाउनुहोस्') + '</button></div>' +
                        '</div>' +
                        '<div class="text-right">' + KG.priceHtml(l.total) + '</div>' +
                    '</div>';
                }).join('') + '</div>' +
                '<div class="border-t border-gray-200 dark:border-gray-800 mt-2 pt-3 flex justify-between items-center"><span class="font-semibold text-sm">' + KG.tx('Subtotal', 'उपजम्मा') + '</span><span>' + KG.priceHtml(sub, 'text-lg font-extrabold text-red-700 dark:text-red-400') + '</span></div>' +
                '<p class="' + ui.muted + ' mt-1">' + KG.tx('Shipping, coupons and gift options at checkout.', 'ढुवानी, कुपन र उपहार विकल्प चेकआउटमा।') + '</p>' +
                '<button class="' + ui.btn + ' w-full mt-4" onclick="KG.openCheckout()">' + KG.tx('Checkout', 'चेकआउट') + ' <i class="fa-solid fa-arrow-right ml-1"></i></button>'
            ) : '<div class="text-center py-10"><i class="fa-solid fa-bag-shopping text-4xl text-gray-300 dark:text-gray-700"></i><p class="text-sm text-gray-500 mt-3">' + KG.tx('Your bag is empty.', 'झोला खाली छ।') + '</p><button class="' + ui.btn2 + ' mt-4" onclick="KG.closeModal(\'kgCart\');KG.openGiftMode()"><i class="fa-solid fa-gift mr-1"></i>' + KG.tx('Need ideas? Try Gift Mode', 'उपहार मोड प्रयास गर्नुहोस्') + '</button></div>', 'lg');
    };

    /* ---------------------------- coupons ---------------------------- */
    KG.allCoupons = function () { return C.coupons.concat(KG.store.get('kg-coupons', [])).filter(function (c) { return c.active !== false && (!c.expires || new Date(c.expires) >= new Date(KG.today())); }); };
    KG.findCoupon = function (code) { code = (code || '').trim().toUpperCase(); return KG.allCoupons().find(function (c) { return c.code.toUpperCase() === code; }); };
    function couponDiscount(coupon, lines) {
        if (!coupon) return { amount: 0, freeship: false, error: '' };
        const eligible = lines.filter(function (l) { return !coupon.sellerId || l.p.sellerId === coupon.sellerId; });
        const base = eligible.reduce(function (s, l) { return s + l.total; }, 0);
        if (!eligible.length) return { amount: 0, freeship: false, error: KG.tx('This code is for another shop\'s items.', 'यो कोड अर्को पसलका लागि हो।') };
        if (base < (coupon.minOrder || 0)) return { amount: 0, freeship: false, error: KG.tx('Spend ' + KG.npr(coupon.minOrder) + ' to use this code.', 'यो कोडका लागि ' + KG.npr(coupon.minOrder) + ' को खरिद चाहिन्छ।') };
        if (coupon.type === 'freeship') return { amount: 0, freeship: true, error: '' };
        const amt = coupon.type === 'percent' ? base * coupon.value / 100 : Math.min(base, coupon.value);
        return { amount: Math.round(amt), freeship: false, error: '' };
    }

    /* ---------------------------- checkout ---------------------------- */
    KG.openCheckout = function (opts) {
        const lines = cartLines(); if (!lines.length) { KG.openCart(); return; }
        const u = KG.user();
        const st = Object.assign({ zone: 'np-valley', gift: false, coupon: null, insurance: false, method: null }, opts || {});
        if (st.gift) st.zone = 'np-outside';
        const pay = C.payments;
        const testMode = !pay.paymentApiBase;
        const body = KG.modal('kgCheckout', '<i class="fa-solid fa-lock text-green-700 mr-1"></i>' + t('kgCheckout'),
            (testMode ? '<div class="mb-4 text-xs bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-lg p-3"><i class="fa-solid fa-flask mr-1"></i><strong>' + KG.tx('Test mode', 'परीक्षण मोड') + ':</strong> ' + KG.tx('online payments are not switched on yet, so no money will be taken. Orders are saved so you can test the full flow.', 'अनलाइन भुक्तानी अझै सुरु भएको छैन, पैसा काटिँदैन।') + '</div>' : '') +
            '<form id="kgCoForm" class="grid lg:grid-cols-5 gap-6" novalidate>' +
                '<div class="lg:col-span-3 space-y-5">' +
                    // diaspora gifting
                    '<label class="flex gap-3 items-start bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-2xl p-3 cursor-pointer">' +
                        '<input type="checkbox" name="gift" class="mt-1 accent-red-700"' + (st.gift ? ' checked' : '') + '>' +
                        '<span><span class="block text-sm font-bold text-gray-900 dark:text-white"><i class="fa-solid fa-gift text-red-700 mr-1"></i>' + t('kgDiasporaTitle') + '</span><span class="block ' + ui.muted + '">' + t('kgDiasporaSub') + '</span></span>' +
                    '</label>' +
                    '<fieldset class="space-y-3"><legend class="text-sm font-bold text-gray-900 dark:text-white mb-2">' + KG.tx('Your details', 'तपाईंको विवरण') + '</legend>' +
                        '<div class="grid sm:grid-cols-2 gap-3">' +
                            field('name', KG.tx('Full name', 'पूरा नाम'), 'text', u ? u.name : '', true) +
                            field('email', KG.tx('Email (for invoice & updates)', 'इमेल'), 'email', u ? u.email : '', true) +
                            field('phone', KG.tx('Phone', 'फोन'), 'tel', '', true) +
                            '<div><label class="' + ui.label + '" for="co-zone">' + KG.tx('Deliver to', 'डेलिभरी स्थान') + '</label><select id="co-zone" name="zone" class="' + ui.input + '">' + C.shipping.zones.map(function (z) { return '<option value="' + z.id + '"' + (z.id === st.zone ? ' selected' : '') + '>' + esc(z.label) + '</option>'; }).join('') + '</select></div>' +
                        '</div>' +
                    '</fieldset>' +
                    '<fieldset id="co-giftbox" class="space-y-3 ' + (st.gift ? '' : 'hidden') + '"><legend class="text-sm font-bold text-gray-900 dark:text-white mb-2">' + KG.tx('Recipient in Nepal', 'नेपालमा प्राप्तकर्ता') + '</legend>' +
                        '<div class="grid sm:grid-cols-2 gap-3">' +
                            field('rname', KG.tx('Recipient name', 'प्राप्तकर्ताको नाम'), 'text', '', false) +
                            field('rphone', KG.tx('Recipient phone (Nepal)', 'प्राप्तकर्ताको फोन'), 'tel', '', false) +
                            '<div><label class="' + ui.label + '" for="co-occasion">' + KG.tx('Occasion', 'अवसर') + '</label><select id="co-occasion" name="occasion" class="' + ui.input + '"><option>Dashain</option><option>Tihar</option><option>Teej</option><option>Birthday</option><option>Wedding</option><option>Just because</option></select></div>' +
                            '<label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 mt-6"><input type="checkbox" name="hidePrices" checked class="accent-red-700"> ' + KG.tx('Hide prices on the packing slip', 'प्याकिङ स्लिपमा मूल्य नदेखाउनुहोस्') + '</label>' +
                        '</div>' +
                        '<div><label class="' + ui.label + '" for="co-msg">' + KG.tx('Gift message', 'उपहार सन्देश') + '</label><textarea id="co-msg" name="giftMsg" rows="2" maxlength="300" class="' + ui.input + '" placeholder="' + KG.tx('Happy Dashain, Aama! With love from Sydney.', 'दशैंको शुभकामना!') + '"></textarea></div>' +
                    '</fieldset>' +
                    '<fieldset class="space-y-3"><legend id="co-addr-legend" class="text-sm font-bold text-gray-900 dark:text-white mb-2">' + KG.tx('Delivery address', 'डेलिभरी ठेगाना') + '</legend>' +
                        '<div class="grid sm:grid-cols-2 gap-3">' +
                            field('address', KG.tx('Street / Tole', 'टोल / सडक'), 'text', '', true) +
                            field('city', KG.tx('City / Municipality', 'शहर / नगरपालिका'), 'text', '', true) +
                            field('district', KG.tx('District / State', 'जिल्ला / प्रदेश'), 'text', '', false) +
                            field('postcode', KG.tx('Postcode', 'पोस्टकोड'), 'text', '', false) +
                            '<div class="sm:col-span-2" id="co-country-wrap">' + field('country', KG.tx('Country', 'देश'), 'text', 'Nepal', true) + '</div>' +
                        '</div>' +
                    '</fieldset>' +
                    '<fieldset><legend class="text-sm font-bold text-gray-900 dark:text-white mb-2">' + KG.tx('Courier', 'कुरियर') + '</legend><div id="co-couriers" class="grid sm:grid-cols-2 gap-2"></div>' +
                        '<label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 mt-3"><input type="checkbox" name="insurance" class="accent-red-700"> ' + KG.tx('Add shipping insurance', 'ढुवानी बीमा थप्नुहोस्') + ' (' + Math.round(C.shipping.insuranceRate * 100) + '% ' + KG.tx('of item value', 'वस्तु मूल्यको') + ')</label>' +
                    '</fieldset>' +
                    '<fieldset><legend class="text-sm font-bold text-gray-900 dark:text-white mb-2">' + KG.tx('Payment', 'भुक्तानी') + '</legend><div id="co-methods" class="grid sm:grid-cols-2 gap-2"></div></fieldset>' +
                '</div>' +
                '<aside class="lg:col-span-2"><div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 lg:sticky lg:top-16">' +
                    '<p class="text-sm font-bold text-gray-900 dark:text-white mb-3">' + KG.tx('Order summary', 'अर्डर सारांश') + '</p>' +
                    '<div class="space-y-2 text-xs">' + lines.map(function (l) { return '<div class="flex justify-between gap-2"><span class="text-gray-700 dark:text-gray-300">' + esc(l.p.name) + ' × ' + l.qty + '</span><span>' + KG.npr(l.total) + '</span></div>'; }).join('') + '</div>' +
                    '<div class="flex gap-2 mt-4"><label class="sr-only" for="co-coupon">Coupon</label><input id="co-coupon" name="coupon" placeholder="' + KG.tx('Coupon code', 'कुपन कोड') + '" class="' + ui.input + ' uppercase" value="' + esc(st.coupon || '') + '"><button type="button" id="co-apply" class="' + ui.btn2 + '">' + KG.tx('Apply', 'लागू') + '</button></div>' +
                    '<p id="co-coupon-msg" class="text-[11px] mt-1"></p>' +
                    '<div id="co-totals" class="mt-3 text-sm space-y-1.5"></div>' +
                    '<label class="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-400 mt-4"><input type="checkbox" name="agree" required class="mt-0.5 accent-red-700"><span>' + KG.tx('I agree to the ', 'म ') + '<a href="pages/terms.html" target="_blank" class="underline">' + KG.tx('Terms', 'सर्तहरू') + '</a>, <a href="pages/returns.html" target="_blank" class="underline">' + KG.tx('Return policy', 'फिर्ता नीति') + '</a> ' + KG.tx('and', 'र') + ' <a href="pages/privacy.html" target="_blank" class="underline">' + KG.tx('Privacy policy', 'गोपनीयता नीति') + '</a>' + KG.tx('.', 'मा सहमत छु।') + '</span></label>' +
                    '<p id="co-error" class="text-xs text-red-700 dark:text-red-400 mt-2 hidden" role="alert"></p>' +
                    '<button type="submit" class="' + ui.btn + ' w-full mt-3"><i class="fa-solid fa-lock mr-1"></i><span id="co-paylabel">' + KG.tx('Place order', 'अर्डर गर्नुहोस्') + '</span></button>' +
                    '<p class="text-[11px] text-green-700 dark:text-green-400 mt-3"><i class="fa-solid fa-shield-halved mr-1"></i>' + KG.tx('Your payment is held safely and only released to the artisan after delivery.', 'तपाईंको भुक्तानी डेलिभरी नभएसम्म सुरक्षित राखिन्छ।') + '</p>' +
                '</div></aside>' +
            '</form>', 'full');

        const form = body.querySelector('#kgCoForm');
        function field(name, label, type, val, req) {
            return '<div><label class="' + ui.label + '" for="co-' + name + '">' + label + (req ? ' <span class="text-red-700">*</span>' : '') + '</label><input id="co-' + name + '" name="' + name + '" type="' + type + '" value="' + esc(val) + '"' + (req ? ' required' : '') + ' class="' + ui.input + '"></div>';
        }
        function calc() {
            const z = KG.zoneById(form.zone.value);
            const coupon = st.coupon ? KG.findCoupon(st.coupon) : null;
            const goods = lines.reduce(function (s, l) { return s + l.total; }, 0);
            const weight = lines.reduce(function (s, l) { return s + (l.p.weightG || 500) * l.qty; }, 0);
            const cd = couponDiscount(coupon, lines);
            let ship = KG.shippingCost(z.id, goods - cd.amount, weight);
            if (cd.freeship) ship = 0;
            const ins = form.insurance.checked ? Math.round(goods * C.shipping.insuranceRate) : 0;
            const total = goods - cd.amount + ship + ins;
            const vat = C.tax.pricesIncludeVat ? (goods - cd.amount) - (goods - cd.amount) / (1 + C.tax.vatRate) : 0;
            return { zone: z, coupon: coupon, cd: cd, goods: goods, weight: weight, ship: ship, ins: ins, total: total, vat: vat };
        }
        function renderOptions() {
            const z = KG.zoneById(form.zone.value);
            const giftOn = form.gift.checked;
            body.querySelector('#co-giftbox').classList.toggle('hidden', !giftOn);
            body.querySelector('#co-addr-legend').textContent = giftOn ? KG.tx('Recipient\'s address in Nepal', 'प्राप्तकर्ताको ठेगाना (नेपाल)') : KG.tx('Delivery address', 'डेलिभरी ठेगाना');
            if (giftOn && !z.domestic) { form.zone.value = 'np-outside'; return renderOptions(); }
            if (z.domestic) form.country.value = 'Nepal';
            else if (form.country.value === 'Nepal') form.country.value = '';
            form.country.readOnly = !!z.domestic;
            const couriers = z.domestic ? C.shipping.couriers.domestic : C.shipping.couriers.international;
            const cWrap = body.querySelector('#co-couriers');
            const curC = (form.querySelector('input[name="courier"]:checked') || {}).value;
            cWrap.innerHTML = couriers.map(function (c, i) {
                return '<label class="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm cursor-pointer has-[:checked]:border-red-700"><input type="radio" name="courier" value="' + c.id + '" class="accent-red-700"' + ((curC ? curC === c.id : i === 0) ? ' checked' : '') + '><span>' + esc(c.name) + '<span class="block ' + ui.muted + '">' + z.days + KG.tx(' business days', ' कार्यदिवस') + '</span></span></label>';
            }).join('');
            if (!cWrap.querySelector(':checked')) cWrap.querySelector('input').checked = true;
            // international buyers (or gift senders) may still pay by card; domestic wallets only for Nepal
            const payerAbroad = giftOn || !z.domestic;
            const methods = C.payments.methods.filter(function (m) { return (giftOn ? !m.domesticOnly : (z.domestic || !m.domesticOnly)) && (!KG.serverMethods || KG.serverMethods.indexOf(m.id) > -1); });
            const mWrap = body.querySelector('#co-methods');
            const cur = (form.querySelector('input[name="method"]:checked') || {}).value;
            mWrap.innerHTML = methods.map(function (m, i) {
                return '<label class="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm cursor-pointer has-[:checked]:border-red-700"><input type="radio" name="method" value="' + m.id + '" class="accent-red-700"' + ((cur ? cur === m.id : i === 0) ? ' checked' : '') + '>' + methodIcon(m.id) + '<span>' + esc(m.name) + '</span></label>';
            }).join('');
            if (!mWrap.querySelector(':checked') && mWrap.querySelector('input')) mWrap.querySelector('input').checked = true;
            if (payerAbroad && !giftOn) mWrap.insertAdjacentHTML('beforeend', '<p class="sm:col-span-2 ' + ui.muted + '">' + KG.tx('Nepali wallets work only for payments inside Nepal.', 'नेपाली वालेट नेपालभित्र मात्र।') + '</p>');
            renderTotals();
        }
        function renderTotals() {
            const r = calc();
            const msg = body.querySelector('#co-coupon-msg');
            if (st.coupon && !r.coupon) { msg.className = 'text-[11px] mt-1 text-red-700'; msg.textContent = KG.tx('That code isn\'t valid.', 'कोड मिलेन।'); }
            else if (r.coupon && r.cd.error) { msg.className = 'text-[11px] mt-1 text-amber-700'; msg.textContent = r.cd.error; }
            else if (r.coupon) { msg.className = 'text-[11px] mt-1 text-green-700'; msg.textContent = '✓ ' + r.coupon.code + ' — ' + (r.coupon.note || ''); }
            else msg.textContent = '';
            const row = function (l, v, cls) { return '<div class="flex justify-between ' + (cls || '') + '"><span>' + l + '</span><span>' + v + '</span></div>'; };
            body.querySelector('#co-totals').innerHTML =
                row(KG.tx('Items', 'वस्तु'), KG.npr(r.goods)) +
                (r.cd.amount ? row(KG.tx('Discount', 'छुट'), '− ' + KG.npr(r.cd.amount), 'text-green-700') : '') +
                row(KG.tx('Shipping', 'ढुवानी') + ' <span class="' + ui.muted + '">(' + (r.weight / 1000).toFixed(1) + ' kg)</span>', r.ship ? KG.npr(r.ship) : KG.tx('Free', 'निःशुल्क')) +
                (r.ins ? row(KG.tx('Insurance', 'बीमा'), KG.npr(r.ins)) : '') +
                '<div class="flex justify-between font-extrabold text-base pt-2 border-t border-gray-200 dark:border-gray-700"><span>' + KG.tx('Total', 'जम्मा') + '</span><span class="text-red-700 dark:text-red-400">' + KG.npr(r.total) + '</span></div>' +
                (KG.cur !== 'NPR' ? row('', '≈ ' + KG.fx(r.total), 'text-xs text-gray-500') : '') +
                (r.vat ? row('<span class="' + ui.muted + '">' + KG.tx('Includes VAT ' + Math.round(C.tax.vatRate * 100) + '%', 'भ्याट ' + Math.round(C.tax.vatRate * 100) + '% समावेश') + '</span>', '<span class="' + ui.muted + '">' + KG.npr(r.vat) + '</span>') : '');
            const m = (form.querySelector('input[name="method"]:checked') || {}).value;
            body.querySelector('#co-paylabel').textContent = m === 'cod' ? KG.tx('Place order — pay on delivery', 'अर्डर गर्नुहोस् — डेलिभरीमा तिर्नुहोस्') : KG.tx('Pay ', 'तिर्नुहोस् ') + KG.npr(r.total);
        }
        form.addEventListener('change', function (e) { if (e.target.name === 'zone' || e.target.name === 'gift') renderOptions(); else renderTotals(); });
        body.querySelector('#co-apply').addEventListener('click', function () { st.coupon = form.coupon.value.trim().toUpperCase() || null; renderTotals(); });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const err = body.querySelector('#co-error'); err.classList.add('hidden');
            const giftOn = form.gift.checked;
            const required = ['name', 'email', 'phone', 'address', 'city', 'country'].concat(giftOn ? ['rname', 'rphone'] : []);
            const missing = required.filter(function (n) { return !form[n].value.trim(); });
            if (missing.length) { err.textContent = KG.tx('Please fill in all required fields.', 'सबै आवश्यक विवरण भर्नुहोस्।'); err.classList.remove('hidden'); form[missing[0]].focus(); return; }
            if (!/^\S+@\S+\.\S+$/.test(form.email.value)) { err.textContent = KG.tx('Please enter a valid email.', 'सही इमेल लेख्नुहोस्।'); err.classList.remove('hidden'); return; }
            if (!form.agree.checked) { err.textContent = KG.tx('Please accept the terms and policies.', 'सर्त र नीति स्वीकार गर्नुहोस्।'); err.classList.remove('hidden'); return; }
            const r = calc();
            if (r.coupon && r.cd.error) { st.coupon = null; }
            placeOrders(form, r, lines);
        });
        renderOptions();
    };
    function methodIcon(id) {
        const m = { khalti: '<span class="text-[10px] font-bold text-purple-700 bg-purple-50 rounded px-1">K</span>', esewa: '<span class="text-[10px] font-bold text-green-700 bg-green-50 rounded px-1">e</span>', fonepay: '<i class="fa-solid fa-qrcode text-red-600"></i>', connectips: '<i class="fa-solid fa-building-columns text-blue-700"></i>', card: '<i class="fa-brands fa-cc-visa text-blue-800"></i>', cod: '<i class="fa-solid fa-money-bill-1 text-green-700"></i>' };
        return m[id] || '';
    }

    /* Orders are split per seller (like Etsy), each with its own held payout. */
    function placeOrders(form, r, lines) {
        const u = KG.user();
        const giftOn = form.gift.checked;
        const method = (form.querySelector('input[name="method"]:checked') || {}).value || 'cod';
        const courier = (form.querySelector('input[name="courier"]:checked') || {}).value || '';
        const groupId = KG.uid('G');
        const bySeller = {};
        lines.forEach(function (l) { (bySeller[l.p.sellerId] = bySeller[l.p.sellerId] || []).push(l); });
        const sellerIds = Object.keys(bySeller);
        const testMode = !C.payments.paymentApiBase;
        const created = [];
        let seq = KG.store.get('kg-order-seq', 1000);
        sellerIds.forEach(function (sid) {
            const ls = bySeller[sid];
            const goods = ls.reduce(function (s, l) { return s + l.total; }, 0);
            const share = r.goods ? goods / r.goods : 1;
            const wShare = r.weight ? ls.reduce(function (s, l) { return s + (l.p.weightG || 500) * l.qty; }, 0) / r.weight : 1;
            const discount = r.coupon && !r.cd.error ? Math.round(r.cd.amount * (r.coupon.sellerId ? (r.coupon.sellerId === sid ? 1 : 0) : share)) : 0;
            const ship = Math.round(r.ship * wShare), ins = Math.round(r.ins * share);
            const total = goods - discount + ship + ins;
            seq++;
            const order = {
                id: 'KG-' + seq, groupId: groupId, sellerId: sid, buyerId: u ? u.id : null,
                buyer: { name: form.name.value.trim(), email: form.email.value.trim(), phone: form.phone.value.trim() },
                address: { line: form.address.value.trim(), city: form.city.value.trim(), district: form.district.value.trim(), postcode: form.postcode.value.trim(), country: form.country.value.trim() },
                gift: giftOn ? { recipient: form.rname.value.trim(), phone: form.rphone.value.trim(), occasion: form.occasion.value, message: form.giftMsg.value.trim(), hidePrices: form.hidePrices.checked } : null,
                items: ls.map(function (l) { return { productId: l.p.id, name: l.p.name, price: l.p.price, qty: l.qty, personalization: l.personalization, sellerId: sid }; }),
                goods: goods, discount: discount, coupon: r.coupon && !r.cd.error ? r.coupon.code : '', shipping: ship, insurance: ins, total: total,
                vat: C.tax.pricesIncludeVat ? Math.round((goods - discount) - (goods - discount) / (1 + C.tax.vatRate)) : 0,
                zone: r.zone.id, courier: courier, tracking: '',
                payment: { method: method, status: method === 'cod' ? 'cod' : (testMode ? 'test' : 'pending'), ref: '' },
                status: method === 'cod' || testMode ? 'paid' : 'awaiting_payment',
                escrow: method === 'cod' ? 'cod' : (testMode ? 'held' : 'none'),
                payout: Math.round((goods - discount) * (1 - C.payments.commissionRate)),
                invoiceNo: 'INV-' + new Date().getFullYear() + '-' + seq,
                createdAt: KG.now(), timeline: [{ at: KG.now(), status: 'placed', note: testMode && method !== 'cod' ? 'Test mode — no money taken' : '' }]
            };
            if (order.status === 'paid') order.timeline.push({ at: KG.now(), status: method === 'cod' ? 'confirmed' : 'paid', note: '' });
            KG.store.push('kg-orders', order); created.push(order);
            order.items.forEach(function (i) { KG.track('buy', i.productId); });
        });
        KG.store.set('kg-order-seq', seq);
        saveCart([]);
        if (!testMode && method !== 'cod') return startPayment(created, method);
        showConfirmation(created);
    }

    function showConfirmation(orders) {
        const total = orders.reduce(function (s, o) { return s + o.total; }, 0);
        KG.closeModal('kgCheckout');
        KG.modal('kgDone', KG.tx('Thank you! Your order is placed.', 'धन्यवाद! अर्डर भयो।'),
            '<div class="text-center"><div class="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 flex items-center justify-center text-2xl"><i class="fa-solid fa-check"></i></div>' +
            '<p class="text-sm text-gray-700 dark:text-gray-300 mt-3">' + KG.tx('Order', 'अर्डर') + ' ' + orders.map(function (o) { return '<strong>' + o.id + '</strong>'; }).join(', ') + ' · ' + KG.npr(total) + '</p>' +
            (orders.length > 1 ? '<p class="' + ui.muted + ' mt-1">' + KG.tx('Your items come from ' + orders.length + ' artisans, so they ship separately.', 'तपाईंका वस्तु ' + orders.length + ' शिल्पीबाट अलग-अलग आउँछन्।') + '</p>' : '') +
            '<p class="' + ui.muted + ' mt-2">' + KG.tx('A copy of your invoice is ready below. We\'ll email updates to ', 'इनभ्वाइस तल छ। अपडेट पठाइनेछ: ') + esc(orders[0].buyer.email) + '.</p>' +
            '<div class="flex flex-wrap justify-center gap-2 mt-5">' + orders.map(function (o) { return '<button class="' + ui.btn2 + '" onclick="KG.invoice(\'' + o.id + '\')"><i class="fa-solid fa-file-invoice mr-1"></i>' + KG.tx('Invoice ', 'इनभ्वाइस ') + o.id + '</button>'; }).join('') +
            '<button class="' + ui.btn + '" onclick="KG.closeModal(\'kgDone\');KG.openAccount()">' + KG.tx('Track my orders', 'अर्डर ट्र्याक गर्नुहोस्') + '</button></div>' +
            (!KG.user() ? '<p class="' + ui.muted + ' mt-4">' + KG.tx('Create an account with the same email to track orders and leave reviews.', 'अर्डर ट्र्याक गर्न सोही इमेलबाट खाता बनाउनुहोस्।') + '</p>' : '') + '</div>', 'md');
    }

    /* ---------------------------- online payments ----------------------------
       The payment server (see /server) creates the payment with your merchant
       keys and returns where to send the buyer.                              */
    function startPayment(orders, method) {
        const base = C.payments.paymentApiBase.replace(/\/$/, '');
        const total = orders.reduce(function (s, o) { return s + o.total; }, 0);
        const returnUrl = location.origin + location.pathname + '?payment=return&group=' + encodeURIComponent(orders[0].groupId) + '&method=' + method;
        fetch(base + '/api/pay/' + method + '/start', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: orders[0].groupId, orderIds: orders.map(function (o) { return o.id; }), amountNpr: total, buyer: orders[0].buyer, returnUrl: returnUrl, currency: KG.cur })
        }).then(function (r) { return r.json(); }).then(function (j) {
            if (j.redirectUrl) location.href = j.redirectUrl;
            else if (j.form) { // eSewa: auto-submit signed form
                const f = document.createElement('form'); f.method = 'POST'; f.action = j.form.action;
                Object.keys(j.form.fields).forEach(function (k) { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = j.form.fields[k]; f.appendChild(i); });
                document.body.appendChild(f); f.submit();
            } else if (j.qrImage) { // Fonepay dynamic QR
                KG.modal('kgQrPay', 'Fonepay QR', '<div class="text-center"><img src="' + esc(j.qrImage) + '" alt="Payment QR" class="mx-auto w-56 h-56"><p class="text-sm mt-3">' + KG.tx('Scan with any bank app to pay ', 'कुनै पनि बैंक एपबाट स्क्यान गर्नुहोस् ') + KG.npr(total) + '</p><button class="' + ui.btn + ' mt-4" onclick="location.href=\'' + esc(returnUrl) + '&ref=' + esc(j.ref || '') + '\'">' + KG.tx('I have paid', 'भुक्तानी गरें') + '</button></div>');
            } else throw new Error(j.error || 'Payment could not start');
        }).catch(function (e) {
            KG.toast(KG.tx('Payment could not start: ', 'भुक्तानी सुरु हुन सकेन: ') + e.message + KG.tx('. Your order is saved — try again from My Account.', '। अर्डर सुरक्षित छ।'), 'error');
            showConfirmation(orders);
        });
    }
    KG.handlePaymentReturn = function () {
        const q = new URLSearchParams(location.search);
        if (q.get('payment') !== 'return') return;
        const group = q.get('group'), method = q.get('method');
        const base = (C.payments.paymentApiBase || '').replace(/\/$/, '');
        const params = {}; q.forEach(function (v, k) { params[k] = v; });
        history.replaceState(null, '', location.pathname);
        if (!base) return;
        fetch(base + '/api/pay/' + method + '/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) })
            .then(function (r) { return r.json(); }).then(function (j) {
                const orders = KG.store.get('kg-orders', []).filter(function (o) { return o.groupId === group; });
                orders.forEach(function (o) {
                    KG.store.update('kg-orders', o.id, function (x) {
                        const tl = x.timeline.concat([{ at: KG.now(), status: j.paid ? 'paid' : 'payment_failed', note: j.ref || '' }]);
                        return j.paid ? { status: 'paid', escrow: 'held', payment: Object.assign({}, x.payment, { status: 'paid', ref: j.ref || '' }), timeline: tl } : { payment: Object.assign({}, x.payment, { status: 'failed' }), timeline: tl };
                    });
                });
                if (j.paid) showConfirmation(KG.store.get('kg-orders', []).filter(function (o) { return o.groupId === group; }));
                else KG.toast(KG.tx('Payment was not completed. If money was deducted it will be refunded within 7 days.', 'भुक्तानी पूरा भएन। रकम काटिएको भए ७ दिनभित्र फिर्ता हुन्छ।'), 'error');
            }).catch(function () { KG.toast(KG.tx('Could not confirm payment yet — check My Account shortly.', 'भुक्तानी पुष्टि हुन सकेन।'), 'warn'); });
    };

    /* ---------------------------- order lifecycle ---------------------------- */
    const STATUS = {
        awaiting_payment: ['Awaiting payment', 'भुक्तानी बाँकी', 'bg-gray-100 text-gray-700'],
        paid: ['Paid — preparing', 'भुक्तानी भयो — तयारी', 'bg-blue-100 text-blue-800'],
        shipped: ['Shipped', 'पठाइयो', 'bg-indigo-100 text-indigo-800'],
        delivered: ['Delivered', 'डेलिभर भयो', 'bg-teal-100 text-teal-800'],
        completed: ['Completed', 'पूरा', 'bg-green-100 text-green-800'],
        cancelled: ['Cancelled', 'रद्द', 'bg-gray-200 text-gray-700'],
        refunded: ['Refunded', 'रकम फिर्ता', 'bg-amber-100 text-amber-800'],
        disputed: ['Case open', 'उजुरी खुला', 'bg-red-100 text-red-800']
    };
    KG.statusBadge = function (s) { const x = STATUS[s] || [s, s, 'bg-gray-100 text-gray-700']; return '<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ' + x[2] + '">' + esc(KG.tx(x[0], x[1])) + '</span>'; };
    KG.escrowLabel = function (o) {
        return { held: KG.tx('Payout held until delivery', 'डेलिभरीसम्म भुक्तानी रोकिएको'), released: KG.tx('Paid out to artisan', 'शिल्पीलाई भुक्तानी'), refunded: KG.tx('Refunded to buyer', 'खरिदकर्तालाई फिर्ता'), frozen: KG.tx('On hold — case open', 'उजुरीका कारण रोकिएको'), cod: KG.tx('Cash on delivery', 'क्यास अन डेलिभरी'), none: KG.tx('Not paid yet', 'भुक्तानी भएको छैन') }[o.escrow] || o.escrow;
    };
    KG.setOrderStatus = function (id, status, note, extra) {
        return KG.store.update('kg-orders', id, function (o) {
            const patch = Object.assign({ status: status, timeline: o.timeline.concat([{ at: KG.now(), status: status, note: note || '' }]) }, extra || {});
            if (status === 'shipped') patch.shippedAt = KG.now();
            if (status === 'delivered') patch.deliveredAt = KG.now();
            const holding = o.escrow === 'held' || o.escrow === 'frozen';
            if (status === 'completed') { patch.completedAt = KG.now(); if (holding) { patch.escrow = 'released'; patch.releasedAt = KG.now(); } }
            if (status === 'refunded' && o.escrow !== 'cod') patch.escrow = 'refunded';
            if (status === 'cancelled' && holding) patch.escrow = 'refunded';
            return patch;
        });
    };
    // Auto-release payouts N days after delivery if no case is open
    KG.autoRelease = function () {
        const days = C.payments.autoReleaseDays;
        KG.store.get('kg-orders', []).forEach(function (o) {
            if (o.status === 'delivered' && o.deliveredAt && Date.now() - new Date(o.deliveredAt) > days * 864e5) KG.setOrderStatus(o.id, 'completed', 'Auto-completed ' + days + ' days after delivery');
        });
    };
    KG.myOrders = function () {
        const u = KG.user(); if (!u) return [];
        return KG.store.get('kg-orders', []).filter(function (o) { return o.buyerId === u.id || (o.buyer.email || '').toLowerCase() === u.email; }).reverse();
    };
    KG.trackingUrl = function (o) {
        const all = C.shipping.couriers.domestic.concat(C.shipping.couriers.international);
        const c = all.find(function (x) { return x.id === o.courier; });
        return c && c.site ? c.site : '';
    };

    /* ---------------------------- invoice (electronic) ---------------------------- */
    KG.invoice = function (orderId) {
        const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === orderId; }); if (!o) return;
        const b = C.business, s = KG.seller(o.sellerId) || {};
        const pend = '<em style="color:#b45309">pending registration</em>';
        const rows = o.items.map(function (i) { return '<tr><td>' + esc(i.name) + (i.personalization ? '<br><small>Personalization: ' + esc(i.personalization) + '</small>' : '') + '</td><td style="text-align:center">' + i.qty + '</td><td style="text-align:right">' + KG.npr(i.price) + '</td><td style="text-align:right">' + KG.npr(i.price * i.qty) + '</td></tr>'; }).join('');
        const taxable = (o.goods - o.discount) - o.vat;
        const html = '<!doctype html><html><head><meta charset="utf-8"><title>Invoice ' + o.invoiceNo + '</title><style>body{font-family:Arial,sans-serif;color:#111;max-width:780px;margin:24px auto;padding:0 16px;font-size:13px}h1{color:#b91c1c;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f7f7f7}.r{text-align:right}.grid{display:flex;justify-content:space-between;gap:24px;margin-top:16px}.muted{color:#666;font-size:12px}button{margin-top:20px;padding:8px 16px;background:#b91c1c;color:#fff;border:0;border-radius:6px;cursor:pointer}@media print{button{display:none}}</style></head><body>' +
            '<div class="grid"><div><h1>KalaGhar</h1><div>' + esc(b.legalName || b.name) + '<br>' + esc(b.address) + '<br>PAN/VAT: ' + (b.pan ? esc(b.pan) : pend) + '<br>Reg. No: ' + (b.registrationNo ? esc(b.registrationNo) : pend) + '<br>E-commerce listing: ' + (b.docListingNo ? esc(b.docListingNo) : pend) + '</div></div>' +
            '<div class="r"><h2 style="margin:0">' + (o.payment.status === 'test' ? 'TEST ' : '') + 'TAX INVOICE</h2><div>Invoice no: <b>' + o.invoiceNo + '</b><br>Order: ' + o.id + '<br>Date: ' + KG.fmtDate(o.createdAt) + '<br>Payment: ' + esc(o.payment.method.toUpperCase()) + ' (' + esc(o.payment.status) + ')</div></div></div>' +
            '<div class="grid"><div><b>Bill to</b><br>' + esc(o.buyer.name) + '<br>' + esc(o.buyer.email) + '<br>' + esc(o.buyer.phone) + '</div>' +
            '<div><b>' + (o.gift ? 'Gift — deliver to' : 'Ship to') + '</b><br>' + (o.gift ? esc(o.gift.recipient) + ' · ' + esc(o.gift.phone) + '<br>' : '') + esc(o.address.line) + ', ' + esc(o.address.city) + '<br>' + esc([o.address.district, o.address.postcode, o.address.country].filter(Boolean).join(', ')) + '</div>' +
            '<div><b>Sold by</b><br>' + esc(s.shopName || '') + '<br><span class="muted">via KalaGhar Marketplace</span></div></div>' +
            '<table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '<table style="width:320px;margin-left:auto"><tr><td>Items</td><td class="r">' + KG.npr(o.goods) + '</td></tr>' +
            (o.discount ? '<tr><td>Discount (' + esc(o.coupon) + ')</td><td class="r">− ' + KG.npr(o.discount) + '</td></tr>' : '') +
            (o.vat ? '<tr><td>Taxable amount</td><td class="r">' + KG.npr(taxable) + '</td></tr><tr><td>VAT ' + Math.round(C.tax.vatRate * 100) + '%</td><td class="r">' + KG.npr(o.vat) + '</td></tr>' : '') +
            '<tr><td>Shipping</td><td class="r">' + KG.npr(o.shipping) + '</td></tr>' + (o.insurance ? '<tr><td>Insurance</td><td class="r">' + KG.npr(o.insurance) + '</td></tr>' : '') +
            '<tr><th>Total</th><th class="r">' + KG.npr(o.total) + '</th></tr></table>' +
            '<p class="muted">Country of origin: Nepal. Returns: exchange or refund within ' + C.protection.returnWindowDays + ' days for faulty or misdescribed items. Complaints: ' + esc(b.complaintOfficer.name || 'Complaint officer') + ', ' + esc(b.complaintOfficer.email) + ', ' + esc(b.complaintOfficer.phone) + '.</p>' +
            (o.payment.status === 'test' ? '<p style="color:#b45309"><b>Test order — no payment was taken. Not a valid tax invoice.</b></p>' : '') +
            '<button onclick="print()">Print / Save as PDF</button></body></html>';
        const w = window.open('', '_blank');
        if (!w) { KG.toast(KG.tx('Allow pop-ups to view the invoice.', 'इनभ्वाइस हेर्न पप-अप खोल्नुहोस्।'), 'warn'); return; }
        w.document.write(html); w.document.close();
    };

    /* ---------------------------- buyer account ---------------------------- */
    KG.openAccount = function (tab) {
        const u = KG.user(); if (!u) { openModal('customerAuthModal'); return; }
        tab = tab || 'orders';
        const seller = KG.mySeller();
        const orders = KG.myOrders();
        const threads = KG.myThreads();
        const tabs = [['orders', KG.tx('My orders', 'मेरा अर्डर')], ['messages', KG.tx('Messages', 'सन्देश') + (threads.unread ? ' (' + threads.unread + ')' : '')], ['favs', t('kgFavs')]];
        const body = KG.modal('kgAccount', esc(KG.tx('Namaste, ', 'नमस्ते, ') + u.name.split(' ')[0]),
            '<div class="flex flex-wrap gap-2 mb-4 items-center">' + tabs.map(function (x) { return '<button class="text-xs font-semibold px-3 py-1.5 rounded-full ' + (x[0] === tab ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-800') + '" onclick="KG.openAccount(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') +
                (seller ? '<button class="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-700 text-red-700 dark:text-red-400" onclick="KG.closeModal(\'kgAccount\');KG.openSellerDashboard()"><i class="fa-solid fa-store mr-1"></i>' + t('fSellerDash') + '</button>' : '<button class="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700" onclick="KG.closeModal(\'kgAccount\');openModal(\'artisanModal\')"><i class="fa-solid fa-hands-holding mr-1"></i>' + KG.tx('Sell on KalaGhar', 'KalaGhar मा बेच्नुहोस्') + '</button>') +
                '<button class="text-xs text-gray-500 hover:text-red-700 ml-auto" onclick="KG.closeModal(\'kgAccount\');KG.logout()"><i class="fa-solid fa-right-from-bracket mr-1"></i>' + KG.tx('Sign out', 'साइन आउट') + '</button></div>' +
            '<div id="kgAcctBody"></div>', 'xl');
        const box = body.querySelector('#kgAcctBody');
        if (tab === 'favs') { KG.closeModal('kgAccount'); KG.openFavorites(); return; }
        if (tab === 'messages') { box.innerHTML = KG.threadListHtml(threads.list, 'buyer'); return; }
        box.innerHTML = orders.length ? orders.map(orderCard).join('') : '<p class="text-sm text-gray-500 text-center py-8">' + KG.tx('No orders yet.', 'अहिलेसम्म अर्डर छैन।') + '</p>';
    };
    function orderCard(o) {
        const s = KG.seller(o.sellerId) || {};
        const canConfirm = o.status === 'shipped' || o.status === 'delivered';
        const canReview = o.status === 'delivered' || o.status === 'completed';
        const caseOpen = o.status === 'disputed';
        const withinCase = Date.now() - new Date(o.createdAt) < (C.protection.caseWindowDays + 30) * 864e5;
        const reviewed = KG.store.get('kg-reviews', []).filter(function (r) { return r.orderId === o.id; }).map(function (r) { return r.productId; });
        const steps = ['paid', 'shipped', 'delivered', 'completed'];
        const idx = steps.indexOf(o.status);
        return '<div class="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-3">' +
            '<div class="flex flex-wrap items-center gap-2 justify-between"><div><strong class="text-sm">' + o.id + '</strong> <span class="' + ui.muted + '">· ' + KG.fmtDate(o.createdAt) + ' · ' + esc(s.shopName || '') + '</span></div>' + KG.statusBadge(o.status) + '</div>' +
            '<ol class="flex items-center gap-1 mt-3" aria-label="Order progress">' + steps.map(function (st, i) {
                const on = idx >= i && o.status !== 'cancelled' && o.status !== 'refunded';
                return '<li class="flex-1"><div class="h-1.5 rounded ' + (on ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700') + '"></div><span class="text-[10px] ' + (on ? 'text-green-700 dark:text-green-400' : 'text-gray-400') + '">' + KG.tx(STATUS[st][0].split(' —')[0], STATUS[st][1].split(' —')[0]) + '</span></li>';
            }).join('') + '</ol>' +
            '<ul class="mt-3 text-sm space-y-2">' + o.items.map(function (i) {
                return '<li class="flex flex-wrap items-center gap-2 justify-between"><span>' + esc(i.name) + ' × ' + i.qty + (i.personalization ? ' <span class="' + ui.muted + '">(' + esc(i.personalization) + ')</span>' : '') + '</span>' +
                    (canReview && reviewed.indexOf(i.productId) === -1 ? '<button class="text-xs text-red-700 dark:text-red-400 font-semibold hover:underline" onclick="KG.writeReview(\'' + o.id + '\',' + i.productId + ')"><i class="fa-regular fa-star mr-1"></i>' + KG.tx('Write a review', 'समीक्षा लेख्नुहोस्') + '</button>' : (reviewed.indexOf(i.productId) > -1 ? '<span class="text-[11px] text-green-700">✓ ' + KG.tx('Reviewed', 'समीक्षा गरियो') + '</span>' : '')) + '</li>';
            }).join('') + '</ul>' +
            '<p class="text-xs text-gray-600 dark:text-gray-400 mt-2">' + KG.tx('Total', 'जम्मा') + ' <strong>' + KG.npr(o.total) + '</strong> · <i class="fa-solid fa-shield-halved text-green-700"></i> ' + esc(KG.escrowLabel(o)) +
                (o.tracking ? ' · ' + KG.tx('Tracking', 'ट्र्याकिङ') + ': <strong>' + esc(o.tracking) + '</strong>' + (KG.trackingUrl(o) ? ' <a class="underline" target="_blank" rel="noopener" href="' + esc(KG.trackingUrl(o)) + '">' + KG.tx('track', 'ट्र्याक') + '</a>' : '') : '') +
                (o.gift ? ' · <i class="fa-solid fa-gift text-red-700"></i> ' + KG.tx('Gift for ', 'उपहार: ') + esc(o.gift.recipient) : '') + '</p>' +
            '<div class="flex flex-wrap gap-2 mt-3">' +
                (canConfirm ? '<button class="' + ui.btn + ' !text-xs !py-1.5" onclick="KG.confirmReceived(\'' + o.id + '\')"><i class="fa-solid fa-box-open mr-1"></i>' + KG.tx('I received it', 'मैले पाएँ') + '</button>' : '') +
                (o.status === 'awaiting_payment' && C.payments.paymentApiBase ? '<button class="' + ui.btn + ' !text-xs !py-1.5" onclick="KG.retryPayment(\'' + o.id + '\')">' + KG.tx('Pay now', 'अहिले तिर्नुहोस्') + '</button>' : '') +
                '<button class="' + ui.btn2 + ' !text-xs !py-1.5" onclick="KG.invoice(\'' + o.id + '\')"><i class="fa-solid fa-file-invoice mr-1"></i>' + KG.tx('Invoice', 'इनभ्वाइस') + '</button>' +
                '<button class="' + ui.btn2 + ' !text-xs !py-1.5" onclick="KG.openThread({sellerId:\'' + esc(o.sellerId) + '\', orderId:\'' + o.id + '\'})"><i class="fa-regular fa-comments mr-1"></i>' + KG.tx('Message seller', 'विक्रेतालाई सन्देश') + '</button>' +
                (!caseOpen && withinCase && ['paid', 'shipped', 'delivered'].indexOf(o.status) > -1 ? '<button class="' + ui.btn2 + ' !text-xs !py-1.5" onclick="KG.openCase(\'' + o.id + '\')"><i class="fa-solid fa-triangle-exclamation mr-1"></i>' + KG.tx('Report a problem', 'समस्या रिपोर्ट') + '</button>' : '') +
            '</div></div>';
    }
    KG.confirmReceived = function (id) {
        KG.setOrderStatus(id, 'completed', 'Buyer confirmed receipt');
        KG.toast(KG.tx('Thank you! The artisan has been paid.', 'धन्यवाद! शिल्पीलाई भुक्तानी गरियो।'));
        KG.openAccount('orders');
    };
    KG.retryPayment = function (id) {
        const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === id; });
        if (o) startPayment(KG.store.get('kg-orders', []).filter(function (x) { return x.groupId === o.groupId && x.status === 'awaiting_payment'; }), o.payment.method);
    };

    /* ---------------------------- reviews ---------------------------- */
    KG.writeReview = function (orderId, productId) {
        const u = KG.user(); const p = KG.product(productId);
        const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === orderId; });
        if (!u || !o || !p || ['delivered', 'completed'].indexOf(o.status) === -1) return;
        let rating = 5, photo = '';
        const body = KG.modal('kgReview', KG.tx('Review: ', 'समीक्षा: ') + esc(p.name),
            '<form id="kgRvForm" class="space-y-4"><div><p class="' + ui.label + '">' + KG.tx('Your rating', 'तपाईंको मूल्याङ्कन') + '</p><div id="kgRvStars" class="flex gap-1 text-2xl">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" aria-label="' + n + ' stars" class="text-amber-500"><i class="fa-solid fa-star"></i></button>'; }).join('') + '</div></div>' +
            '<div><label class="' + ui.label + '" for="kgRvText">' + KG.tx('Your review', 'तपाईंको समीक्षा') + '</label><textarea id="kgRvText" required minlength="10" rows="4" class="' + ui.input + '"></textarea></div>' +
            '<div><label class="' + ui.label + '" for="kgRvPhoto">' + KG.tx('Add a photo (optional)', 'फोटो (ऐच्छिक)') + '</label><input id="kgRvPhoto" type="file" accept="image/*" class="text-xs"></div>' +
            '<p class="' + ui.muted + '">' + KG.tx('Your first name and review will be public. Reviews must be honest — we never edit or buy reviews.', 'तपाईंको नाम र समीक्षा सार्वजनिक हुन्छ।') + '</p>' +
            '<button class="' + ui.btn + ' w-full">' + KG.tx('Post review', 'समीक्षा पोस्ट') + '</button></form>');
        body.querySelector('#kgRvStars').addEventListener('click', function (e) {
            const b = e.target.closest('[data-n]'); if (!b) return; rating = +b.dataset.n;
            body.querySelectorAll('#kgRvStars i').forEach(function (i, k) { i.className = (k < rating ? 'fa-solid' : 'fa-regular') + ' fa-star'; });
        });
        body.querySelector('#kgRvPhoto').addEventListener('change', function (e) { if (e.target.files[0]) KG.readImage(e.target.files[0], 500).then(function (d) { photo = d; }); });
        body.querySelector('#kgRvForm').addEventListener('submit', function (e) {
            e.preventDefault();
            KG.store.push('kg-reviews', { id: KG.uid('r-'), productId: productId, orderId: orderId, userId: u.id, name: u.name.split(' ')[0], rating: rating, text: body.querySelector('#kgRvText').value.trim(), photo: photo, createdAt: KG.now() });
            KG.closeModal('kgReview'); KG.toast(KG.tx('Thanks for your review!', 'समीक्षाका लागि धन्यवाद!')); renderProducts(); KG.openAccount('orders');
        });
    };

    /* ---------------------------- protection cases ---------------------------- */
    KG.openCase = function (orderId) {
        const body = KG.modal('kgCase', KG.tx('Report a problem with ', 'समस्या रिपोर्ट: ') + orderId,
            '<form id="kgCaseForm" class="space-y-4"><div><label class="' + ui.label + '" for="kgCaseReason">' + KG.tx('What happened?', 'के भयो?') + '</label><select id="kgCaseReason" class="' + ui.input + '"><option value="not_arrived">' + KG.tx('It hasn\'t arrived', 'आइपुगेन') + '</option><option value="damaged">' + KG.tx('It arrived damaged', 'बिग्रिएर आयो') + '</option><option value="not_as_described">' + KG.tx('It isn\'t as described', 'विवरण अनुसार छैन') + '</option><option value="wrong_item">' + KG.tx('Wrong item', 'गलत वस्तु') + '</option></select></div>' +
            '<div><label class="' + ui.label + '" for="kgCaseText">' + KG.tx('Details', 'विवरण') + '</label><textarea id="kgCaseText" required rows="4" class="' + ui.input + '"></textarea></div>' +
            '<div><label class="' + ui.label + '" for="kgCasePhoto">' + KG.tx('Photo (helps us resolve faster)', 'फोटो') + '</label><input id="kgCasePhoto" type="file" accept="image/*" class="text-xs"></div>' +
            '<p class="' + ui.muted + '">' + KG.tx('The artisan\'s payout is frozen while we review. We aim to resolve cases within 5 business days.', 'जाँच अवधिमा शिल्पीको भुक्तानी रोकिन्छ। ५ कार्यदिवसभित्र समाधान गर्ने लक्ष्य।') + '</p>' +
            '<button class="' + ui.btn + ' w-full">' + KG.tx('Open case', 'उजुरी दर्ता') + '</button></form>');
        let photo = '';
        body.querySelector('#kgCasePhoto').addEventListener('change', function (e) { if (e.target.files[0]) KG.readImage(e.target.files[0], 700).then(function (d) { photo = d; }); });
        body.querySelector('#kgCaseForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === orderId; });
            const u = KG.user();
            KG.store.push('kg-complaints', { id: KG.uid('C-'), kind: 'protection', orderId: orderId, reason: body.querySelector('#kgCaseReason').value, text: body.querySelector('#kgCaseText').value.trim(), photo: photo, name: u ? u.name : o.buyer.name, email: u ? u.email : o.buyer.email, status: 'open', createdAt: KG.now(), prevStatus: o.status });
            KG.setOrderStatus(orderId, 'disputed', 'Buyer opened a protection case', { escrow: o.escrow === 'held' ? 'frozen' : o.escrow });
            KG.closeModal('kgCase'); KG.toast(KG.tx('Case opened. We\'ll be in touch by email.', 'उजुरी दर्ता भयो।')); KG.openAccount('orders');
        });
    };

    /* ---------------------------- messaging ---------------------------- */
    KG.threads = function () { return KG.store.get('kg-threads', []); };
    KG.myThreads = function () {
        const u = KG.user(); if (!u) return { list: [], unread: 0 };
        const list = KG.threads().filter(function (th) { return th.buyerId === u.id; }).sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
        return { list: list, unread: list.filter(function (th) { return th.unreadBuyer; }).length };
    };
    KG.openThread = function (ctx) {
        if (!KG.user()) { KG.requireLogin(function () { KG.openThread(ctx); }); return; }
        const u = KG.user();
        let th = KG.threads().find(function (x) { return x.buyerId === u.id && x.sellerId === ctx.sellerId && (ctx.orderId ? x.orderId === ctx.orderId : (!x.orderId && x.productId === ctx.productId)); });
        if (!th) {
            th = { id: KG.uid('T-'), buyerId: u.id, buyerName: u.name, sellerId: ctx.sellerId, productId: ctx.productId || null, orderId: ctx.orderId || null, messages: [], updatedAt: KG.now() };
            KG.store.push('kg-threads', th);
        }
        KG.showThread(th.id, 'buyer');
    };
    KG.showThread = function (threadId, side) {
        const th = KG.threads().find(function (x) { return x.id === threadId; }); if (!th) return;
        KG.store.update('kg-threads', threadId, side === 'buyer' ? { unreadBuyer: false } : { unreadSeller: false });
        const s = KG.seller(th.sellerId) || {};
        const p = th.productId ? KG.product(th.productId) : null;
        const o = th.orderId ? KG.store.get('kg-orders', []).find(function (x) { return x.id === th.orderId; }) : null;
        const title = side === 'buyer' ? esc(s.shopName || 'Seller') : esc(th.buyerName || 'Buyer');
        const actions = [];
        if (o && side === 'seller') {
            if (['paid', 'awaiting_payment'].indexOf(o.status) > -1) actions.push(['cancel', KG.tx('Cancel order & refund', 'अर्डर रद्द र फिर्ता')]);
            if (['paid', 'shipped', 'delivered', 'disputed'].indexOf(o.status) > -1) actions.push(['refund', KG.tx('Issue full refund', 'पूरा रकम फिर्ता')]);
        }
        if (o && side === 'buyer' && o.status === 'paid') actions.push(['reqcancel', KG.tx('Request cancellation', 'रद्द गर्न अनुरोध')]);
        const body = KG.modal('kgThread', '<i class="fa-regular fa-comments mr-1 text-red-700"></i>' + title,
            ((p || o) ? '<div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 mb-3 text-xs">' + (p ? '<img src="' + esc(p.image) + '" alt="" class="w-10 h-10 rounded object-cover"><span>' + esc(p.name) + '</span>' : '') + (o ? '<span>' + KG.tx('Order', 'अर्डर') + ' <strong>' + o.id + '</strong> ' + KG.statusBadge(o.status) + '</span>' : '') + '</div>' : '') +
            '<div id="kgMsgs" class="h-72 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-950 rounded-lg p-3">' + (th.messages.length ? th.messages.map(function (m) {
                const mine = m.from === side;
                if (m.from === 'system') return '<p class="text-center text-[11px] text-gray-500"><i class="fa-solid fa-circle-info mr-1"></i>' + esc(m.text) + '</p>';
                return '<div class="flex ' + (mine ? 'justify-end' : '') + '"><div class="max-w-[80%] rounded-2xl px-3 py-2 text-sm ' + (mine ? 'bg-red-700 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm') + '">' + esc(m.text) + '<div class="text-[10px] opacity-70 mt-0.5">' + new Date(m.at).toLocaleString() + '</div></div></div>';
            }).join('') : '<p class="text-center text-xs text-gray-500 pt-24">' + (side === 'buyer' ? KG.tx('Ask about sizes, colours, custom orders or shipping.', 'साइज, रङ, अनुकूलन वा ढुवानीबारे सोध्नुहोस्।') : KG.tx('No messages yet.', 'सन्देश छैन।')) + '</p>') + '</div>' +
            (actions.length ? '<div class="flex flex-wrap gap-2 mt-2">' + actions.map(function (a) { return '<button class="' + ui.btn2 + ' !text-xs !py-1.5" data-act="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>' : '') +
            '<form id="kgMsgForm" class="flex gap-2 mt-3"><label class="sr-only" for="kgMsgIn">Message</label><input id="kgMsgIn" autocomplete="off" required class="' + ui.input + '" placeholder="' + KG.tx('Write a message…', 'सन्देश लेख्नुहोस्…') + '"><button class="' + ui.btn + '" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button></form>', 'lg');
        const box = body.querySelector('#kgMsgs'); box.scrollTop = box.scrollHeight;
        function send(text, from) {
            KG.store.update('kg-threads', threadId, function (x) {
                const patch = { messages: x.messages.concat([{ from: from || side, text: text, at: KG.now() }]), updatedAt: KG.now() };
                if ((from || side) === 'buyer') patch.unreadSeller = true; else patch.unreadBuyer = true;
                return patch;
            });
        }
        body.querySelector('#kgMsgForm').addEventListener('submit', function (e) {
            e.preventDefault(); const v = body.querySelector('#kgMsgIn').value.trim(); if (!v) return;
            send(v); KG.showThread(threadId, side);
        });
        body.querySelectorAll('[data-act]').forEach(function (b) {
            b.addEventListener('click', function () {
                const act = b.dataset.act;
                if (act === 'reqcancel') { send(KG.tx('I would like to cancel this order, please.', 'कृपया यो अर्डर रद्द गरिदिनुहोस्।')); return KG.showThread(threadId, side); }
                if (!confirm(KG.tx('Are you sure? This cannot be undone.', 'पक्का हो? यो फिर्ता गर्न सकिँदैन।'))) return;
                if (act === 'cancel') { KG.setOrderStatus(o.id, 'cancelled', 'Cancelled by seller in Messages'); send('Order ' + o.id + ' was cancelled and the payment refunded.', 'system'); }
                if (act === 'refund') { KG.setOrderStatus(o.id, 'refunded', 'Refunded by seller in Messages'); send('A full refund of ' + KG.npr(o.total) + ' was issued for ' + o.id + '.', 'system'); }
                KG.showThread(threadId, side);
            });
        });
    };
    KG.threadListHtml = function (list, side) {
        if (!list.length) return '<p class="text-sm text-gray-500 text-center py-8">' + KG.tx('No conversations yet.', 'अहिलेसम्म कुराकानी छैन।') + '</p>';
        return '<ul class="divide-y divide-gray-100 dark:divide-gray-800">' + list.map(function (th) {
            const last = th.messages[th.messages.length - 1];
            const unread = side === 'buyer' ? th.unreadBuyer : th.unreadSeller;
            const who = side === 'buyer' ? (KG.seller(th.sellerId) || {}).shopName : th.buyerName;
            return '<li><button class="w-full text-left py-3 flex gap-3 items-start hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded" onclick="KG.showThread(\'' + th.id + '\',\'' + side + '\')"><i class="fa-regular fa-comments mt-1 text-red-700"></i><span class="flex-1 min-w-0"><span class="block text-sm ' + (unread ? 'font-bold' : 'font-semibold') + '">' + esc(who || '') + (th.orderId ? ' · ' + th.orderId : '') + (unread ? ' <span class="inline-block w-2 h-2 rounded-full bg-red-600"></span>' : '') + '</span><span class="block text-xs text-gray-500 truncate">' + esc(last ? last.text : KG.tx('(no messages)', '(सन्देश छैन)')) + '</span></span><span class="text-[10px] text-gray-400">' + KG.fmtDate(th.updatedAt) + '</span></button></li>';
        }).join('') + '</ul>';
    };

    /* ---------------------------- sign in / sign up ---------------------------- */
    function wireAuthForms() {
        const lf = document.getElementById('loginForm'), sf = document.getElementById('signupForm');
        if (!lf || !sf) return;
        const err = function (form, msg) {
            let p = form.querySelector('.kg-err');
            if (!p) { p = document.createElement('p'); p.className = 'kg-err text-xs text-red-700 dark:text-red-400'; p.setAttribute('role', 'alert'); form.insertBefore(p, form.querySelector('button[type=submit]')); }
            p.textContent = msg || ''; p.classList.toggle('hidden', !msg);
        };
        sf.querySelector('button[type=submit]').insertAdjacentHTML('beforebegin', '<label class="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300"><input type="checkbox" name="asSeller" class="mt-0.5 accent-red-700"><span>' + KG.tx('I\'m an artisan or cooperative and want to sell on KalaGhar', 'म शिल्पी/सहकारी हुँ र KalaGhar मा बेच्न चाहन्छु') + '</span></label><p class="text-[11px] text-gray-500 dark:text-gray-400">' + KG.tx('By creating an account you agree to our ', 'खाता बनाएर तपाईं हाम्रो ') + '<a class="underline" target="_blank" href="pages/terms.html">' + KG.tx('Terms', 'सर्तहरू') + '</a> ' + KG.tx('and', 'र') + ' <a class="underline" target="_blank" href="pages/privacy.html">' + KG.tx('Privacy Policy', 'गोपनीयता नीति') + '</a>' + KG.tx('.', 'मा सहमत हुनुहुन्छ।') + '</p>');
        lf.onsubmit = async function (e) {
            e.preventDefault(); err(lf, '');
            const email = lf.querySelector('input[type=email]').value, pass = lf.querySelector('input[type=password]').value;
            try { await KG.login(email, pass); afterAuth(); lf.reset(); } catch (x) { err(lf, x.message); }
        };
        sf.onsubmit = async function (e) {
            e.preventDefault(); err(sf, '');
            const name = sf.querySelector('input[type=text]').value, email = sf.querySelector('input[type=email]').value, pass = sf.querySelector('input[type=password]').value;
            if (pass.length < 8) return err(sf, KG.tx('Use at least 8 characters for your password.', 'पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।'));
            try { const u = await KG.signup(name, email, pass, sf.asSeller.checked); afterAuth(u.role === 'seller'); sf.reset(); } catch (x) { err(sf, x.message); }
        };
        function afterAuth(newSeller) {
            closeModal('customerAuthModal'); KG.refreshAccountLabel();
            KG.toast(KG.tx('Welcome, ', 'स्वागत छ, ') + KG.user().name.split(' ')[0] + '!');
            const next = KG.afterLogin; KG.afterLogin = null;
            if (next) next(); else if (newSeller) KG.openSellerDashboard();
        }
    }

    /* ---------------------------- abandoned bag reminder ---------------------------- */
    function bagReminder() {
        const c = KG.cart(), ts = KG.store.get('kg-cart-ts', 0);
        if (!c.length || Date.now() - ts < 3600e3 || sessionStorage.getItem('kg-bag-nudged')) return;
        sessionStorage.setItem('kg-bag-nudged', '1');
        const n = c.reduce(function (s, l) { return s + l.qty; }, 0);
        const bar = document.createElement('div');
        bar.className = 'fixed bottom-4 left-4 z-[60] max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 text-sm';
        bar.setAttribute('role', 'status');
        bar.innerHTML = '<button class="absolute top-2 right-2 text-gray-400" aria-label="Dismiss" onclick="this.parentNode.remove()"><i class="fa-solid fa-xmark"></i></button><p class="font-bold text-gray-900 dark:text-white"><i class="fa-solid fa-bag-shopping text-red-700 mr-1"></i>' + KG.tx('Still thinking it over?', 'अझै सोच्दै हुनुहुन्छ?') + '</p><p class="text-xs text-gray-600 dark:text-gray-400 mt-1">' + KG.tx('You left ' + n + ' handmade item' + (n > 1 ? 's' : '') + ' in your bag. One-of-a-kind pieces can sell out.', 'तपाईंको झोलामा ' + n + ' वस्तु बाँकी छन्।') + '</p><button class="' + ui.btn + ' !py-1.5 !text-xs mt-3" onclick="this.parentNode.remove();KG.openCart()">' + KG.tx('View my bag', 'झोला हेर्नुहोस्') + '</button>';
        document.body.appendChild(bar);
    }

    KG.initCheckout = function () {
        wireAuthForms(); KG.refreshAccountLabel(); updateCartCount(); KG.autoRelease(); KG.handlePaymentReturn();
        // When the payment server is connected, only offer the methods it has keys for
        if (C.payments.paymentApiBase) fetch(C.payments.paymentApiBase.replace(/\/$/, '') + '/api/pay/methods').then(function (r) { return r.json(); }).then(function (j) { KG.serverMethods = j.methods; }).catch(function () {});
        setTimeout(bagReminder, 2500);
    };
})();
