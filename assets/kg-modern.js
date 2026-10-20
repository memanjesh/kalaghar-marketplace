/* =====================================================================
   KALAGHAR SITE THEMES — "Classic" (the original site, default) and
   "Modern". Admin → Site theme picks the theme and tunes every Modern
   feature: fonts, calmer homepage, 2-column phone grid, motion, phone
   tab bar, scroll story, maker videos, Nepali patterns, illustrated map,
   customer photo wall and the dark gallery look.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const root = document.documentElement;
    const T = function () { return KG.setting('theme') || { active: 'classic', modern: {} }; };
    const M = function (k) { return (T().modern || {})[k]; };
    const isModern = function () { return T().active === 'modern'; };
    KG.isModernTheme = isModern;
    const FONT_URL = {
        fraunces: 'Fraunces:opsz,wght@9..144,500;9..144,600', playfair: 'Playfair+Display:wght@500;600', 'dm-serif': 'DM+Serif+Display', inter: 'Inter:wght@400;500;600;700;800',
        'dm-sans': 'DM+Sans:wght@400;500;600;700', manrope: 'Manrope:wght@400;500;600;700'
    };

    /* ---------------------------- apply theme ---------------------------- */
    function loadFonts(h, b) {
        const fams = [FONT_URL[h], FONT_URL[b]].filter(function (x, i, a) { return x && a.indexOf(x) === i; });
        const href = 'https://fonts.googleapis.com/css2?family=' + fams.join('&family=') + '&display=swap';
        let link = document.getElementById('kgModernFonts');
        if (!link) { link = document.createElement('link'); link.id = 'kgModernFonts'; link.rel = 'stylesheet'; document.head.appendChild(link); }
        if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    }
    function applyTheme() {
        const on = isModern(), m = T().modern || {};
        root.classList.toggle('kg-modern', on);
        const flags = { 'kg-m-fonts': m.fonts, 'kg-m-grid': m.phoneGrid, 'kg-m-motion': m.motion, 'kg-m-tabbar': m.tabBar, 'kg-m-patterns': m.patterns, 'kg-m-map': m.map };
        Object.keys(flags).forEach(function (c) { root.classList.toggle(c, on && !!flags[c]); });
        root.dataset.mh = m.headingFont || 'fraunces'; root.dataset.mb = m.bodyFont || 'inter'; root.dataset.mp = m.patternStyle || 'dhaka';
        if (on && m.fonts) loadFonts(m.headingFont, m.bodyFont);
        // Calmer homepage: hide the chosen sections in Modern only
        KG.HOME_SECTIONS.forEach(function (s) { const el = document.getElementById(s.key); if (el) el.classList.toggle('kg-calm-off', on && !!m.calmHome && (m.calmHidden || []).indexOf(s.key) > -1); });
        // Remember for the next page load so Modern appears without a flash
        try { localStorage.setItem('kg-theme-cache', JSON.stringify(on ? { a: 'modern', c: Object.keys(flags).filter(function (c) { return flags[c]; }), mh: m.headingFont, mb: m.bodyFont, mp: m.patternStyle } : { a: 'classic' })); } catch (e) { /* storage off */ }
        renderStory(); renderWall(); enhanceMap(); renderTabBar(); updateGallery(); setupReveal();
    }
    KG.applyTheme = applyTheme;

    /* ---------------------------- motion ---------------------------- */
    let io = null;
    function setupReveal() {
        if (!isModern() || !M('motion') || !('IntersectionObserver' in window)) { document.querySelectorAll('.kg-reveal').forEach(function (el) { el.classList.add('is-in'); }); return; }
        if (!io) io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
        document.querySelectorAll('body > section:not(#hero-slider) > *:not(.kg-reveal), #productGrid > .product-card:not(.kg-reveal)').forEach(function (el) {
            const r = el.getBoundingClientRect();
            el.classList.add('kg-reveal');
            if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in'); else io.observe(el);
        });
    }
    function flyToBag(id) {
        const bag = document.getElementById('cartCounter'); if (!bag) return;
        const target = (document.querySelector('.kg-tabbar [data-tab="bag"]') && getComputedStyle(document.querySelector('.kg-tabbar')).display !== 'none') ? document.querySelector('.kg-tabbar [data-tab="bag"]') : bag.parentNode;
        const src = document.querySelector('#kgProduct #kgMainImg') || document.querySelector('#productGrid .product-card[data-product-id="' + id + '"] img');
        if (!src) return;
        const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
        if (!a.width || a.bottom < 0 || a.top > window.innerHeight) { target.classList.add('kg-bag-bump'); setTimeout(function () { target.classList.remove('kg-bag-bump'); }, 600); return; }
        const img = document.createElement('img'); img.src = src.currentSrc || src.src; img.className = 'kg-fly'; img.alt = '';
        img.style.left = (a.left + a.width / 2 - 27) + 'px'; img.style.top = (a.top + a.height / 2 - 27) + 'px';
        document.body.appendChild(img);
        requestAnimationFrame(function () { requestAnimationFrame(function () {
            img.style.transform = 'translate(' + (b.left + b.width / 2 - (a.left + a.width / 2)) + 'px,' + (b.top + b.height / 2 - (a.top + a.height / 2)) + 'px) scale(.25)'; img.style.opacity = '.3';
        }); });
        setTimeout(function () { img.remove(); target.classList.add('kg-bag-bump'); setTimeout(function () { target.classList.remove('kg-bag-bump'); }, 600); }, 720);
    }

    /* ---------------------------- phone tab bar ---------------------------- */
    function renderTabBar() {
        let bar = document.getElementById('kgTabbar');
        if (!bar) {
            bar = document.createElement('nav'); bar.id = 'kgTabbar'; bar.className = 'kg-tabbar'; bar.setAttribute('aria-label', 'Main');
            document.body.appendChild(bar);
            bar.addEventListener('click', function (e) {
                const b = e.target.closest('button'); if (!b) return;
                const t = b.dataset.tab;
                if (t === 'home') { document.querySelectorAll('.kg-modal').forEach(function (m) { m.remove(); }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                if (t === 'search') { const box = document.getElementById('kgMobileSearch'), inp = document.getElementById('kgMobileSearchInput'); if (box) { box.classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); if (inp) setTimeout(function () { inp.focus(); }, 250); } }
                if (t === 'saved') KG.openFavorites();
                if (t === 'bag') KG.openCart();
                if (t === 'you') { if (KG.user()) KG.openAccount(); else if (window.openModal) window.openModal('customerAuthModal'); }
            });
            const counter = document.getElementById('cartCounter');
            if (counter && 'MutationObserver' in window) new MutationObserver(updateTabCount).observe(counter, { childList: true, characterData: true, subtree: true });
        }
        const items = [['home', 'fa-house', KG.tx('Home', 'गृह')], ['search', 'fa-magnifying-glass', KG.tx('Search', 'खोज')], ['saved', 'fa-heart', KG.tx('Saved', 'मनपर्ने')], ['bag', 'fa-bag-shopping', KG.tx('Bag', 'झोला')], ['you', 'fa-user', KG.tx('You', 'तपाईं')]];
        bar.innerHTML = items.map(function (x) { return '<button type="button" data-tab="' + x[0] + '"' + (x[0] === 'home' ? ' class="is-on"' : '') + '><i class="fa-' + (x[0] === 'saved' || x[0] === 'you' ? 'regular' : 'solid') + ' ' + x[1] + '" aria-hidden="true"></i>' + esc(x[2]) + '</button>'; }).join('');
        updateTabCount();
    }
    function updateTabCount() {
        const b = document.querySelector('#kgTabbar [data-tab="bag"]'); if (!b) return;
        const n = +(document.getElementById('cartCounter') || {}).textContent || 0;
        let c = b.querySelector('.kg-tab-count');
        if (n > 0) { if (!c) { c = document.createElement('span'); c.className = 'kg-tab-count'; b.appendChild(c); } c.textContent = n; } else if (c) c.remove();
    }

    /* ---------------------------- scroll story ---------------------------- */
    let storyIO = null;
    function renderStory() {
        let sec = document.getElementById('kgStory');
        if (!sec) {
            sec = document.createElement('section'); sec.id = 'kgStory'; sec.className = 'kg-story'; sec.setAttribute('aria-label', 'Our story');
            const after = document.getElementById('popular-categories') || document.getElementById('marketplace'); if (!after) return; after.after(sec);
        }
        const steps = M('storySteps') || [];
        const on = isModern() && M('story') && steps.length;
        sec.classList.toggle('kg-home-empty', !on);
        if (!on) { sec.innerHTML = ''; return; }
        const key = JSON.stringify([steps, M('storyTitle'), M('storySub'), KG.lang()]);
        if (sec.dataset.key === key) return; sec.dataset.key = key;
        sec.innerHTML = '<div class="kg-story-head"><span class="kg-eyebrow font-bold uppercase tracking-widest">' + KG.tx('Our story', 'हाम्रो कथा') + '</span><h2 class="text-gray-900 dark:text-white mt-2">' + esc(M('storyTitle')) + '</h2>' + (M('storySub') ? '<p>' + esc(M('storySub')) + '</p>' : '') + '</div>' +
            '<div class="kg-story-wrap"><div class="kg-story-media">' + steps.map(function (s, i) { return s.image ? '<img src="' + esc(s.image) + '" alt="" loading="lazy" data-i="' + i + '"' + (i ? '' : ' class="is-on"') + '>' : ''; }).join('') +
                '<div class="kg-story-progress">' + steps.map(function (s, i) { return '<span' + (i ? '' : ' class="is-done"') + '></span>'; }).join('') + '</div></div>' +
            '<div class="kg-story-steps">' + steps.map(function (s, i) {
                return '<div class="kg-story-step' + (i ? '' : ' is-on') + '" data-i="' + i + '">' + (s.image ? '<img src="' + esc(s.image) + '" alt="" loading="lazy">' : '') + '<span class="kg-story-n">' + String(i + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0') + '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>';
            }).join('') + '</div></div>';
        if (!('IntersectionObserver' in window)) return;
        if (storyIO) storyIO.disconnect();
        storyIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return; const i = +e.target.dataset.i;
                sec.querySelectorAll('.kg-story-step').forEach(function (x) { x.classList.toggle('is-on', +x.dataset.i === i); });
                sec.querySelectorAll('.kg-story-media img').forEach(function (x) { x.classList.toggle('is-on', +x.dataset.i === i); });
                sec.querySelectorAll('.kg-story-progress span').forEach(function (x, j) { x.classList.toggle('is-done', j <= i); });
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        sec.querySelectorAll('.kg-story-step').forEach(function (s) { storyIO.observe(s); });
    }

    /* ---------------------------- customer photo wall ---------------------------- */
    function wallItems() {
        const list = (M('photos') || []).filter(function (x) { return x.visible; }).map(function (x) { return { image: x.image, caption: x.caption, name: x.name, productId: x.productId }; });
        if (M('includeReviewPhotos')) {
            const hidden = KG.store.get('kg-wall-hidden', []);
            KG.store.get('kg-reviews', []).filter(function (r) { return r.photo && r.rating >= 4 && hidden.indexOf(r.id) === -1; }).slice(-24).reverse().forEach(function (r) {
                list.push({ image: r.photo, caption: r.text, name: r.name, productId: r.productId });
            });
        }
        return list;
    }
    KG.wallItems = wallItems;
    function renderWall() {
        let sec = document.getElementById('kgPhotoWall');
        if (!sec) {
            sec = document.createElement('section'); sec.id = 'kgPhotoWall'; sec.className = 'kg-wall'; sec.setAttribute('aria-label', 'Customer photos');
            const after = document.getElementById('makers') || document.getElementById('marketplace'); if (!after) return; after.after(sec);
        }
        const items = isModern() && M('photoWall') ? wallItems() : [];
        sec.classList.toggle('kg-home-empty', !items.length);
        if (!items.length) { sec.innerHTML = ''; return; }
        sec.innerHTML = '<div class="max-w-7xl mx-auto px-4"><div class="text-center mb-8"><span class="kg-eyebrow font-bold uppercase tracking-widest">' + KG.tx('From our customers', 'ग्राहकबाट') + '</span><h2 class="text-gray-900 dark:text-white mt-2">' + esc(M('photoWallTitle')) + '</h2></div><div class="kg-wall-grid">' +
            items.map(function (x, i) {
                const p = x.productId ? KG.product(x.productId) : null;
                return '<button type="button" class="kg-wall-item" data-w="' + i + '"><img src="' + esc(x.image) + '" alt="' + esc(x.caption || 'Customer photo') + '" loading="lazy">' +
                    ((x.caption || x.name || p) ? '<span class="kg-wall-cap">' + (p ? '<strong>' + esc(p.name) + '</strong>' : '') + esc(x.caption ? '“' + x.caption.slice(0, 90) + (x.caption.length > 90 ? '…' : '') + '”' : '') + (x.name ? ' — ' + esc(x.name) : '') + '</span>' : '') + '</button>';
            }).join('') + '</div></div>';
        sec.querySelectorAll('[data-w]').forEach(function (b) { b.addEventListener('click', function () { const x = items[+b.dataset.w]; if (x.productId && KG.product(x.productId)) KG.openProduct(x.productId); }); });
        setupReveal();
    }

    /* ---------------------------- illustrated map ---------------------------- */
    function enhanceMap() {
        const svg = document.querySelector('#regions svg'); if (!svg) return;
        const on = isModern() && M('map');
        let defs = svg.querySelector('#kgMapDefs'), peaks = svg.querySelector('.kg-map-peaks');
        if (!on) { if (defs) defs.remove(); if (peaks) peaks.remove(); return; }
        const NS = 'http://www.w3.org/2000/svg';
        if (!defs) {
            defs = document.createElementNS(NS, 'defs'); defs.id = 'kgMapDefs';
            defs.innerHTML = '<linearGradient id="kgMapFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ece1"/><stop offset=".55" stop-color="#e9dcc7"/><stop offset="1" stop-color="#d8e4c4"/></linearGradient>';
            svg.insertBefore(defs, svg.firstChild);
        }
        if (!peaks) {
            // A row of stylised Himalayan peaks along the northern border
            peaks = document.createElementNS(NS, 'g'); peaks.setAttribute('class', 'kg-map-peaks'); peaks.setAttribute('aria-hidden', 'true');
            const tops = [[150, 70], [215, 52], [285, 78], [350, 96], [420, 112], [480, 128], [545, 150], [600, 140], [655, 150], [720, 146]];
            peaks.innerHTML = tops.map(function (t, i) { const w = 22 + (i % 3) * 6, h = 20 + (i % 2) * 10; return '<path d="M' + (t[0] - w) + ' ' + (t[1] + h) + ' L' + t[0] + ' ' + t[1] + ' L' + (t[0] + w) + ' ' + (t[1] + h) + ' Z"/><path d="M' + (t[0] - w * .35) + ' ' + (t[1] + h * .35) + ' L' + t[0] + ' ' + t[1] + ' L' + (t[0] + w * .35) + ' ' + (t[1] + h * .35) + '" fill="none"/>'; }).join('');
            const poly = svg.querySelector('polygon'); if (poly) poly.after(peaks); else svg.appendChild(peaks);
        }
    }

    /* ---------------------------- dark gallery look ---------------------------- */
    function galleryFor(cat) { const g = M('gallery'); return isModern() && (g === 'all' || (g === 'premium' && (M('galleryCategories') || []).indexOf(cat) > -1)); }
    function updateGallery() {
        const cat = typeof activeCategory === 'undefined' ? 'all' : activeCategory;
        root.classList.toggle('kg-gallery-on', isModern() && (M('gallery') === 'all' || (cat !== 'all' && galleryFor(cat))));
    }

    /* ---------------------------- maker videos ---------------------------- */
    function decorateProduct(id) {
        const m = document.getElementById('kgProduct'), p = KG.product(id); if (!m || !p) return;
        m.classList.toggle('kg-gallery-modal', galleryFor(p.category));
        const src = isModern() && M('makerVideos') ? (M('videos') || {})[p.id] : '';
        const zoom = m.querySelector('#kgZoom'); if (!src || !zoom || zoom.querySelector('.kg-mvideo')) return;
        const v = document.createElement('video');
        v.className = 'kg-mvideo'; v.src = src; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('aria-label', 'The maker at work');
        const tag = document.createElement('span'); tag.className = 'kg-mvideo-tag'; tag.innerHTML = '<i class="fa-solid fa-hands mr-1"></i>' + KG.tx('Maker at work', 'शिल्पी काम गर्दै');
        zoom.appendChild(v); zoom.appendChild(tag);
        const thumbs = m.querySelector('[data-thumb]') && m.querySelector('[data-thumb]').parentNode;
        const show = function (on) { v.hidden = !on; tag.hidden = !on; if (on) { const pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); };
        if (thumbs) {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'kg-thumb-video w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 border-red-700';
            b.innerHTML = '<img src="' + esc(p.image) + '" alt="" class="w-full h-full object-cover">'; b.setAttribute('aria-label', 'Play maker video');
            thumbs.insertBefore(b, thumbs.firstChild);
            b.addEventListener('click', function () { show(true); });
            thumbs.querySelectorAll('[data-thumb]').forEach(function (t) { t.addEventListener('click', function () { show(false); }); });
        }
        const pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    }

    /* ---------------------------- hooks ---------------------------- */
    function hook() {
        const op = KG.openProduct;
        KG.openProduct = function (id) { const r = op.apply(this, arguments); decorateProduct(id); return r; };
        const fav = KG.toggleFav;
        KG.toggleFav = function (id) {
            const r = fav.apply(this, arguments);
            if (isModern() && M('motion')) document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) { b.classList.remove('kg-pop'); void b.offsetWidth; b.classList.add('kg-pop'); });
            return r;
        };
        const add = KG.addToCart;
        KG.addToCart = function (id, qty, personalization, silent) {
            const before = KG.cart().reduce(function (s, l) { return s + l.qty; }, 0);
            const r = add.apply(this, arguments);
            const after = KG.cart().reduce(function (s, l) { return s + l.qty; }, 0);
            if (after > before && isModern() && M('motion') && !silent) flyToBag(id);
            return r;
        };
        const fc = window.filterCategory;
        if (fc) window.filterCategory = function () { const r = fc.apply(this, arguments); updateGallery(); return r; };
        const rp = window.renderProducts;
        if (rp) window.renderProducts = function () { const r = rp.apply(this, arguments); setupReveal(); return r; };
        const rd = KG.renderDiscover;
        if (rd) KG.renderDiscover = function () { const r = rd.apply(this, arguments); enhanceMap(); setupReveal(); return r; };
        const al = window.applyLang;
        if (al) window.applyLang = function () { const r = al.apply(this, arguments); renderTabBar(); renderStory(); renderWall(); return r; };
        const homeLayout = KG.applyHomeLayout;
        if (homeLayout) KG.applyHomeLayout = function () { const r = homeLayout.apply(this, arguments); KG.HOME_SECTIONS.forEach(function (s) { const el = document.getElementById(s.key); if (el) el.classList.toggle('kg-calm-off', isModern() && !!M('calmHome') && (M('calmHidden') || []).indexOf(s.key) > -1); }); return r; };
        // Review photos join the wall as soon as they're posted
        const set = KG.store.set;
        KG.store.set = function (k) { const r = set.apply(this, arguments); if (k === 'kg-reviews' && isModern()) setTimeout(renderWall, 0); return r; };
    }

    /* ---------------------------- admin ---------------------------- */
    async function uploadFile(file, folder, maxBytes, isImage) {
        const c = window.KG_CONTENT;
        if (!c || !c.isAuthenticated()) throw new Error('Sign in to Admin with your GitHub token to upload files.');
        if (file.size > maxBytes) throw new Error('That file is too large (max ' + Math.round(maxBytes / 1048576) + ' MB).');
        let data, ext;
        if (isImage) { const d = await KG.readImage(file, 1600); data = d.split(',')[1]; ext = 'jpg'; }
        else {
            ext = /webm$/i.test(file.type) || /\.webm$/i.test(file.name) ? 'webm' : 'mp4';
            data = await new Promise(function (res, rej) { const r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(file); });
        }
        const path = folder + '/' + Date.now().toString(36) + '.' + ext;
        await c.putFile(path, data, 'Upload ' + (isImage ? 'image' : 'video') + ' from admin', true);
        return path;
    }
    function upd(fn) { KG.updateSettings(function (s) { fn(s.theme.modern, s.theme); }); }
    function renderThemeAdmin(el) {
        const t = T(), m = t.modern, A = KG.adminField, active = t.active;
        const choice = function (key, title, desc, icon) {
            return '<button type="button" data-pick="' + key + '" class="kg-theme-pick ' + ui.card + ' p-5 text-left transition ' + (active === key ? 'ring-2 ring-red-700' : 'hover:shadow-md') + '"><div class="flex items-center justify-between"><span class="font-bold text-lg"><i class="fa-solid ' + icon + ' mr-2 text-red-700"></i>' + title + '</span>' + (active === key ? '<span class="text-[11px] font-bold uppercase tracking-wider text-green-700 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">In use</span>' : '<span class="text-xs font-semibold text-red-700">Use this</span>') + '</div><p class="' + ui.muted + ' mt-2">' + desc + '</p></button>';
        };
        const products = KG.products();
        const secLabel = function (k) { const s = KG.HOME_SECTIONS.find(function (x) { return x.key === k; }); return s ? s.label : k; };
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Site theme</h3><p class="' + ui.muted + ' mb-4">Pick how the whole site looks. Changes preview in your browser straight away; press <strong>Publish to all visitors</strong> when you\'re happy. Switching back to Classic is always one click — nothing is lost.</p>' +
            '<div class="grid md:grid-cols-2 gap-4 mb-6">' + choice('classic', 'Classic', 'The original KalaGhar look: festival red-to-amber, bold cards, everything on the homepage.', 'fa-store') + choice('modern', 'Modern', 'Calmer and more editorial: serif headings, warm off-white, borderless product photos, two products per row on phones, motion, a phone tab bar, a scroll story, maker videos, Nepali patterns and a photo wall.', 'fa-wand-magic-sparkles') + '</div>' +
            '<div class="' + (active === 'modern' ? '' : 'opacity-60') + '"><h4 class="font-bold mb-1">Modern theme settings</h4><p class="' + ui.muted + ' mb-3">' + (active === 'modern' ? 'Each part can be switched off on its own.' : 'You can set these up now; they take effect when Modern is in use.') + '</p>' +
            '<form id="th-form" class="grid lg:grid-cols-3 gap-4">' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Look</p>' + A.toggle('fonts', 'New fonts', m.fonts, 'Serif headings with a clean body font') +
                    A.select('headingFont', 'Heading font', m.headingFont, [['fraunces', 'Fraunces (warm serif)'], ['playfair', 'Playfair Display (elegant)'], ['dm-serif', 'DM Serif Display (bold)'], ['inter', 'Inter (no serif)']]) +
                    A.select('bodyFont', 'Body font', m.bodyFont, [['inter', 'Inter'], ['dm-sans', 'DM Sans'], ['manrope', 'Manrope']]) +
                    A.toggle('patterns', 'Nepali pattern dividers', m.patterns, 'Small woven border between sections') +
                    A.select('patternStyle', 'Pattern', m.patternStyle, [['dhaka', 'Dhaka weave (diamonds)'], ['mithila', 'Mithila art (waves)'], ['lokta', 'Lokta paper (fibres)']]) + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Feel</p>' + A.toggle('phoneGrid', 'Two products per row on phones', m.phoneGrid) + A.toggle('motion', 'Motion', m.motion, 'Fade-in on scroll, heart pop, photo flies into the bag') + A.toggle('tabBar', 'Phone tab bar', m.tabBar, 'Home · Search · Saved · Bag · You at the bottom of phones') + A.toggle('map', 'Illustrated region map', m.map, 'Mountains and pulsing pins on the Shop by Region map') + A.toggle('makerVideos', 'Maker videos on product pages', m.makerVideos) + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Dark gallery look</p>' + A.select('gallery', 'Use the dark museum-style look for', m.gallery, [['off', 'Nothing (keep it light)'], ['premium', 'Premium crafts only'], ['all', 'The whole catalog']]) +
                    '<div><p class="' + ui.label + '">Premium crafts</p><div class="grid grid-cols-2 gap-1">' + KG.CATEGORIES.map(function (c) { return '<label class="flex items-center gap-1.5 text-xs"><input type="checkbox" data-gcat="' + esc(c.id) + '"' + (m.galleryCategories.indexOf(c.id) > -1 ? ' checked' : '') + '> ' + esc(c.en) + '</label>'; }).join('') + '</div></div></div>' +
            '</form>' +
            '<div class="grid lg:grid-cols-2 gap-4 mt-4"><div class="' + ui.card + ' p-4"><label class="kg-switch"><input type="checkbox" id="th-calm"' + (m.calmHome ? ' checked' : '') + '><span class="kg-switch-ui"></span><span><strong class="block text-sm">Calmer homepage</strong><span class="' + ui.muted + '">In Modern, also hide the sections ticked below (Classic is not affected). Order and names still come from the Homepage tab.</span></span></label>' +
                '<div class="grid sm:grid-cols-2 gap-1 mt-3">' + KG.HOME_SECTIONS.map(function (s) { return '<label class="flex items-center gap-1.5 text-xs"><input type="checkbox" data-calm="' + s.key + '"' + (m.calmHidden.indexOf(s.key) > -1 ? ' checked' : '') + '> Hide ' + esc(s.label) + '</label>'; }).join('') + '</div></div>' +
            '<div class="' + ui.card + ' p-4"><label class="kg-switch"><input type="checkbox" id="th-story"' + (m.story ? ' checked' : '') + '><span class="kg-switch-ui"></span><span><strong class="block text-sm">Scroll story</strong><span class="' + ui.muted + '">Pictures change as shoppers scroll through each step. Move it on the Homepage tab ("' + esc(secLabel('kgStory')) + '").</span></span></label>' +
                '<div class="grid gap-2 mt-3"><input id="th-stitle" value="' + esc(m.storyTitle) + '" maxlength="80" class="' + ui.input + '" aria-label="Story title"><input id="th-ssub" value="' + esc(m.storySub) + '" maxlength="200" class="' + ui.input + '" aria-label="Story subtitle"></div>' +
                '<div id="th-steps" class="space-y-2 mt-3">' + m.storySteps.map(function (s, i) {
                    return '<details class="border border-gray-200 dark:border-gray-800 rounded-xl p-2"><summary class="text-sm font-semibold cursor-pointer">' + (i + 1) + '. ' + esc(s.title || 'Untitled') + '</summary><div class="grid gap-2 mt-2" data-step="' + i + '">' +
                        '<input data-k="title" value="' + esc(s.title) + '" maxlength="80" class="' + ui.input + '" aria-label="Step title"><textarea data-k="text" rows="3" maxlength="300" class="' + ui.input + '" aria-label="Step text">' + esc(s.text) + '</textarea>' +
                        '<div class="flex gap-2 items-center">' + (s.image ? '<img src="' + esc(s.image) + '" alt="" class="w-14 h-14 rounded-lg object-cover">' : '') + '<input data-k="image" value="' + esc(s.image) + '" placeholder="https://… or upload" class="' + ui.input + '" aria-label="Step image"><label class="' + ui.btn2 + ' !py-1.5 !text-xs cursor-pointer shrink-0">Upload<input type="file" accept="image/*" data-up="' + i + '" class="hidden"></label></div>' +
                        '<div class="flex gap-3 text-xs"><button type="button" data-mv="' + i + '" data-d="-1">↑ Up</button><button type="button" data-mv="' + i + '" data-d="1">↓ Down</button><button type="button" data-del="' + i + '" class="text-red-700 ml-auto">Delete step</button></div></div></details>';
                }).join('') + '</div><button type="button" id="th-addstep" class="' + ui.btn2 + ' !py-1.5 !text-xs mt-2">+ Add step</button></div></div>' +
            '<div class="' + ui.card + ' p-4 mt-4"><div class="flex flex-wrap items-center gap-3 justify-between"><div><p class="font-bold text-sm">Maker videos</p><p class="' + ui.muted + '">A short silent clip (10–20 s, MP4 or WebM, under 15 MB) of the artisan at work. It plays first on the product page. Paste a link or upload.</p></div><input id="th-vq" type="search" placeholder="Search products" class="' + ui.input + ' !w-52 !py-1.5" aria-label="Search products"></div>' +
                '<div class="overflow-x-auto mt-3 max-h-80"><table class="w-full text-sm min-w-[560px]"><tbody id="th-vrows">' + products.map(function (p) {
                    const v = m.videos[p.id] || '';
                    return '<tr class="border-t border-gray-100 dark:border-gray-800" data-name="' + esc(p.name.toLowerCase()) + '"><td class="p-2 w-12"><img src="' + esc(p.image) + '" alt="" class="w-10 h-10 rounded object-cover"></td><td class="p-2">' + esc(p.name) + (v ? ' <span class="text-[11px] text-green-700 font-semibold">● video</span>' : '') + '</td><td class="p-2"><input data-vid="' + p.id + '" value="' + esc(v) + '" placeholder="https://…/clip.mp4" class="' + ui.input + ' !py-1"></td><td class="p-2 w-20"><label class="' + ui.btn2 + ' !py-1 !text-xs cursor-pointer">Upload<input type="file" accept="video/mp4,video/webm" data-vup="' + p.id + '" class="hidden"></label></td></tr>';
                }).join('') + '</tbody></table></div></div>' +
            '<div class="' + ui.card + ' p-4 mt-4"><div class="flex flex-wrap gap-4 items-start justify-between"><label class="kg-switch"><input type="checkbox" id="th-wall"' + (m.photoWall ? ' checked' : '') + '><span class="kg-switch-ui"></span><span><strong class="block text-sm">Customer photo wall</strong><span class="' + ui.muted + '">A Pinterest-style wall of real customer photos. Only post photos customers agreed to share.</span></span></label>' +
                '<label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" id="th-wallrev"' + (m.includeReviewPhotos ? ' checked' : '') + '> Also show 4–5★ review photos automatically</label></div>' +
                '<input id="th-walltitle" value="' + esc(m.photoWallTitle) + '" maxlength="80" class="' + ui.input + ' mt-3" aria-label="Photo wall title">' +
                '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">' + m.photos.map(function (x, i) {
                    return '<div class="border border-gray-200 dark:border-gray-800 rounded-xl p-2 space-y-1.5" data-ph="' + i + '"><img src="' + esc(x.image) + '" alt="" class="w-full h-28 object-cover rounded-lg' + (x.visible ? '' : ' opacity-40') + '"><input data-k="caption" value="' + esc(x.caption) + '" placeholder="Caption" maxlength="140" class="' + ui.input + ' !py-1 !text-xs"><input data-k="name" value="' + esc(x.name) + '" placeholder="Customer first name" maxlength="60" class="' + ui.input + ' !py-1 !text-xs">' +
                        '<select data-k="productId" class="' + ui.input + ' !py-1 !text-xs"><option value="">No product link</option>' + products.map(function (p) { return '<option value="' + p.id + '"' + (x.productId === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select>' +
                        '<div class="flex justify-between text-xs"><label class="flex items-center gap-1"><input type="checkbox" data-k="visible"' + (x.visible ? ' checked' : '') + '> Show</label><button type="button" data-phdel="' + i + '" class="text-red-700">Delete</button></div></div>';
                }).join('') + '</div>' +
                '<div class="flex flex-wrap gap-2 mt-3"><input id="th-phurl" placeholder="Photo link https://…" class="' + ui.input + ' !w-72 !py-1.5"><button type="button" id="th-phadd" class="' + ui.btn2 + ' !py-1.5 !text-xs">Add link</button><label class="' + ui.btn + ' !py-1.5 !text-xs cursor-pointer">Upload photo<input type="file" accept="image/*" id="th-phup" class="hidden"></label></div>' +
                (KG.store.get('kg-reviews', []).some(function (r) { return r.photo; }) ? '<details class="mt-3"><summary class="text-xs font-semibold cursor-pointer">Review photos (' + KG.store.get('kg-reviews', []).filter(function (r) { return r.photo; }).length + ')</summary><div class="flex flex-wrap gap-2 mt-2">' + KG.store.get('kg-reviews', []).filter(function (r) { return r.photo; }).map(function (r) { const hid = KG.store.get('kg-wall-hidden', []).indexOf(r.id) > -1; return '<label class="text-[11px] text-center"><img src="' + esc(r.photo) + '" alt="" class="w-16 h-16 rounded object-cover' + (hid ? ' opacity-40' : '') + '"><input type="checkbox" data-rvh="' + esc(r.id) + '"' + (hid ? '' : ' checked') + '> show</label>'; }).join('') + '</div></details>' : '') +
            '</div></div>';

        const rerender = function () { renderThemeAdmin(el); };
        el.querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { KG.updateSettings(function (s) { s.theme.active = b.dataset.pick; }); rerender(); KG.toast(b.dataset.pick === 'modern' ? 'Previewing Modern — close Admin to look around, then publish.' : 'Back to Classic (preview).'); }); });
        el.querySelector('#th-form').addEventListener('change', function (e) {
            const f = e.target;
            if (f.dataset.gcat) { upd(function (m) { m.galleryCategories = m.galleryCategories.filter(function (x) { return x !== f.dataset.gcat; }).concat(f.checked ? [f.dataset.gcat] : []); }); return rerender(); }
            if (!f.name) return;
            upd(function (m) { m[f.name] = f.type === 'checkbox' ? f.checked : f.value; }); rerender();
        });
        el.querySelector('#th-calm').addEventListener('change', function (e) { upd(function (m) { m.calmHome = e.target.checked; }); });
        el.querySelectorAll('[data-calm]').forEach(function (c) { c.addEventListener('change', function () { upd(function (m) { m.calmHidden = m.calmHidden.filter(function (k) { return k !== c.dataset.calm; }).concat(c.checked ? [c.dataset.calm] : []); }); }); });
        el.querySelector('#th-story').addEventListener('change', function (e) { upd(function (m) { m.story = e.target.checked; }); });
        el.querySelector('#th-stitle').addEventListener('change', function (e) { upd(function (m) { m.storyTitle = e.target.value; }); });
        el.querySelector('#th-ssub').addEventListener('change', function (e) { upd(function (m) { m.storySub = e.target.value; }); });
        el.querySelectorAll('[data-step] [data-k]').forEach(function (f) { f.addEventListener('change', function () { const i = +f.closest('[data-step]').dataset.step; upd(function (m) { m.storySteps[i][f.dataset.k] = f.value; }); if (f.dataset.k === 'image') rerender(); }); });
        el.querySelectorAll('[data-up]').forEach(function (f) { f.addEventListener('change', async function () { const i = +f.dataset.up; try { KG.toast('Uploading…'); const path = await uploadFile(f.files[0], 'images/story', 8 * 1048576, true); upd(function (m) { m.storySteps[i].image = path; }); rerender(); KG.toast('Image uploaded. Publish to make it live.'); } catch (err) { KG.toast(err.message, 'error'); } }); });
        el.querySelectorAll('[data-mv]').forEach(function (b) { b.addEventListener('click', function () { const i = +b.dataset.mv, j = i + +b.dataset.d; upd(function (m) { if (j < 0 || j >= m.storySteps.length) return; const x = m.storySteps.splice(i, 1)[0]; m.storySteps.splice(j, 0, x); }); rerender(); }); });
        el.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { if (!confirm('Delete this step?')) return; upd(function (m) { m.storySteps.splice(+b.dataset.del, 1); }); rerender(); }); });
        el.querySelector('#th-addstep').addEventListener('click', function () { upd(function (m) { if (m.storySteps.length < 8) m.storySteps.push({ title: 'New step', text: 'Describe this part of the journey.', image: '' }); }); rerender(); });
        el.querySelector('#th-vq').addEventListener('input', function (e) { const q = e.target.value.toLowerCase(); el.querySelectorAll('#th-vrows tr').forEach(function (r) { r.hidden = q && r.dataset.name.indexOf(q) === -1; }); });
        el.querySelectorAll('[data-vid]').forEach(function (f) { f.addEventListener('change', function () { const v = f.value.trim(); upd(function (m) { if (v) m.videos[f.dataset.vid] = v; else delete m.videos[f.dataset.vid]; }); if (v && !(M('videos') || {})[f.dataset.vid]) KG.toast('That link wasn\'t accepted — use an https link ending in .mp4 or .webm.', 'warn'); rerender(); }); });
        el.querySelectorAll('[data-vup]').forEach(function (f) { f.addEventListener('change', async function () { try { KG.toast('Uploading video…'); const path = await uploadFile(f.files[0], 'videos', 15 * 1048576, false); upd(function (m) { m.videos[f.dataset.vup] = path; }); rerender(); KG.toast('Video uploaded. Publish to make it live.'); } catch (err) { KG.toast(err.message, 'error'); } }); });
        el.querySelector('#th-wall').addEventListener('change', function (e) { upd(function (m) { m.photoWall = e.target.checked; }); });
        el.querySelector('#th-wallrev').addEventListener('change', function (e) { upd(function (m) { m.includeReviewPhotos = e.target.checked; }); });
        el.querySelector('#th-walltitle').addEventListener('change', function (e) { upd(function (m) { m.photoWallTitle = e.target.value; }); });
        el.querySelectorAll('[data-ph] [data-k]').forEach(function (f) { f.addEventListener('change', function () { const i = +f.closest('[data-ph]').dataset.ph, k = f.dataset.k; upd(function (m) { m.photos[i][k] = k === 'visible' ? f.checked : k === 'productId' ? (f.value ? +f.value : null) : f.value; }); if (k === 'visible') rerender(); }); });
        el.querySelectorAll('[data-phdel]').forEach(function (b) { b.addEventListener('click', function () { if (!confirm('Remove this photo from the wall?')) return; upd(function (m) { m.photos.splice(+b.dataset.phdel, 1); }); rerender(); }); });
        const addPhoto = function (image) { upd(function (m) { m.photos.unshift({ id: 'ph-' + Date.now().toString(36), image: image, caption: '', name: '', productId: null, visible: true }); }); rerender(); };
        el.querySelector('#th-phadd').addEventListener('click', function () { const v = el.querySelector('#th-phurl').value.trim(); if (!/^https:\/\//.test(v)) return KG.toast('Use an https:// photo link.', 'warn'); addPhoto(v); });
        el.querySelector('#th-phup').addEventListener('change', async function (e) { try { KG.toast('Uploading…'); addPhoto(await uploadFile(e.target.files[0], 'images/wall', 8 * 1048576, true)); KG.toast('Photo uploaded. Publish to make it live.'); } catch (err) { KG.toast(err.message, 'error'); } });
        el.querySelectorAll('[data-rvh]').forEach(function (c) { c.addEventListener('change', function () { const h = KG.store.get('kg-wall-hidden', []).filter(function (x) { return x !== c.dataset.rvh; }); if (!c.checked) h.push(c.dataset.rvh); KG.store.set('kg-wall-hidden', h); renderWall(); rerender(); }); });
    }

    KG.addAdminTab('site-theme', 'Site theme', renderThemeAdmin);
    KG.initModern = function () {
        hook();
        // Wait for the published settings (or an admin draft) so the theme never flickers on load
        if (KG.hasSettingsDraft() || KG.settingsLoaded) applyTheme();
        KG.onSettings(applyTheme);
    };
})();
