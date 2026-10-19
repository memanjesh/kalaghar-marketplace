/* =====================================================================
   KALAGHAR CORE — storage, helpers, products, accounts, currency, UI kit
   Loaded after the main inline script in index.html.
   ===================================================================== */
(function () {
    'use strict';
    const C = window.KG_CONFIG;
    const KG = window.KG = window.KG || {};
    KG.C = C;

    /* ---------------------------- helpers ---------------------------- */
    KG.esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };
    KG.uid = function (prefix) { return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
    KG.now = function () { return new Date().toISOString(); };
    KG.today = function () { return new Date().toISOString().slice(0, 10); };
    KG.fmtDate = function (iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); };
    KG.npr = function (n) { return 'NPR ' + Math.round(n || 0).toLocaleString('en-US'); };
    KG.lang = function () { return (typeof currentLang !== 'undefined' && currentLang) || 'en'; };
    KG.tx = function (en, ne) { return KG.lang() === 'ne' && ne ? ne : en; };

    /* ---------------------------- storage -----------------------------
       Browser storage for now. All reads/writes go through here so a
       shared database can replace it later without touching features. */
    KG.store = {
        get: function (key, fallback) {
            try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
            catch (e) { return fallback; }
        },
        set: function (key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); return true; }
            catch (e) { KG.toast(KG.tx('Storage is full — remove some photos and try again.', 'भण्डारण भरियो — केही फोटो हटाएर फेरि प्रयास गर्नुहोस्।'), 'error'); return false; }
        },
        push: function (key, item) { const a = KG.store.get(key, []); a.push(item); KG.store.set(key, a); return item; },
        update: function (key, id, patch) {
            const a = KG.store.get(key, []); const i = a.findIndex(function (x) { return x.id === id; });
            if (i > -1) { a[i] = Object.assign({}, a[i], typeof patch === 'function' ? patch(a[i]) : patch); KG.store.set(key, a); return a[i]; }
            return null;
        }
    };

    /* ---------------------------- analytics ---------------------------- */
    KG.track = function (type, productId) {
        const ev = KG.store.get('kg-events', []);
        ev.push({ t: type, p: productId, at: Date.now() });
        if (ev.length > 3000) ev.splice(0, ev.length - 3000);
        KG.store.set('kg-events', ev);
    };

    /* ---------------------------- SHA-256 ---------------------------- */
    KG.hash = async function (text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    };

    /* ---------------------------- UI kit ---------------------------- */
    const INPUT = 'w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded p-2.5 text-sm focus:border-red-700 focus:outline-none';
    KG.ui = {
        input: INPUT,
        label: 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1',
        btn: 'kg-btn text-white font-semibold py-2.5 px-4 rounded-xl transition text-sm',
        btn2: 'bg-white dark:bg-gray-900 text-red-800 dark:text-amber-300 border border-red-200 dark:border-gray-700 hover:border-red-700 dark:hover:border-amber-400 font-semibold py-2 px-4 rounded-xl transition text-sm',
        card: 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm',
        h2: 'text-2xl font-bold text-gray-900 dark:text-white',
        muted: 'text-xs text-gray-500 dark:text-gray-400'
    };

    // Generic modal. size: 'md' | 'lg' | 'xl' | 'full'
    KG.modal = function (id, title, bodyHtml, size) {
        KG.closeModal(id);
        const widths = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
        const wrap = document.createElement('div');
        wrap.id = id;
        wrap.className = 'kg-modal fixed inset-0 bg-black/60 z-[90] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto';
        wrap.innerHTML =
            '<div role="dialog" aria-modal="true" aria-label="' + KG.esc(title) + '" class="bg-white dark:bg-gray-900 rounded-2xl ' + (widths[size] || widths.md) + ' w-full shadow-2xl relative my-6 max-h-[calc(100vh-3rem)] overflow-y-auto">' +
                '<div class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-between gap-3">' +
                    '<h3 class="text-lg font-bold text-gray-900 dark:text-white truncate">' + title + '</h3>' +
                    '<button type="button" data-close class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1" aria-label="Close"><i class="fa-solid fa-xmark text-lg"></i></button>' +
                '</div>' +
                '<div class="p-5 kg-modal-body">' + bodyHtml + '</div>' +
            '</div>';
        wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('[data-close]')) KG.closeModal(id); });
        document.body.appendChild(wrap);
        document.body.style.overflow = 'hidden';
        return wrap.querySelector('.kg-modal-body');
    };
    KG.closeModal = function (id) {
        const m = document.getElementById(id);
        if (m) m.remove();
        if (!document.querySelector('.kg-modal')) document.body.style.overflow = '';
        if (location.hash && /^#(product|shop|collection|complaint)/.test(location.hash)) {
            history.replaceState(null, '', location.pathname + location.search);
        }
    };
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { const ms = document.querySelectorAll('.kg-modal'); if (ms.length) KG.closeModal(ms[ms.length - 1].id); }
    });

    KG.toast = function (msg, kind) {
        let box = document.getElementById('kgToasts');
        if (!box) { box = document.createElement('div'); box.id = 'kgToasts'; box.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] flex flex-col gap-2 items-center pointer-events-none'; document.body.appendChild(box); }
        const el = document.createElement('div');
        const color = kind === 'error' ? 'bg-red-700' : kind === 'warn' ? 'bg-amber-700' : 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900';
        el.className = color + ' text-white text-sm px-4 py-2.5 rounded-lg shadow-xl max-w-sm text-center';
        el.setAttribute('role', 'status');
        el.textContent = msg;
        box.appendChild(el);
        setTimeout(function () { el.remove(); }, 3500);
    };

    // Resize an uploaded image to keep storage small. Returns a data URL.
    KG.readImage = function (file, maxW) {
        return new Promise(function (resolve, reject) {
            const r = new FileReader();
            r.onload = function () {
                const img = new Image();
                img.onload = function () {
                    const w = Math.min(maxW || 900, img.width), h = Math.round(img.height * w / img.width);
                    const c = document.createElement('canvas'); c.width = w; c.height = h;
                    c.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(c.toDataURL('image/jpeg', 0.78));
                };
                img.onerror = reject; img.src = r.result;
            };
            r.onerror = reject; r.readAsDataURL(file);
        });
    };

    // Placeholder product art for categories without photos yet
    KG.placeholderImg = function (label, c1, c2, icon) {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
            '<pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#fff" fill-opacity=".18"/></pattern></defs>' +
            '<rect width="600" height="450" fill="url(#g)"/><rect width="600" height="450" fill="url(#p)"/>' +
            '<text x="300" y="215" text-anchor="middle" font-family="Georgia,serif" font-size="92" fill="#fff" fill-opacity=".9">' + icon + '</text>' +
            '<text x="300" y="300" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="30" letter-spacing="3" fill="#fff">' + label.toUpperCase() + '</text>' +
            '<text x="300" y="338" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#fff" fill-opacity=".75">Photo coming soon</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };

    /* ---------------------------- categories ---------------------------- */
    KG.CATEGORIES = [
        { id: 'pashmina',   en: 'Himalayan Pashmina & Wool', ne: 'हिमाली पश्मिना र ऊन', icon: 'fa-scarf' },
        { id: 'dhaka',      en: 'Palpali Dhaka',            ne: 'पाल्पाली ढाका' },
        { id: 'lokta',      en: 'Lokta Paper',              ne: 'लोक्ता कागज' },
        { id: 'metal',      en: 'Patan Statues',            ne: 'पाटनका मूर्ति' },
        { id: 'singingbowl',en: 'Singing Bowls',            ne: 'सिंगिङ बोल', isNew: true },
        { id: 'thangka',    en: 'Thangka & Paubha',         ne: 'थाङ्का र पौभा', isNew: true },
        { id: 'felt',       en: 'Felt Crafts',              ne: 'फेल्ट शिल्प', isNew: true },
        { id: 'tea',        en: 'Tea & Spices',             ne: 'चिया र मसला', isNew: true },
        { id: 'beads',      en: 'Beads, Pote & Jewelry',    ne: 'पोते, मोती र गहना', isNew: true },
        { id: 'wood',       en: 'Wood Carving',             ne: 'काष्ठकला', isNew: true },
        { id: 'rugs',       en: 'Rugs & Carpets',           ne: 'राडी र गलैंचा', isNew: true },
        { id: 'shoes',      en: 'Shoes',                    ne: 'जुत्ता' },
        { id: 'bags',       en: 'Bags',                     ne: 'झोला' },
        { id: 'homedecor',  en: 'Home Decor',               ne: 'घर सजावट' },
        { id: 'clothes',    en: 'Clothes',                  ne: 'लुगा' },
        { id: 'accessories',en: 'Accessories',              ne: 'सामग्री' }
    ];
    KG.CATEGORIES.forEach(function (category) {
        category.visible = category.visible !== false;
        if (!category.icon) category.icon = 'fa-border-all';
    });
    KG.visibleCategories = function () { return KG.CATEGORIES.filter(function (category) { return category.visible !== false; }); };
    KG.setCategories = function (categories) {
        if (!Array.isArray(categories) || !categories.length) return;
        KG.CATEGORIES.splice.apply(KG.CATEGORIES, [0, KG.CATEGORIES.length].concat(categories.map(function (category) {
            return { id: category.id, en: category.en, ne: category.ne || category.en, icon: category.icon || 'fa-border-all', visible: category.visible !== false };
        })));
        if (typeof KG.refreshCategoryUI === 'function') KG.refreshCategoryUI();
    };
    KG.catName = function (id) { const c = KG.CATEGORIES.find(function (x) { return x.id === id; }); return c ? KG.tx(c.en, c.ne) : id; };

    /* ---------------------------- regions ---------------------------- */
    KG.REGIONS = [
        { id: 'mustang',   en: 'Mustang',    ne: 'मुस्ताङ',   lon: 83.85, lat: 28.98, crafts: ['pashmina', 'rugs'], blurb: 'High-altitude Chyangra goats give the finest pashmina fibre.' },
        { id: 'palpa',     en: 'Palpa',      ne: 'पाल्पा',    lon: 83.54, lat: 27.87, crafts: ['dhaka', 'metal'], blurb: 'Home of the Dhaka loom and Tansen\'s copper and brass work.' },
        { id: 'baglung',   en: 'Baglung',    ne: 'बागलुङ',    lon: 83.59, lat: 28.27, crafts: ['lokta'], blurb: 'Lokta bark is harvested in the hills and pressed into handmade paper.' },
        { id: 'kathmandu', en: 'Kathmandu',  ne: 'काठमाडौं',  lon: 85.32, lat: 27.71, crafts: ['thangka', 'felt', 'singingbowl', 'beads'], blurb: 'Thangka ateliers, felt workshops and the bead bazaars of Indra Chowk.' },
        { id: 'patan',     en: 'Patan',      ne: 'पाटन',      lon: 85.32, lat: 27.67, crafts: ['metal', 'singingbowl'], blurb: 'Centuries of lost-wax bronze casting by Newar master craftsmen.' },
        { id: 'bhaktapur', en: 'Bhaktapur',  ne: 'भक्तपुर',   lon: 85.43, lat: 27.67, crafts: ['wood', 'homedecor'], blurb: 'Pottery Square and the famous carved windows of Newari wood art.' },
        { id: 'janakpur',  en: 'Janakpur',   ne: 'जनकपुर',    lon: 85.92, lat: 26.73, crafts: ['homedecor', 'thangka'], blurb: 'Mithila painting — bold folk art passed down by women of the Terai.' },
        { id: 'ilam',      en: 'Ilam',       ne: 'इलाम',      lon: 87.92, lat: 26.91, crafts: ['tea'], blurb: 'Rolling tea gardens producing orthodox Himalayan tea.' }
    ];
    KG.regionName = function (id) { const r = KG.REGIONS.find(function (x) { return x.id === id; }); return r ? KG.tx(r.en, r.ne) : (id || ''); };

    /* ---------------------------- sellers ----------------------------
       Sample seller profiles (sample data — replace with real artisans). */
    const DEFAULT_SELLERS = [
        { id: 's-sunita', shopName: 'Sunita Dhaka Weaves', owner: 'Sunita Shrestha', email: '', region: 'palpa', craft: 'dhaka', type: 'cooperative', verified: true, status: 'approved',
          story: 'A weaving circle of women in Tansen keeping the Palpali Dhaka loom alive, one geometric pattern at a time.',
          members: [{ name: 'Sunita Shrestha', share: 40 }, { name: 'Weaving circle members', share: 60 }], sample: true },
        { id: 's-purna', shopName: 'Purna Shakya Metal Arts', owner: 'Purna Shakya', email: '', region: 'patan', craft: 'metal', type: 'individual', verified: true, status: 'approved',
          story: 'Third-generation Newar sculptor using the lost-wax process — each statue takes weeks from wax model to final gilding.', members: [], sample: true },
        { id: 's-maya', shopName: 'Maya Mustang Pashmina', owner: 'Maya Gurung', email: '', region: 'mustang', craft: 'pashmina', type: 'individual', verified: false, status: 'pending',
          story: 'Hand-combing Chyangra fibre each spring and spinning it into soft pashmina at 14,000 ft.', members: [], sample: true },
        { id: 'kg', shopName: 'KalaGhar Curated', owner: 'KalaGhar Team', email: '', region: 'kathmandu', craft: 'homedecor', type: 'individual', verified: true, status: 'approved',
          story: 'Pieces sourced directly from partner workshops across Nepal while their makers set up their own shops.', members: [], sample: true }
    ];
    KG.sellers = function () {
        let s = KG.store.get('kg-sellers', null);
        if (!s) { s = DEFAULT_SELLERS; KG.store.set('kg-sellers', s); }
        return s;
    };
    KG.seller = function (id) { return KG.sellers().find(function (s) { return s.id === id; }); };
    KG.saveSeller = function (seller) {
        const all = KG.sellers(); const i = all.findIndex(function (s) { return s.id === seller.id; });
        if (i > -1) all[i] = seller; else all.push(seller);
        KG.store.set('kg-sellers', all);
    };

    /* ---------------------------- products ---------------------------- */
    const DETAILS = {
        1: { sellerId: 's-maya', region: 'mustang', materials: '100% Chyangra pashmina (Himalayan cashmere)', size: '200 × 70 cm', weightG: 180, badges: ['chyangra'], personalizable: true, care: 'Dry clean or gentle hand wash in cold water.', chyangraLicense: 'pending' },
        2: { sellerId: 's-sunita', region: 'palpa', materials: 'Cotton Dhaka weave', size: '180 × 50 cm', weightG: 120, personalizable: true, care: 'Hand wash cold, dry in shade.' },
        3: { sellerId: 'kg', region: 'baglung', materials: 'Handmade lokta bark paper, cotton thread binding', size: '21 × 15 cm, 120 pages', weightG: 260, care: 'Keep dry.' },
        4: { sellerId: 's-purna', region: 'patan', materials: 'Bronze, lost-wax cast, hand-finished', size: 'Height 20 cm', weightG: 1800, care: 'Wipe with a soft dry cloth.', fragile: true },
        5: { sellerId: 'kg', region: 'kathmandu', materials: 'Leather upper, rubber sole', size: 'EU 36–44', weightG: 700, personalizable: true },
        6: { sellerId: 'kg', region: 'kathmandu', materials: 'Himalayan hemp, cotton lining', size: '40 × 35 cm', weightG: 400 },
        7: { sellerId: 'kg', region: 'bhaktapur', materials: 'Hand-carved wood, natural paints', size: 'Diameter 25 cm', weightG: 600, fragile: true },
        8: { sellerId: 'kg', region: 'kathmandu', materials: 'Handwoven cotton', size: 'S / M / L / XL', weightG: 300, personalizable: true },
        9: { sellerId: 'kg', region: 'kathmandu', materials: 'Glass beads (pote), brass clasp', size: 'Length 45 cm', weightG: 60 }
    };
    // Free stock photos from Pexels (pexels.com, free to use). Replace with the artisans' own photos when available.
    KG.photo = function (id) { return 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=600'; };
    const PHOTOS = {101: "11889669", 102: "11501256", 103: "7612424", 104: "33118330", 105: "10973354", 106: "4611339", 107: "6118896"};
    // Earlier versions used photos that didn't match their products — swap any saved copies
    const PHOTO_FIX = {"375880": "11733651", "2292919": "11404647", "261763": "34079281", "1050244": "18681553", "267320": "26925256", "2081199": "8356401", "4207794": "6962803", "7691162": "8483487", "1191531": "29218624", "6158525": "6634555"};
    // New-category sample listings (ids 101+).
    const NEW_PRODUCTS = [
        { id: 101, name: 'Hand-hammered Singing Bowl', sub: '7-metal alloy, with cushion & striker', price: 6500, category: 'singingbowl', tag: 'PATAN', tagClass: 'bg-yellow-700', sellerId: 's-purna', region: 'patan', materials: 'Bell-metal alloy, hand-hammered', size: 'Diameter 15 cm', weightG: 900, img: ['Singing Bowl', '#78350f', '#b45309', '◎'] },
        { id: 102, name: 'Medicine Buddha Thangka', sub: 'Hand-painted, natural mineral pigments', price: 18000, category: 'thangka', tag: 'KATHMANDU', tagClass: 'bg-orange-700', sellerId: 'kg', region: 'kathmandu', materials: 'Cotton canvas, mineral pigments, 24k gold detailing', size: '50 × 35 cm (painting)', weightG: 300, fragile: true, img: ['Thangka', '#7c2d12', '#1e3a8a', '☸'] },
        { id: 103, name: 'Felt Ball Garland', sub: 'Hand-felted New Zealand wool', price: 1400, category: 'felt', tag: 'FELT', tagClass: 'bg-rose-600', sellerId: 'kg', region: 'kathmandu', materials: '100% wool felt', size: '2 m garland, 30 balls', weightG: 150, personalizable: true, img: ['Felt Craft', '#be123c', '#f59e0b', '●'] },
        { id: 104, name: 'Ilam Orthodox Black Tea', sub: 'First flush, loose leaf, 100 g', price: 950, category: 'tea', tag: 'ILAM', tagClass: 'bg-green-700', sellerId: 'kg', region: 'ilam', materials: 'Orthodox black tea leaves', size: '100 g tin', weightG: 160, expiry: '18 months from packing', img: ['Ilam Tea', '#14532d', '#65a30d', '❦'] },
        { id: 105, name: 'Traditional Pote Mala', sub: 'Glass bead necklace with gold-plated tilhari', price: 3200, category: 'beads', tag: 'POTE', tagClass: 'bg-emerald-700', sellerId: 'kg', region: 'kathmandu', materials: 'Glass beads, gold-plated brass', size: 'Length 60 cm', weightG: 80, img: ['Pote & Beads', '#065f46', '#ca8a04', '◈'] },
        { id: 106, name: 'Carved Peacock Window Panel', sub: 'Newari sal-wood carving', price: 22000, category: 'wood', tag: 'BHAKTAPUR', tagClass: 'bg-amber-900', sellerId: 'kg', region: 'bhaktapur', materials: 'Seasoned sal wood', size: '45 × 30 cm', weightG: 2500, fragile: true, img: ['Wood Carving', '#451a03', '#92400e', '❖'] },
        { id: 107, name: 'Tibetan-knot Wool Rug', sub: 'Hand-knotted, 100 knots per inch', price: 28000, category: 'rugs', tag: 'HAND-KNOTTED', tagClass: 'bg-indigo-800', sellerId: 'kg', region: 'kathmandu', materials: 'Himalayan highland wool, vegetable dyes', size: '120 × 180 cm', weightG: 6000, personalizable: true, img: ['Rug & Carpet', '#312e81', '#9f1239', '▦'] }
    ].map(function (p) {
        p.image = KG.photo(PHOTOS[p.id]); delete p.img; return p;
    });

    function normalize(p) {
        const d = DETAILS[p.id] || {};
        const out = Object.assign({
            sellerId: 'kg', region: 'kathmandu', materials: '', size: '', weightG: 500, origin: 'Nepal',
            badges: [], personalizable: false, care: '', images: [], stock: 10, active: true,
            nameNe: '', descNe: '', description: ''
        }, d, p);
        if (!out.images || !out.images.length) out.images = [out.image];
        if (out.image !== out.images[0]) out.images = [out.image].concat(out.images.filter(function (x) { return x !== out.image; }));
        return out;
    }

    // Replace the original loader so every feature sees full product details
    window.loadProducts = function () {
        let list = KG.store.get('kg-products', null);
        if (!list) list = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        if (!KG.store.get('kg-migr-photos2', false)) {
            list.forEach(function (p) {
                const fix = function (src) { const m = /photos\/(\d+)\//.exec(src || ''); return m && PHOTO_FIX[m[1]] ? KG.photo(PHOTO_FIX[m[1]]) : src; };
                if (PHOTOS[p.id] && (p.placeholder || /^data:image\/svg/.test(p.image || ''))) { p.image = KG.photo(PHOTOS[p.id]); p.images = [p.image]; p.placeholder = false; }
                p.image = fix(p.image); if (p.images) p.images = p.images.map(fix);
            });
            KG.store.set('kg-migr-photos2', true);
            if (KG.store.get('kg-products', null)) KG.store.set('kg-products', list);
        }
        if (!KG.store.get('kg-migr-newcats', false)) {
            NEW_PRODUCTS.forEach(function (np) { if (!list.some(function (p) { return p.id === np.id; })) list.push(np); });
            KG.store.set('kg-products', list);
            KG.store.set('kg-migr-newcats', true);
        }
        return list.map(normalize);
    };
    window.saveProducts = function (list) { KG.store.set('kg-products', list); };
    KG.products = function () { return window.loadProducts().filter(function (p) { return p.active !== false; }); };
    KG.product = function (id) { return window.loadProducts().find(function (p) { return p.id == id; }); };
    KG.saveProduct = function (prod) {
        const raw = KG.store.get('kg-products', null) || window.loadProducts();
        const i = raw.findIndex(function (p) { return p.id == prod.id; });
        if (i > -1) raw[i] = prod; else raw.push(prod);
        KG.store.set('kg-products', raw);
    };
    KG.nextProductId = function () { const all = window.loadProducts(); return all.length ? Math.max.apply(null, all.map(function (p) { return +p.id || 0; })) + 1 : 1; };

    /* ---------------------------- reviews ---------------------------- */
    KG.reviews = function (productId) { return KG.store.get('kg-reviews', []).filter(function (r) { return productId == null || r.productId == productId; }); };
    KG.rating = function (productId) {
        const r = KG.reviews(productId); if (!r.length) return { avg: 0, count: 0 };
        return { avg: r.reduce(function (s, x) { return s + x.rating; }, 0) / r.length, count: r.length };
    };
    KG.stars = function (avg, size) {
        let h = '';
        for (let i = 1; i <= 5; i++) h += '<i class="fa-' + (avg >= i - 0.25 ? 'solid fa-star' : avg >= i - 0.75 ? 'solid fa-star-half-stroke' : 'regular fa-star') + ' text-amber-500 ' + (size || 'text-xs') + '"></i>';
        return h;
    };

    /* ---------------------------- badges ---------------------------- */
    KG.badgesFor = function (p) {
        const out = [];
        const s = KG.seller(p.sellerId);
        if (p.category === 'pashmina' && (p.chyangraLicense === 'verified' || (s && s.chyangraCert && s.chyangraCert.status === 'verified'))) out.push({ id: 'chyangra', en: 'Chyangra Pashmina Verified', ne: 'च्याङ्ग्रा पश्मिना प्रमाणित', icon: 'fa-certificate', cls: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800' });
        if (s && s.verified) out.push({ id: 'verified', en: 'Verified Artisan', ne: 'प्रमाणित शिल्पी', icon: 'fa-circle-check', cls: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800' });
        if (s && KG.isStarSeller(s.id)) out.push({ id: 'star', en: 'Star Artisan', ne: 'स्टार शिल्पी', icon: 'fa-star', cls: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800' });
        return out;
    };
    KG.badgeHtml = function (b, small) {
        return '<span class="inline-flex items-center gap-1 border rounded-full ' + (small ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5') + ' font-semibold ' + b.cls + '"><i class="fa-solid ' + b.icon + '"></i>' + KG.esc(KG.tx(b.en, b.ne)) + '</span>';
    };
    // Star Artisan: 5+ completed orders, average rating 4.5+, every shipped order dispatched within 3 days, replies to messages.
    KG.isStarSeller = function (sellerId) {
        const orders = KG.store.get('kg-orders', []).filter(function (o) { return o.items.some(function (i) { return i.sellerId === sellerId; }); });
        const done = orders.filter(function (o) { return o.status === 'completed' || o.status === 'delivered'; });
        if (done.length < 5) return false;
        const prods = KG.products().filter(function (p) { return p.sellerId === sellerId; }).map(function (p) { return p.id; });
        const rv = KG.store.get('kg-reviews', []).filter(function (r) { return prods.indexOf(r.productId) > -1; });
        if (!rv.length) return false;
        const avg = rv.reduce(function (s, r) { return s + r.rating; }, 0) / rv.length;
        const slow = orders.some(function (o) { return o.shippedAt && (new Date(o.shippedAt) - new Date(o.createdAt)) > 3 * 864e5; });
        return avg >= 4.5 && !slow;
    };

    /* ---------------------------- currency ---------------------------- */
    KG.rates = Object.assign({}, C.currency.fallbackRates);
    KG.cur = KG.store.get('kg-currency', 'NPR');
    const SYMBOLS = { NPR: 'NPR ', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', INR: '₹', JPY: '¥' };
    KG.fx = function (npr, code) {
        code = code || KG.cur; const v = (npr || 0) * (KG.rates[code] || 0);
        if (code === 'NPR') return KG.npr(npr);
        return SYMBOLS[code] + (code === 'JPY' ? Math.round(v).toLocaleString() : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };
    KG.priceHtml = function (npr, cls) {
        let h = '<span class="' + (cls || 'text-sm font-bold text-red-700 dark:text-red-400') + '">' + KG.npr(npr) + '</span>';
        if (KG.cur !== 'NPR') h += ' <span class="text-[11px] text-gray-500 dark:text-gray-400">≈ ' + KG.fx(npr) + '</span>';
        return h;
    };
    KG.loadRates = function () {
        const cached = KG.store.get('kg-rates', null);
        if (cached && Date.now() - cached.at < 12 * 3600e3) { Object.assign(KG.rates, cached.rates); return; }
        fetch(C.currency.liveRatesUrl).then(function (r) { return r.json(); }).then(function (j) {
            if (j && j.rates) {
                Object.keys(SYMBOLS).forEach(function (k) { if (j.rates[k]) KG.rates[k] = j.rates[k]; });
                KG.store.set('kg-rates', { at: Date.now(), rates: KG.rates });
                if (KG.cur !== 'NPR' && window.renderProducts) renderProducts();
            }
        }).catch(function () { /* keep fallback rates */ });
    };
    KG.setCurrency = function (code) {
        KG.cur = code; KG.store.set('kg-currency', code);
        renderProducts();
        document.dispatchEvent(new CustomEvent('kg:currency'));
    };

    /* ---------------------------- accounts ---------------------------- */
    KG.session = function () { return KG.store.get('kg-session', null); };
    KG.user = function () { const s = KG.session(); if (!s) return null; return KG.store.get('kg-users', []).find(function (u) { return u.id === s.userId; }) || null; };
    KG.mySeller = function () { const u = KG.user(); return u ? KG.sellers().find(function (s) { return s.userId === u.id; }) : null; };

    KG.signup = async function (name, email, password, asSeller) {
        email = email.trim().toLowerCase();
        const users = KG.store.get('kg-users', []);
        if (users.some(function (u) { return u.email === email; })) throw new Error(KG.tx('An account with this email already exists.', 'यो इमेलको खाता पहिले नै छ।'));
        const user = { id: KG.uid('u-'), name: name.trim(), email: email, pass: await KG.hash(email + '|' + password), role: asSeller ? 'seller' : 'buyer', createdAt: KG.now() };
        users.push(user); KG.store.set('kg-users', users);
        if (asSeller) {
            let s = KG.sellers().find(function (x) { return x.email && x.email.toLowerCase() === email && !x.userId; });
            if (s) { s.userId = user.id; }
            else s = { id: KG.uid('s-'), userId: user.id, shopName: name.trim() + "'s Shop", owner: name.trim(), email: email, region: 'kathmandu', craft: 'homedecor', type: 'individual', verified: false, status: 'pending', story: '', members: [], createdAt: KG.now() };
            KG.saveSeller(s);
        }
        KG.store.set('kg-session', { userId: user.id, at: KG.now() });
        return user;
    };
    KG.login = async function (email, password) {
        email = email.trim().toLowerCase();
        const u = KG.store.get('kg-users', []).find(function (x) { return x.email === email; });
        if (!u || u.pass !== await KG.hash(email + '|' + password)) throw new Error(KG.tx('Email or password is incorrect.', 'इमेल वा पासवर्ड मिलेन।'));
        KG.store.set('kg-session', { userId: u.id, at: KG.now() });
        return u;
    };
    KG.logout = function () { localStorage.removeItem('kg-session'); KG.refreshAccountLabel(); KG.toast(KG.tx('Signed out', 'साइन आउट भयो')); };
    KG.refreshAccountLabel = function () {
        const label = document.getElementById('userStatusLabel'); const u = KG.user();
        if (!label) return;
        if (u) { label.removeAttribute('data-i18n'); label.textContent = u.name.split(' ')[0]; }
        else { label.dataset.i18n = 'signIn'; label.textContent = t('signIn'); }
    };
    KG.requireLogin = function (then) {
        if (KG.user()) { then && then(); return true; }
        KG.afterLogin = then; openModal('customerAuthModal'); return false;
    };

    /* ---------------------------- translations ---------------------------- */
    Object.assign(I18N.en, {
        kgFavs: 'Favorites', kgBag: 'Your Bag', kgCheckout: 'Checkout', kgGiftMode: 'Gift Mode', kgCurrency: 'Currency',
        kgRegionsTitle: 'Shop by Region', kgRegionsSub: 'Every craft has a home. Tap a region to see what its makers create.',
        kgMakersTitle: 'Meet the Makers', kgMakersSub: 'Visit an artisan\'s shop, read their story and buy directly from them.',
        kgImpactTitle: 'Our Impact', kgWorkshopsTitle: 'Craft Experiences', kgWorkshopsSub: 'Learn from the makers themselves — book a hands-on workshop in Nepal.',
        kgWholesaleTitle: 'Wholesale & Bulk Orders', kgWholesaleSub: 'For shops, hotels, yoga studios and corporate gifting abroad.',
        kgDiasporaTitle: 'Send a gift home to Nepal', kgDiasporaSub: 'Living abroad? Pay by card and we deliver to your family anywhere in Nepal — with a gift message.',
        kgComplaint: 'File a Complaint', fPrivacyPolicy: 'Privacy Policy', fReturns: 'Return & Refund Policy', fDelivery: 'Delivery Policy',
        fProtection: 'Purchase Protection', fExportHub: 'Export Hub for Artisans', fSellerDash: 'Seller Dashboard', fWholesale: 'Wholesale', fImpact: 'Our Impact', fWorkshops: 'Workshops',
        kgCategories: 'Categories', kgHomeFav: 'Home Favorites', kgFashion: 'Fashion Finds', ftShop: 'Shop', ftSell: 'Sell', ftAbout: 'About', ftHelp: 'Help', ftHandmade: '100% handmade in Nepal',
        ftFestival: 'Festival Gifts', ftSendHome: 'Send a Gift Home', ftSellOn: 'Sell on KalaGhar', ftSellerRules: 'Seller Policies', ftTrack: 'Track My Order'
    });
    Object.assign(I18N.ne, {
        kgFavs: 'मनपर्ने', kgBag: 'तपाईंको झोला', kgCheckout: 'चेकआउट', kgGiftMode: 'उपहार मोड', kgCurrency: 'मुद्रा',
        kgRegionsTitle: 'क्षेत्र अनुसार किनमेल', kgRegionsSub: 'हरेक शिल्पको आफ्नै घर छ। क्षेत्र छान्नुहोस् र त्यहाँका शिल्पीको काम हेर्नुहोस्।',
        kgMakersTitle: 'शिल्पीहरूलाई भेट्नुहोस्', kgMakersSub: 'शिल्पीको पसल हेर्नुहोस्, उनीहरूको कथा पढ्नुहोस् र सिधै किन्नुहोस्।',
        kgImpactTitle: 'हाम्रो प्रभाव', kgWorkshopsTitle: 'शिल्प अनुभव', kgWorkshopsSub: 'शिल्पीहरूसँगै सिक्नुहोस् — नेपालमा व्यावहारिक कार्यशाला बुक गर्नुहोस्।',
        kgWholesaleTitle: 'थोक तथा ठूला अर्डर', kgWholesaleSub: 'विदेशका पसल, होटल, योग स्टुडियो र कर्पोरेट उपहारका लागि।',
        kgDiasporaTitle: 'नेपालमा घर उपहार पठाउनुहोस्', kgDiasporaSub: 'विदेशमा हुनुहुन्छ? कार्डबाट तिर्नुहोस्, हामी नेपालभर तपाईंको परिवारसम्म उपहार सन्देशसहित पुर्‍याउँछौं।',
        kgComplaint: 'गुनासो दर्ता', fPrivacyPolicy: 'गोपनीयता नीति', fReturns: 'फिर्ता तथा रकम फिर्ता नीति', fDelivery: 'डेलिभरी नीति',
        fProtection: 'खरिद सुरक्षा', fExportHub: 'शिल्पीका लागि निर्यात केन्द्र', fSellerDash: 'विक्रेता ड्यासबोर्ड', fWholesale: 'थोक', fImpact: 'हाम्रो प्रभाव', fWorkshops: 'कार्यशाला',
        kgCategories: 'वर्गहरू', kgHomeFav: 'घरका मनपर्ने', kgFashion: 'फेसन', ftShop: 'किनमेल', ftSell: 'बिक्री', ftAbout: 'हाम्रोबारे', ftHelp: 'सहायता', ftHandmade: '१००% नेपालमा हातले बनेको',
        ftFestival: 'चाडपर्व उपहार', ftSendHome: 'घरमा उपहार पठाउनुहोस्', ftSellOn: 'KalaGhar मा बेच्नुहोस्', ftSellerRules: 'विक्रेता नीति', ftTrack: 'मेरो अर्डर ट्र्याक'
    });
    KG.CATEGORIES.forEach(function (c) {
        const key = 'kgCat_' + c.id; I18N.en[key] = c.en; I18N.ne[key] = c.ne;
    });

    KG.loadRates();
})();
