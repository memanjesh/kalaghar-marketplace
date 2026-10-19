/* =====================================================================
   KALAGHAR ADMIN EXTENSIONS — real orders, artisan verification &
   certificates, complaints & protection cases, inquiries & bookings,
   translations, coupons, payouts, festival control, tourist QR codes,
   launch checklist
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, C = KG.C, esc = KG.esc, ui = KG.ui;
    const th = function (cols) { return '<thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800"><tr>' + cols.map(function (c) { return '<th class="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">' + c + '</th>'; }).join('') + '</tr></thead>'; };
    const wrap = function (inner, minW) { return '<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto"><table class="w-full text-left text-sm ' + (minW || 'min-w-[720px]') + '">' + inner + '</table></div>'; };
    const td = function (h, cls) { return '<td class="p-3 align-top ' + (cls || '') + '">' + h + '</td>'; };

    const NEW_TABS = [
        ['complaints', 'Complaints'], ['inquiries', 'Inquiries'], ['translations', 'Translations'],
        ['coupons', 'Coupons'], ['payouts', 'Payouts'], ['qr', 'QR codes'], ['launch', 'Launch checklist']
    ];
    function addTabs() {
        const bar = document.querySelector('.admin-tab[data-tab="artisans"]'); if (!bar || bar.dataset.kg) return;
        bar.dataset.kg = '1';
        const host = document.getElementById('adminTab-artisans').parentNode;
        let prev = bar;
        NEW_TABS.forEach(function (x) {
            const b = document.createElement('button'); b.className = 'admin-tab'; b.dataset.tab = x[0]; b.textContent = x[1];
            b.setAttribute('onclick', "switchAdminTab('" + x[0] + "')"); prev.after(b); prev = b;
            const d = document.createElement('div'); d.id = 'adminTab-' + x[0]; d.className = 'admin-tab-content hidden'; host.appendChild(d);
        });
        const tabBar = bar.parentNode; tabBar.classList.add('overflow-x-auto');
    }
    const origSwitch = window.switchAdminTab;
    window.switchAdminTab = function (tab) {
        if (['overview', 'products', 'orders', 'artisans'].indexOf(tab) > -1) return origSwitch(tab);
        document.querySelectorAll('.admin-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
        document.querySelectorAll('.admin-tab-content').forEach(function (c) { c.classList.add('hidden'); });
        document.getElementById('adminTab-' + tab).classList.remove('hidden');
        RENDER[tab](document.getElementById('adminTab-' + tab));
    };
    KG.adminTab = function (tab) { window.switchAdminTab(tab); };

    /* ---------------------------- overview ---------------------------- */
    window.renderAdminDashboard = function () {
        const orders = KG.store.get('kg-orders', []);
        const live = orders.filter(function (o) { return ['cancelled', 'refunded'].indexOf(o.status) === -1; });
        const gmv = live.reduce(function (a, o) { return a + o.total; }, 0);
        const commission = live.reduce(function (a, o) { return a + (o.goods - o.discount - o.payout); }, 0);
        const promo = KG.store.get('kg-promos', []).reduce(function (a, p) { return a + p.cost; }, 0);
        const held = orders.filter(function (o) { return o.escrow === 'held' || o.escrow === 'frozen'; }).reduce(function (a, o) { return a + o.payout; }, 0);
        const openC = KG.store.get('kg-complaints', []).filter(function (c) { return c.status === 'open'; }).length;
        const pendingS = KG.sellers().filter(function (s) { return s.status === 'pending'; }).length;
        const pendingCert = KG.sellers().filter(function (s) { return s.chyangraCert && s.chyangraCert.status === 'submitted'; }).length;
        const card = function (v, l, icon, tab) { return '<button ' + (tab ? 'onclick="switchAdminTab(\'' + tab + '\')"' : '') + ' class="text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"><p class="text-xs text-gray-500"><i class="fa-solid ' + icon + ' mr-1"></i>' + l + '</p><p class="text-2xl font-extrabold mt-1 text-gray-900 dark:text-white">' + v + '</p></button>'; };
        const testOrders = orders.filter(function (o) { return o.payment && o.payment.status === 'test'; }).length;
        document.getElementById('adminTab-overview').innerHTML =
            (testOrders ? '<div class="mb-4 text-xs bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-lg p-3"><i class="fa-solid fa-flask mr-1"></i>' + testOrders + ' test order(s) — payments are in test mode until the payment server is connected. <button class="underline" onclick="switchAdminTab(\'launch\')">See launch checklist</button></div>' : '') +
            '<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">' + card(KG.npr(gmv), 'Total sales (GMV)', 'fa-sack-dollar', 'orders') + card(KG.npr(commission + promo), 'KalaGhar revenue (commission + ads)', 'fa-coins', 'payouts') + card(KG.npr(held), 'Buyer money held', 'fa-lock', 'payouts') + card(live.length, 'Orders', 'fa-receipt', 'orders') +
            card(KG.products().length, 'Live products', 'fa-box', 'products') + card(KG.sellers().filter(function (s) { return s.status === 'approved'; }).length, 'Approved sellers', 'fa-store', 'artisans') + card(pendingS + pendingCert, 'Verifications waiting', 'fa-user-check', 'artisans') + card(openC, 'Open complaints & cases', 'fa-scale-balanced', 'complaints') + '</div>' +
            '<p class="text-xs text-gray-500 mt-4">Data is stored in this browser until a shared database is connected (see Launch checklist).</p>';
    };

    /* ---------------------------- orders ---------------------------- */
    window.renderAdminOrders = function () {
        const orders = KG.store.get('kg-orders', []).slice().reverse();
        const el = document.getElementById('adminTab-orders');
        if (!orders.length) { el.innerHTML = '<p class="text-sm text-gray-500 p-6 text-center">No orders yet. Place a test order from the shop to see it here.</p>'; return; }
        el.innerHTML = wrap(th(['Order', 'Buyer', 'Seller', 'Items', 'Total', 'Payment', 'Status', 'Money', '']) + '<tbody>' + orders.map(function (o) {
            return '<tr class="border-b border-gray-100 dark:border-gray-800">' + td('<strong>' + o.id + '</strong><br><span class="text-xs text-gray-500">' + KG.fmtDate(o.createdAt) + '</span>' + (o.gift ? '<br><span class="text-[10px] text-red-700"><i class="fa-solid fa-gift"></i> gift</span>' : '')) +
                td(esc(o.buyer.name) + '<br><span class="text-xs text-gray-500">' + esc(o.buyer.email) + '</span>') + td(esc((KG.seller(o.sellerId) || {}).shopName || '')) +
                td(o.items.map(function (i) { return esc(i.name) + ' ×' + i.qty; }).join('<br>'), 'text-xs') + td(KG.npr(o.total)) +
                td('<span class="text-xs">' + esc(o.payment.method) + ' · ' + esc(o.payment.status) + '</span>') + td(KG.statusBadge(o.status)) + td('<span class="text-xs">' + esc(KG.escrowLabel(o)) + '</span>') +
                td('<button class="text-xs text-red-700 font-semibold" onclick="KG.invoice(\'' + o.id + '\')">Invoice</button>' + (['paid', 'shipped', 'delivered', 'disputed'].indexOf(o.status) > -1 ? '<br><button class="text-xs text-gray-600" onclick="if(confirm(\'Refund ' + o.id + '?\')){KG.setOrderStatus(\'' + o.id + '\',\'refunded\',\'Refunded by admin\');renderAdminOrders();}">Refund</button>' : '') + (o.status === 'delivered' ? '<br><button class="text-xs text-gray-600" onclick="KG.setOrderStatus(\'' + o.id + '\',\'completed\',\'Completed by admin\');renderAdminOrders();">Release payout</button>' : '')) + '</tr>';
        }).join('') + '</tbody>', 'min-w-[1000px]');
    };

    /* ---------------------------- artisans & verification ---------------------------- */
    window.renderAdminArtisans = function () {
        const sellers = KG.sellers().slice().reverse();
        document.getElementById('adminTab-artisans').innerHTML = wrap(th(['Shop', 'Region / craft', 'Type', 'Status', 'Verified', 'Chyangra licence', 'Actions']) + '<tbody>' + sellers.map(function (s) {
            const cert = s.chyangraCert || {};
            return '<tr class="border-b border-gray-100 dark:border-gray-800">' + td('<strong>' + esc(s.shopName) + '</strong>' + (s.sample ? ' <span class="text-[10px] text-amber-700">sample</span>' : '') + '<br><span class="text-xs text-gray-500">' + esc(s.owner || '') + ' · ' + esc(s.email || '') + (s.phone ? ' · ' + esc(s.phone) : '') + '</span>') +
                td(esc(KG.regionName(s.region)) + '<br><span class="text-xs text-gray-500">' + esc(KG.catName(s.craft)) + '</span>') + td(esc(s.type)) +
                td('<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ' + (s.status === 'approved' ? 'bg-green-100 text-green-800' : s.status === 'rejected' ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-800') + '">' + esc(s.status) + '</span>') +
                td(s.verified ? '<i class="fa-solid fa-circle-check text-green-600"></i>' : '—') +
                td(cert.status ? '<span class="text-xs">' + esc(cert.status) + '</span>' + (cert.data ? '<br><button class="text-xs text-red-700 underline" onclick="KG.viewCert(\'' + esc(s.id) + '\')">View</button>' : '') : '<span class="text-xs text-gray-400">—</span>') +
                td('<div class="flex flex-col gap-1 text-xs">' +
                    (s.status !== 'approved' ? '<button class="text-green-700 font-semibold text-left" onclick="KG.adminSeller(\'' + esc(s.id) + '\',{status:\'approved\',verified:true})">Approve & verify</button>' : '') +
                    (s.status === 'approved' && !s.verified ? '<button class="text-green-700 font-semibold text-left" onclick="KG.adminSeller(\'' + esc(s.id) + '\',{verified:true})">Mark verified</button>' : '') +
                    (s.verified ? '<button class="text-gray-600 text-left" onclick="KG.adminSeller(\'' + esc(s.id) + '\',{verified:false})">Remove verified</button>' : '') +
                    (cert.status === 'submitted' ? '<button class="text-green-700 font-semibold text-left" onclick="KG.adminCert(\'' + esc(s.id) + '\',\'verified\')">Verify licence</button><button class="text-gray-600 text-left" onclick="KG.adminCert(\'' + esc(s.id) + '\',\'rejected\')">Reject licence</button>' : '') +
                    (s.status === 'pending' ? '<button class="text-gray-600 text-left" onclick="KG.adminSeller(\'' + esc(s.id) + '\',{status:\'rejected\'})">Reject</button>' : '') +
                    '<button class="text-gray-600 text-left" onclick="KG.openShop(\'' + esc(s.id) + '\')">View shop</button></div>') + '</tr>';
        }).join('') + '</tbody>', 'min-w-[960px]');
    };
    KG.adminSeller = function (id, patch) { const s = KG.seller(id); Object.assign(s, patch); KG.saveSeller(s); renderAdminArtisans(); renderProducts(); KG.renderDiscover(); };
    KG.adminCert = function (id, status) { const s = KG.seller(id); s.chyangraCert.status = status; s.chyangraCert.reviewedAt = KG.now(); KG.saveSeller(s); renderAdminArtisans(); renderProducts(); };
    KG.viewCert = function (id) {
        const s = KG.seller(id); const c = s.chyangraCert;
        KG.modal('kgCert', 'Licence — ' + esc(s.shopName), c.data.indexOf('data:application/pdf') === 0 ? '<iframe src="' + c.data + '" class="w-full h-[70vh]" title="Licence"></iframe>' : '<img src="' + c.data + '" alt="Licence" class="max-w-full mx-auto">', 'xl');
    };

    /* ---------------------------- complaints & protection cases ---------------------------- */
    function complaints(el) {
        const list = KG.store.get('kg-complaints', []).slice().reverse();
        el.innerHTML = list.length ? list.map(function (c) {
            const o = c.orderId ? KG.store.get('kg-orders', []).find(function (x) { return x.id === c.orderId; }) : null;
            return '<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-3"><div class="flex flex-wrap justify-between gap-2"><div><strong>' + esc(c.id) + '</strong> <span class="text-xs text-gray-500">· ' + KG.fmtDate(c.createdAt) + ' · ' + (c.kind === 'protection' ? '<span class="text-red-700 font-semibold">Purchase protection — ' + esc(c.reason) + '</span>' : esc(c.type)) + '</span></div><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ' + (c.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') + '">' + esc(c.status) + '</span></div>' +
                '<p class="text-xs text-gray-500 mt-1">' + esc(c.name) + ' · ' + esc(c.email) + (c.phone ? ' · ' + esc(c.phone) : '') + (c.orderId ? ' · Order ' + esc(c.orderId) + (o ? ' (' + KG.npr(o.total) + ', ' + esc((KG.seller(o.sellerId) || {}).shopName || '') + ')' : '') : '') + '</p>' +
                '<p class="text-sm mt-2 whitespace-pre-line">' + esc(c.text) + '</p>' + (c.photo ? '<img src="' + c.photo + '" alt="" class="mt-2 w-32 rounded border">' : '') +
                (c.resolution ? '<p class="text-xs mt-2 text-green-700"><strong>Resolution:</strong> ' + esc(c.resolution) + '</p>' : '') +
                (c.status === 'open' ? '<div class="flex flex-wrap gap-2 mt-3 items-center"><label class="sr-only" for="res-' + c.id + '">Resolution</label><input id="res-' + c.id + '" class="' + ui.input + ' !py-1.5 !w-72" placeholder="Resolution note sent to customer">' +
                    (c.kind === 'protection' && o ? '<button class="' + ui.btn + ' !py-1.5 !text-xs" onclick="KG.resolveCase(\'' + c.id + '\',\'refund\')">Refund buyer</button><button class="' + ui.btn2 + ' !py-1.5 !text-xs" onclick="KG.resolveCase(\'' + c.id + '\',\'release\')">Release to seller</button>' : '') +
                    '<button class="' + ui.btn2 + ' !py-1.5 !text-xs" onclick="KG.resolveCase(\'' + c.id + '\',\'close\')">Mark resolved</button><a class="text-xs underline text-red-700" href="mailto:' + esc(c.email) + '?subject=' + encodeURIComponent('Your KalaGhar complaint ' + c.id) + '">Email customer</a></div>' : '') + '</div>';
        }).join('') : '<p class="text-sm text-gray-500 p-6 text-center">No complaints. 🎉</p>';
    }
    KG.resolveCase = function (id, action) {
        const note = (document.getElementById('res-' + id) || {}).value || '';
        const c = KG.store.get('kg-complaints', []).find(function (x) { return x.id === id; });
        if (action === 'refund') KG.setOrderStatus(c.orderId, 'refunded', 'Protection case ' + id + ': refunded');
        if (action === 'release') KG.setOrderStatus(c.orderId, 'completed', 'Protection case ' + id + ': released to seller');
        KG.store.update('kg-complaints', id, { status: 'resolved', resolution: note || ({ refund: 'Refunded in full', release: 'Reviewed — payment released to seller', close: 'Resolved' })[action], resolvedAt: KG.now() });
        complaints(document.getElementById('adminTab-complaints'));
    };

    /* ---------------------------- inquiries & bookings ---------------------------- */
    function inquiries(el) {
        const ws = KG.store.get('kg-wholesale', []).slice().reverse(), bk = KG.store.get('kg-bookings', []).slice().reverse();
        el.innerHTML = '<h3 class="font-bold mb-2">Wholesale requests (' + ws.length + ')</h3>' + (ws.length ? wrap(th(['Date', 'Business', 'Contact', 'Product', 'Qty', 'Details', 'Status']) + '<tbody>' + ws.map(function (w) {
            return '<tr class="border-b border-gray-100 dark:border-gray-800">' + td(KG.fmtDate(w.createdAt)) + td(esc(w.company) + '<br><span class="text-xs text-gray-500">' + esc(w.country) + '</span>') + td(esc(w.name) + '<br><a class="text-xs underline" href="mailto:' + esc(w.email) + '">' + esc(w.email) + '</a>') + td(esc(KG.catName(w.category))) + td(w.qty) + td('<span class="text-xs">' + esc(w.message) + '</span>') +
                td('<select class="text-xs border rounded p-1 dark:bg-gray-800" onchange="KG.store.update(\'kg-wholesale\',\'' + w.id + '\',{status:this.value})">' + ['new', 'quoted', 'won', 'lost'].map(function (s) { return '<option' + (s === w.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>') + '</tr>';
        }).join('') + '</tbody>') : '<p class="text-sm text-gray-500 mb-4">None yet.</p>') +
        '<h3 class="font-bold mt-6 mb-2">Workshop bookings (' + bk.length + ')</h3>' + (bk.length ? wrap(th(['Requested', 'Workshop', 'Guest', 'Date', 'People', 'Total', 'Notes', 'Status']) + '<tbody>' + bk.map(function (b) {
            return '<tr class="border-b border-gray-100 dark:border-gray-800">' + td(KG.fmtDate(b.createdAt)) + td(esc(b.workshop)) + td(esc(b.name) + '<br><a class="text-xs underline" href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a>') + td(esc(b.date)) + td(b.people) + td(KG.npr(b.total)) + td('<span class="text-xs">' + esc(b.note) + '</span>') +
                td('<select class="text-xs border rounded p-1 dark:bg-gray-800" onchange="KG.store.update(\'kg-bookings\',\'' + b.id + '\',{status:this.value})">' + ['requested', 'confirmed', 'paid', 'cancelled'].map(function (s) { return '<option' + (s === b.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>') + '</tr>';
        }).join('') + '</tbody>') : '<p class="text-sm text-gray-500">None yet.</p>');
    }

    /* ---------------------------- translations ---------------------------- */
    function translations(el) {
        const list = window.loadProducts().filter(function (p) { return p.needsTranslation; });
        el.innerHTML = '<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Listings made by Nepali voice or text that still need an English name and description for international buyers.</p>' + (list.length ? list.map(function (p) {
            return '<form class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-3 grid md:grid-cols-2 gap-3" data-id="' + p.id + '"><div><p class="text-xs text-gray-500">Nepali</p><p class="font-semibold">' + esc(p.nameNe) + '</p><p class="text-sm mt-1 whitespace-pre-line">' + esc(p.descNe) + '</p><p class="text-xs text-gray-500 mt-1">' + esc((KG.seller(p.sellerId) || {}).shopName || '') + '</p></div>' +
                '<div class="space-y-2"><label class="sr-only" for="tr-n-' + p.id + '">English name</label><input id="tr-n-' + p.id + '" required class="' + ui.input + '" placeholder="English name"><label class="sr-only" for="tr-d-' + p.id + '">English description</label><textarea id="tr-d-' + p.id + '" rows="3" class="' + ui.input + '" placeholder="English description"></textarea><button class="' + ui.btn + ' !py-1.5 !text-xs">Publish English</button></div></form>';
        }).join('') : '<p class="text-sm text-gray-500 p-6 text-center">Nothing waiting.</p>');
        el.querySelectorAll('form').forEach(function (f) {
            f.addEventListener('submit', function (e) {
                e.preventDefault(); const id = +f.dataset.id;
                const raw = KG.store.get('kg-products', []); const p = raw.find(function (x) { return x.id === id; });
                p.name = f.querySelector('#tr-n-' + id).value.trim(); p.description = f.querySelector('#tr-d-' + id).value.trim(); p.needsTranslation = false;
                KG.store.set('kg-products', raw); renderProducts(); translations(el);
            });
        });
    }

    /* ---------------------------- coupons ---------------------------- */
    function coupons(el) {
        const extra = KG.store.get('kg-coupons', []);
        el.innerHTML = '<div class="grid lg:grid-cols-2 gap-4"><div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p class="font-bold text-sm mb-3">New site-wide coupon</p><form id="adCp" class="grid grid-cols-2 gap-2"><div><label class="' + ui.label + '" for="ad-code">Code</label><input id="ad-code" required pattern="[A-Za-z0-9]{4,15}" class="' + ui.input + ' uppercase"></div><div><label class="' + ui.label + '" for="ad-type">Type</label><select id="ad-type" class="' + ui.input + '"><option value="percent">% off</option><option value="fixed">NPR off</option><option value="freeship">Free shipping</option></select></div><div><label class="' + ui.label + '" for="ad-val">Value</label><input id="ad-val" type="number" min="0" value="10" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="ad-min">Min. order</label><input id="ad-min" type="number" min="0" value="0" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="ad-exp">Expires</label><input id="ad-exp" type="date" class="' + ui.input + '"></div><div><label class="' + ui.label + '" for="ad-note">Note</label><input id="ad-note" class="' + ui.input + '"></div><button class="' + ui.btn + ' col-span-2 !text-xs">Create</button></form></div>' +
            '<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p class="font-bold text-sm mb-2">All coupons</p><ul class="text-sm">' + C.coupons.map(function (c) { return '<li class="py-1.5 border-t border-gray-100 dark:border-gray-800"><code class="font-bold">' + esc(c.code) + '</code> <span class="text-xs text-gray-500">' + esc(c.note) + ' · set in config.js</span></li>'; }).join('') +
            extra.map(function (c) { return '<li class="py-1.5 border-t border-gray-100 dark:border-gray-800 flex gap-2 items-center"><code class="font-bold">' + esc(c.code) + '</code><span class="text-xs text-gray-500 flex-1">' + esc(c.note || '') + (c.sellerId ? ' · shop: ' + esc((KG.seller(c.sellerId) || {}).shopName || '') : ' · site-wide') + (c.active === false ? ' · off' : '') + '</span><button class="text-xs" onclick="KG.toggleCoupon(\'' + esc(c.code) + '\')">' + (c.active === false ? 'Turn on' : 'Turn off') + '</button></li>'; }).join('') + '</ul></div></div>';
        el.querySelector('#adCp').addEventListener('submit', function (e) {
            e.preventDefault(); const code = el.querySelector('#ad-code').value.trim().toUpperCase();
            if (KG.findCoupon(code) || extra.some(function (c) { return c.code === code; })) return alert('Code exists');
            KG.store.push('kg-coupons', { code: code, type: el.querySelector('#ad-type').value, value: +el.querySelector('#ad-val').value, minOrder: +el.querySelector('#ad-min').value || 0, expires: el.querySelector('#ad-exp').value || '', note: el.querySelector('#ad-note').value.trim(), active: true });
            coupons(el);
        });
    }

    /* ---------------------------- payouts ---------------------------- */
    function payouts(el) {
        const orders = KG.store.get('kg-orders', []);
        const rows = KG.sellers().map(function (s) {
            const mine = orders.filter(function (o) { return o.sellerId === s.id; });
            const held = mine.filter(function (o) { return o.escrow === 'held' || o.escrow === 'frozen'; }).reduce(function (a, o) { return a + o.payout; }, 0);
            const due = mine.filter(function (o) { return o.escrow === 'released' && !o.transferredAt; }).reduce(function (a, o) { return a + o.payout; }, 0);
            const promo = KG.store.get('kg-promos', []).filter(function (p) { return p.sellerId === s.id && !p.settled; }).reduce(function (a, p) { return a + p.cost; }, 0);
            return { s: s, held: held, due: due, promo: promo };
        }).filter(function (r) { return r.held || r.due || r.promo; });
        el.innerHTML = '<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Money released to artisans that you still need to transfer to their eSewa/Khalti/bank. Promotion costs are deducted.</p>' + (rows.length ? wrap(th(['Seller', 'Payout account', 'Still held', 'Released, to transfer', 'Ad costs', 'Transfer now', '']) + '<tbody>' + rows.map(function (r) {
            const net = Math.max(0, r.due - r.promo);
            return '<tr class="border-b border-gray-100 dark:border-gray-800">' + td('<strong>' + esc(r.s.shopName) + '</strong>' + (r.s.type === 'cooperative' ? '<br><span class="text-xs text-gray-500">cooperative · split in seller dashboard</span>' : '')) + td('<span class="text-xs">' + esc(r.s.payout ? r.s.payout.method + ' — ' + r.s.payout.id : 'not set') + '</span>') + td(KG.npr(r.held)) + td(KG.npr(r.due)) + td('− ' + KG.npr(r.promo)) + td('<strong>' + KG.npr(net) + '</strong>') +
                td(r.due ? '<button class="' + ui.btn + ' !py-1 !text-xs" onclick="KG.markTransferred(\'' + esc(r.s.id) + '\')">Mark transferred</button>' : '') + '</tr>';
        }).join('') + '</tbody>') : '<p class="text-sm text-gray-500 p-6 text-center">Nothing to pay out yet.</p>');
    }
    KG.markTransferred = function (sid) {
        const all = KG.store.get('kg-orders', []); all.forEach(function (o) { if (o.sellerId === sid && o.escrow === 'released' && !o.transferredAt) o.transferredAt = KG.now(); }); KG.store.set('kg-orders', all);
        const pr = KG.store.get('kg-promos', []); pr.forEach(function (p) { if (p.sellerId === sid) p.settled = true; }); KG.store.set('kg-promos', pr);
        payouts(document.getElementById('adminTab-payouts'));
    };

    /* ---------------------------- tourist QR codes ---------------------------- */
    function loadQr() {
        return new Promise(function (res, rej) {
            if (window.QRCode) return res();
            const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
    }
    function qr(el) {
        const base = location.origin + location.pathname;
        el.innerHTML = '<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Print these for partner shops in Thamel, Patan and Bhaktapur. Tourists scan, order online, and we ship it home — no carrying fragile items in their luggage.</p>' +
            '<div class="flex flex-wrap gap-2 mb-4 items-end"><div><label class="' + ui.label + '" for="qr-what">Link to</label><select id="qr-what" class="' + ui.input + ' !w-72"><option value="">Whole marketplace</option><optgroup label="Shops">' + KG.sellers().map(function (s) { return '<option value="#shop-' + esc(s.id) + '">' + esc(s.shopName) + '</option>'; }).join('') + '</optgroup><optgroup label="Products">' + KG.products().map(function (p) { return '<option value="#product-' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</optgroup></select></div>' +
            '<div><label class="' + ui.label + '" for="qr-src">Partner shop tag</label><input id="qr-src" class="' + ui.input + ' !w-48" placeholder="thamel-shop-1"></div><button id="qr-add" class="' + ui.btn + '">Add to sheet</button><button id="qr-print" class="' + ui.btn2 + '">Print sheet</button></div>' +
            '<div id="qr-sheet" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>';
        const sheet = el.querySelector('#qr-sheet');
        el.querySelector('#qr-add').addEventListener('click', function () {
            loadQr().then(function () {
                const sel = el.querySelector('#qr-what'); const src = el.querySelector('#qr-src').value.trim();
                const url = base + (src ? '?ref=' + encodeURIComponent(src) : '') + sel.value;
                const card = document.createElement('div'); card.className = 'qr-card bg-white text-gray-900 border border-gray-300 rounded-2xl p-3 text-center';
                card.innerHTML = '<div class="qr mx-auto" style="width:140px;height:140px"></div><p class="font-bold text-sm mt-2">' + esc(sel.options[sel.selectedIndex].text) + '</p><p class="text-[11px]">Scan to buy · We ship worldwide</p><p class="text-[10px] text-gray-500">KalaGhar · कलाघर</p>';
                sheet.appendChild(card);
                new window.QRCode(card.querySelector('.qr'), { text: url, width: 140, height: 140, correctLevel: window.QRCode.CorrectLevel.M });
            }).catch(function () { alert('QR library could not load — check your internet connection.'); });
        });
        el.querySelector('#qr-print').addEventListener('click', function () {
            const w = window.open('', '_blank'); if (!w) return;
            w.document.write('<!doctype html><html><head><title>KalaGhar QR sheet</title><style>body{font-family:Arial;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px}.qr-card{border:1px dashed #999;border-radius:12px;padding:12px;text-align:center;break-inside:avoid}img,canvas{margin:auto;display:block}</style></head><body>' + sheet.innerHTML + '</body></html>');
            w.document.close(); setTimeout(function () { w.print(); }, 400);
        });
    }

    /* ---------------------------- launch checklist ---------------------------- */
    function launch(el) {
        const b = C.business;
        const item = function (ok, title, how) { return '<li class="flex gap-3 py-3 border-t border-gray-100 dark:border-gray-800"><i class="fa-solid ' + (ok ? 'fa-circle-check text-green-600' : 'fa-circle-exclamation text-amber-600') + ' mt-0.5"></i><div><p class="text-sm font-semibold">' + title + '</p><p class="text-xs text-gray-500">' + how + '</p></div></li>'; };
        const fest = KG.activeFestival();
        el.innerHTML = '<div class="grid lg:grid-cols-3 gap-4"><div class="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p class="font-bold">Before going live</p><ul class="mt-2">' +
            item(!!b.docListingNo, 'Register on the Department of Commerce e-commerce portal', 'Then put the listing number in assets/config.js → business.docListingNo. It shows in the footer and on invoices.') +
            item(!!(b.pan && b.registrationNo), 'Business registration & PAN/VAT', 'Fill business.legalName, registrationNo and pan in assets/config.js.') +
            item(!!b.complaintOfficer.name, 'Appoint a complaint officer', 'Fill business.complaintOfficer in assets/config.js.') +
            item(!!C.payments.paymentApiBase, 'Payments: Khalti, eSewa, Fonepay, ConnectIPS, cards', 'Get merchant accounts, deploy the /server folder with your keys, then set payments.paymentApiBase. Until then checkout runs in test mode.') +
            item(C.shipping.couriers.domestic.every(function (c) { return c.apiKey; }), 'Courier accounts (Nepal Can Move, Pathao)', 'Open business accounts and replace the illustrative shipping rates in config.js with your contracted rates.') +
            item(!!(C.database.supabaseUrl && C.database.supabaseAnonKey), 'Shared database', 'Right now each visitor\'s data stays in their own browser. Create a Supabase project, run db/schema.sql, and add the URL and key.') +
            item(!/KalaGhar@2026/.test(typeof ADMIN_CREDS !== 'undefined' ? ADMIN_CREDS.password : ''), 'Change the admin password', 'The admin login is written in index.html where anyone can read it. Move admin login to the database (Supabase Auth) before launch.') +
            item(!KG.sellers().some(function (s) { return s.sample; }), 'Replace sample artisans and products', 'Edit or remove the sample shops in Artisans and add real photos to listings marked "Photo coming soon".') +
            '</ul></div><div class="space-y-4"><div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p class="font-bold text-sm">Festival storefront</p><p class="text-xs text-gray-500 mt-1">Showing now: <strong>' + esc(fest ? fest.name : 'none') + '</strong></p><label class="sr-only" for="fest-sel">Festival</label><select id="fest-sel" class="' + ui.input + ' mt-2"><option value="">Automatic (by date)</option><option value="none">Hide</option>' + C.festivals.map(function (f) { return '<option value="' + f.id + '"' + (KG.store.get('kg-festival-override', '') === f.id ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('') + '</select></div>' +
            '<div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p class="font-bold text-sm">Test data</p><p class="text-xs text-gray-500 mt-1">Clear test orders, reviews and messages from this browser.</p><button id="clr" class="' + ui.btn2 + ' !text-xs mt-2">Clear test data</button></div></div></div>';
        el.querySelector('#fest-sel').value = KG.store.get('kg-festival-override', '');
        el.querySelector('#fest-sel').addEventListener('change', function (e) { KG.store.set('kg-festival-override', e.target.value); KG.renderDiscover(); launch(el); });
        el.querySelector('#clr').addEventListener('click', function () {
            if (!confirm('Delete all orders, reviews, messages, complaints and analytics stored in this browser?')) return;
            ['kg-orders', 'kg-reviews', 'kg-threads', 'kg-complaints', 'kg-events', 'kg-promos', 'kg-bookings', 'kg-wholesale'].forEach(function (k) { localStorage.removeItem(k); });
            renderProducts(); KG.renderDiscover(); launch(el);
        });
    }

    const RENDER = { complaints: complaints, inquiries: inquiries, translations: translations, coupons: coupons, payouts: payouts, qr: qr, launch: launch };
    KG.initAdmin = function () { addTabs(); };
})();
