/* =====================================================================
   KALAGHAR BUYER CONVENIENCE — #17 delivery date estimates, #21 saved
   addresses & remembered payment method, #22 buy it again, #19 gift
   teaser emails. All switched and configured from Admin.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const D = function (k) { return KG.setting('delivery.' + k); };
    const B = function (k) { return KG.setting('buyer.' + k) !== false; };

    /* =================== #17 DELIVERY DATE ESTIMATES =================== */
    function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function isWorking(d) { return (D('nonWorkingDays') || []).indexOf(d.getDay()) === -1 && (D('holidays') || []).indexOf(ymd(d)) === -1; }
    function addWorkingDays(start, n) { const d = new Date(start); let left = n; while (left > 0) { d.setDate(d.getDate() + 1); if (isWorking(d)) left--; } return d; }
    function zoneDays(zone) { const m = String(zone.days || '').match(/(\d+)\D+(\d+)/); if (m) return [+m[1], +m[2]]; const one = parseInt(zone.days, 10) || 3; return [one, one]; }
    // Processing time: listing → seller → site default
    KG.processingDays = function (p, sellerId) {
        const s = KG.seller(sellerId || (p && p.sellerId)) || {};
        const pick = function (obj) { return obj && obj.processingMin != null && obj.processingMax != null ? [+obj.processingMin, Math.max(+obj.processingMin, +obj.processingMax)] : null; };
        return pick(p) || pick(s) || [D('processingMin'), D('processingMax')];
    };
    KG.deliveryEstimate = function (p, zoneId, from, sellerId) {
        if (!D('enabled')) return null;
        const zone = KG.zoneById(zoneId || KG.buyerZone());
        const proc = KG.processingDays(p, sellerId), ship = zoneDays(zone);
        let start = new Date(from || Date.now());
        // Orders after the daily cut-off, or on a closed day, start the next working day
        if (start.getHours() >= D('cutoffHour') || !isWorking(start)) { start = addWorkingDays(start, 1); start.setHours(9); }
        return { min: addWorkingDays(start, proc[0] + ship[0]), max: addWorkingDays(start, proc[1] + ship[1]), zone: zone };
    };
    const NE_MONTHS = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'];
    const neNum = function (n) { return String(n).replace(/\d/g, function (x) { return '०१२३४५६७८९'[x]; }); };
    function fmt(d) { return KG.lang() === 'ne' ? NE_MONTHS[d.getMonth()] + ' ' + neNum(d.getDate()) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
    KG.etaText = function (eta) {
        if (!eta) return '';
        const a = fmt(eta.min), b = fmt(eta.max);
        return a === b ? KG.tx('Arrives by ', 'आइपुग्ने: ') + a : KG.tx('Arrives ', 'आइपुग्ने: ') + a + ' – ' + b;
    };
    KG.buyerZone = function () { return KG.store.get('kg-buyer-zone', null) || (defaultAddress() || {}).zone || 'np-valley'; };
    KG.setBuyerZone = function (z) { KG.store.set('kg-buyer-zone', z); };
    function zoneSelect(id, current) {
        return '<select id="' + id + '" aria-label="' + KG.tx('Deliver to', 'डेलिभरी स्थान') + '" class="kg-eta-zone">' + KG.C.shipping.zones.map(function (z) { return '<option value="' + z.id + '"' + (z.id === current ? ' selected' : '') + '>' + esc(z.label) + '</option>'; }).join('') + '</select>';
    }
    function decorateProductEta(modal, p) {
        if (!D('enabled') || !D('showOnProduct')) return;
        const anchor = modal.querySelector('.kg-alert-box') || (modal.querySelector('#kgQty') && modal.querySelector('#kgQty').parentNode);
        if (!anchor) return;
        const box = document.createElement('div'); box.className = 'kg-eta mt-3';
        anchor.after(box);
        const draw = function () {
            const eta = KG.deliveryEstimate(p, KG.buyerZone());
            const proc = KG.processingDays(p);
            box.innerHTML = '<i class="fa-solid fa-truck-fast"></i><div><strong>' + esc(KG.etaText(eta)) + '</strong><span>' + KG.tx('to ', 'गन्तव्य: ') + zoneSelect('kgEtaZone', KG.buyerZone()) + '</span><small>' + KG.tx('Made and dispatched in ' + (proc[0] === proc[1] ? proc[0] : proc[0] + '–' + proc[1]) + ' working day' + (proc[1] === 1 ? '' : 's') + ', then shipped. Order before ' + D('cutoffHour') + ':00 Nepal time to start today.', proc[0] + '–' + proc[1] + ' कार्यदिवसमा तयार भई पठाइन्छ।') + '</small></div>';
            box.querySelector('select').addEventListener('change', function (e) { KG.setBuyerZone(e.target.value); draw(); });
        };
        draw();
    }
    function decorateCartEta() {
        const m = document.getElementById('kgCart'); if (!m || !D('enabled') || !D('showInCart')) return;
        const lines = KG.cart();
        m.querySelectorAll('.kg-modal-body .divide-y > div').forEach(function (row, i) {
            const l = lines[i]; if (!l) return; const p = KG.product(l.productId); if (!p) return;
            const target = row.querySelector('.flex-1'); if (!target || target.querySelector('.kg-eta-line')) return;
            target.insertAdjacentHTML('beforeend', '<p class="kg-eta-line"><i class="fa-solid fa-truck-fast mr-1"></i>' + esc(KG.etaText(KG.deliveryEstimate(p, KG.buyerZone()))) + '</p>');
        });
    }
    function checkoutEta(form) {
        if (!D('enabled') || !D('showAtCheckout')) return;
        let box = form.querySelector('#co-eta');
        if (!box) { const totals = form.querySelector('#co-totals'); if (!totals) return; totals.insertAdjacentHTML('afterend', '<div id="co-eta" class="kg-eta-check mt-3"></div>'); box = form.querySelector('#co-eta'); }
        const zone = form.zone ? form.zone.value : KG.buyerZone();
        const bySeller = {};
        KG.cart().forEach(function (l) { const p = KG.product(l.productId); if (!p) return; const e = KG.deliveryEstimate(p, zone); const cur = bySeller[p.sellerId]; if (!cur || e.max > cur.max) bySeller[p.sellerId] = e; });
        const ids = Object.keys(bySeller);
        box.innerHTML = ids.length ? '<p class="font-semibold text-xs mb-1"><i class="fa-solid fa-truck-fast mr-1"></i>' + KG.tx('Estimated delivery', 'अनुमानित डेलिभरी') + '</p>' + ids.map(function (sid) {
            return '<p class="text-xs">' + (ids.length > 1 ? esc((KG.seller(sid) || {}).shopName || '') + ': ' : '') + '<strong>' + esc(KG.etaText(bySeller[sid])) + '</strong></p>';
        }).join('') : '';
    }

    /* =================== #21 SAVED ADDRESSES & PAYMENT =================== */
    const ADDR_FIELDS = ['name', 'phone', 'address', 'city', 'district', 'postcode', 'country'];
    function myAddresses() { const u = KG.user(); return u ? KG.store.get('kg-addresses', []).filter(function (a) { return a.userId === u.id; }) : []; }
    function defaultAddress() { const list = myAddresses(); return list.find(function (a) { return a.isDefault; }) || list[0] || null; }
    KG.myAddresses = myAddresses;
    function saveAddress(a) {
        const all = KG.store.get('kg-addresses', []), u = KG.user(); if (!u) return null;
        if (!a.id) {
            const dup = all.find(function (x) { return x.userId === u.id && x.address.toLowerCase() === a.address.toLowerCase() && x.city.toLowerCase() === a.city.toLowerCase() && x.name.toLowerCase() === a.name.toLowerCase(); });
            if (dup) return dup;
            a.id = KG.uid('AD-'); a.userId = u.id; a.createdAt = KG.now();
            if (!all.some(function (x) { return x.userId === u.id; })) a.isDefault = true;
            all.push(a);
        } else { const i = all.findIndex(function (x) { return x.id === a.id && x.userId === u.id; }); if (i > -1) all[i] = Object.assign({}, all[i], a); }
        if (a.isDefault) all.forEach(function (x) { if (x.userId === u.id && x.id !== a.id) x.isDefault = false; });
        KG.store.set('kg-addresses', all); return a;
    }
    KG.openAddressBook = function (editId) {
        if (!KG.user()) return KG.requireLogin(function () { KG.openAddressBook(); });
        const list = myAddresses(), edit = editId ? list.find(function (a) { return a.id === editId; }) : null;
        const f = function (k, label, v, attrs) { return '<div><label class="' + ui.label + '" for="ab-' + k + '">' + label + '</label><input id="ab-' + k + '" name="' + k + '" value="' + esc(v || '') + '" ' + (attrs || '') + ' class="' + ui.input + '"></div>'; };
        const body = KG.modal('kgAddressBook', '<i class="fa-solid fa-location-dot text-red-700 mr-1"></i>' + KG.tx('Saved addresses', 'सुरक्षित ठेगाना'),
            (list.length ? '<ul class="space-y-2 mb-5">' + list.map(function (a) {
                return '<li class="' + ui.card + ' p-3 flex flex-wrap items-start gap-3"><span class="flex-1 min-w-[200px] text-sm"><strong>' + esc(a.label || a.name) + '</strong>' + (a.isDefault ? ' <span class="text-[10px] font-bold text-green-700 uppercase">' + KG.tx('Default', 'मुख्य') + '</span>' : '') + '<span class="block text-xs text-gray-600 dark:text-gray-400">' + esc([a.name, a.address, a.city, a.district, a.country].filter(Boolean).join(', ')) + ' · ' + esc(a.phone) + '</span></span>' +
                    '<span class="flex gap-3 text-xs">' + (a.isDefault ? '' : '<button type="button" data-def="' + esc(a.id) + '" class="text-red-700 font-semibold">' + KG.tx('Make default', 'मुख्य बनाउनुहोस्') + '</button>') + '<button type="button" data-edit="' + esc(a.id) + '" class="text-gray-600">' + KG.tx('Edit', 'सम्पादन') + '</button><button type="button" data-del="' + esc(a.id) + '" class="text-gray-600">' + KG.tx('Delete', 'मेटाउनुहोस्') + '</button></span></li>';
            }).join('') + '</ul>' : '<p class="text-sm text-gray-500 mb-4">' + KG.tx('No saved addresses yet. They\'re saved automatically when you check out.', 'अहिलेसम्म ठेगाना छैन।') + '</p>') +
            '<form class="' + ui.card + ' p-4 grid sm:grid-cols-2 gap-3"><p class="sm:col-span-2 font-bold text-sm">' + (edit ? KG.tx('Edit address', 'ठेगाना सम्पादन') : KG.tx('Add an address', 'ठेगाना थप्नुहोस्')) + '</p>' +
                f('label', KG.tx('Label (e.g. Home, Aama\'s house)', 'नाम (जस्तै घर)'), edit && edit.label, 'maxlength="40"') + f('name', KG.tx('Full name', 'पूरा नाम'), edit && edit.name, 'required maxlength="80"') +
                f('phone', KG.tx('Phone', 'फोन'), edit && edit.phone, 'required type="tel" maxlength="30"') + f('address', KG.tx('Street / Tole', 'टोल / सडक'), edit && edit.address, 'required maxlength="160"') +
                f('city', KG.tx('City', 'शहर'), edit && edit.city, 'required maxlength="60"') + f('district', KG.tx('District / State', 'जिल्ला / प्रदेश'), edit && edit.district, 'maxlength="60"') +
                f('postcode', KG.tx('Postcode', 'पोस्टकोड'), edit && edit.postcode, 'maxlength="20"') + f('country', KG.tx('Country', 'देश'), (edit && edit.country) || 'Nepal', 'required maxlength="60"') +
                '<div><label class="' + ui.label + '" for="ab-zone">' + KG.tx('Delivery area', 'डेलिभरी क्षेत्र') + '</label><select id="ab-zone" name="zone" class="' + ui.input + '">' + KG.C.shipping.zones.map(function (z) { return '<option value="' + z.id + '"' + (edit && edit.zone === z.id ? ' selected' : '') + '>' + esc(z.label) + '</option>'; }).join('') + '</select></div>' +
                '<label class="flex items-center gap-2 text-sm mt-6"><input type="checkbox" name="isDefault"' + (!list.length || (edit && edit.isDefault) ? ' checked' : '') + '> ' + KG.tx('Use as my default', 'मुख्य ठेगाना') + '</label>' +
                '<button class="' + ui.btn + ' sm:col-span-2">' + (edit ? KG.tx('Save changes', 'परिवर्तन सुरक्षित') : KG.tx('Save address', 'ठेगाना सुरक्षित')) + '</button></form>', 'lg');
        body.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault(); const fm = e.target, a = edit ? { id: edit.id } : {};
            ['label'].concat(ADDR_FIELDS).forEach(function (k) { a[k] = fm[k].value.trim(); }); a.zone = fm.zone.value; a.isDefault = fm.isDefault.checked;
            saveAddress(a); KG.toast(KG.tx('Address saved', 'ठेगाना सुरक्षित भयो')); KG.openAddressBook();
        });
        body.querySelectorAll('[data-def]').forEach(function (b) { b.addEventListener('click', function () { saveAddress({ id: b.dataset.def, isDefault: true }); KG.openAddressBook(); }); });
        body.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { KG.openAddressBook(b.dataset.edit); }); });
        body.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { if (!confirm(KG.tx('Delete this address?', 'यो ठेगाना मेटाउने?'))) return; KG.store.set('kg-addresses', KG.store.get('kg-addresses', []).filter(function (x) { return x.id !== b.dataset.del; })); KG.openAddressBook(); }); });
    };
    function fillAddress(form, a) {
        const gift = form.gift && form.gift.checked;
        ADDR_FIELDS.forEach(function (k) {
            const target = gift && k === 'name' ? form.rname : gift && k === 'phone' ? form.rphone : form[k];
            if (target && a[k] != null) target.value = a[k];
        });
        if (a.zone && form.zone && form.zone.value !== a.zone) { form.zone.value = a.zone; form.zone.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    let pendingCheckout = null;   // values captured at submit, used once the order exists
    function enhanceCheckout() {
        const form = document.getElementById('kgCoForm'); if (!form) return;
        const u = KG.user();
        // Saved addresses
        if (u && B('savedAddresses')) {
            const list = myAddresses(), def = defaultAddress();
            const addrLegend = form.querySelector('#co-addr-legend'), fs = addrLegend && addrLegend.parentNode;
            if (list.length && fs) {
                fs.insertAdjacentHTML('beforebegin', '<div class="kg-saved-addr"><p class="text-sm font-bold mb-2">' + KG.tx('Deliver to a saved address', 'सुरक्षित ठेगानामा पठाउनुहोस्') + '</p><div class="grid sm:grid-cols-2 gap-2">' + list.map(function (a) {
                    return '<label class="kg-addr-card"><input type="radio" name="savedAddr" value="' + esc(a.id) + '"' + (def && def.id === a.id ? ' checked' : '') + '><span><strong>' + esc(a.label || a.name) + '</strong><small>' + esc([a.address, a.city, a.country].filter(Boolean).join(', ')) + '</small></span></label>';
                }).join('') + '<label class="kg-addr-card"><input type="radio" name="savedAddr" value=""><span><strong>' + KG.tx('New address', 'नयाँ ठेगाना') + '</strong><small>' + KG.tx('Type it below', 'तल लेख्नुहोस्') + '</small></span></label></div><button type="button" class="text-xs text-red-700 font-semibold mt-1" onclick="KG.openAddressBook()">' + KG.tx('Manage addresses', 'ठेगाना व्यवस्थापन') + '</button></div>');
                form.querySelectorAll('input[name="savedAddr"]').forEach(function (r) {
                    r.addEventListener('change', function () { const a = list.find(function (x) { return x.id === r.value; }); if (a) fillAddress(form, a); else ['address', 'city', 'district', 'postcode'].forEach(function (k) { form[k].value = ''; }); });
                });
                if (def && !form.gift.checked) { fillAddress(form, def); if (!form.phone.value) form.phone.value = def.phone; }
            }
            if (fs && !form.querySelector('[name="saveAddr"]')) fs.insertAdjacentHTML('beforeend', '<label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 mt-2"><input type="checkbox" name="saveAddr" checked class="accent-red-700"> ' + KG.tx('Save this address to my account', 'यो ठेगाना खातामा सुरक्षित गर्नुहोस्') + '</label>');
        }
        // Remembered payment method
        if (u && B('rememberPayment')) {
            const pref = KG.store.get('kg-pay-pref', {})[u.id];
            const pick = function () { const r = pref && form.querySelector('input[name="method"][value="' + pref + '"]'); if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } };
            pick(); setTimeout(pick, 0);
            const methods = form.querySelector('#co-methods');
            if (methods && !form.querySelector('.kg-card-note')) methods.insertAdjacentHTML('afterend', '<p class="kg-card-note text-[11px] text-gray-500 dark:text-gray-400 mt-2"><i class="fa-solid fa-lock mr-1"></i>' + KG.tx('We remember your preferred payment method. Card numbers are never stored by KalaGhar — your payment provider keeps them securely.', 'तपाईंको भुक्तानी माध्यम सम्झिन्छौं। कार्ड नम्बर KalaGhar ले राख्दैन।') + '</p>');
        }
        // Gift teaser
        const gift = form.querySelector('#co-giftbox');
        if (gift && B('giftTeaser') && !form.querySelector('[name="teaser"]')) {
            gift.insertAdjacentHTML('beforeend', '<div class="kg-teaser"><label class="flex items-start gap-2 text-sm"><input type="checkbox" name="teaser" class="mt-1 accent-red-700"><span><strong>' + KG.tx('Email a gift teaser to the recipient', 'प्राप्तकर्तालाई उपहार सूचना इमेल पठाउनुहोस्') + '</strong><span class="block text-xs text-gray-500">' + KG.tx('Tells them a handmade gift is coming — without saying what it is.', 'के हो नभनी उपहार आउँदैछ भनी जानकारी दिन्छ।') + '</span></span></label>' +
                '<div class="kg-teaser-fields hidden grid sm:grid-cols-2 gap-3 mt-2"><div><label class="' + ui.label + '" for="co-temail">' + KG.tx('Recipient\'s email', 'प्राप्तकर्ताको इमेल') + '</label><input id="co-temail" name="teaserEmail" type="email" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="co-tdate">' + KG.tx('Send on', 'पठाउने मिति') + '</label><input id="co-tdate" name="teaserDate" type="date" min="' + KG.today() + '" value="' + KG.today() + '" class="' + ui.input + '"></div></div></div>');
            const cb = form.querySelector('[name="teaser"]');
            cb.addEventListener('change', function () { form.querySelector('.kg-teaser-fields').classList.toggle('hidden', !cb.checked); });
        }
        // Capture choices before the order is created (capture phase runs first)
        form.addEventListener('submit', function () {
            const method = (form.querySelector('input[name="method"]:checked') || {}).value;
            const addr = {}; ADDR_FIELDS.forEach(function (k) { addr[k] = form[k] ? form[k].value.trim() : ''; }); addr.zone = form.zone ? form.zone.value : '';
            if (form.gift && form.gift.checked) { addr.name = form.rname.value.trim() || addr.name; addr.phone = form.rphone.value.trim() || addr.phone; addr.label = KG.tx('Gift: ', 'उपहार: ') + addr.name; }
            const t = form.querySelector('[name="teaser"]');
            pendingCheckout = {
                user: KG.user(), method: method, address: addr,
                saveAddr: !!(form.querySelector('[name="saveAddr"]') && form.querySelector('[name="saveAddr"]').checked),
                teaser: t && t.checked && form.gift.checked ? { email: form.teaserEmail.value.trim(), date: form.teaserDate.value || KG.today() } : null,
                buyerName: form.name.value.trim(), at: Date.now()
            };
        }, true);
        form.addEventListener('change', function () { checkoutEta(form); });
        checkoutEta(form);
    }
    function afterOrders(orders) {
        const pc = pendingCheckout; pendingCheckout = null;
        // Delivery estimate saved on each order
        orders.forEach(function (o) {
            const first = o.items[0] && KG.product(o.items[0].productId);
            const eta = KG.deliveryEstimate(first, o.zone, Date.now(), o.sellerId);
            if (eta) KG.store.update('kg-orders', o.id, { eta: { min: ymd(eta.min), max: ymd(eta.max) } });
        });
        if (!pc || Date.now() - pc.at > 60000) return;
        if (pc.user && B('rememberPayment') && pc.method) { const prefs = KG.store.get('kg-pay-pref', {}); prefs[pc.user.id] = pc.method; KG.store.set('kg-pay-pref', prefs); }
        if (pc.user && B('savedAddresses') && pc.saveAddr && pc.address.address && pc.address.city) saveAddress(Object.assign({ label: '' }, pc.address));
        if (pc.address.zone) KG.setBuyerZone(pc.address.zone);
        // Gift teaser email (queued in the outbox; staff or an email service sends it on the chosen date)
        if (pc.teaser && B('giftTeaser') && /^\S+@\S+\.\S+$/.test(pc.teaser.email)) {
            const o = orders.find(function (x) { return x.gift; }); if (!o) return;
            const latest = orders.map(function (x) { const e = KG.store.get('kg-orders', []).find(function (y) { return y.id === x.id; }); return e && e.eta ? e.eta.max : ''; }).sort().pop();
            const fill = function (tpl) {
                return String(tpl).replace(/\{recipient\}/g, o.gift.recipient || '').replace(/\{sender\}/g, pc.buyerName || 'Someone special').replace(/\{occasion\}/g, o.gift.occasion || 'you')
                    .replace(/\{arrival\}/g, latest ? fmt(new Date(latest + 'T12:00:00')) : 'soon').replace(/\{message\}/g, o.gift.message || '—');
            };
            const msg = { id: KG.uid('MSG-'), type: 'gift-teaser', to: pc.teaser.email.toLowerCase(), subject: fill(KG.setting('buyer.teaserSubject')), body: fill(KG.setting('buyer.teaserBody')), sendAfter: pc.teaser.date, orderIds: orders.map(function (x) { return x.id; }), status: 'queued', createdAt: KG.now() };
            KG.store.push('kg-outbox', msg);
            orders.forEach(function (x) { if (x.gift) KG.store.update('kg-orders', x.id, function (y) { return { gift: Object.assign({}, y.gift, { teaser: { email: msg.to, sendAfter: msg.sendAfter, messageId: msg.id } }) }; }); });
        }
    }

    /* =================== #22 BUY IT AGAIN =================== */
    KG.buyAgain = function (orderId) {
        const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === orderId; }); if (!o) return;
        let added = 0, skipped = 0;
        o.items.forEach(function (it) {
            const p = KG.product(it.productId);
            const ok = p && p.active !== false && (!KG.canAddToCart || KG.canAddToCart(p, it.variant || '', true));
            if (!ok) { skipped++; return; }
            KG.addToCart(it.productId, it.qty, it.personalization || '', true, it.packaging || 'eco', it.variant || ''); added++;
        });
        if (added) { KG.toast(KG.tx(added + ' item' + (added > 1 ? 's' : '') + ' added to your bag', added + ' वस्तु झोलामा थपियो') + (skipped ? KG.tx(' · ' + skipped + ' no longer available', ' · ' + skipped + ' उपलब्ध छैन') : '')); KG.closeModal('kgAccount'); KG.openCart(); }
        else KG.toast(KG.tx('Those items aren\'t available right now.', 'ती वस्तु अहिले उपलब्ध छैनन्।'), 'warn');
    };
    function purchasedProducts() {
        const seen = {}, out = [];
        (KG.myOrders ? KG.myOrders() : []).filter(function (o) { return ['cancelled', 'refunded', 'awaiting_payment'].indexOf(o.status) === -1; }).forEach(function (o) {
            o.items.forEach(function (it) { const key = it.productId + '|' + (it.variant || ''); if (seen[key]) return; const p = KG.product(it.productId); if (!p || p.active === false) return; seen[key] = 1; out.push({ p: p, it: it, date: o.createdAt }); });
        });
        return out.slice(0, 12);
    }
    KG.renderBuyAgain = function () {
        let sec = document.getElementById('kgBuyAgain');
        if (!sec) {
            sec = document.createElement('section'); sec.id = 'kgBuyAgain'; sec.className = 'max-w-7xl mx-auto px-4 pb-10'; sec.setAttribute('aria-label', 'Buy it again');
            const after = document.getElementById('kgDiscoveryShelf') || document.getElementById('marketplace'); if (!after) return; after.after(sec);
        }
        const items = B('buyAgain') && KG.user() ? purchasedProducts() : [];
        sec.classList.toggle('kg-home-empty', !items.length);
        if (!items.length) { sec.innerHTML = ''; return; }
        sec.innerHTML = '<div class="flex items-end justify-between mb-3"><h2 class="text-xl font-bold text-gray-900 dark:text-white">' + KG.tx('Buy it again', 'फेरि किन्नुहोस्') + '</h2><button type="button" class="text-xs font-semibold text-red-700 dark:text-amber-300 hover:underline" onclick="KG.openAccount()">' + KG.tx('Your orders', 'तपाईंका अर्डर') + ' →</button></div>' +
            '<div class="kg-discovery-rail">' + items.map(function (x, i) {
                return '<div class="kg-discovery-card"><img src="' + esc(x.p.image) + '" alt="" loading="lazy" onclick="KG.openProduct(' + x.p.id + ')" class="cursor-pointer"><span class="min-w-0"><strong>' + esc(x.p.name) + (x.it.variant ? ' — ' + esc(x.it.variant.split('|').join(' / ')) : '') + '</strong><small>' + KG.npr(KG.withVariant ? KG.withVariant(x.p, x.it.variant).price : x.p.price) + '</small><button type="button" data-again="' + i + '" class="kg-again-btn">' + KG.tx('Add to bag', 'झोलामा थप्नुहोस्') + '</button></span></div>';
            }).join('') + '</div>';
        sec.querySelectorAll('[data-again]').forEach(function (b) {
            b.addEventListener('click', function () { const x = items[+b.dataset.again]; KG.addToCart(x.p.id, 1, x.it.personalization || '', false, x.it.packaging || 'eco', x.it.variant || ''); });
        });
    };

    /* ---------------------------- hooks into existing screens ---------------------------- */
    function hookScreens() {
        const op = KG.openProduct;
        KG.openProduct = function (id) { const r = op.apply(this, arguments); const m = document.getElementById('kgProduct'), p = KG.product(id); if (m && p) decorateProductEta(m, p); return r; };
        const cart = KG.openCart;
        KG.openCart = function () { const r = cart.apply(this, arguments); decorateCartEta(); return r; };
        const co = KG.openCheckout;
        KG.openCheckout = function () { const r = co.apply(this, arguments); enhanceCheckout(); return r; };
        const placed = KG.onOrdersPlaced;
        KG.onOrdersPlaced = function (orders) { if (placed) placed.apply(this, arguments); afterOrders(orders); KG.renderBuyAgain(); };
        const acct = KG.openAccount;
        KG.openAccount = function (tab) {
            const r = acct.apply(this, arguments);
            const m = document.getElementById('kgAccount'); if (!m) return r;
            const bar = m.querySelector('.kg-modal-body > div');
            if (bar && B('savedAddresses') && !bar.querySelector('[data-kg-addr]')) bar.insertAdjacentHTML('beforeend', '<button data-kg-addr class="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800" onclick="KG.closeModal(\'kgAccount\');KG.openAddressBook()"><i class="fa-solid fa-location-dot mr-1"></i>' + KG.tx('Addresses', 'ठेगाना') + '</button>');
            // Order cards: delivery estimate + Buy it again
            m.querySelectorAll('[onclick^="KG.invoice("]').forEach(function (inv) {
                const id = (inv.getAttribute('onclick').match(/'([^']+)'/) || [])[1];
                const o = KG.store.get('kg-orders', []).find(function (x) { return x.id === id; }); if (!o) return;
                const row = inv.parentNode;
                if (B('buyAgain') && !row.querySelector('[data-buyagain]')) inv.insertAdjacentHTML('beforebegin', '<button data-buyagain class="' + ui.btn + ' !text-xs !py-1.5" onclick="KG.buyAgain(\'' + esc(o.id) + '\')"><i class="fa-solid fa-rotate-right mr-1"></i>' + KG.tx('Buy it again', 'फेरि किन्नुहोस्') + '</button>');
                if (D('enabled') && o.eta && ['paid', 'shipped', 'awaiting_payment'].indexOf(o.status) > -1 && !row.parentNode.querySelector('.kg-eta-order')) {
                    row.insertAdjacentHTML('beforebegin', '<p class="kg-eta-order"><i class="fa-solid fa-truck-fast mr-1"></i>' + esc(KG.etaText({ min: new Date(o.eta.min + 'T12:00:00'), max: new Date(o.eta.max + 'T12:00:00') })) + '</p>');
                }
            });
            return r;
        };
        // Seller: processing time per shop (new tab) and per listing (in the listing form)
        const tabs = KG.extraSellerTabs;
        KG.extraSellerTabs = function (s) { return (tabs ? tabs(s) : []).concat(D('enabled') ? [['processing', 'fa-clock', KG.tx('Processing time', 'तयारी समय')]] : []); };
        KG.extraSellerRenderers = Object.assign(KG.extraSellerRenderers || {}, { processing: sellerProcessingTab });
        const el = KG.editListing;
        if (el) KG.editListing = function (id) {
            const r = el.apply(this, arguments);
            const form = document.getElementById('kgLsForm'); if (!form || !D('enabled')) return r;
            const p = id ? KG.product(id) : {}, s = KG.mySeller(); const def = KG.processingDays(p.processingMin != null ? p : null, s && s.id);
            const box = document.createElement('div'); box.className = 'grid grid-cols-2 gap-3';
            box.innerHTML = '<div><label class="' + ui.label + '" for="ls-pmin">' + KG.tx('Ready to ship in (min days)', 'तयार हुने (न्यूनतम दिन)') + '</label><input id="ls-pmin" type="number" min="0" max="60" value="' + (p.processingMin != null ? p.processingMin : '') + '" placeholder="' + def[0] + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="ls-pmax">' + KG.tx('…to (max days)', '…सम्म (अधिकतम दिन)') + '</label><input id="ls-pmax" type="number" min="0" max="90" value="' + (p.processingMax != null ? p.processingMax : '') + '" placeholder="' + def[1] + '" class="' + ui.input + '"></div><p class="col-span-2 ' + ui.muted + '">' + KG.tx('Leave blank to use your shop\'s processing time. Made-to-order pieces usually need longer.', 'खाली छोडे पसलको समय लागू हुन्छ।') + '</p>';
            const err = form.querySelector('#ls-err'); (err || form.lastElementChild).before(box);
            const before = window.loadProducts().map(function (x) { return x.id; });
            form.addEventListener('submit', function () {
                const mn = form.querySelector('#ls-pmin').value, mx = form.querySelector('#ls-pmax').value;
                setTimeout(function () {
                    let pid = id; if (!pid) { const mine = window.loadProducts().filter(function (x) { return s && x.sellerId === s.id && before.indexOf(x.id) === -1; }); if (mine.length) pid = mine[mine.length - 1].id; }
                    if (!pid || !KG.updateRawProduct) return;
                    KG.updateRawProduct(pid, function (x) { if (mn === '' && mx === '') { delete x.processingMin; delete x.processingMax; } else { x.processingMin = Math.max(0, +mn || 0); x.processingMax = Math.max(x.processingMin, +mx || x.processingMin); } });
                }, 0);
            });
            return r;
        };
        const refresh = KG.refreshAccountLabel;
        KG.refreshAccountLabel = function () { refresh.apply(this, arguments); KG.renderBuyAgain(); };
    }
    function sellerProcessingTab(box, s) {
        const cur = KG.processingDays(null, s.id);
        box.innerHTML = '<form class="' + ui.card + ' p-5 space-y-4 max-w-xl"><p class="text-sm">' + KG.tx('How many working days you need to make or pack an order before it ships. Buyers see a delivery date based on this.', 'अर्डर तयार गरी पठाउन लाग्ने कार्यदिवस। खरिदकर्ताले यसैका आधारमा डेलिभरी मिति देख्छन्।') + '</p>' +
            '<div class="grid grid-cols-2 gap-3"><div><label class="' + ui.label + '" for="sp-min">' + KG.tx('Minimum days', 'न्यूनतम दिन') + '</label><input id="sp-min" type="number" min="0" max="60" value="' + cur[0] + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="sp-max">' + KG.tx('Maximum days', 'अधिकतम दिन') + '</label><input id="sp-max" type="number" min="0" max="90" value="' + cur[1] + '" class="' + ui.input + '"></div></div>' +
            '<p class="' + ui.muted + '">' + KG.tx('Example delivery to Kathmandu Valley if ordered now: ', 'उदाहरण: ') + '<strong id="sp-ex"></strong></p><button class="' + ui.btn + ' w-full">' + KG.tx('Save', 'सुरक्षित') + '</button></form>';
        const ex = function () { const t = Object.assign({}, s, { processingMin: +box.querySelector('#sp-min').value || 0, processingMax: Math.max(+box.querySelector('#sp-min').value || 0, +box.querySelector('#sp-max').value || 0) }); const saved = KG.seller(s.id); const tmp = Object.assign({}, saved); KG.saveSeller(t); box.querySelector('#sp-ex').textContent = KG.etaText(KG.deliveryEstimate(null, 'np-valley', Date.now(), s.id)); KG.saveSeller(tmp); };
        box.querySelectorAll('input').forEach(function (i) { i.addEventListener('input', ex); }); ex();
        box.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault(); const mn = Math.max(0, +box.querySelector('#sp-min').value || 0);
            s.processingMin = mn; s.processingMax = Math.max(mn, +box.querySelector('#sp-max').value || mn); KG.saveSeller(s);
            KG.toast(KG.tx('Processing time saved', 'तयारी समय सुरक्षित भयो'));
        });
    }

    /* =================== ADMIN TABS =================== */
    const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    function renderDeliveryAdmin(el) {
        const A = KG.adminField, d = KG.setting('delivery');
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Delivery date estimates</h3><p class="' + ui.muted + ' mb-4">Shows "Arrives Oct 28 – Nov 2" on product pages, in the bag, at checkout and on orders. Estimate = processing time (listing → shop → default below) + the delivery days of the buyer\'s area (set in config.js), counting only working days.</p>' +
            '<form id="dl-form" class="grid lg:grid-cols-3 gap-4 mb-4"><div class="' + ui.card + ' p-4 space-y-3">' + A.toggle('enabled', 'Delivery estimates on', d.enabled) + A.toggle('showOnProduct', 'On product pages', d.showOnProduct) + A.toggle('showInCart', 'In the bag', d.showInCart) + A.toggle('showAtCheckout', 'At checkout', d.showAtCheckout) + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Default processing time (working days)</p><div class="grid grid-cols-2 gap-3">' + A.text('processingMin', 'Minimum', d.processingMin, 'type="number" min="0" max="60"') + A.text('processingMax', 'Maximum', d.processingMax, 'type="number" min="0" max="90"') + '</div>' + A.text('cutoffHour', 'Daily order cut-off (hour, Nepal time)', d.cutoffHour, 'type="number" min="0" max="23"') + '</div>' +
                '<div class="' + ui.card + ' p-4"><p class="font-bold text-sm mb-2">Weekly days off</p><div class="grid grid-cols-2 gap-1">' + WEEKDAYS.map(function (w, i) { return '<label class="flex items-center gap-2 text-sm"><input type="checkbox" data-wd="' + i + '"' + (d.nonWorkingDays.indexOf(i) > -1 ? ' checked' : '') + '> ' + w + '</label>'; }).join('') + '</div></div></form>' +
            '<div class="grid lg:grid-cols-2 gap-4"><div class="' + ui.card + ' p-4"><p class="font-bold text-sm mb-2">Holidays & closures <span class="font-normal ' + ui.muted + '">(Dashain, Tihar…)</span></p><div class="flex gap-2 mb-3"><input id="dl-hday" type="date" class="' + ui.input + ' !w-48" aria-label="Holiday date"><input id="dl-hdays" type="number" min="1" max="30" value="1" class="' + ui.input + ' !w-20" aria-label="Number of days"><button type="button" id="dl-hadd" class="' + ui.btn2 + ' !text-xs">Add days off</button></div>' +
                (d.holidays.length ? '<div class="flex flex-wrap gap-1.5">' + d.holidays.map(function (h) { return '<span class="text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">' + esc(h) + ' <button type="button" data-hdel="' + esc(h) + '" aria-label="Remove ' + esc(h) + '" class="ml-1 text-red-700">×</button></span>'; }).join('') + '</div>' : '<p class="' + ui.muted + '">None added.</p>') + '</div>' +
                '<div class="' + ui.card + ' p-4"><p class="font-bold text-sm mb-2">Preview — order placed now</p><table class="w-full text-xs"><tbody>' + KG.C.shipping.zones.map(function (z) { return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="py-1.5">' + esc(z.label) + '</td><td class="text-right font-semibold">' + esc(KG.etaText(KG.deliveryEstimate(null, z.id))) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
            '<h4 class="font-bold mt-5 mb-2">Processing time by shop</h4><div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-sm min-w-[520px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3">Shop</th><th>Min days</th><th>Max days</th><th></th></tr></thead><tbody>' + KG.sellers().map(function (s) {
                const cur = KG.processingDays(null, s.id), own = s.processingMin != null;
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3">' + esc(s.shopName) + (own ? '' : ' <span class="text-[11px] text-gray-400">(default)</span>') + '</td><td><input data-smin="' + esc(s.id) + '" type="number" min="0" max="60" value="' + cur[0] + '" class="' + ui.input + ' !w-20 !py-1"></td><td><input data-smax="' + esc(s.id) + '" type="number" min="0" max="90" value="' + cur[1] + '" class="' + ui.input + ' !w-20 !py-1"></td><td class="pr-3 text-right">' + (own ? '<button type="button" data-sreset="' + esc(s.id) + '" class="text-xs text-gray-500">Use default</button>' : '') + '</td></tr>';
            }).join('') + '</tbody></table></div>';
        KG.bindSettingsForm(el.querySelector('#dl-form'), 'delivery', function () { renderDeliveryAdmin(el); });
        el.querySelectorAll('[data-wd]').forEach(function (c) { c.addEventListener('change', function () { KG.updateSettings(function (s) { const v = +c.dataset.wd; s.delivery.nonWorkingDays = s.delivery.nonWorkingDays.filter(function (x) { return x !== v; }).concat(c.checked ? [v] : []); }); renderDeliveryAdmin(el); }); });
        el.querySelector('#dl-hadd').addEventListener('click', function () {
            const start = el.querySelector('#dl-hday').value, n = Math.max(1, +el.querySelector('#dl-hdays').value || 1); if (!start) return KG.toast('Pick a date.', 'warn');
            KG.updateSettings(function (s) { const d0 = new Date(start + 'T12:00:00'); for (let i = 0; i < n; i++) { const d = new Date(d0); d.setDate(d0.getDate() + i); s.delivery.holidays.push(ymd(d)); } });
            renderDeliveryAdmin(el);
        });
        el.querySelectorAll('[data-hdel]').forEach(function (b) { b.addEventListener('click', function () { KG.updateSettings(function (s) { s.delivery.holidays = s.delivery.holidays.filter(function (h) { return h !== b.dataset.hdel; }); }); renderDeliveryAdmin(el); }); });
        const saveShop = function (id) { const s = KG.seller(id), mn = Math.max(0, +el.querySelector('[data-smin="' + id + '"]').value || 0); s.processingMin = mn; s.processingMax = Math.max(mn, +el.querySelector('[data-smax="' + id + '"]').value || mn); KG.saveSeller(s); renderDeliveryAdmin(el); };
        el.querySelectorAll('[data-smin],[data-smax]').forEach(function (i) { i.addEventListener('change', function () { saveShop(i.dataset.smin || i.dataset.smax); }); });
        el.querySelectorAll('[data-sreset]').forEach(function (b) { b.addEventListener('click', function () { const s = KG.seller(b.dataset.sreset); delete s.processingMin; delete s.processingMax; KG.saveSeller(s); renderDeliveryAdmin(el); }); });
    }
    function renderCheckoutAdmin(el) {
        const A = KG.adminField, b = KG.setting('buyer');
        const teasers = KG.store.get('kg-outbox', []).filter(function (m) { return m.type === 'gift-teaser'; }).reverse();
        const sample = function (t) { return String(t).replace(/\{recipient\}/g, 'Aama').replace(/\{sender\}/g, 'Sita').replace(/\{occasion\}/g, 'Dashain').replace(/\{arrival\}/g, 'Oct 28').replace(/\{message\}/g, 'Happy Dashain!'); };
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Checkout, accounts & gifting</h3><p class="' + ui.muted + ' mb-4">Faster repeat shopping and nicer gifting. Each switch applies to every visitor once published.</p>' +
            '<form id="ck-form" class="grid lg:grid-cols-2 gap-4"><div class="' + ui.card + ' p-4 space-y-4">' +
                A.toggle('savedAddresses', 'Saved addresses', b.savedAddresses, 'Shoppers pick a saved address at checkout; new ones save automatically (they can untick)') +
                A.toggle('rememberPayment', 'Remember preferred payment method', b.rememberPayment, 'Card numbers are never stored by KalaGhar') +
                A.toggle('buyAgain', '"Buy it again"', b.buyAgain, 'Button on past orders + a homepage row for signed-in shoppers (position it on the Homepage tab)') +
                A.toggle('giftTeaser', 'Gift teaser emails', b.giftTeaser, 'Gift senders can email the recipient that something is coming, without revealing it') + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Gift teaser email</p>' + A.text('teaserSubject', 'Subject', b.teaserSubject, 'maxlength="120"') +
                    '<div><label class="' + ui.label + '" for="af-teaserBody">Message</label><textarea id="af-teaserBody" name="teaserBody" rows="6" maxlength="1200" class="' + ui.input + '">' + esc(b.teaserBody) + '</textarea><p class="' + ui.muted + ' mt-1">Placeholders: {recipient} {sender} {occasion} {arrival} {message}. Never mention the item or price.</p></div>' +
                    '<details class="text-xs"><summary class="cursor-pointer font-semibold">Preview</summary><p class="mt-2 font-semibold">' + esc(sample(b.teaserSubject)) + '</p><p class="whitespace-pre-line mt-1">' + esc(sample(b.teaserBody)) + '</p></details></div></form>' +
            '<h4 class="font-bold mt-5 mb-2">Gift teasers</h4><p class="' + ui.muted + ' mb-2">Send each on its date with one click from your email app (or automatically once an email service is connected on the server).</p>' +
            (teasers.length ? teasers.map(function (m) {
                const due = !m.sendAfter || m.sendAfter <= KG.today();
                return '<div class="' + ui.card + ' p-3 mb-2 flex flex-wrap items-center gap-3"><span class="flex-1 min-w-[220px] text-sm"><strong>' + esc(m.to) + '</strong><span class="block text-xs text-gray-500">Orders ' + esc((m.orderIds || []).join(', ')) + ' · ' + (m.status === 'queued' ? (due ? '<span class="text-amber-700 font-semibold">Ready to send</span>' : 'Scheduled for ' + esc(m.sendAfter)) : '<span class="text-green-700">Sent</span>') + '</span></span>' +
                    (m.status === 'queued' ? '<a class="' + ui.btn + ' !py-1 !text-xs' + (due ? '' : ' opacity-60') + '" href="mailto:' + encodeURIComponent(m.to) + '?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.body) + '">Send email</a><button type="button" data-tsent="' + esc(m.id) + '" class="' + ui.btn2 + ' !py-1 !text-xs">Mark sent</button>' : '') + '</div>';
            }).join('') : '<p class="text-sm text-gray-500">No gift teasers yet.</p>');
        KG.bindSettingsForm(el.querySelector('#ck-form'), 'buyer', function () { renderCheckoutAdmin(el); });
        el.querySelectorAll('[data-tsent]').forEach(function (x) { x.addEventListener('click', function () { KG.store.update('kg-outbox', x.dataset.tsent, { status: 'sent', sentAt: KG.now() }); renderCheckoutAdmin(el); }); });
    }

    KG.addAdminTab('delivery', 'Delivery estimates', renderDeliveryAdmin);
    KG.addAdminTab('checkout-gifting', 'Checkout & gifting', renderCheckoutAdmin);
    KG.initBuyer = function () {
        hookScreens(); KG.renderBuyAgain();
        KG.onSettings(function () { KG.renderBuyAgain(); });
    };
})();
