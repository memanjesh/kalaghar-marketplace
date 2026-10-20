/* =====================================================================
   KALAGHAR FOOTER STYLES — "Classic" (the original footer, default) and
   "Clean" (Etsy-style two tiers: newsletter + socials band, trust row,
   three short link columns that fold up on phones, one tidy bottom bar,
   Dhaka-pattern edge). Admin → Footer edits every column, link, colour
   and line, and hides the public Admin link (open Admin with #admin).
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const root = document.documentElement;
    const F = function () { return KG.setting('footer') || { style: 'classic' }; };
    const loc = function (en, ne) { return KG.lang() === 'ne' && ne ? ne : en; };
    const SOCIAL_ICON = { instagram: 'fa-instagram', facebook: 'fa-facebook-f', tiktok: 'fa-tiktok', youtube: 'fa-youtube', whatsapp: 'fa-whatsapp' };
    const ACTIONS = {
        'kg:all': function () { if (window.filterCategory) window.filterCategory('all'); const m = document.getElementById('marketplace'); if (m) m.scrollIntoView({ behavior: 'smooth' }); },
        'kg:giftmode': function () { KG.openGiftMode(); },
        'kg:sell': function () { if (window.openModal) window.openModal('artisanModal'); },
        'kg:seller-dashboard': function () { KG.openSellerDashboard(); },
        'kg:support': function () { KG.openSupportCenter(); },
        'kg:track': function () { if (KG.user()) KG.openAccount('orders'); else KG.openSupportCenter('track-order'); },
        'kg:account': function () { if (KG.user()) KG.openAccount(); else if (window.openModal) window.openModal('customerAuthModal'); },
        'kg:favorites': function () { KG.openFavorites(); },
        'kg:locale': function () { KG.openLocale(); }
    };
    KG.FOOTER_ACTIONS = Object.keys(ACTIONS);
    const linkHtml = function (l, cls) {
        const href = l.href.indexOf('kg:') === 0 ? '#' : l.href;
        const ext = /^https:/.test(l.href);
        return '<a href="' + esc(href) + '" class="' + cls + '"' + (l.href.indexOf('kg:') === 0 ? ' data-kg-action="' + esc(l.href) + '"' : '') + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(loc(l.text, l.ne)) + '</a>';
    };

    /* ---------------------------- render ---------------------------- */
    let classic = null, el = null;
    function render() {
        const f = F();
        classic = classic || document.querySelector('body > footer:not(#kgCleanFooter)');
        if (classic && !classic.id) classic.id = 'kgClassicFooter';
        root.classList.toggle('kg-hide-admin-link', !f.adminLink);
        const clean = f.style === 'clean';
        root.classList.toggle('kg-footer-clean', clean);
        classicCols(f);
        if (!clean) { restoreShared(); if (el) el.hidden = true; return; }
        if (!el) {
            el = document.createElement('footer'); el.id = 'kgCleanFooter'; el.className = 'mt-auto';
            (classic || document.body.lastElementChild).after(el);
            el.addEventListener('click', onClick);
            el.addEventListener('submit', function (e) {
                if (!e.target.matches('.kg-cf-news form')) return;
                e.preventDefault(); const msg = el.querySelector('.kg-cf-news-msg'); if (msg) msg.hidden = false; e.target.reset();
            });
            watchFloat();
        }
        el.hidden = false;
        restoreShared();   // take the shared buttons out before redrawing, so they're never lost
        el.className = 'mt-auto kg-cf kg-cf-' + f.palette + (f.pattern ? ' kg-cf-pattern' : '');
        const socials = KG.FOOTER_SOCIALS.filter(function (k) { return f.socials[k]; });
        el.innerHTML =
            ((f.newsletter || socials.length) ? '<div class="kg-cf-band"><div class="kg-cf-wrap kg-cf-band-grid">' +
                (f.newsletter ? '<div class="kg-cf-news"><h2>' + esc(loc(f.newsletterTitle, f.newsletterTitleNe)) + '</h2>' + (f.newsletterText ? '<p>' + esc(loc(f.newsletterText, f.newsletterTextNe)) + '</p>' : '') +
                    '<form><label class="sr-only" for="kgCfEmail">' + KG.tx('Email address', 'इमेल') + '</label><input id="kgCfEmail" type="email" required placeholder="' + KG.tx('Your email address', 'तपाईंको इमेल') + '"><button type="submit">' + KG.tx('Subscribe', 'सदस्य बन्नुहोस्') + '</button></form>' +
                    '<p class="kg-cf-news-msg" hidden>' + KG.tx('Thanks — you\'re subscribed.', 'धन्यवाद — तपाईं सदस्य हुनुभयो।') + '</p></div>' : '<div></div>') +
                (socials.length ? '<div class="kg-cf-social"><span>' + KG.tx('Follow the makers', 'शिल्पीहरूलाई फलो गर्नुहोस्') + '</span><div>' + socials.map(function (k) { return '<a href="' + esc(f.socials[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '"><i class="fa-brands ' + SOCIAL_ICON[k] + '"></i></a>'; }).join('') + '</div></div>' : '') +
            '</div></div>' : '') +
            (f.trust && f.trustItems.length ? '<div class="kg-cf-trust"><div class="kg-cf-wrap"><ul>' + f.trustItems.map(function (t) { return '<li><i class="fa-solid ' + esc(t.icon) + '" aria-hidden="true"></i><span>' + esc(loc(t.text, t.ne)) + '</span></li>'; }).join('') + '</ul></div></div>' : '') +
            '<div class="kg-cf-main"><div class="kg-cf-wrap kg-cf-main-grid">' +
                '<div class="kg-cf-brand"><a href="#" class="kg-cf-logo" data-kg-action="kg:top"><span class="kg-logo-mark kg-grad" aria-hidden="true">क</span><span>KalaGhar</span></a>' +
                    (f.about ? '<p>' + esc(loc(f.about, f.aboutNe)) + '</p>' : '') + (f.tagline ? '<p class="kg-cf-tagline">' + esc(loc(f.tagline, f.taglineNe)) + '</p>' : '') + '</div>' +
                '<nav class="kg-cf-cols" aria-label="Footer">' + f.columns.map(function (c, i) {
                    return '<div class="kg-cf-col"><h3><button type="button" aria-expanded="false" aria-controls="kgCfCol' + i + '" data-cf-toggle>' + esc(loc(c.title, c.ne)) + '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button></h3>' +
                        '<ul id="kgCfCol' + i + '">' + c.links.map(function (l) { return '<li>' + linkHtml(l, 'kg-cf-link') + '</li>'; }).join('') + '</ul></div>';
                }).join('') + '</nav>' +
            '</div></div>' +
            '<div class="kg-cf-bottom"><div class="kg-cf-wrap kg-cf-bottom-grid">' +
                '<div class="kg-cf-legal"><span>© ' + new Date().getFullYear() + ' KalaGhar</span>' + f.legal.map(function (l) { return linkHtml(l, 'kg-cf-link'); }).join('') + (f.adminLink ? '<a href="#admin" class="kg-cf-link" data-kg-action="kg:admin">Admin</a>' : '') + '</div>' +
                '<div class="kg-cf-prefs">' + (f.payments ? '<div class="kg-cf-pay" aria-label="Accepted payment methods"></div>' : '') + '<div class="kg-cf-shared"></div></div>' +
            '</div></div>';
        moveShared(); copyPayments();
    }

    // Classic footer link columns, edited in Admin → Footer
    function classicCols(f) {
        const nav = classic && classic.querySelector('nav[aria-label="Footer"]'); if (!nav || !f.classicColumns || !f.classicColumns.length) return;
        nav.className = 'grid grid-cols-2 sm:grid-cols-' + Math.min(4, f.classicColumns.length) + ' gap-x-6 gap-y-8';
        nav.innerHTML = f.classicColumns.map(function (c) {
            return '<div><h4 class="kg-fhead">' + esc(loc(c.title, c.ne)) + '</h4><ul class="kg-footer-links">' + c.links.map(function (l) { return '<li>' + linkHtml(l, 'kg-flink') + '</li>'; }).join('') + '</ul></div>';
        }).join('');
        if (!nav.dataset.kgWired) { nav.dataset.kgWired = '1'; nav.addEventListener('click', onClick); }
    }

    // The language/currency and dark-mode buttons keep their IDs and handlers: move them in, and back for Classic
    function moveShared() {
        const slot = el && el.querySelector('.kg-cf-shared'); if (!slot) return;
        const locale = document.querySelector('.kg-locale-button'), theme = document.getElementById('themeToggle');
        [locale, theme].forEach(function (n) { if (n && n.parentNode !== slot) slot.appendChild(n); });
    }
    function restoreShared() {
        const prefs = document.querySelector('#kgClassicFooter .kg-footer-preferences'); if (!prefs) return;
        const locale = document.querySelector('.kg-locale-button'), theme = document.getElementById('themeToggle');
        if (locale && locale.parentNode !== prefs) prefs.insertBefore(locale, prefs.firstChild);
        if (theme && theme.parentNode !== prefs) prefs.appendChild(theme);
    }
    function copyPayments() {
        const box = el && el.querySelector('.kg-cf-pay'), src = document.getElementById('kgPaymentMethods');
        if (box && src) box.innerHTML = src.innerHTML;
    }
    function onClick(e) {
        const t = e.target.closest('[data-cf-toggle]');
        if (t) { const open = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', open ? 'true' : 'false'); t.closest('.kg-cf-col').classList.toggle('is-open', open); return; }
        const a = e.target.closest('[data-kg-action]'); if (!a) return;
        e.preventDefault();
        const act = a.dataset.kgAction;
        if (act === 'kg:top') return window.scrollTo({ top: 0, behavior: 'smooth' });
        if (act === 'kg:admin') return window.openAdminPanel && window.openAdminPanel();
        if (ACTIONS[act]) ACTIONS[act]();
    }
    function watchFloat() {
        const fl = document.getElementById('kgFloat'); if (!fl || !('IntersectionObserver' in window)) return;
        new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (!el.hidden) fl.classList.toggle('kg-float-in-footer', e.isIntersecting); }); }, { threshold: 0.08 }).observe(el);
    }

    // With the public link hidden, Admin opens from the address bar: yoursite/#admin
    function adminFromHash() { if (location.hash === '#admin' && window.openAdminPanel) { window.openAdminPanel(); history.replaceState(null, '', location.pathname + location.search); } }

    /* ---------------------------- admin ---------------------------- */
    function upd(fn) { KG.updateSettings(function (s) { fn(s.footer); }); }
    const ACTION_LABEL = { 'kg:all': 'All crafts', 'kg:giftmode': 'Gift Mode', 'kg:sell': 'Open your shop (seller sign-up)', 'kg:seller-dashboard': 'Seller dashboard', 'kg:support': 'Help centre', 'kg:track': 'Track my order', 'kg:account': 'My account', 'kg:favorites': 'Saved items', 'kg:locale': 'Country, language & currency' };
    function renderFooterAdmin(box) {
        const f = F(), A = KG.adminField;
        const colEditor = function (set, title, hint) {
            const cols = f[set] || [];
            const counts = cols.map(function (c) { return c.links.length; });
            const even = counts.every(function (n) { return n === counts[0]; });
            return '<div class="mt-6" data-set="' + set + '"><div class="flex flex-wrap items-end justify-between gap-2 mb-2"><div><p class="font-bold">' + title + '</p><p class="' + ui.muted + '">' + hint + '</p></div>' +
                (cols.length ? '<span class="text-xs font-semibold ' + (even ? 'text-green-700' : 'text-amber-700') + '">' + (even ? '✓ Even: ' : '⚠ Uneven: ') + counts.join(' · ') + ' links</span>' : '') + '</div>' +
                '<div class="grid md:grid-cols-2 xl:grid-cols-' + Math.max(1, Math.min(4, cols.length)) + ' gap-4">' + cols.map(function (c, ci) {
                    return '<div class="' + ui.card + ' p-4" data-col="' + ci + '"><div class="flex gap-1.5 mb-2"><input data-ck="title" value="' + esc(c.title) + '" maxlength="40" class="' + ui.input + ' !py-1 font-bold" aria-label="Column title"><input data-ck="ne" value="' + esc(c.ne) + '" maxlength="60" placeholder="नेपाली" class="' + ui.input + ' !py-1" aria-label="Nepali title"></div>' +
                        '<div class="space-y-1.5">' + c.links.map(function (l, li) { return linkRow(l, set + ':' + ci + ':' + li); }).join('') + '</div>' +
                        '<div class="flex flex-wrap gap-3 text-xs mt-2">' + (c.links.length < 10 ? '<button type="button" data-ladd="' + set + ':' + ci + '" class="font-semibold text-red-700">+ Add link</button>' : '') + '<button type="button" data-cmv="' + ci + '" data-d="-1">← Move</button><button type="button" data-cmv="' + ci + '" data-d="1">Move →</button><button type="button" data-cdel="' + ci + '" class="text-red-700 ml-auto">Delete column</button></div></div>';
                }).join('') + '</div>' + (cols.length < 4 ? '<button type="button" data-cadd="' + set + '" class="' + ui.btn2 + ' !py-1.5 !text-xs mt-2">+ Add column</button>' : '') + '</div>';
        };
        const linkRow = function (l, path) {
            const isAction = l.href.indexOf('kg:') === 0;
            return '<div class="grid grid-cols-12 gap-1.5 items-center border-b border-gray-100 dark:border-gray-800 pb-1.5" data-link="' + path + '"><input data-k="text" value="' + esc(l.text) + '" maxlength="40" placeholder="Text" class="' + ui.input + ' !py-1 !text-xs col-span-3" aria-label="Link text"><input data-k="ne" value="' + esc(l.ne) + '" maxlength="60" placeholder="नेपाली (optional)" class="' + ui.input + ' !py-1 !text-xs col-span-3" aria-label="Nepali text">' +
                '<select data-k="kind" class="' + ui.input + ' !py-1 !text-xs col-span-2" aria-label="Link type"><option value="url"' + (isAction ? '' : ' selected') + '>Link</option><option value="action"' + (isAction ? ' selected' : '') + '>Opens…</option></select>' +
                (isAction ? '<select data-k="href" class="' + ui.input + ' !py-1 !text-xs col-span-3" aria-label="Action">' + KG.FOOTER_ACTIONS.map(function (a) { return '<option value="' + a + '"' + (a === l.href ? ' selected' : '') + '>' + esc(ACTION_LABEL[a] || a) + '</option>'; }).join('') + '</select>'
                    : '<input data-k="href" value="' + esc(l.href) + '" placeholder="#section, pages/…, https://…" class="' + ui.input + ' !py-1 !text-xs col-span-3" aria-label="Link">') +
                '<span class="col-span-1 flex gap-1 text-xs justify-end"><button type="button" data-lmv="-1" aria-label="Move up">↑</button><button type="button" data-lmv="1" aria-label="Move down">↓</button><button type="button" data-ldel class="text-red-700" aria-label="Delete link">✕</button></span></div>';
        };
        const choice = function (key, title, desc) { return '<button type="button" data-fstyle="' + key + '" class="' + ui.card + ' p-5 text-left ' + (f.style === key ? 'ring-2 ring-red-700' : 'hover:shadow-md') + '"><div class="flex justify-between items-center"><span class="font-bold text-lg">' + title + '</span>' + (f.style === key ? '<span class="text-[11px] font-bold uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded-full">In use</span>' : '<span class="text-xs font-semibold text-red-700">Use this</span>') + '</div><p class="' + ui.muted + ' mt-2">' + desc + '</p></button>'; };
        box.innerHTML = '<h3 class="font-bold text-lg mb-1">Footer</h3><p class="' + ui.muted + ' mb-4">Pick a footer style and edit everything in it. Changes preview straight away; publish when you\'re happy.</p>' +
            '<div class="grid md:grid-cols-2 gap-4 mb-5">' + choice('classic', 'Classic', 'The original footer: newsletter band, brand block, four link columns, contact panel and bottom bar. Its columns are edited below; its bottom bar in Site content.') + choice('clean', 'Clean', 'Etsy-style: a calm newsletter + social band, a trust row, three short link columns that fold up on phones, and one tidy bottom bar with a woven Dhaka edge.') + '</div>' +
            '<form id="ft-form" class="grid lg:grid-cols-3 gap-4"><div class="' + ui.card + ' p-4 space-y-3"><p class="font-bold text-sm">Look</p>' +
                A.select('palette', 'Colours (Clean)', f.palette, [['cream', 'Warm cream (light)'], ['charcoal', 'Charcoal (dark)'], ['red', 'KalaGhar red']]) +
                A.toggle('pattern', 'Dhaka-pattern edge', f.pattern) + A.toggle('trust', 'Trust row', f.trust) + A.toggle('newsletter', 'Newsletter signup', f.newsletter) + A.toggle('payments', 'Payment logos', f.payments) +
                A.toggle('adminLink', 'Show "Admin" link in the footer', f.adminLink, 'Off = hidden from shoppers (both footers). Open Admin by adding #admin to your site address.') + '</div>' +
            '<div class="' + ui.card + ' p-4 space-y-2"><p class="font-bold text-sm">Words</p>' +
                A.text('newsletterTitle', 'Newsletter heading', f.newsletterTitle, 'maxlength="80"') + A.text('newsletterTitleNe', 'Newsletter heading (Nepali)', f.newsletterTitleNe, 'maxlength="100"') +
                A.text('newsletterText', 'Newsletter text', f.newsletterText, 'maxlength="160"') + A.text('newsletterTextNe', 'Newsletter text (Nepali)', f.newsletterTextNe, 'maxlength="200"') +
                A.text('about', 'About line', f.about, 'maxlength="300"') + A.text('aboutNe', 'About line (Nepali)', f.aboutNe, 'maxlength="400"') +
                A.text('tagline', 'Signature line', f.tagline, 'maxlength="80"') + A.text('taglineNe', 'Signature line (Nepali)', f.taglineNe, 'maxlength="100"') + '</div>' +
            '<div class="' + ui.card + ' p-4 space-y-2"><p class="font-bold text-sm">Social links</p><p class="' + ui.muted + '">Leave blank to hide. Use full https:// links.</p>' +
                KG.FOOTER_SOCIALS.map(function (k) { return '<div><label class="' + ui.label + '" for="ft-so-' + k + '">' + k.charAt(0).toUpperCase() + k.slice(1) + '</label><input id="ft-so-' + k + '" data-social="' + k + '" value="' + esc(f.socials[k]) + '" placeholder="https://…" class="' + ui.input + '"></div>'; }).join('') + '</div></form>' +
            '<div class="' + ui.card + ' p-4 mt-4"><p class="font-bold text-sm mb-2">Trust row</p><div class="space-y-1.5">' + f.trustItems.map(function (t, i) {
                return '<div class="grid grid-cols-12 gap-1.5" data-trust="' + i + '"><select data-k="icon" class="' + ui.input + ' !py-1 !text-xs col-span-3" aria-label="Icon">' + KG.FOOTER_ICONS.map(function (ic) { return '<option value="' + ic + '"' + (ic === t.icon ? ' selected' : '') + '>' + ic.replace('fa-', '').replace(/-/g, ' ') + '</option>'; }).join('') + '</select><input data-k="text" value="' + esc(t.text) + '" maxlength="50" class="' + ui.input + ' !py-1 !text-xs col-span-4" aria-label="Text"><input data-k="ne" value="' + esc(t.ne) + '" maxlength="70" placeholder="नेपाली" class="' + ui.input + ' !py-1 !text-xs col-span-4" aria-label="Nepali text"><button type="button" data-tdel class="text-red-700 text-xs col-span-1" aria-label="Delete">✕</button></div>';
            }).join('') + '</div>' + (f.trustItems.length < 4 ? '<button type="button" id="ft-tadd" class="' + ui.btn2 + ' !py-1 !text-xs mt-2">+ Add item</button>' : '') + '</div>' +
            colEditor('classicColumns', 'Classic footer columns', 'The four link columns of the Classic footer. Keep the same number of links in each so they line up.') +
            colEditor('columns', 'Clean footer columns', 'The link columns of the Clean footer (they fold up on phones).') +
            '<div class="' + ui.card + ' p-4 mt-4"><p class="font-bold text-sm mb-1">Bottom bar links</p><p class="' + ui.muted + ' mb-2">Keep Terms, Privacy and the complaint link — Nepal\'s E-Commerce Act expects them to be easy to find.</p><div class="space-y-1.5">' + f.legal.map(function (l, li) { return linkRow(l, 'legal:' + li); }).join('') + '</div><button type="button" data-ladd="legal" class="font-semibold text-red-700 text-xs mt-2">+ Add link</button></div>';

        const again = function () { renderFooterAdmin(box); };
        box.querySelectorAll('[data-fstyle]').forEach(function (b) { b.addEventListener('click', function () { upd(function (x) { x.style = b.dataset.fstyle; }); again(); if (b.dataset.fstyle === 'clean') KG.toast('Previewing the Clean footer — scroll down to see it.'); }); });
        KG.bindSettingsForm(box.querySelector('#ft-form'), 'footer', again);
        box.querySelectorAll('[data-social]').forEach(function (i) { i.addEventListener('change', function () { upd(function (x) { x.socials[i.dataset.social] = i.value.trim(); }); if (i.value.trim() && !(F().socials[i.dataset.social])) KG.toast('Use a full https:// link.', 'warn'); }); });
        box.querySelectorAll('[data-trust] [data-k]').forEach(function (i) { i.addEventListener('change', function () { const n = +i.closest('[data-trust]').dataset.trust; upd(function (x) { x.trustItems[n][i.dataset.k] = i.value; }); }); });
        box.querySelectorAll('[data-tdel]').forEach(function (b) { b.addEventListener('click', function () { const n = +b.closest('[data-trust]').dataset.trust; upd(function (x) { x.trustItems.splice(n, 1); }); again(); }); });
        const tadd = box.querySelector('#ft-tadd'); if (tadd) tadd.addEventListener('click', function () { upd(function (x) { x.trustItems.push({ icon: 'fa-star', text: 'New promise', ne: '' }); }); again(); });
        const listFor = function (x, path) { const p = path.split(':'); return p[0] === 'legal' ? { list: x.legal, i: +p[1] } : { list: x[p[0]][+p[1]].links, i: +p[2] }; };
        const setOf = function (el) { return el.closest('[data-set]').dataset.set; };
        box.querySelectorAll('[data-link] [data-k]').forEach(function (i) {
            i.addEventListener('change', function () {
                const path = i.closest('[data-link]').dataset.link, k = i.dataset.k;
                upd(function (x) { const r = listFor(x, path), l = r.list[r.i]; if (k === 'kind') l.href = i.value === 'action' ? 'kg:support' : '#'; else l[k] = i.value.trim(); });
                if (k === 'kind') again();
                else if (k === 'href') { const r = listFor(F(), path); if (r.list[r.i] && r.list[r.i].href === '#' && i.value.trim() !== '#') KG.toast('That link wasn\'t accepted. Use #section, pages/…, https://, mailto: or tel:.', 'warn'); }
            });
        });
        box.querySelectorAll('[data-lmv]').forEach(function (b) { b.addEventListener('click', function () { const path = b.closest('[data-link]').dataset.link, d = +b.dataset.lmv; upd(function (x) { const r = listFor(x, path), j = r.i + d; if (j < 0 || j >= r.list.length) return; const it = r.list.splice(r.i, 1)[0]; r.list.splice(j, 0, it); }); again(); }); });
        box.querySelectorAll('[data-ldel]').forEach(function (b) { b.addEventListener('click', function () { const path = b.closest('[data-link]').dataset.link; upd(function (x) { const r = listFor(x, path); r.list.splice(r.i, 1); }); again(); }); });
        box.querySelectorAll('[data-ladd]').forEach(function (b) { b.addEventListener('click', function () { const p = b.dataset.ladd.split(':'); upd(function (x) { (p[0] === 'legal' ? x.legal : x[p[0]][+p[1]].links).push({ text: 'New link', ne: '', href: '#' }); }); again(); }); });
        box.querySelectorAll('[data-ck]').forEach(function (i) { i.addEventListener('change', function () { const ci = +i.closest('[data-col]').dataset.col, set = setOf(i); upd(function (x) { x[set][ci][i.dataset.ck] = i.value.trim(); }); }); });
        box.querySelectorAll('[data-cmv]').forEach(function (b) { b.addEventListener('click', function () { const ci = +b.dataset.cmv, j = ci + +b.dataset.d, set = setOf(b); upd(function (x) { if (j < 0 || j >= x[set].length) return; const c = x[set].splice(ci, 1)[0]; x[set].splice(j, 0, c); }); again(); }); });
        box.querySelectorAll('[data-cdel]').forEach(function (b) { b.addEventListener('click', function () { if (!confirm('Delete this whole column?')) return; const set = setOf(b); upd(function (x) { x[set].splice(+b.dataset.cdel, 1); }); again(); }); });
        box.querySelectorAll('[data-cadd]').forEach(function (b) { b.addEventListener('click', function () { upd(function (x) { x[b.dataset.cadd].push({ title: 'New column', ne: '', links: [{ text: 'New link', ne: '', href: '#' }] }); }); again(); }); });
    }

    KG.addAdminTab('footer', 'Footer', renderFooterAdmin);
    KG.initFooter = function () {
        if (KG.hasSettingsDraft() || KG.settingsLoaded) render();
        KG.onSettings(render);
        const al = window.applyLang;
        if (al) window.applyLang = function () { const r = al.apply(this, arguments); render(); return r; };
        const pay = document.getElementById('kgPaymentMethods');
        if (pay && 'MutationObserver' in window) new MutationObserver(copyPayments).observe(pay, { childList: true, subtree: true, characterData: true });
        window.addEventListener('hashchange', adminFromHash);
        setTimeout(adminFromHash, 0);
    };
})();
