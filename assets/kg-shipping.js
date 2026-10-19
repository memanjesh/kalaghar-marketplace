/* =====================================================================
   KALAGHAR SHIPPING — #14 courier booking and shipping-label printing
   (Nepal Can Move, Pathao, Export Hub). Admin controls sender details,
   label size, COD display, default courier and the booking connection.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const S = function (k) { return KG.setting('courier.' + k); };
    const couriers = function () { return KG.C.shipping.couriers.domestic.concat(KG.C.shipping.couriers.international); };
    const courierName = function (id) { const c = couriers().find(function (x) { return x.id === id; }); return c ? c.name : id; };
    const bookings = function () { return KG.store.get('kg-courier-bookings', []); };
    const orderById = function (id) { return KG.store.get('kg-orders', []).find(function (o) { return o.id === id; }); };
    const bookingFor = function (id) { return bookings().filter(function (b) { return b.orderId === id && b.status !== 'cancelled'; }).pop(); };
    KG.courierBookingFor = bookingFor;

    function recipient(o) {
        return { name: o.gift ? o.gift.recipient : o.buyer.name, phone: o.gift ? o.gift.phone : o.buyer.phone, line: o.address.line, city: o.address.city, district: o.address.district, postcode: o.address.postcode, country: o.address.country || 'Nepal' };
    }
    function weightOf(o) {
        return o.items.reduce(function (s, it) { const p = KG.product(it.productId); return s + ((p && p.weightG) || S('defaultWeightG')) * it.qty; }, 0) || S('defaultWeightG');
    }
    function codAmount(o) { return o.payment && (o.payment.method === 'cod' || o.payment.status === 'cod') ? o.total : 0; }

    /* ---------------------------- booking ---------------------------- */
    KG.bookCourier = async function (orderId, opts) {
        if (!S('enabled')) throw new Error('Courier booking is switched off in Admin.');
        const o = orderById(orderId); if (!o) throw new Error('Order not found');
        if (bookingFor(orderId)) throw new Error(orderId + ' is already booked.');
        opts = opts || {};
        const zone = KG.zoneById(o.zone);
        const courier = opts.courier || (zone.domestic ? (o.courier && o.courier !== 'hub' ? o.courier : S('defaultCourier')) : 'hub');
        const b = { id: KG.uid('BK-').toUpperCase(), orderId: orderId, sellerId: o.sellerId, courier: courier, weightG: +opts.weightG || weightOf(o), pieces: +opts.pieces || 1, cod: codAmount(o), fragile: o.items.some(function (it) { const p = KG.product(it.productId); return p && p.fragile; }), ref: '', tracking: '', labelUrl: '', mode: 'manual', status: 'booked', createdAt: KG.now() };
        const endpoint = S('bookingEndpoint');
        if (endpoint && courier !== 'hub') {
            // Your server talks to the courier with your account keys and returns the tracking number
            const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courier: courier, orderId: o.id, sender: S('sender'), recipient: recipient(o), weightG: b.weightG, pieces: b.pieces, codAmount: b.cod, fragile: b.fragile, items: o.items.map(function (i) { return { name: i.name, qty: i.qty }; }) }) });
            const j = await r.json().catch(function () { return {}; });
            if (!r.ok || !j.trackingNumber) throw new Error(j.error || 'The courier booking service did not confirm the booking.');
            b.mode = 'api'; b.tracking = String(j.trackingNumber).slice(0, 60); b.ref = String(j.bookingId || j.trackingNumber).slice(0, 60); b.labelUrl = /^https:\/\//.test(j.labelUrl || '') ? j.labelUrl : '';
        } else {
            // No connection yet: a KalaGhar reference goes on the label; staff book on the courier's portal
            b.ref = 'KGS-' + o.id.replace(/\D/g, '') + '-' + Date.now().toString(36).slice(-4).toUpperCase();
        }
        KG.store.push('kg-courier-bookings', b);
        KG.store.update('kg-orders', orderId, function (x) {
            return { courier: courier, tracking: b.tracking || x.tracking || '', shipmentStatus: 'label_created', timeline: (x.timeline || []).concat([{ at: KG.now(), status: 'courier_booked', note: courierName(courier) + ' · ' + (b.tracking || b.ref) }]) };
        });
        if (window.KG_ADMIN_AUDIT) window.KG_ADMIN_AUDIT('courier.booked', 'order', orderId, courierName(courier) + ' ' + (b.tracking || b.ref));
        return b;
    };
    KG.cancelBooking = function (bid) {
        const b = bookings().find(function (x) { return x.id === bid; }); if (!b) return;
        KG.store.update('kg-courier-bookings', bid, { status: 'cancelled', cancelledAt: KG.now() });
        KG.store.update('kg-orders', b.orderId, function (x) { return { shipmentStatus: x.status === 'shipped' ? x.shipmentStatus : '', timeline: (x.timeline || []).concat([{ at: KG.now(), status: 'courier_cancelled', note: b.ref }]) }; });
    };

    /* ---------------------------- labels ---------------------------- */
    KG.printLabels = function (orderIds) {
        const list = orderIds.map(orderById).filter(Boolean);
        if (!list.length) return KG.toast('Choose at least one order.', 'warn');
        const size = S('labelSize') === 'a6' ? { w: '105mm', h: '148mm' } : { w: '4in', h: '6in' };
        const sender = S('sender');
        const label = function (o) {
            const b = bookingFor(o.id) || { courier: o.courier || S('defaultCourier'), ref: '', tracking: o.tracking || '', weightG: weightOf(o), pieces: 1, cod: codAmount(o) };
            const to = recipient(o), code = b.tracking || b.ref || o.id;
            const fragile = o.items.some(function (it) { const p = KG.product(it.productId); return p && p.fragile; });
            const intl = !KG.zoneById(o.zone).domestic;
            return '<section class="label"><div class="row top"><strong class="brand">KalaGhar</strong><span class="courier">' + esc(courierName(b.courier)) + '</span></div>' +
                '<div class="from"><small>FROM</small>' + esc(sender.name) + '<br>' + esc(sender.address) + ', ' + esc(sender.city) + '<br>' + esc(sender.phone) + '</div>' +
                '<div class="to"><small>TO</small><b>' + esc(to.name) + '</b><br>' + esc(to.line) + '<br>' + esc([to.city, to.district, to.postcode].filter(Boolean).join(', ')) + '<br>' + esc(to.country) + '<br><b>☎ ' + esc(to.phone) + '</b></div>' +
                '<div class="row meta"><span>Order <b>' + esc(o.id) + '</b></span><span>' + (b.weightG / 1000).toFixed(2) + ' kg</span><span>' + (b.pieces || 1) + ' pc</span></div>' +
                (b.cod && S('showCodOnLabel') ? '<div class="cod">COLLECT CASH: NPR ' + Math.round(b.cod).toLocaleString('en-US') + '</div>' : '<div class="paid">PREPAID — DO NOT COLLECT</div>') +
                '<div class="flags">' + (fragile ? '<span>⚠ FRAGILE — HANDLE WITH CARE</span>' : '') + (intl ? '<span>INTERNATIONAL · via KalaGhar Export Hub</span>' : '') + (o.gift ? '<span>🎁 GIFT</span>' : '') + '</div>' +
                '<svg class="barcode" data-code="' + esc(code) + '"></svg><p class="ref">' + esc(code) + '</p></section>';
        };
        const w = window.open('', '_blank'); if (!w) return KG.toast('Allow pop-ups to print labels.', 'warn');
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Shipping labels</title><style>@page{size:' + size.w + ' ' + size.h + ';margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#000}' +
            '.label{width:' + size.w + ';height:' + size.h + ';padding:5mm;page-break-after:always;display:flex;flex-direction:column;gap:3mm;border:1px dashed #bbb}.row{display:flex;justify-content:space-between;align-items:center;gap:2mm}.brand{font-size:18pt}.courier{font-size:12pt;font-weight:700;border:2px solid #000;padding:1mm 2mm;border-radius:2mm}' +
            'small{display:block;font-size:7pt;font-weight:700;letter-spacing:.1em;color:#444}.from{font-size:8.5pt;line-height:1.3}.to{font-size:12pt;line-height:1.35;border:2px solid #000;border-radius:2mm;padding:2.5mm;flex:1}.meta{font-size:9pt;border-top:1px solid #000;border-bottom:1px solid #000;padding:1.5mm 0}' +
            '.cod{background:#000;color:#fff;text-align:center;font-weight:700;font-size:13pt;padding:2mm}.paid{text-align:center;font-weight:700;font-size:10pt;border:2px solid #000;padding:1.5mm}.flags span{display:block;font-size:8.5pt;font-weight:700}.barcode{width:100%;height:20mm}.ref{text-align:center;margin:0;font:700 10pt monospace}' +
            '.bar{position:fixed;top:0;left:0;right:0;background:#111;color:#fff;padding:8px 12px;font:14px Arial;display:flex;gap:10px;align-items:center}.bar button{background:#d97706;color:#fff;border:0;border-radius:6px;padding:6px 14px;font-weight:700;cursor:pointer}@media print{.bar{display:none}.label{border:0}}@media screen{body{padding-top:48px;background:#eee}.label{background:#fff;margin:12px auto}}</style>' +
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js"><\/script></head><body><div class="bar">' + list.length + ' label(s) · ' + (S('labelSize') === 'a6' ? 'A6' : '4×6 in') + '<button onclick="print()">Print</button></div>' + list.map(label).join('') +
            '<script>window.addEventListener("load",function(){document.querySelectorAll(".barcode").forEach(function(s){try{JsBarcode(s,s.dataset.code,{format:"CODE128",displayValue:false,height:60,margin:0})}catch(e){s.outerHTML="<p class=ref>"+s.dataset.code+"</p>"}})})<\/script></body></html>');
        w.document.close();
        list.forEach(function (o) { KG.store.update('kg-orders', o.id, { labelPrintedAt: KG.now() }); });
    };

    function bookDialog(orderId, done) {
        const o = orderById(orderId), zone = KG.zoneById(o.zone);
        const opts = (zone.domestic ? KG.C.shipping.couriers.domestic : KG.C.shipping.couriers.international);
        const body = KG.modal('kgBookCourier', 'Book courier — ' + esc(orderId),
            '<form class="space-y-3"><div class="grid sm:grid-cols-3 gap-3"><div><label class="' + ui.label + '" for="bc-c">Courier</label><select id="bc-c" class="' + ui.input + '">' + opts.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === (o.courier || S('defaultCourier')) ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
            '<div><label class="' + ui.label + '" for="bc-w">Weight (grams)</label><input id="bc-w" type="number" min="50" value="' + weightOf(o) + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="bc-p">Parcels</label><input id="bc-p" type="number" min="1" max="20" value="1" class="' + ui.input + '"></div></div>' +
            '<p class="text-sm"><strong>To:</strong> ' + esc(recipient(o).name) + ', ' + esc(recipient(o).city) + (codAmount(o) ? ' · <span class="text-amber-700 font-semibold">Collect NPR ' + Math.round(codAmount(o)).toLocaleString('en-US') + ' on delivery</span>' : ' · prepaid') + '</p>' +
            '<p class="' + ui.muted + '">' + (S('bookingEndpoint') ? 'This books the pickup directly with the courier and fills in the tracking number.' : 'The courier connection isn\'t set up yet, so this creates a KalaGhar reference for the label. Book the pickup on the courier\'s website, then add their tracking number when you mark the order shipped.') + '</p>' +
            '<div class="flex gap-2"><button class="' + ui.btn + ' flex-1">Book</button><button type="button" id="bc-print" class="' + ui.btn2 + '">Book & print label</button></div></form>');
        const go = async function (print) {
            try { await KG.bookCourier(orderId, { courier: body.querySelector('#bc-c').value, weightG: body.querySelector('#bc-w').value, pieces: body.querySelector('#bc-p').value }); KG.closeModal('kgBookCourier'); KG.toast('Courier booked.'); if (print) KG.printLabels([orderId]); if (done) done(); }
            catch (e) { KG.toast(e.message, 'error'); }
        };
        body.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); go(false); });
        body.querySelector('#bc-print').addEventListener('click', function () { go(true); });
    }
    KG.openBookCourier = bookDialog;

    /* ---------------------------- seller order screen ---------------------------- */
    function hookSellerOrders() {
        const orig = KG.openSellerDashboard; if (!orig) return;
        KG.openSellerDashboard = function (tab) {
            const r = orig.apply(this, arguments);
            if (tab !== 'orders' || !S('enabled')) return r;
            document.querySelectorAll('#kgSellerBody [onclick^="KG.packingSlip"]').forEach(function (slip) {
                const id = (slip.getAttribute('onclick').match(/'([^']+)'/) || [])[1]; const o = orderById(id); if (!o || ['cancelled', 'refunded'].indexOf(o.status) > -1) return;
                const b = bookingFor(id);
                const html = (!b && o.status === 'paid' ? '<button type="button" data-book="' + esc(id) + '" class="' + ui.btn2 + ' !py-1.5 !text-xs"><i class="fa-solid fa-truck-ramp-box mr-1"></i>' + KG.tx('Book courier', 'कुरियर बुक') + '</button>' : '') +
                    '<button type="button" data-label="' + esc(id) + '" class="' + ui.btn2 + ' !py-1.5 !text-xs"><i class="fa-solid fa-barcode mr-1"></i>' + KG.tx('Print label', 'लेबल प्रिन्ट') + '</button>' +
                    (b ? '<span class="text-[11px] text-green-700 self-center"><i class="fa-solid fa-check mr-1"></i>' + esc(courierName(b.courier)) + ' · ' + esc(b.tracking || b.ref) + '</span>' : '');
                slip.insertAdjacentHTML('afterend', html);
            });
            document.querySelectorAll('#kgSellerBody [data-book]').forEach(function (x) { x.addEventListener('click', function () { bookDialog(x.dataset.book, function () { KG.openSellerDashboard('orders'); }); }); });
            document.querySelectorAll('#kgSellerBody [data-label]').forEach(function (x) { x.addEventListener('click', function () { KG.printLabels([x.dataset.label]); }); });
            // Booked with a tracking number? Pre-fill the "mark shipped" box
            document.querySelectorAll('#kgSellerBody input[id^="sh-t-"]').forEach(function (inp) { const b = bookingFor(inp.id.slice(5)); if (b && b.tracking && !inp.value) inp.value = b.tracking; });
            return r;
        };
    }

    /* ---------------------------- admin tab ---------------------------- */
    function renderShippingAdmin(el) {
        const A = KG.adminField, sender = S('sender');
        const orders = KG.store.get('kg-orders', []).filter(function (o) { return ['paid', 'shipped'].indexOf(o.status) > -1; }).reverse();
        const all = bookings().slice().reverse();
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Courier booking & shipping labels</h3><p class="' + ui.muted + ' mb-4">Book pickups and print 4×6 or A6 labels with a barcode for Nepal Can Move, Pathao and the Export Hub. Sellers get the same buttons on their orders screen.</p>' +
            '<form id="sh-form" class="grid lg:grid-cols-3 gap-4 mb-5">' +
                '<div class="' + ui.card + ' p-4 space-y-3">' + A.toggle('enabled', 'Courier booking & labels on', S('enabled')) + A.select('labelSize', 'Label size', S('labelSize'), [['4x6', '4 × 6 in (thermal label printers)'], ['a6', 'A6 (fold an A4 sheet in four)']]) + A.select('defaultCourier', 'Default courier in Nepal', S('defaultCourier'), KG.C.shipping.couriers.domestic.map(function (c) { return [c.id, c.name]; })) + A.text('defaultWeightG', 'Default weight when a product has none (g)', S('defaultWeightG'), 'type="number" min="50"') + A.toggle('showCodOnLabel', 'Print the cash-on-delivery amount', S('showCodOnLabel')) + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Sender (printed on every label)</p>' + A.text('sender.name', 'Name', sender.name) + A.text('sender.phone', 'Phone', sender.phone) + A.text('sender.address', 'Address', sender.address) + A.text('sender.city', 'City', sender.city) + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Automatic booking (optional)</p>' + A.text('bookingEndpoint', 'Booking service address', S('bookingEndpoint'), 'type="url" placeholder="https://pay.kalaghar.com/api/courier/book"') +
                    '<p class="' + ui.muted + '">Leave empty to book on the courier\'s website and print labels with a KalaGhar reference. Automatic booking needs a business account with Nepal Can Move or Pathao and a small server holding your courier API key — see docs/DEPLOYMENT.md.</p>' +
                    KG.C.shipping.couriers.domestic.map(function (c) { return '<p class="text-xs"><a class="underline" target="_blank" rel="noopener" href="' + esc(c.site) + '">' + esc(c.name) + ' portal</a></p>'; }).join('') + '</div></form>' +
            '<div class="flex flex-wrap items-center gap-2 mb-2"><h4 class="font-bold mr-auto">Orders ready to ship</h4><button type="button" id="sh-book" class="' + ui.btn2 + ' !text-xs"><i class="fa-solid fa-truck-ramp-box mr-1"></i>Book selected</button><button type="button" id="sh-print" class="' + ui.btn + ' !text-xs"><i class="fa-solid fa-print mr-1"></i>Print labels for selected</button></div>' +
            '<div class="' + ui.card + ' overflow-x-auto mb-5"><table class="w-full text-sm min-w-[680px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3"><input type="checkbox" id="sh-all" aria-label="Select all"></th><th>Order</th><th>Ship to</th><th>Weight</th><th>Payment</th><th>Courier booking</th><th>Label</th></tr></thead><tbody>' + (orders.length ? orders.map(function (o) {
                const b = bookingFor(o.id), to = recipient(o);
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3"><input type="checkbox" data-o="' + esc(o.id) + '" aria-label="Select ' + esc(o.id) + '"></td><td><strong>' + esc(o.id) + '</strong><span class="block text-xs text-gray-500">' + esc(o.status) + '</span></td><td class="text-xs">' + esc(to.name) + '<br>' + esc(to.city) + ', ' + esc(to.country) + '</td><td class="text-xs">' + (weightOf(o) / 1000).toFixed(2) + ' kg</td><td class="text-xs">' + (codAmount(o) ? '<span class="text-amber-700 font-semibold">COD ' + KG.npr(codAmount(o)) + '</span>' : 'Prepaid') + '</td>' +
                    '<td class="text-xs">' + (b ? '<span class="text-green-700">' + esc(courierName(b.courier)) + '</span><br>' + esc(b.tracking || b.ref) + (b.mode === 'manual' ? ' <span class="text-gray-400">(book on portal)</span>' : '') + ' <button type="button" data-cancel-bk="' + esc(b.id) + '" class="text-red-700 ml-1">cancel</button>' : (o.status === 'paid' ? '<button type="button" data-book1="' + esc(o.id) + '" class="text-red-700 font-semibold">Book</button>' : '—')) + '</td>' +
                    '<td class="text-xs pr-3">' + (o.labelPrintedAt ? '<span class="text-green-700">printed</span> ' : '') + '<button type="button" data-print1="' + esc(o.id) + '" class="text-red-700 font-semibold">Print</button></td></tr>';
            }).join('') : '<tr><td colspan="7" class="p-4 text-gray-500">No paid orders waiting. Place a test order from the shop to try it.</td></tr>') + '</tbody></table></div>' +
            '<h4 class="font-bold mb-2">Booking history</h4><div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-xs min-w-[560px]"><thead><tr class="text-left text-gray-500"><th class="p-3">Booked</th><th>Order</th><th>Courier</th><th>Reference / tracking</th><th>Mode</th><th>Status</th></tr></thead><tbody>' + (all.length ? all.map(function (b) {
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3">' + KG.fmtDate(b.createdAt) + '</td><td>' + esc(b.orderId) + '</td><td>' + esc(courierName(b.courier)) + '</td><td>' + esc(b.tracking || b.ref) + '</td><td>' + (b.mode === 'api' ? 'automatic' : 'manual') + '</td><td>' + esc(b.status) + '</td></tr>';
            }).join('') : '<tr><td colspan="6" class="p-4 text-gray-500">No bookings yet.</td></tr>') + '</tbody></table></div>';
        KG.bindSettingsForm(el.querySelector('#sh-form'), 'courier');
        const selected = function () { return Array.from(el.querySelectorAll('[data-o]:checked')).map(function (c) { return c.dataset.o; }); };
        el.querySelector('#sh-all').addEventListener('change', function (e) { el.querySelectorAll('[data-o]').forEach(function (c) { c.checked = e.target.checked; }); });
        el.querySelector('#sh-print').addEventListener('click', function () { KG.printLabels(selected()); setTimeout(function () { renderShippingAdmin(el); }, 300); });
        el.querySelector('#sh-book').addEventListener('click', async function () {
            const ids = selected().filter(function (id) { return !bookingFor(id) && orderById(id).status === 'paid'; });
            if (!ids.length) return KG.toast('Select paid orders that aren\'t booked yet.', 'warn');
            let ok = 0; for (const id of ids) { try { await KG.bookCourier(id); ok++; } catch (e) { KG.toast(id + ': ' + e.message, 'error'); } }
            KG.toast(ok + ' booked.'); renderShippingAdmin(el);
        });
        el.querySelectorAll('[data-book1]').forEach(function (b) { b.addEventListener('click', function () { bookDialog(b.dataset.book1, function () { renderShippingAdmin(el); }); }); });
        el.querySelectorAll('[data-print1]').forEach(function (b) { b.addEventListener('click', function () { KG.printLabels([b.dataset.print1]); setTimeout(function () { renderShippingAdmin(el); }, 300); }); });
        el.querySelectorAll('[data-cancel-bk]').forEach(function (b) { b.addEventListener('click', function () { if (confirm('Cancel this booking? Also cancel it on the courier\'s portal if you booked there.')) { KG.cancelBooking(b.dataset.cancelBk); renderShippingAdmin(el); } }); });
    }

    KG.addAdminTab('shipping-labels', 'Courier & labels', renderShippingAdmin);
    KG.initShipping = function () { hookSellerOrders(); };
})();
