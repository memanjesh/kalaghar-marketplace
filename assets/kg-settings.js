/* =====================================================================
   KALAGHAR SITE SETTINGS — one published file (content/site-settings.json)
   that every visitor loads, so admin switches apply site-wide.

   • Visitors: read the published file.
   • Admin: edits are saved as a draft in this browser and previewed live;
     "Publish to all visitors" commits the file to GitHub (needs the admin
     GitHub sign-in). Until published, nobody else sees the change.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const PATH = 'content/site-settings.json';
    const DRAFT_KEY = 'kg-settings-draft';

    const HOME_SECTIONS = [
        { key: 'hero-slider', label: 'Hero slider (top banner)' },
        { key: 'festival', label: 'Festival storefront' },
        { key: 'hero', label: 'Heritage banner' },
        { key: 'popular-categories', label: 'Shop Popular Categories' },
        { key: 'marketplace', label: 'Product catalog' },
        { key: 'kgDiscoveryShelf', label: 'Personal picks (recently viewed)' },
        { key: 'spotlight', label: 'Featured spotlight' },
        { key: 'craft-of-week', label: 'Craft of the week' },
        { key: 'regions', label: 'Shop by Region map' },
        { key: 'makers', label: 'Meet the Makers' },
        { key: 'send-home', label: 'Send a gift home' },
        { key: 'why-shop', label: 'Why shop with us' },
        { key: 'artisan-stories', label: 'Stories behind the craft' },
        { key: 'kgPlusSection', label: 'KalaGhar Plus services' },
        { key: 'workshops', label: 'Craft experiences' },
        { key: 'impact', label: 'Our impact' },
        { key: 'wholesale', label: 'Wholesale & bulk orders' },
        { key: 'shipping-calc', label: 'Shipping calculator' },
        { key: 'faq', label: 'FAQ' }
    ];
    KG.HOME_SECTIONS = HOME_SECTIONS;

    const p = function (id) { return 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=1200'; };
    const DEFAULTS = {
        version: 1,
        home: {
            // Shorter by default: lower-value sections start hidden (admin can show them again)
            sections: HOME_SECTIONS.map(function (s) {
                const hidden = ['hero', 'spotlight', 'craft-of-week', 'why-shop', 'shipping-calc'].indexOf(s.key) > -1;
                return { key: s.key, visible: !hidden, mobile: ['regions', 'impact'].indexOf(s.key) === -1, title: '' };
            })
        },
        hero: {
            autoplay: true, interval: 6, height: 'medium',
            slides: [
                { id: 'heritage', visible: true, eyebrow: 'Authentic Nepali Heritage Crafts', title: 'Handcrafted Heritage, Nepal\'s Identity', text: 'Buy directly from master weavers, bronze sculptors and paper artisans. Certified origin & fair trade.', buttonText: 'Explore the catalog', action: 'section', target: 'marketplace', image: p('6634555'), theme: 'gradient', start: '', end: '' },
                { id: 'pashmina', visible: true, eyebrow: 'Mustang · Chyangra goats', title: 'Himalayan Pashmina & Wool', text: 'Hand-spun at 14,000 ft and woven on wooden looms.', buttonText: 'Shop pashmina', action: 'category', target: 'pashmina', image: p('11733651'), theme: 'image', start: '', end: '' },
                { id: 'gift-home', visible: true, eyebrow: 'For Nepalis abroad', title: 'Send a gift home this festival', text: 'Pay by card, we deliver to your family anywhere in Nepal with your message.', buttonText: 'Send a gift', action: 'gift', target: '', image: p('18681553'), theme: 'image', start: '', end: '' }
            ]
        },
        plus: { hubVisible: true, homeSection: true, features: {} },
        shopping: { variants: true, backInStock: true, priceDrop: true, priceDropMinPercent: 5, qa: true, qaRequireApproval: true, vacation: true },
        marketing: {
            siteUrl: 'https://memanjesh.github.io/kalaghar-marketplace/',
            feedsEnabled: true, feedExcluded: [], feedBrandFallback: 'KalaGhar', feedCondition: 'new',
            seoPagesEnabled: true,
            analyticsEnabled: false, consentBanner: true, ga4Id: '', plausibleDomain: '', metaPixelId: ''
        },
        courier: {
            enabled: true, labelSize: '4x6', defaultCourier: 'ncm', defaultWeightG: 500,
            sender: { name: 'KalaGhar Marketplace', phone: '+977 9851022453', address: 'Kathmandu-14', city: 'Kathmandu' },
            showCodOnLabel: true, bookingEndpoint: ''
        }
    };

    /* ---------------------------- sanitizing ---------------------------- */
    const str = function (v, max, fb) { v = v == null ? '' : String(v).trim().slice(0, max || 200); return v || (fb == null ? '' : fb); };
    const bool = function (v, fb) { return typeof v === 'boolean' ? v : fb; };
    const num = function (v, min, max, fb) { v = Number(v); return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fb; };
    const url = function (v) { v = str(v, 500); return /^https:\/\//i.test(v) || /^(assets|content|images)\/[\w./-]+$/i.test(v) ? v : ''; };
    const date = function (v) { v = str(v, 10); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''; };
    const id = function (v, fb) { v = str(v, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '-'); return v || fb; };

    function sanitize(raw) {
        const s = raw && typeof raw === 'object' ? raw : {}, d = DEFAULTS;
        const h = s.home || {}, hero = s.hero || {}, plus = s.plus || {}, sh = s.shopping || {}, m = s.marketing || {}, c = s.courier || {};
        const known = HOME_SECTIONS.map(function (x) { return x.key; });
        let sections = (Array.isArray(h.sections) ? h.sections : []).filter(function (x) { return x && known.indexOf(x.key) > -1; })
            .map(function (x) { return { key: x.key, visible: x.visible !== false, mobile: x.mobile !== false, title: str(x.title, 80) }; });
        d.home.sections.forEach(function (x) { if (!sections.some(function (y) { return y.key === x.key; })) sections.push(Object.assign({}, x)); });
        const actions = ['section', 'category', 'gift', 'link', 'product', 'support'];
        const slides = (Array.isArray(hero.slides) ? hero.slides : d.hero.slides).slice(0, 10).map(function (x, i) {
            x = x || {};
            return { id: id(x.id, 'slide-' + (i + 1)), visible: x.visible !== false, eyebrow: str(x.eyebrow, 80), title: str(x.title, 120), text: str(x.text, 300),
                buttonText: str(x.buttonText, 40), action: actions.indexOf(x.action) > -1 ? x.action : 'section', target: str(x.target, 300),
                image: url(x.image), theme: x.theme === 'image' ? 'image' : 'gradient', start: date(x.start), end: date(x.end) };
        });
        const feats = {};
        Object.keys(plus.features || {}).forEach(function (k) {
            const f = plus.features[k] || {};
            if (/^\d{1,2}$/.test(k)) feats[k] = { state: ['enabled', 'coming_soon', 'hidden'].indexOf(f.state) > -1 ? f.state : 'enabled', featured: !!f.featured, customDescription: str(f.customDescription, 300) };
        });
        const sender = c.sender || {};
        return {
            version: 1,
            home: { sections: sections },
            hero: { autoplay: bool(hero.autoplay, true), interval: num(hero.interval, 3, 20, 6), height: ['small', 'medium', 'large'].indexOf(hero.height) > -1 ? hero.height : 'medium', slides: slides },
            plus: { hubVisible: bool(plus.hubVisible, true), homeSection: bool(plus.homeSection, true), features: feats },
            shopping: {
                variants: bool(sh.variants, true), backInStock: bool(sh.backInStock, true), priceDrop: bool(sh.priceDrop, true),
                priceDropMinPercent: num(sh.priceDropMinPercent, 1, 90, 5), qa: bool(sh.qa, true), qaRequireApproval: bool(sh.qaRequireApproval, true), vacation: bool(sh.vacation, true)
            },
            marketing: {
                siteUrl: /^https:\/\/[\w.-]+(\/[\w./-]*)?$/.test(str(m.siteUrl, 200)) ? str(m.siteUrl, 200).replace(/\/?$/, '/') : d.marketing.siteUrl,
                feedsEnabled: bool(m.feedsEnabled, true), feedExcluded: (Array.isArray(m.feedExcluded) ? m.feedExcluded : []).map(Number).filter(Number.isFinite).slice(0, 5000),
                feedBrandFallback: str(m.feedBrandFallback, 60, 'KalaGhar'), feedCondition: m.feedCondition === 'used' ? 'used' : 'new',
                seoPagesEnabled: bool(m.seoPagesEnabled, true),
                analyticsEnabled: bool(m.analyticsEnabled, false), consentBanner: bool(m.consentBanner, true),
                // Strict formats: these values are written into script tags
                ga4Id: /^G-[A-Z0-9]{4,15}$/.test(str(m.ga4Id, 20)) ? str(m.ga4Id, 20) : '',
                plausibleDomain: /^[a-z0-9.-]{3,100}$/i.test(str(m.plausibleDomain, 100)) ? str(m.plausibleDomain, 100).toLowerCase() : '',
                metaPixelId: /^\d{6,20}$/.test(str(m.metaPixelId, 20)) ? str(m.metaPixelId, 20) : ''
            },
            courier: {
                enabled: bool(c.enabled, true), labelSize: c.labelSize === 'a6' ? 'a6' : '4x6', defaultCourier: id(c.defaultCourier, 'ncm'),
                defaultWeightG: num(c.defaultWeightG, 50, 50000, 500),
                sender: { name: str(sender.name, 80, d.courier.sender.name), phone: str(sender.phone, 30, d.courier.sender.phone), address: str(sender.address, 160, d.courier.sender.address), city: str(sender.city, 60, d.courier.sender.city) },
                showCodOnLabel: bool(c.showCodOnLabel, true),
                bookingEndpoint: /^https:\/\//.test(str(c.bookingEndpoint, 300)) ? str(c.bookingEndpoint, 300) : ''
            }
        };
    }

    /* ---------------------------- state ---------------------------- */
    let published = sanitize(DEFAULTS);
    function draft() { const d = KG.store.get(DRAFT_KEY, null); return d ? sanitize(d) : null; }
    KG.siteSettings = function () { return JSON.parse(JSON.stringify(draft() || published)); };
    KG.setting = function (path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, KG.siteSettings()); };
    KG.hasSettingsDraft = function () { return !!draft(); };
    // Change one area of the settings (draft) and re-apply everywhere
    KG.updateSettings = function (mutator) {
        const next = KG.siteSettings(); mutator(next);
        KG.store.set(DRAFT_KEY, sanitize(next));
        apply(); refreshPublishBar();
    };
    KG.discardSettingsDraft = function () { localStorage.removeItem(DRAFT_KEY); apply(); refreshPublishBar(); };
    KG.publishSettings = async function () {
        const c = window.KG_CONTENT;
        if (!c || !c.isAuthenticated()) throw new Error('Sign in to the admin console with your GitHub token first.');
        const next = KG.siteSettings();
        const r = await c.putFile(PATH, JSON.stringify(next, null, 2) + '\n', 'Update site settings from admin');
        published = next; localStorage.removeItem(DRAFT_KEY); refreshPublishBar();
        if (window.KG_ADMIN_AUDIT) window.KG_ADMIN_AUDIT('settings.published', 'settings', PATH, '');
        return r;
    };
    function apply() { document.dispatchEvent(new CustomEvent('kg:settings', { detail: KG.siteSettings() })); }
    KG.onSettings = function (fn) { document.addEventListener('kg:settings', function (e) { fn(e.detail); }); };

    /* ---------------------------- admin helpers ---------------------------- */
    const extraTabs = {};
    KG.addAdminTab = function (key, label, render) { extraTabs[key] = { label: label, render: render }; };
    function mountAdminTabs() {
        const bar = document.querySelector('.admin-tab[data-tab="overview"]');
        if (!bar) return;
        const host = document.getElementById('adminTab-overview').parentNode;
        let prev = bar.parentNode.lastElementChild;
        Object.keys(extraTabs).forEach(function (key) {
            if (document.querySelector('.admin-tab[data-tab="' + key + '"]')) return;
            const b = document.createElement('button'); b.className = 'admin-tab'; b.dataset.tab = key; b.textContent = extraTabs[key].label;
            b.setAttribute('onclick', "switchAdminTab('" + key + "')"); prev.after(b); prev = b;
            const d = document.createElement('div'); d.id = 'adminTab-' + key; d.className = 'admin-tab-content hidden'; host.appendChild(d);
        });
        const before = window.switchAdminTab;
        window.switchAdminTab = function (tab) {
            if (!extraTabs[tab]) return before(tab);
            document.querySelectorAll('.admin-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
            document.querySelectorAll('.admin-tab-content').forEach(function (c) { c.classList.add('hidden'); });
            const el = document.getElementById('adminTab-' + tab); el.classList.remove('hidden');
            el.innerHTML = '<div data-publish-bar></div><div data-tab-body></div>';
            refreshPublishBar();
            extraTabs[tab].render(el.querySelector('[data-tab-body]'));
        };
    }
    function refreshPublishBar() {
        document.querySelectorAll('[data-publish-bar]').forEach(function (bar) {
            const dirty = KG.hasSettingsDraft();
            bar.innerHTML = '<div class="kg-publishbar ' + (dirty ? 'is-dirty' : '') + '"><span><i class="fa-solid ' + (dirty ? 'fa-pen-to-square' : 'fa-circle-check') + ' mr-1.5"></i>' +
                (dirty ? '<strong>Unpublished changes.</strong> You are previewing them in this browser only.' : 'All settings are published — every visitor sees what you see.') + '</span>' +
                (dirty ? '<span class="flex gap-2"><button type="button" data-discard class="' + ui.btn2 + ' !py-1.5 !text-xs">Discard</button><button type="button" data-publish class="' + ui.btn + ' !py-1.5 !text-xs"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Publish to all visitors</button></span>' : '') + '</div>';
            const pub = bar.querySelector('[data-publish]'), dis = bar.querySelector('[data-discard]');
            if (dis) dis.addEventListener('click', function () { if (confirm('Discard all unpublished setting changes?')) { KG.discardSettingsDraft(); const t = document.querySelector('.admin-tab.active'); if (t) switchAdminTab(t.dataset.tab); } });
            if (pub) pub.addEventListener('click', async function () {
                pub.disabled = true; pub.textContent = 'Publishing…';
                try { const r = await KG.publishSettings(); KG.toast('Published. Visitors see it within a few minutes.'); if (r.commitUrl) console.info('Settings commit:', r.commitUrl); }
                catch (e) { KG.toast(e.message, 'error'); pub.disabled = false; pub.textContent = 'Publish to all visitors'; }
            });
        });
    }
    KG.refreshPublishBar = refreshPublishBar;
    // Small form helpers shared by the admin tabs
    KG.adminField = {
        toggle: function (name, label, on, hint) { return '<label class="kg-switch"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '><span class="kg-switch-ui"></span><span><strong class="block text-sm">' + label + '</strong>' + (hint ? '<span class="' + ui.muted + '">' + hint + '</span>' : '') + '</span></label>'; },
        text: function (name, label, value, attrs) { return '<div><label class="' + ui.label + '" for="af-' + name + '">' + label + '</label><input id="af-' + name + '" name="' + name + '" value="' + esc(value == null ? '' : value) + '" ' + (attrs || '') + ' class="' + ui.input + '"></div>'; },
        select: function (name, label, value, opts) { return '<div><label class="' + ui.label + '" for="af-' + name + '">' + label + '</label><select id="af-' + name + '" name="' + name + '" class="' + ui.input + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>'; }
    };
    // Bind a settings form: every change saves to the draft immediately
    KG.bindSettingsForm = function (form, area, after) {
        form.addEventListener('change', function (e) {
            const el = e.target; if (!el.name) return;
            KG.updateSettings(function (s) {
                const target = area.split('.').reduce(function (o, k) { return o[k]; }, s);
                const keys = el.name.split('.'), last = keys.pop();
                const obj = keys.reduce(function (o, k) { return o[k]; }, target);
                obj[last] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
            });
            if (after) after();
        });
    };

    KG.initSettings = function () {
        mountAdminTabs();
        fetch(PATH, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
            .then(function (j) { published = sanitize(j); }).catch(function () { /* first run: defaults */ })
            .then(function () { apply(); refreshPublishBar(); });
    };
    KG.SETTINGS_DEFAULTS = DEFAULTS;
    KG.sanitizeSettings = sanitize;
})();
