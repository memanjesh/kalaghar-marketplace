/* =====================================================================
   KALAGHAR LAYOUT — "Classic" (the site as it was, default) or "Clean"
   per area, chosen in Admin → Layout. Every Clean change is applied by
   adding a class / small helper, and fully undone when switched back.

   header   #1  one announcement at a time · #2 category tabs fade + More · #3 slimmer header on scroll
   home     #4  lighter festival strip · #5 8 categories + See all · #6 wholesale card · #10 makers + stories merged
   catalog  #7  8 products + Show more + Popular/New/Under-price tabs · #8 Filters button, sheet and chips
   cards    #11 slim product cards · #12 one badge style in one spot
   product  #13 product page tabs · #14 one row of small action icons · #15 gift wrap as one line
   checkout #16 three steps · #17 "Have a code?" link · #18 top 3 payments + More · #19 test notice for Admin only
   account  #20 tidy account tabs
   seller   #21 seller dashboard grouped (Shop · Orders · Money · Marketing · Settings)
   admin    #22 grouped Admin sidebar with search · #23 one "N unpublished changes" bar
   buttons  #24 three button styles
   darkmode #28 dark-mode fixes
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const root = document.documentElement;
    const L = function (k) { return KG.setting('layout.' + k); };
    const on = function (area) { return L(area) === 'clean'; };
    KG.layoutClean = on;

    /* ---------------------------- apply ---------------------------- */
    function apply() {
        (KG.LAYOUT_AREAS || []).forEach(function (a) { root.classList.toggle('kg-l-' + a, on(a)); });
        announcement(); catNav(); festival(); categories(); wholesale(); makersMerge(); catalogUI(); cardBadges(); adminSidebar();
        if (window.KG.applyAdvancedFilters) KG.applyAdvancedFilters();
    }

    /* =================== #1 one announcement at a time =================== */
    let annTimer = null;
    function announcement() {
        const track = document.getElementById('kgAnnouncementTrack'); if (!track) return;
        const bar = track.parentNode;
        let rot = bar.querySelector('.kg-ann-rot');
        clearInterval(annTimer);
        if (!on('header')) { if (rot) rot.remove(); return; }
        const seen = {}, items = Array.from(track.children).map(function (s) { return s.textContent.trim(); }).filter(function (t) { if (!t || seen[t]) return false; seen[t] = 1; return true; });
        if (!rot) { rot = document.createElement('div'); rot.className = 'kg-ann-rot'; rot.setAttribute('aria-live', 'polite'); bar.appendChild(rot); }
        let i = 0;
        const show = function () { if (!items.length) return; rot.classList.remove('is-in'); setTimeout(function () { rot.textContent = items[i % items.length]; rot.classList.add('is-in'); i++; }, 180); };
        show();
        if (items.length > 1) annTimer = setInterval(show, 4500);
    }

    /* =================== #2 category tabs: edge fade + More · #3 slimmer header =================== */
    function catNav() {
        const ul = document.getElementById('kgFeatured'); if (!ul) return;
        let more = document.getElementById('kgFeatMore');
        if (!on('header')) { if (more) more.remove(); root.classList.remove('kg-hdr-compact'); return; }
        if (!more) {
            more = document.createElement('li'); more.id = 'kgFeatMore';
            more.innerHTML = '<button type="button" class="kg-feat kg-feat-more"></button>';
            more.querySelector('button').addEventListener('click', function () { const b = document.getElementById('kgCatBtn'); if (b) { window.scrollTo({ top: 0, behavior: 'smooth' }); b.click(); } });
            ul.appendChild(more);
        }
        more.querySelector('button').innerHTML = KG.tx('More', 'थप') + ' <i class="fa-solid fa-chevron-right text-[10px]"></i>';
        onScroll();
    }
    // Shrink after scrolling down; grow back only after a clear scroll up (stops flicker as the header changes height)
    let compact = false, anchor = 0;
    function onScroll() {
        if (!on('header')) return;
        const y = window.scrollY || 0;
        if (y < 100) { compact = false; anchor = y; }
        else if (!compact) { if (y > 160 && y > anchor + 24) { compact = true; anchor = y; } else anchor = Math.min(anchor, y); }
        else { if (y < anchor - 80) { compact = false; anchor = y; } else anchor = Math.max(anchor, y); }
        root.classList.toggle('kg-hdr-compact', compact);
    }

    /* =================== #4 lighter festival strip =================== */
    function festival() { const f = document.getElementById('festival'); if (f) f.classList.toggle('kg-fest-light', on('home')); }

    /* =================== #5 eight categories + See all =================== */
    let catsOpen = false;
    function categories() {
        const host = document.getElementById('kgCategoryTiles'); if (!host) return;
        const tiles = Array.from(host.querySelectorAll('.kg-cattile'));
        let more = document.getElementById('kgCatMore');
        if (!on('home')) { tiles.forEach(function (t) { t.classList.remove('kg-cat-extra', 'kg-cat-lowcount'); t.style.order = ''; }); if (more) more.remove(); return; }
        const counts = {}; KG.products().forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
        const catOf = function (t) { const c = t.querySelector('.kg-catcount'); return c ? c.dataset.cat : ''; };
        const ranked = tiles.slice().sort(function (a, b) { return (counts[catOf(b)] || 0) - (counts[catOf(a)] || 0); });
        ranked.forEach(function (t, i) { t.style.order = i; t.classList.toggle('kg-cat-extra', i >= 8 && !catsOpen); t.classList.toggle('kg-cat-lowcount', (counts[catOf(t)] || 0) < 5); });
        if (tiles.length <= 8) { if (more) more.remove(); return; }
        if (!more) {
            more = document.createElement('div'); more.id = 'kgCatMore'; more.className = 'kg-cat-more';
            host.after(more);
            more.addEventListener('click', function (e) { if (!e.target.closest('button')) return; catsOpen = !catsOpen; categories(); });
        }
        more.innerHTML = '<button type="button">' + (catsOpen ? KG.tx('Show fewer', 'कम देखाउनुहोस्') : KG.tx('See all ' + tiles.length + ' categories', 'सबै ' + tiles.length + ' वर्ग हेर्नुहोस्')) + ' <i class="fa-solid fa-chevron-' + (catsOpen ? 'up' : 'down') + '"></i></button>';
    }

    /* =================== #6 wholesale as one card =================== */
    function wholesale() {
        const sec = document.getElementById('wholesale'); if (!sec) return;
        const form = sec.querySelector('#kgWholesaleForm'); if (!form) return;
        let btn = sec.querySelector('.kg-ws-open');
        sec.classList.toggle('kg-ws-compact', on('home'));
        if (!on('home')) { if (btn) btn.remove(); sec.classList.remove('kg-ws-is-open'); return; }
        if (!btn) {
            btn = document.createElement('button'); btn.type = 'button'; btn.className = ui.btn + ' kg-ws-open';
            form.before(btn);
            btn.addEventListener('click', function () { sec.classList.add('kg-ws-is-open'); const f = form.querySelector('input'); if (f) f.focus(); });
        }
        btn.innerHTML = '<i class="fa-solid fa-boxes-stacked mr-1"></i>' + KG.tx('Get a bulk quote', 'थोक कोटेसन लिनुहोस्');
    }

    /* =================== #10 makers + stories as one section =================== */
    function makersMerge() {
        const makers = document.getElementById('makers'), stories = document.getElementById('artisan-stories');
        if (!makers || !stories) return;
        const h = makers.querySelector('h2'); let quotes = makers.querySelector('.kg-maker-quotes');
        if (!on('home')) {
            stories.classList.remove('kg-merged-off'); if (quotes) quotes.remove();
            if (h && h.dataset.kgMergeOrig != null) { if (!h.dataset.kgRenamed) h.textContent = h.dataset.kgMergeOrig; delete h.dataset.kgMergeOrig; }
            return;
        }
        stories.classList.add('kg-merged-off');
        if (h && !h.dataset.kgRenamed) { if (h.dataset.kgMergeOrig == null) h.dataset.kgMergeOrig = h.textContent; h.textContent = KG.tx('The people behind your piece', 'तपाईंको वस्तुका पछाडिका मानिस'); }
        if (!quotes) {
            const cards = stories.querySelectorAll('.grid > div'); if (!cards.length) return;
            quotes = document.createElement('div'); quotes.className = 'kg-maker-quotes';
            quotes.innerHTML = '<p class="kg-maker-quotes-title">' + KG.tx('In their words', 'उनीहरूकै शब्दमा') + '</p><div class="kg-maker-quotes-row"></div>';
            cards.forEach(function (c) { quotes.lastChild.appendChild(c.cloneNode(true)); });
            (makers.querySelector('.max-w-7xl') || makers).appendChild(quotes);
        }
    }

    /* =================== #7 + #8 catalog: tabs, Show more, Filters sheet, chips =================== */
    let tab = 'all', limit = 0, sheetOpen = false;
    function stats() { return KG.productStats ? KG.productStats() : {}; }
    function catalogUI() {
        const grid = document.getElementById('productGrid'), form = document.getElementById('kgAdvancedFilters');
        if (!grid) return;
        let bar = document.getElementById('kgCatalogBar'), more = document.getElementById('kgShowMore');
        const cleanCat = on('catalog');
        if (!cleanCat) {
            [bar, more, document.getElementById('kgSheetBackdrop')].forEach(function (x) { if (x) x.remove(); });
            if (form) form.classList.remove('kg-filter-sheet', 'is-open');
            document.querySelectorAll('.kg-more-hidden,.kg-tab-hidden').forEach(function (c) { c.classList.remove('kg-more-hidden', 'kg-tab-hidden'); });
            tab = 'all'; limit = 0; return;
        }
        if (!limit) limit = L('perPage');
        if (form) form.classList.add('kg-filter-sheet');
        if (!bar) {
            bar = document.createElement('div'); bar.id = 'kgCatalogBar'; bar.className = 'kg-catalog-bar';
            (form || grid).before(bar);
            bar.addEventListener('click', function (e) {
                const t = e.target.closest('[data-ptab]'); if (t) { tab = t.dataset.ptab; limit = L('perPage'); KG.applyAdvancedFilters(); return; }
                if (e.target.closest('[data-open-filters]')) { toggleSheet(!sheetOpen); return; }
                const chip = e.target.closest('[data-chip]'); if (chip) clearChip(chip.dataset.chip);
            });
        }
        if (!more) {
            more = document.createElement('div'); more.id = 'kgShowMore'; more.className = 'kg-show-more'; grid.after(more);
            more.addEventListener('click', function (e) { if (e.target.closest('button')) { limit += L('perPage'); KG.applyAdvancedFilters(); } });
        }
        if (form && !form.querySelector('.kg-sheet-head')) {
            form.insertAdjacentHTML('afterbegin', '<div class="kg-sheet-head"><strong>' + KG.tx('Filters', 'फिल्टर') + '</strong><button type="button" data-close-sheet aria-label="Close">✕</button></div>');
            form.insertAdjacentHTML('beforeend', '<div class="kg-sheet-foot"><button type="button" data-clear-all class="kg-sheet-clear">' + KG.tx('Clear all', 'सबै हटाउनुहोस्') + '</button><button type="button" data-close-sheet class="' + ui.btn + ' kg-sheet-show"></button></div>');
            form.addEventListener('click', function (e) {
                if (e.target.closest('[data-close-sheet]')) toggleSheet(false);
                if (e.target.closest('[data-clear-all]')) { if (KG.clearAdvancedFilters) KG.clearAdvancedFilters(); }
            });
        }
    }
    function toggleSheet(open) {
        const form = document.getElementById('kgAdvancedFilters'); if (!form) return;
        sheetOpen = open; form.classList.toggle('is-open', open);
        let bd = document.getElementById('kgSheetBackdrop');
        if (open && !bd) { bd = document.createElement('div'); bd.id = 'kgSheetBackdrop'; bd.className = 'kg-sheet-backdrop'; document.body.appendChild(bd); bd.addEventListener('click', function () { toggleSheet(false); }); }
        if (bd) bd.classList.toggle('is-open', open);
        const b = document.querySelector('[data-open-filters]'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function chips() {
        const f = document.getElementById('kgAdvancedFilters'); if (!f) return [];
        const v = function (id) { const el = f.querySelector('#' + id); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; };
        const out = [];
        if (v('kgMinPrice')) out.push(['kgMinPrice', KG.tx('From NPR ', 'रु. ') + v('kgMinPrice')]);
        if (v('kgMaxPrice')) out.push(['kgMaxPrice', KG.tx('Up to NPR ', 'रु. ') + v('kgMaxPrice')]);
        if (+v('kgMinRating')) out.push(['kgMinRating', v('kgMinRating') + '★+']);
        if (v('kgVerifiedOnly')) out.push(['kgVerifiedOnly', KG.tx('Verified', 'प्रमाणित')]);
        if (v('kgCustomOnly')) out.push(['kgCustomOnly', KG.tx('Customizable', 'अनुकूलन')]);
        if (v('kgStockOnly')) out.push(['kgStockOnly', KG.tx('In stock', 'स्टकमा')]);
        if (v('kgShipsFrom')) out.push(['kgShipsFrom', KG.tx('Ships from ', '') + KG.regionName(v('kgShipsFrom'))]);
        return out;
    }
    function clearChip(id) {
        const el = document.getElementById(id); if (!el) return;
        if (el.type === 'checkbox') el.checked = false; else el.value = el.tagName === 'SELECT' && id === 'kgMinRating' ? '0' : '';
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function afterFilters() {
        if (!on('catalog')) return;
        const grid = document.getElementById('productGrid'), bar = document.getElementById('kgCatalogBar'), more = document.getElementById('kgShowMore');
        if (!grid || !bar) return;
        const cards = Array.from(grid.querySelectorAll('.product-card'));
        const st = stats(), score = function (p) { const s = st[p.id] || {}; return (s.sales30 || 0) * 5 + (s.carts7 || 0) * 2 + (s.views48 || 0); };
        const prod = function (c) { return KG.product(+c.dataset.productId) || {}; };
        cards.forEach(function (c) { c.classList.remove('kg-tab-hidden', 'kg-more-hidden'); });
        if (tab === 'popular') cards.slice().sort(function (a, b) { return score(prod(b)) - score(prod(a)); }).forEach(function (c) { grid.appendChild(c); });
        if (tab === 'new') cards.slice().sort(function (a, b) { return new Date(prod(b).createdAt || 0) - new Date(prod(a).createdAt || 0) || prod(b).id - prod(a).id; }).forEach(function (c) { grid.appendChild(c); });
        if (tab === 'under') cards.forEach(function (c) { if (prod(c).price > L('underPrice')) c.classList.add('kg-tab-hidden'); });
        const visible = Array.from(grid.querySelectorAll('.product-card')).filter(function (c) { return c.style.display !== 'none' && !c.classList.contains('kg-tab-hidden'); });
        visible.forEach(function (c, i) { if (i >= limit) c.classList.add('kg-more-hidden'); });
        const left = Math.max(0, visible.length - limit);
        more.innerHTML = left ? '<button type="button" class="' + ui.btn2 + '">' + KG.tx('Show more', 'थप हेर्नुहोस्') + ' <span class="kg-more-n">(' + left + ')</span></button><p>' + KG.tx('Showing ' + Math.min(limit, visible.length) + ' of ' + visible.length, visible.length + ' मध्ये ' + Math.min(limit, visible.length)) + '</p>' : (visible.length ? '' : '<p>' + KG.tx('Nothing matches — try another tab or clear filters.', 'केही भेटिएन — अर्को ट्याब वा फिल्टर हटाउनुहोस्।') + '</p>');
        const cs = chips();
        const tabs = [['all', KG.tx('All', 'सबै')], ['popular', KG.tx('Popular', 'लोकप्रिय')], ['new', KG.tx('New', 'नयाँ')], ['under', KG.tx('Under NPR ' + Number(L('underPrice')).toLocaleString(), 'रु. ' + L('underPrice') + ' भन्दा कम')]];
        bar.innerHTML = '<div class="kg-ptabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-ptab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '"' + (tab === t[0] ? ' class="is-on"' : '') + '>' + esc(t[1]) + '</button>'; }).join('') + '</div>' +
            '<div class="kg-filter-row"><button type="button" data-open-filters aria-expanded="' + sheetOpen + '" class="kg-filter-btn"><i class="fa-solid fa-sliders"></i> ' + KG.tx('Filters', 'फिल्टर') + (cs.length ? ' <span class="kg-filter-n">' + cs.length + '</span>' : '') + '</button>' +
            cs.map(function (c) { return '<button type="button" class="kg-chip" data-chip="' + c[0] + '" aria-label="Remove ' + esc(c[1]) + '">' + esc(c[1]) + ' <span aria-hidden="true">✕</span></button>'; }).join('') +
            '<span class="kg-result-n">' + visible.length + ' ' + KG.tx(visible.length === 1 ? 'item' : 'items', 'वस्तु') + '</span></div>';
        const show = document.querySelector('#kgAdvancedFilters .kg-sheet-show'); if (show) show.textContent = KG.tx('Show ' + visible.length + ' result' + (visible.length === 1 ? '' : 's'), visible.length + ' नतिजा हेर्नुहोस्');
    }

    /* =================== #11 + #12 slim cards, one badge =================== */
    function cardBadges() {
        const clean = on('cards');
        const st = KG.productStats ? KG.productStats() : null;
        document.querySelectorAll('#productGrid .product-card').forEach(function (card) {
            const old = card.querySelector('.kg-one-badge'); if (old) old.remove();
            if (!clean) return;
            const p = KG.product(+card.dataset.productId); if (!p) return;
            const media = card.querySelector('[data-fav]') && card.querySelector('[data-fav]').parentNode; if (!media) return;
            const sig = KG.popularityFor ? KG.popularityFor(p, st) : [];
            const pick = sig.find(function (s) { return s.id === 'lowStock'; }) || sig[0];
            const text = pick ? pick.text : (p.tag || '');
            if (!text) return;
            media.insertAdjacentHTML('beforeend', '<span class="kg-one-badge' + (pick ? ' is-signal' : '') + '">' + (pick ? '<i class="fa-solid ' + pick.icon + '"></i>' : '') + esc(text) + '</span>');
        });
    }

    /* =================== #13 product page tabs =================== */
    function productTabs() {
        if (!on('product')) return;
        const m = document.getElementById('kgProduct'); if (!m) return;
        const body = m.querySelector('.kg-modal-body') || m.querySelector('[role=dialog] > div:last-child'); if (!body || body.querySelector('.kg-ptab-bar')) return;
        productExtras(body);
        const passport = body.querySelector('.kg-passport');
        const details = Array.from(body.querySelectorAll('h4')).map(function (h) { return h.parentNode; }).find(function (d) { return d.querySelector('dl'); });
        const reviews = body.querySelector('#kgReviews'), qa = body.querySelector('#kgQA');
        const panels = [['details', KG.tx('Details', 'विवरण'), details], ['story', KG.tx('Maker\'s story', 'शिल्पीको कथा'), passport], ['reviews', KG.tx('Reviews', 'समीक्षा') + (reviews && /\((\d+)\)/.test(reviews.querySelector('h4').textContent) ? ' (' + RegExp.$1 + ')' : ''), reviews], ['qa', KG.tx('Questions', 'प्रश्न'), qa]].filter(function (x) { return x[2]; });
        if (panels.length < 2) return;
        const first = panels.map(function (x) { return x[2]; }).sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; })[0];
        const barEl = document.createElement('div'); barEl.className = 'kg-ptab-bar'; barEl.setAttribute('role', 'tablist');
        barEl.innerHTML = panels.map(function (x, i) { return '<button type="button" role="tab" data-tab-for="' + x[0] + '" aria-selected="' + (i === 0) + '"' + (i === 0 ? ' class="is-on"' : '') + '>' + esc(x[1]) + '</button>'; }).join('');
        const wrap = document.createElement('div'); wrap.className = 'kg-ptab-panels';
        first.before(barEl); barEl.after(wrap);
        panels.forEach(function (x, i) { x[2].classList.add('kg-ptab-panel'); x[2].dataset.panel = x[0]; x[2].hidden = i !== 0; wrap.appendChild(x[2]); });
        barEl.addEventListener('click', function (e) {
            const b = e.target.closest('[data-tab-for]'); if (!b) return;
            barEl.querySelectorAll('button').forEach(function (x) { const sel = x === b; x.classList.toggle('is-on', sel); x.setAttribute('aria-selected', sel); });
            wrap.querySelectorAll('.kg-ptab-panel').forEach(function (p) { p.hidden = p.dataset.panel !== b.dataset.tabFor; });
        });
        // "x reviews" link at the top opens the Reviews tab
        body.querySelectorAll('a[href="#kgReviews"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); const b = barEl.querySelector('[data-tab-for="reviews"]'); if (b) { b.click(); barEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }); });
    }

    // #14 secondary actions as one row of icons · #15 gift wrap as a single line
    function productExtras(body) {
        const acts = Array.from(body.querySelectorAll('button[onclick^="KG.openThread"]')).map(function (b) { return b.parentNode; })[0];
        if (acts && !acts.classList.contains('kg-p-actions')) {
            acts.classList.add('kg-p-actions');
            acts.querySelectorAll('button').forEach(function (b) { const txt = b.textContent.trim(); b.title = txt; const i = b.querySelector('i'); b.innerHTML = ''; if (i) b.appendChild(i); const sp = document.createElement('span'); sp.textContent = txt.replace(/^(Request a custom piece|Send as gift to Nepal|Message the maker)$/, function (m) { return { 'Request a custom piece': KG.tx('Custom', 'अनुकूलन'), 'Send as gift to Nepal': KG.tx('Gift to Nepal', 'नेपालमा उपहार'), 'Message the maker': KG.tx('Message', 'सन्देश') }[m]; }); b.appendChild(sp); });
        }
        const grid = body.querySelector('.kg-packaging-grid'), wrap = grid && grid.parentNode;
        if (wrap && !wrap.classList.contains('kg-wrap-line')) {
            wrap.classList.add('kg-wrap-line');
            const line = document.createElement('button'); line.type = 'button'; line.className = 'kg-wrap-toggle'; line.setAttribute('aria-expanded', 'false');
            const label = function () { const c = wrap.querySelector('input[name="kgPackaging"]:checked'); const name = c ? c.parentNode.querySelector('strong').textContent : ''; line.innerHTML = '<i class="fa-solid fa-gift"></i><span>' + KG.tx('Gift wrap: ', 'उपहार प्याकेजिङ: ') + '<strong>' + esc(name) + '</strong></span><em>' + KG.tx('Change', 'परिवर्तन') + ' <i class="fa-solid fa-chevron-down"></i></em>'; };
            label(); wrap.insertBefore(line, wrap.firstChild);
            line.addEventListener('click', function () { const open = !wrap.classList.contains('is-open'); wrap.classList.toggle('is-open', open); line.setAttribute('aria-expanded', open); });
            grid.addEventListener('change', function () { label(); wrap.classList.remove('is-open'); line.setAttribute('aria-expanded', 'false'); });
        }
    }

    /* =================== #16 three-step checkout =================== */
    function checkoutSteps() {
        if (!on('checkout')) return;
        const form = document.getElementById('kgCoForm'); if (!form || form.querySelector('.kg-co-progress')) return;
        checkoutExtras(form);
        const left = form.firstElementChild, aside = form.querySelector('aside');
        if (!left || !aside) return;
        const legendOf = function (fs) { const l = fs.querySelector('legend'); return l ? l.id || l.textContent : ''; };
        Array.from(left.children).forEach(function (el) {
            let step = 1;
            if (el.matches('fieldset') && (el.querySelector('input[name="fulfillment"]') || el.querySelector('#co-addr-legend') || el.querySelector('#co-couriers'))) step = 2;
            if (el.classList.contains('kg-saved-addr')) step = 2;
            if (el.matches('fieldset') && el.querySelector('#co-methods')) step = 3;
            if (el.classList.contains('kg-card-note')) step = 3;
            el.dataset.coStep = step; void legendOf;
        });
        const steps = [KG.tx('Contact', 'सम्पर्क'), KG.tx('Delivery', 'डेलिभरी'), KG.tx('Payment', 'भुक्तानी')];
        form.classList.add('kg-co-steps');
        form.insertAdjacentHTML('afterbegin', '<ol class="kg-co-progress lg:col-span-5">' + steps.map(function (s, i) { return '<li data-p="' + (i + 1) + '"><span>' + (i + 1) + '</span>' + esc(s) + '</li>'; }).join('') + '</ol>');
        left.insertAdjacentHTML('beforeend', '<div class="kg-co-nav" data-co-step="nav"><button type="button" data-co-back class="' + ui.btn2 + '">← ' + KG.tx('Back', 'पछाडि') + '</button><button type="button" data-co-next class="' + ui.btn + '">' + KG.tx('Continue', 'अगाडि बढ्नुहोस्') + ' →</button></div>');
        let cur = 1;
        const go = function (n) {
            cur = n; form.dataset.step = n;
            left.querySelectorAll('[data-co-step]').forEach(function (el) { if (el.dataset.coStep !== 'nav') el.classList.toggle('kg-co-off', +el.dataset.coStep !== n); });
            form.querySelectorAll('.kg-co-progress li').forEach(function (li) { const p = +li.dataset.p; li.classList.toggle('is-on', p === n); li.classList.toggle('is-done', p < n); });
            form.querySelector('[data-co-back]').hidden = n === 1; form.querySelector('[data-co-next]').hidden = n === 3;
            const dlg = form.closest('[role=dialog]'); if (dlg) dlg.scrollTop = 0;
        };
        // Newly inserted pieces (saved addresses, teaser) land in the right step
        new MutationObserver(function () { Array.from(left.children).forEach(function (el) { if (!el.dataset.coStep) { el.dataset.coStep = el.classList.contains('kg-saved-addr') ? 2 : 1; el.classList.toggle('kg-co-off', +el.dataset.coStep !== cur); } }); }).observe(left, { childList: true });
        const err = form.querySelector('#co-error');
        const check = function (n) {
            const need = n === 1 ? ['name', 'email', 'phone'].concat(form.gift && form.gift.checked ? ['rname', 'rphone'] : []) : n === 2 ? ['address', 'city', 'country'] : [];
            const miss = need.filter(function (k) { return form[k] && !form[k].value.trim(); });
            if (miss.length) { form[miss[0]].focus(); form[miss[0]].classList.add('kg-shake'); setTimeout(function () { form[miss[0]].classList.remove('kg-shake'); }, 400); KG.toast(KG.tx('Please fill in the highlighted field.', 'चिन्ह लगाइएको विवरण भर्नुहोस्।'), 'warn'); return false; }
            if (n === 1 && !/^\S+@\S+\.\S+$/.test(form.email.value)) { form.email.focus(); KG.toast(KG.tx('Please enter a valid email.', 'सही इमेल लेख्नुहोस्।'), 'warn'); return false; }
            return true;
        };
        form.addEventListener('click', function (e) {
            if (e.target.closest('[data-co-next]')) { if (check(cur)) go(cur + 1); }
            if (e.target.closest('[data-co-back]')) go(cur - 1);
            const li = e.target.closest('.kg-co-progress li'); if (li && +li.dataset.p < cur) go(+li.dataset.p);
        });
        // If the final check finds a missing field from an earlier step, jump back there
        form.addEventListener('submit', function () { setTimeout(function () { if (err && !err.classList.contains('hidden')) { for (let n = 1; n <= 2; n++) if (!check(n)) { go(n); break; } } }, 0); });
        go(1);
    }

    // #17 coupon behind a link · #18 three payment options + More · #19 test notice only for Admin
    function checkoutExtras(form) {
        const coupon = form.querySelector('#co-coupon'), row = coupon && coupon.parentNode;
        if (row && !row.classList.contains('kg-coupon-row')) {
            row.classList.add('kg-coupon-row');
            const link = document.createElement('button'); link.type = 'button'; link.className = 'kg-coupon-link'; link.textContent = KG.tx('Have a code?', 'कुपन कोड छ?');
            row.before(link);
            link.addEventListener('click', function () { row.classList.add('is-open'); link.hidden = true; coupon.focus(); });
        }
        const methods = form.querySelector('#co-methods');
        const fold = function () {
            if (!methods) return;
            const labels = Array.from(methods.querySelectorAll('label'));
            let btn = methods.parentNode.querySelector('.kg-pay-more');
            const checkedIdx = labels.findIndex(function (l) { return l.querySelector('input:checked'); });
            const expanded = methods.dataset.expanded === '1' || checkedIdx > 2;
            labels.forEach(function (l, i) { l.classList.toggle('kg-pay-extra', i > 2 && !expanded); });
            if (labels.length > 3 && !expanded) {
                if (!btn) { btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kg-pay-more'; methods.after(btn); btn.addEventListener('click', function () { methods.dataset.expanded = '1'; fold(); }); }
                btn.textContent = KG.tx('More payment options (' + (labels.length - 3) + ')', 'थप भुक्तानी विकल्प (' + (labels.length - 3) + ')');
                btn.hidden = false;
            } else if (btn) btn.hidden = true;
        };
        if (methods) { fold(); new MutationObserver(function () { clearTimeout(methods.t); methods.t = setTimeout(fold, 0); }).observe(methods, { childList: true }); }
        const dlg = form.closest('.kg-modal-body') || form.parentNode;
        const notice = dlg && Array.from(dlg.children).find(function (c) { return c !== form && c.classList.contains('bg-amber-50'); });
        const isAdmin = window.KG_CONTENT && KG_CONTENT.isAuthenticated && KG_CONTENT.isAuthenticated();
        if (notice && !isAdmin) notice.classList.add('kg-test-hidden');
    }

    /* =================== #21 seller dashboard grouped =================== */
    const SELLER_GROUPS = [['shop', 'Shop', 'दुकान', ['overview', 'listings']], ['orders', 'Orders', 'अर्डर', ['orders', 'custom', 'messages', 'questions']], ['money', 'Money', 'पैसा', ['earnings']], ['marketing', 'Marketing', 'प्रचार', ['marketing']], ['settings', 'Settings', 'सेटिङ', []]];
    function sellerGroups() {
        if (!on('seller')) return;
        const m = document.getElementById('kgSeller'); if (!m) return;
        const btns = Array.from(m.querySelectorAll('button[onclick^="KG.openSellerDashboard("]')); if (!btns.length) return;
        const bar = btns[0].parentNode; if (bar.classList.contains('kg-seller-sub')) return;
        const keyOf = function (b) { return ((b.getAttribute('onclick') || '').match(/'([^']+)'/) || [])[1]; };
        const groupOf = function (k) { const g = SELLER_GROUPS.find(function (x) { return x[3].indexOf(k) > -1; }); return g ? g[0] : 'settings'; };
        const active = btns.find(function (b) { return b.classList.contains('bg-red-700'); }) || btns[0];
        const cur = groupOf(keyOf(active));
        bar.classList.add('kg-seller-sub');
        btns.forEach(function (b) { b.hidden = groupOf(keyOf(b)) !== cur; });
        const top = document.createElement('div'); top.className = 'kg-seller-groups'; top.setAttribute('role', 'tablist');
        top.innerHTML = SELLER_GROUPS.filter(function (g) { return btns.some(function (b) { return groupOf(keyOf(b)) === g[0]; }); }).map(function (g) {
            const first = btns.find(function (b) { return groupOf(keyOf(b)) === g[0]; });
            const badge = btns.filter(function (b) { return groupOf(keyOf(b)) === g[0]; }).map(function (b) { return (b.textContent.match(/\((\d+)\)/) || [0, 0])[1] | 0; }).reduce(function (a, n) { return a + n; }, 0);
            return '<button type="button" role="tab" data-sg="' + keyOf(first) + '" aria-selected="' + (g[0] === cur) + '"' + (g[0] === cur ? ' class="is-on"' : '') + '>' + esc(KG.tx(g[1], g[2])) + (badge ? ' <span class="kg-sg-n">' + badge + '</span>' : '') + '</button>';
        }).join('');
        bar.before(top);
        top.addEventListener('click', function (e) { const b = e.target.closest('[data-sg]'); if (b) KG.openSellerDashboard(b.dataset.sg); });
    }

    /* =================== #20 tidy account tabs =================== */
    function accountTabs() {
        if (!on('account')) return;
        const m = document.getElementById('kgAccount'); if (!m) return;
        const bar = m.querySelector('.kg-modal-body > div'); if (!bar || bar.classList.contains('kg-acct-tabs')) return;
        bar.classList.add('kg-acct-tabs');
        const util = document.createElement('div'); util.className = 'kg-acct-util';
        Array.from(bar.children).forEach(function (b) {
            const oc = b.getAttribute('onclick') || '';
            if (/logout|openSellerDashboard|artisanModal/.test(oc)) util.appendChild(b);
        });
        bar.before(util);
    }

    /* =================== #22 grouped admin sidebar =================== */
    const GROUPS = [
        ['Store', ['overview', 'products', 'orders', 'artisans', 'inventory', 'customers', 'payouts', 'coupons']],
        ['Help & safety', ['support', 'tracking', 'complaints', 'inquiries', 'moderation', 'qa', 'alerts', 'vacations']],
        ['Design & content', ['layout', 'site-theme', 'footer', 'home-layout', 'hero-slider', 'content', 'site-content', 'categories', 'translations']],
        ['Shopping & delivery', ['shop-features', 'delivery', 'checkout-gifting', 'shopping-signals', 'shipping-labels', 'plus-launch', 'features', 'feature-requests']],
        ['Marketing', ['feeds', 'seo-pages', 'analytics', 'qr', 'qrcodes']],
        ['Settings', ['launch', 'staff', 'operations', 'audit']]
    ];
    let sideObs = null;
    function adminSidebar() {
        const view = document.getElementById('adminDashboardView'); if (!view) return;
        const tabBar = view.querySelector('.admin-tab') && view.querySelector('.admin-tab').parentNode;
        let side = document.getElementById('kgAdminSide');
        if (!on('admin')) { if (side) side.remove(); view.classList.remove('kg-admin-side'); if (sideObs) { sideObs.disconnect(); sideObs = null; } return; }
        if (!tabBar) return;
        view.classList.add('kg-admin-side');
        if (!side) {
            side = document.createElement('nav'); side.id = 'kgAdminSide'; side.className = 'kg-admin-nav'; side.setAttribute('aria-label', 'Admin sections');
            view.insertBefore(side, view.querySelector('main'));
            side.addEventListener('click', function (e) {
                const b = e.target.closest('[data-go]');
                if (b) { const t = tabBar.querySelector('.admin-tab[data-tab="' + b.dataset.go + '"]'); if (t) t.click(); side.classList.remove('is-open'); return; }
                if (e.target.closest('[data-side-toggle]')) side.classList.toggle('is-open');
                const pub = e.target.closest('[data-pub-all]');
                if (pub) { pub.disabled = true; pub.textContent = 'Publishing…'; KG.publishSettings().then(function () { KG.toast('Published. Visitors see it within a few minutes.'); adminSidebar(); const t = document.querySelector('.admin-tab.active'); if (t) t.click(); }).catch(function (err) { KG.toast(err.message, 'error'); adminSidebar(); }); }
                if (e.target.closest('[data-discard-all]') && confirm('Discard all unpublished setting changes?')) { KG.discardSettingsDraft(); const t = document.querySelector('.admin-tab.active'); if (t) t.click(); }
            });
            side.addEventListener('input', function (e) { if (e.target.matches('[data-side-q]')) filterSide(e.target.value); });
        }
        const tabs = Array.from(tabBar.querySelectorAll('.admin-tab')).map(function (b) { return { key: b.dataset.tab, label: b.textContent.trim(), active: b.classList.contains('active') }; });
        const used = {};
        const groups = GROUPS.map(function (g) { const items = tabs.filter(function (t) { return g[1].indexOf(t.key) > -1; }); items.forEach(function (t) { used[t.key] = 1; }); return [g[0], items]; });
        const rest = tabs.filter(function (t) { return !used[t.key]; }); if (rest.length) groups.push(['More', rest]);
        const q = (side.querySelector('[data-side-q]') || {}).value || '';
        const activeTab = tabs.find(function (t) { return t.active; });
        const n = KG.settingsChangeCount ? KG.settingsChangeCount() : 0;
        side.innerHTML = (n ? '<div class="kg-admin-changes"><span><strong>' + n + '</strong> unpublished change' + (n === 1 ? '' : 's') + '</span><button type="button" data-pub-all>Publish all</button><button type="button" data-discard-all class="kg-admin-discard">Discard</button></div>' : '<div class="kg-admin-changes is-clean"><i class="fa-solid fa-circle-check"></i> Everything is published</div>') +
            '<button type="button" class="kg-admin-nav-toggle" data-side-toggle><i class="fa-solid fa-bars"></i> ' + esc(activeTab ? activeTab.label : 'Menu') + ' <i class="fa-solid fa-chevron-down"></i></button>' +
            '<div class="kg-admin-nav-inner"><input data-side-q type="search" placeholder="Find a setting…" value="' + esc(q) + '" aria-label="Find a setting">' +
            groups.filter(function (g) { return g[1].length; }).map(function (g) { return '<div class="kg-admin-group"><p>' + esc(g[0]) + '</p>' + g[1].map(function (t) { return '<button type="button" data-go="' + esc(t.key) + '" data-label="' + esc(t.label.toLowerCase()) + '"' + (t.active ? ' class="is-on" aria-current="page"' : '') + '>' + esc(t.label) + '</button>'; }).join('') + '</div>'; }).join('') + '</div>';
        if (q) filterSide(q);
        if (!sideObs && 'MutationObserver' in window) {
            sideObs = new MutationObserver(function (muts) { if (muts.some(function (m) { return m.type === 'childList' || (m.target.classList && m.target.classList.contains('admin-tab')); })) { clearTimeout(sideObs.t); sideObs.t = setTimeout(adminSidebar, 30); } });
            sideObs.observe(tabBar, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }
    }
    function filterSide(q) {
        q = q.toLowerCase().trim();
        document.querySelectorAll('#kgAdminSide .kg-admin-group').forEach(function (g) {
            let any = false;
            g.querySelectorAll('[data-go]').forEach(function (b) { const hit = !q || b.dataset.label.indexOf(q) > -1 || b.dataset.go.indexOf(q) > -1; b.hidden = !hit; any = any || hit; });
            g.hidden = !any;
        });
    }

    /* ---------------------------- hooks ---------------------------- */
    function hook() {
        const aaf = KG.applyAdvancedFilters;
        if (aaf) KG.applyAdvancedFilters = function () { const r = aaf.apply(this, arguments); afterFilters(); return r; };
        const clear = KG.clearAdvancedFilters;
        if (clear) KG.clearAdvancedFilters = function () { tab = on('catalog') ? tab : 'all'; limit = L('perPage'); return clear.apply(this, arguments); };
        const form = document.getElementById('kgAdvancedFilters');
        if (form) form.addEventListener('input', function () { limit = L('perPage'); }, true);
        const rp = window.renderProducts;
        if (rp) window.renderProducts = function () { const r = rp.apply(this, arguments); cardBadges(); return r; };
        const op = KG.openProduct;
        KG.openProduct = function () { const r = op.apply(this, arguments); productTabs(); return r; };
        const oc = KG.openCheckout;
        KG.openCheckout = function () { const r = oc.apply(this, arguments); checkoutSteps(); return r; };
        const osd = KG.openSellerDashboard;
        if (osd) KG.openSellerDashboard = function () { const r = osd.apply(this, arguments); sellerGroups(); return r; };
        window.addEventListener('scroll', onScroll, { passive: true });
        const rf = KG.renderFeatured;
        if (rf) KG.renderFeatured = function () { const r = rf.apply(this, arguments); const m = document.getElementById('kgFeatMore'); if (m) m.remove(); catNav(); return r; };
        const oa = KG.openAccount;
        KG.openAccount = function () { const r = oa.apply(this, arguments); accountTabs(); return r; };
        const rd = KG.renderDiscover;
        if (rd) KG.renderDiscover = function () { const r = rd.apply(this, arguments); festival(); wholesale(); return r; };
        const al = window.applyLang;
        if (al) window.applyLang = function () { const r = al.apply(this, arguments); announcement(); categories(); wholesale(); if (KG.applyAdvancedFilters) KG.applyAdvancedFilters(); return r; };
        const track = document.getElementById('kgAnnouncementTrack');
        if (track && 'MutationObserver' in window) new MutationObserver(function () { clearTimeout(track.t); track.t = setTimeout(announcement, 50); }).observe(track, { childList: true });
        const host = document.getElementById('kgCategoryTiles');
        if (host && 'MutationObserver' in window) new MutationObserver(function (m) { if (m.some(function (x) { return x.type === 'childList'; })) { clearTimeout(host.t); host.t = setTimeout(categories, 30); } }).observe(host, { childList: true });
        const oap = window.openAdminPanel;
        if (oap) window.openAdminPanel = function () { const r = oap.apply(this, arguments); setTimeout(adminSidebar, 0); return r; };
        // Keyboard: Escape closes the filter sheet
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOpen) toggleSheet(false); });
    }

    /* ---------------------------- admin tab ---------------------------- */
    const AREAS = [
        ['header', 'Header', 'Announcement bar shows one message at a time · category tabs fade at the edge with a "More" tab · on phones the header slims down to logo, search and bag while you scroll.'],
        ['home', 'Homepage', 'Lighter festival strip · 8 most-stocked categories with "See all" (counts under 5 hidden) · wholesale as a single "Get a bulk quote" card · "Meet the makers" and "Stories behind the craft" merged into "The people behind your piece".'],
        ['catalog', 'Product catalog', 'Shows a set number of products at a time with "Show more" · tabs: All, Popular, New, Under a price · filters behind one "Filters" button (a slide-up sheet on phones) with removable chips.'],
        ['cards', 'Product cards', 'Photo, name, shop and price only, with one badge (Bestseller, Only N left… or the craft tag) in one spot.'],
        ['product', 'Product page', 'Tabs for Details · Maker\'s story · Reviews · Questions · Message/Custom/Share/Gift as one row of small icons · gift wrap as a single "Gift wrap: Heritage — Change" line.'],
        ['checkout', 'Checkout', 'Three steps — Contact → Delivery → Payment — with a progress bar · coupon box behind "Have a code?" · three payment options plus "More" · the yellow test-mode notice shows only when you\'re signed in to Admin.'],
        ['account', 'Customer account', 'Clean tab row; "Seller dashboard" and "Sign out" tucked in a small line above it.'],
        ['seller', 'Seller dashboard', 'Tabs grouped under Shop · Orders · Money · Marketing · Settings, with counts on each group.'],
        ['admin', 'Admin menu', 'A grouped sidebar (Store, Help & safety, Design & content, Shopping & delivery, Marketing, Settings) with a "Find a setting" search, and one "N unpublished changes — Publish all" bar at the top.'],
        ['buttons', 'Buttons', 'Three button styles everywhere: main (solid), secondary (outline), text link.'],
        ['nepali', 'Complete Nepali text', 'When shoppers choose नेपाली, menus, filters, banners, footer, gift wrap, checkout options and sign-in that were still English show in Nepali. Product names and sellers\' own words stay as written.'],
        ['darkmode', 'Dark mode fixes', 'Pieces that stayed light in dark mode (Craft Passport, gift wrap cards, festival and wholesale cards…) follow dark mode properly.']
    ];
    function renderLayoutAdmin(el) {
        const s = KG.setting('layout');
        const cleanCount = AREAS.filter(function (a) { return s[a[0]] === 'clean'; }).length;
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Layout</h3><p class="' + ui.muted + ' mb-4">Choose <strong>Classic</strong> (the site as it was) or <strong>Clean</strong> for each area. You see changes straight away in this browser; press <strong>Publish to all visitors</strong> when you\'re happy.</p>' +
            '<div class="flex flex-wrap gap-2 mb-4"><button type="button" data-all="clean" class="' + ui.btn + ' !py-1.5 !text-xs">Use Clean everywhere</button><button type="button" data-all="classic" class="' + ui.btn2 + ' !py-1.5 !text-xs"><i class="fa-solid fa-rotate-left mr-1"></i>Switch everything back to Classic</button><span class="text-xs text-gray-500 self-center">' + cleanCount + ' of ' + AREAS.length + ' areas use Clean</span></div>' +
            '<div class="space-y-2">' + AREAS.map(function (a) {
                const v = s[a[0]];
                return '<div class="' + ui.card + ' p-4 flex flex-wrap items-center gap-3"><div class="flex-1 min-w-[240px]"><p class="font-bold text-sm">' + a[1] + '</p><p class="' + ui.muted + '">' + a[2] + '</p></div>' +
                    '<div class="kg-seg" role="group" aria-label="' + a[1] + '"><button type="button" data-area="' + a[0] + '" data-v="classic" aria-pressed="' + (v === 'classic') + '"' + (v === 'classic' ? ' class="is-on"' : '') + '>Classic</button><button type="button" data-area="' + a[0] + '" data-v="clean" aria-pressed="' + (v === 'clean') + '"' + (v === 'clean' ? ' class="is-on"' : '') + '>Clean</button></div></div>';
            }).join('') + '</div>' +
            '<form id="ly-form" class="' + ui.card + ' p-4 mt-4 grid sm:grid-cols-2 gap-3"><p class="sm:col-span-2 font-bold text-sm">Catalog options (Clean)</p>' + KG.adminField.text('perPage', 'Products before "Show more"', s.perPage, 'type="number" min="4" max="48"') + KG.adminField.text('underPrice', '"Under NPR …" tab price', s.underPrice, 'type="number" min="100" step="100"') + '</form>';
        el.querySelectorAll('[data-area]').forEach(function (b) { b.addEventListener('click', function () { KG.updateSettings(function (x) { x.layout[b.dataset.area] = b.dataset.v; }); renderLayoutAdmin(el); }); });
        el.querySelectorAll('[data-all]').forEach(function (b) { b.addEventListener('click', function () { KG.updateSettings(function (x) { AREAS.forEach(function (a) { x.layout[a[0]] = b.dataset.all; }); }); renderLayoutAdmin(el); KG.toast(b.dataset.all === 'classic' ? 'Everything is back to Classic (preview). Publish to make it live.' : 'Clean layout everywhere (preview).'); }); });
        KG.bindSettingsForm(el.querySelector('#ly-form'), 'layout', function () { renderLayoutAdmin(el); });
    }

    KG.addAdminTab('layout', 'Layout', renderLayoutAdmin);
    KG.initLayout = function () {
        hook();
        if (KG.hasSettingsDraft() || KG.settingsLoaded) apply();
        KG.onSettings(apply);
    };
})();
