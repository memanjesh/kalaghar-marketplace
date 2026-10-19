/* =====================================================================
   KALAGHAR HOME — #1 homepage section manager, #2 hero slider,
   #3 KalaGhar Plus launch mode. All controlled from Admin.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui, F = function () { return KG.adminField; };

    /* =================== #1 HOMEPAGE SECTION MANAGER =================== */
    let applying = false, queued = false;
    function managedEls(sections) {
        return sections.map(function (s) { return { s: s, el: document.getElementById(s.key) }; }).filter(function (x) { return x.el && x.el.parentNode === document.body; });
    }
    KG.applyHomeLayout = function () {
        if (applying) return;
        applying = true;
        try {
            const sections = KG.setting('home.sections') || [];
            const list = managedEls(sections);
            const footer = document.querySelector('body > footer');
            // Reorder only when needed (avoids an endless observer loop)
            let inOrder = true;
            for (let i = 1; i < list.length; i++) if (list[i - 1].el.compareDocumentPosition(list[i].el) & Node.DOCUMENT_POSITION_PRECEDING) { inOrder = false; break; }
            if (!inOrder && footer && list.length) {
                const first = list[0].el, anchor = document.createComment('kg-home');
                first.before(anchor);
                list.forEach(function (x) { anchor.parentNode.insertBefore(x.el, anchor); });
                anchor.remove();
            }
            list.forEach(function (x) {
                x.el.classList.toggle('kg-home-off', !x.s.visible);
                x.el.classList.toggle('kg-home-nomobile', x.s.visible && !x.s.mobile);
                x.el.dataset.kgHome = x.s.key;
                const h = x.el.querySelector('h1, h2');
                if (!h) return;
                if (h.dataset.kgOrigTitle == null) h.dataset.kgOrigTitle = h.textContent;
                if (x.s.title) { if (h.textContent !== x.s.title) h.textContent = x.s.title; }
                else if (h.dataset.kgRenamed) h.textContent = h.dataset.kgOrigTitle;
                if (x.s.title) h.dataset.kgRenamed = '1'; else delete h.dataset.kgRenamed;
            });
        } finally { applying = false; }
    };
    function watchHome() {
        new MutationObserver(function () {
            if (applying || queued) return;
            queued = true;
            requestAnimationFrame(function () { queued = false; KG.applyHomeLayout(); });
        }).observe(document.body, { childList: true });
    }

    function renderHomeAdmin(el) {
        const sections = KG.setting('home.sections');
        const label = function (key) { const x = KG.HOME_SECTIONS.find(function (h) { return h.key === key; }); return x ? x.label : key; };
        const shown = sections.filter(function (s) { return s.visible; }).length;
        el.innerHTML = '<div class="flex flex-wrap items-end justify-between gap-3 mb-4"><div><h3 class="font-bold text-lg">Homepage sections</h3><p class="' + ui.muted + '">Drag to reorder (or use the arrows), hide sections, hide them on phones only, or rename their headings. ' + shown + ' of ' + sections.length + ' sections showing.</p></div>' +
            '<div class="flex gap-2"><button type="button" data-preset="lean" class="' + ui.btn2 + ' !text-xs">Short homepage preset</button><button type="button" data-preset="all" class="' + ui.btn2 + ' !text-xs">Show everything</button></div></div>' +
            '<ol class="space-y-2" id="kgHomeList">' + sections.map(function (s, i) {
                const exists = !!document.getElementById(s.key);
                return '<li draggable="true" data-key="' + esc(s.key) + '" class="kg-home-row ' + ui.card + ' p-3 flex flex-wrap items-center gap-3 ' + (s.visible ? '' : 'opacity-60') + '">' +
                    '<span class="cursor-grab text-gray-400" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></span>' +
                    '<span class="w-7 text-xs font-bold text-gray-400">' + (i + 1) + '</span>' +
                    '<span class="flex-1 min-w-[180px]"><strong class="text-sm block">' + esc(label(s.key)) + '</strong>' +
                        '<input data-title value="' + esc(s.title) + '" placeholder="Heading (leave blank for the default)" aria-label="Custom heading for ' + esc(label(s.key)) + '" class="' + ui.input + ' !py-1.5 !text-xs mt-1">' + (exists ? '' : '<span class="text-[11px] text-amber-700">Not on the page right now (empty or switched off elsewhere).</span>') + '</span>' +
                    '<label class="flex items-center gap-1.5 text-xs"><input type="checkbox" data-visible' + (s.visible ? ' checked' : '') + '> Show</label>' +
                    '<label class="flex items-center gap-1.5 text-xs"><input type="checkbox" data-mobile' + (s.mobile ? ' checked' : '') + '> On phones</label>' +
                    '<span class="flex gap-1"><button type="button" data-move="-1" aria-label="Move up" class="w-8 h-8 rounded-lg border dark:border-gray-700"' + (i ? '' : ' disabled') + '><i class="fa-solid fa-arrow-up text-xs"></i></button><button type="button" data-move="1" aria-label="Move down" class="w-8 h-8 rounded-lg border dark:border-gray-700"' + (i < sections.length - 1 ? '' : ' disabled') + '><i class="fa-solid fa-arrow-down text-xs"></i></button>' +
                    '<button type="button" data-goto aria-label="Show on page" title="Show on page" class="w-8 h-8 rounded-lg border dark:border-gray-700"><i class="fa-solid fa-eye text-xs"></i></button></span></li>';
            }).join('') + '</ol>';
        const save = function (mut) { KG.updateSettings(function (st) { mut(st.home.sections); }); renderHomeAdmin(el); };
        el.querySelectorAll('.kg-home-row').forEach(function (row) {
            const key = row.dataset.key, find = function (arr) { return arr.find(function (x) { return x.key === key; }); };
            row.querySelector('[data-visible]').addEventListener('change', function (e) { save(function (a) { find(a).visible = e.target.checked; }); });
            row.querySelector('[data-mobile]').addEventListener('change', function (e) { save(function (a) { find(a).mobile = e.target.checked; }); });
            row.querySelector('[data-title]').addEventListener('change', function (e) { save(function (a) { find(a).title = e.target.value.trim(); }); });
            row.querySelectorAll('[data-move]').forEach(function (b) { b.addEventListener('click', function () { save(function (a) { const i = a.findIndex(function (x) { return x.key === key; }), j = i + +b.dataset.move; const t = a[i]; a[i] = a[j]; a[j] = t; }); }); });
            row.querySelector('[data-goto]').addEventListener('click', function () { const s = document.getElementById(key); if (!s) return KG.toast('That section is not on the page right now.', 'warn'); closeAdminPanel(); s.scrollIntoView({ behavior: 'smooth' }); });
            row.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', key); row.classList.add('opacity-40'); });
            row.addEventListener('dragend', function () { row.classList.remove('opacity-40'); });
            row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('ring-2', 'ring-amber-500'); });
            row.addEventListener('dragleave', function () { row.classList.remove('ring-2', 'ring-amber-500'); });
            row.addEventListener('drop', function (e) {
                e.preventDefault(); const from = e.dataTransfer.getData('text/plain'); if (!from || from === key) return;
                save(function (a) { const i = a.findIndex(function (x) { return x.key === from; }); const item = a.splice(i, 1)[0]; const j = a.findIndex(function (x) { return x.key === key; }); a.splice(j, 0, item); });
            });
        });
        el.querySelectorAll('[data-preset]').forEach(function (b) {
            b.addEventListener('click', function () {
                save(function (a) { a.forEach(function (x) { x.visible = b.dataset.preset === 'all' ? true : KG.SETTINGS_DEFAULTS.home.sections.find(function (d) { return d.key === x.key; }).visible; }); });
            });
        });
    }

    /* =================== #2 HERO SLIDER =================== */
    let timer = null, current = 0;
    function liveSlides() {
        const today = KG.today();
        return (KG.setting('hero.slides') || []).filter(function (s) { return s.visible && s.title && (!s.start || s.start <= today) && (!s.end || s.end >= today); });
    }
    function slideAction(s) {
        if (s.action === 'category' && KG.goCategory) return KG.goCategory(s.target);
        if (s.action === 'gift' && KG.giftThis) return KG.cart().length ? KG.giftThis() : KG.openGiftMode();
        if (s.action === 'product' && KG.openProduct) return KG.openProduct(+s.target);
        if (s.action === 'support' && KG.openSupportCenter) return KG.openSupportCenter();
        if (s.action === 'link') { if (/^(https?:|mailto:|tel:|#|pages\/)/i.test(s.target)) location.href = s.target; return; }
        const el = document.getElementById(String(s.target || 'marketplace').replace(/^#/, '')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    KG.renderHeroSlider = function () {
        let sec = document.getElementById('hero-slider');
        const slides = liveSlides(), cfg = KG.setting('hero');
        if (!sec) {
            sec = document.createElement('section'); sec.id = 'hero-slider'; sec.setAttribute('aria-roledescription', 'carousel'); sec.setAttribute('aria-label', 'Featured');
            const dispatch = document.getElementById('kgDispatchNotice');
            (dispatch || document.querySelector('body > header')).after(sec);
        }
        clearInterval(timer);
        if (!slides.length) { sec.innerHTML = ''; sec.classList.add('kg-home-empty'); return; }
        sec.classList.remove('kg-home-empty');
        if (current >= slides.length) current = 0;
        sec.className = 'kg-hero kg-hero-' + cfg.height + (sec.classList.contains('kg-home-off') ? ' kg-home-off' : '') + (sec.classList.contains('kg-home-nomobile') ? ' kg-home-nomobile' : '');
        sec.innerHTML = '<div class="kg-hero-track">' + slides.map(function (s, i) {
            const img = s.image ? esc(s.image) : '';
            return '<div class="kg-hero-slide kg-hero-' + s.theme + (i === current ? ' is-active' : '') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + slides.length + '"' + (i === current ? '' : ' aria-hidden="true"') + (s.theme === 'image' && img ? ' style="background-image:url(\'' + img + '\')"' : '') + '>' +
                '<div class="kg-hero-inner max-w-7xl mx-auto px-4 md:px-8">' +
                    '<div class="kg-hero-copy">' + (s.eyebrow ? '<span class="kg-hero-eyebrow">' + esc(s.eyebrow) + '</span>' : '') +
                        '<h2 class="kg-hero-title">' + esc(s.title) + '</h2>' + (s.text ? '<p class="kg-hero-text">' + esc(s.text) + '</p>' : '') +
                        (s.buttonText ? '<button type="button" class="kg-hero-btn" data-slide="' + i + '"' + (i === current ? '' : ' tabindex="-1"') + '>' + esc(s.buttonText) + ' <i class="fa-solid fa-arrow-right text-xs ml-1"></i></button>' : '') + '</div>' +
                    (s.theme === 'gradient' && img ? '<div class="kg-hero-art"><img src="' + img + '" alt="" loading="' + (i ? 'lazy' : 'eager') + '"></div>' : '') +
                '</div></div>';
        }).join('') + '</div>' +
        (slides.length > 1 ? '<button type="button" class="kg-hero-nav kg-hero-prev" aria-label="Previous slide"><i class="fa-solid fa-chevron-left"></i></button><button type="button" class="kg-hero-nav kg-hero-next" aria-label="Next slide"><i class="fa-solid fa-chevron-right"></i></button>' +
            '<div class="kg-hero-dots">' + slides.map(function (s, i) { return '<button type="button" aria-label="Go to slide ' + (i + 1) + '"' + (i === current ? ' aria-current="true"' : '') + ' data-dot="' + i + '"></button>'; }).join('') + '</div>' : '');
        const go = function (n) { current = (n + slides.length) % slides.length; KG.renderHeroSlider(); };
        sec.querySelectorAll('[data-slide]').forEach(function (b) { b.addEventListener('click', function () { slideAction(slides[+b.dataset.slide]); }); });
        sec.querySelectorAll('[data-dot]').forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.dot); }); });
        const prev = sec.querySelector('.kg-hero-prev'), next = sec.querySelector('.kg-hero-next');
        if (prev) prev.addEventListener('click', function () { go(current - 1); });
        if (next) next.addEventListener('click', function () { go(current + 1); });
        sec.onkeydown = function (e) { if (e.key === 'ArrowLeft') go(current - 1); if (e.key === 'ArrowRight') go(current + 1); };
        const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (cfg.autoplay && slides.length > 1 && !reduce) {
            const start = function () { clearInterval(timer); timer = setInterval(function () { go(current + 1); }, cfg.interval * 1000); };
            sec.onmouseenter = function () { clearInterval(timer); }; sec.onmouseleave = start;
            sec.onfocusin = function () { clearInterval(timer); }; sec.onfocusout = start;
            start();
        }
    };

    function renderHeroAdmin(el) {
        const cfg = KG.setting('hero'), A = F(), authed = window.KG_CONTENT && KG_CONTENT.isAuthenticated();
        el.innerHTML = '<div class="flex flex-wrap items-end justify-between gap-3 mb-4"><div><h3 class="font-bold text-lg">Hero slider</h3><p class="' + ui.muted + '">The big banner at the top of the homepage, like Etsy\'s. Turn the whole slider on or off under Homepage.</p></div><button type="button" id="hs-add" class="' + ui.btn + '"><i class="fa-solid fa-plus mr-1"></i>Add slide</button></div>' +
            '<form id="hs-cfg" class="' + ui.card + ' p-4 grid sm:grid-cols-3 gap-4 mb-4">' + A.toggle('autoplay', 'Auto-play', cfg.autoplay, 'Pauses when a visitor hovers or tabs into it') +
                A.text('interval', 'Seconds per slide', cfg.interval, 'type="number" min="3" max="20"') + A.select('height', 'Banner height', cfg.height, [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]) + '</form>' +
            '<div class="space-y-3" id="hs-list">' + cfg.slides.map(function (s, i) {
                const live = liveSlides().some(function (x) { return x.id === s.id; });
                return '<details class="' + ui.card + ' p-4" data-i="' + i + '"' + (i === 0 ? ' open' : '') + '><summary class="flex items-center gap-3 cursor-pointer"><img src="' + esc(s.image || '') + '" alt="" class="w-16 h-10 rounded object-cover bg-gray-100 dark:bg-gray-800"><span class="flex-1 min-w-0"><strong class="text-sm block truncate">' + esc(s.title || '(no title)') + '</strong><span class="text-[11px] ' + (live ? 'text-green-700' : 'text-gray-500') + '">' + (live ? 'Showing now' : !s.visible ? 'Hidden' : 'Scheduled / not showing') + (s.start || s.end ? ' · ' + (s.start || '…') + ' → ' + (s.end || '…') : '') + '</span></span></summary>' +
                    '<form class="grid sm:grid-cols-2 gap-3 mt-4">' +
                        A.text('title', 'Headline', s.title, 'maxlength="120"') + A.text('eyebrow', 'Small label above', s.eyebrow, 'maxlength="80"') +
                        '<div class="sm:col-span-2"><label class="' + ui.label + '">Text</label><textarea name="text" rows="2" maxlength="300" class="' + ui.input + '">' + esc(s.text) + '</textarea></div>' +
                        A.text('buttonText', 'Button text', s.buttonText, 'maxlength="40"') +
                        A.select('action', 'Button goes to', s.action, [['section', 'A homepage section'], ['category', 'A category'], ['product', 'A product'], ['gift', 'Send a gift home'], ['support', 'Support center'], ['link', 'A web link']]) +
                        A.text('target', 'Target (section id, category id, product number or link)', s.target, 'placeholder="marketplace / pashmina / 4 / https://…"') +
                        A.select('theme', 'Style', s.theme, [['gradient', 'Festival gradient + photo on the right'], ['image', 'Full-width photo']]) +
                        '<div class="sm:col-span-2"><label class="' + ui.label + '">Image</label><div class="flex flex-wrap gap-2"><input name="image" value="' + esc(s.image) + '" placeholder="https://… (or upload)" class="' + ui.input + ' flex-1 min-w-[220px]">' +
                            '<label class="' + ui.btn2 + ' !text-xs cursor-pointer' + (authed ? '' : ' opacity-50') + '" title="' + (authed ? 'Upload to your GitHub repository' : 'Sign in with your GitHub token to upload') + '"><i class="fa-solid fa-upload mr-1"></i>Upload<input type="file" accept="image/*" data-upload class="hidden"' + (authed ? '' : ' disabled') + '></label></div></div>' +
                        A.text('start', 'Show from (optional)', s.start, 'type="date"') + A.text('end', 'Show until (optional)', s.end, 'type="date"') +
                        '<div class="sm:col-span-2 flex flex-wrap gap-2 items-center"><label class="flex items-center gap-2 text-sm mr-auto"><input type="checkbox" name="visible"' + (s.visible ? ' checked' : '') + '> Visible</label>' +
                            '<button type="button" data-act="up" class="' + ui.btn2 + ' !text-xs"' + (i ? '' : ' disabled') + '>Move up</button><button type="button" data-act="down" class="' + ui.btn2 + ' !text-xs"' + (i < cfg.slides.length - 1 ? '' : ' disabled') + '>Move down</button>' +
                            '<button type="button" data-act="dup" class="' + ui.btn2 + ' !text-xs">Duplicate</button><button type="button" data-act="del" class="' + ui.btn2 + ' !text-xs !text-red-700">Delete</button></div>' +
                    '</form></details>';
            }).join('') + '</div>';
        KG.bindSettingsForm(el.querySelector('#hs-cfg'), 'hero', function () { KG.renderHeroSlider(); });
        el.querySelector('#hs-add').addEventListener('click', function () {
            KG.updateSettings(function (st) { st.hero.slides.push({ id: 'slide-' + Date.now().toString(36), visible: true, eyebrow: '', title: 'New slide', text: '', buttonText: 'Shop now', action: 'section', target: 'marketplace', image: '', theme: 'gradient', start: '', end: '' }); });
            renderHeroAdmin(el); KG.renderHeroSlider();
        });
        el.querySelectorAll('[data-i]').forEach(function (box) {
            const i = +box.dataset.i, form = box.querySelector('form');
            form.addEventListener('change', function (e) {
                if (e.target.dataset.upload != null) return;
                KG.updateSettings(function (st) { const s = st.hero.slides[i]; const t = e.target; s[t.name] = t.type === 'checkbox' ? t.checked : t.value; });
                KG.renderHeroSlider();
            });
            form.querySelectorAll('[data-act]').forEach(function (b) {
                b.addEventListener('click', function () {
                    const act = b.dataset.act;
                    if (act === 'del' && !confirm('Delete this slide?')) return;
                    KG.updateSettings(function (st) {
                        const a = st.hero.slides;
                        if (act === 'del') a.splice(i, 1);
                        if (act === 'dup') a.splice(i + 1, 0, Object.assign({}, a[i], { id: a[i].id + '-copy', title: a[i].title + ' (copy)' }));
                        if (act === 'up' || act === 'down') { const j = act === 'up' ? i - 1 : i + 1; const t = a[i]; a[i] = a[j]; a[j] = t; }
                    });
                    renderHeroAdmin(el); KG.renderHeroSlider();
                });
            });
            const up = form.querySelector('[data-upload]');
            up.addEventListener('change', async function () {
                const file = up.files[0]; if (!file) return;
                try {
                    KG.toast('Uploading image…');
                    const dataUrl = await KG.readImage(file, 1600);
                    const path = 'images/hero/' + Date.now().toString(36) + '.jpg';
                    await KG_CONTENT.putFile(path, dataUrl.split(',')[1], 'Upload hero image', true);
                    KG.updateSettings(function (st) { st.hero.slides[i].image = path; });
                    KG.toast('Uploaded. Publish settings to show it to visitors.');
                    renderHeroAdmin(el); KG.renderHeroSlider();
                } catch (e) { KG.toast('Upload failed: ' + e.message, 'error'); }
            });
        });
    }

    /* =================== #3 KALAGHAR PLUS LAUNCH MODE =================== */
    // Features that work today without an outside provider (payments, couriers, streaming…)
    const LAUNCH_SET = [1, 2, 3, 7, 13, 14, 18, 20, 22, 23, 24, 25];
    function applyPlusVisibility() {
        const on = KG.setting('plus.hubVisible') !== false;
        document.documentElement.classList.toggle('kg-plus-off', !on);
        document.querySelectorAll('[data-featured-action="features"]').forEach(function (b) { const li = b.closest('li') || b; li.hidden = !on; });
    }
    function renderLaunchAdmin(el) {
        const st = KG.siteSettings(), feats = KG.PLUS_FEATURES || [];
        const state = function (fid) { return (st.plus.features[fid] || {}).state || 'enabled'; };
        const plusSec = st.home.sections.find(function (s) { return s.key === 'kgPlusSection'; });
        const count = function (s) { return feats.filter(function (f) { return state(f.id) === s; }).length; };
        el.innerHTML = '<div class="mb-4"><h3 class="font-bold text-lg">Launch mode for KalaGhar Plus</h3><p class="' + ui.muted + '">Show customers only the services you can actually deliver today. Enabled: ' + count('enabled') + ' · Coming soon: ' + count('coming_soon') + ' · Hidden: ' + count('hidden') + '</p></div>' +
            '<div class="grid md:grid-cols-3 gap-3 mb-4">' +
                '<button type="button" data-preset="launch" class="' + ui.card + ' p-4 text-left hover:border-amber-500"><strong class="block"><i class="fa-solid fa-rocket text-amber-600 mr-1"></i>Launch set (recommended)</strong><span class="' + ui.muted + '">Turns on the ' + LAUNCH_SET.length + ' services that need no outside provider; hides the rest.</span></button>' +
                '<button type="button" data-preset="soon" class="' + ui.card + ' p-4 text-left hover:border-amber-500"><strong class="block"><i class="fa-solid fa-hourglass-half text-amber-600 mr-1"></i>Launch set + "coming soon"</strong><span class="' + ui.muted + '">Same, but the others show as "Coming soon" instead of hidden.</span></button>' +
                '<button type="button" data-preset="all" class="' + ui.card + ' p-4 text-left hover:border-amber-500"><strong class="block"><i class="fa-solid fa-toggle-on text-amber-600 mr-1"></i>Everything on</strong><span class="' + ui.muted + '">All 25 services visible (preview / demo).</span></button></div>' +
            '<div class="' + ui.card + ' p-4 grid sm:grid-cols-2 gap-4 mb-4">' + F().toggle('hub', 'Show the "More from KalaGhar" services hub', st.plus.hubVisible, 'Off hides every link to the hub') + F().toggle('home', 'Show the services section on the homepage', plusSec && plusSec.visible, 'Same switch as on the Homepage tab') + '</div>' +
            '<div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-sm min-w-[560px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3">#</th><th>Service</th><th>Needs before going live</th><th class="p-3">Customers see</th></tr></thead><tbody>' + feats.map(function (f) {
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3 text-gray-400">' + f.id + '</td><td><strong>' + esc(f.name) + '</strong>' + (LAUNCH_SET.indexOf(f.id) > -1 ? ' <span class="text-[10px] text-green-700 font-bold">LAUNCH SET</span>' : '') + '</td><td class="text-xs text-gray-500 pr-3">' + esc(f.provider || (LAUNCH_SET.indexOf(f.id) > -1 ? 'Ready — staff handle requests in Admin' : 'An outside provider or your operations')) + '</td>' +
                    '<td class="p-3"><select data-fid="' + f.id + '" class="' + ui.input + ' !py-1.5 !text-xs !w-36"><option value="enabled"' + (state(f.id) === 'enabled' ? ' selected' : '') + '>Enabled</option><option value="coming_soon"' + (state(f.id) === 'coming_soon' ? ' selected' : '') + '>Coming soon</option><option value="hidden"' + (state(f.id) === 'hidden' ? ' selected' : '') + '>Hidden</option></select></td></tr>';
            }).join('') + '</tbody></table></div>';
        const setState = function (fid, value) { KG.updateSettings(function (s) { s.plus.features[fid] = Object.assign({ featured: false, customDescription: '' }, s.plus.features[fid] || {}, { state: value }); }); };
        el.querySelectorAll('[data-fid]').forEach(function (sel) { sel.addEventListener('change', function () { setState(sel.dataset.fid, sel.value); refreshPlus(); renderLaunchAdmin(el); }); });
        el.querySelectorAll('[data-preset]').forEach(function (b) {
            b.addEventListener('click', function () {
                KG.updateSettings(function (s) {
                    feats.forEach(function (f) {
                        const v = b.dataset.preset === 'all' || LAUNCH_SET.indexOf(f.id) > -1 ? 'enabled' : b.dataset.preset === 'soon' ? 'coming_soon' : 'hidden';
                        s.plus.features[f.id] = Object.assign({ featured: false, customDescription: '' }, s.plus.features[f.id] || {}, { state: v });
                    });
                });
                refreshPlus(); renderLaunchAdmin(el); KG.toast('Preset applied — publish to show visitors.');
            });
        });
        el.querySelector('input[name="hub"]').addEventListener('change', function (e) { KG.updateSettings(function (s) { s.plus.hubVisible = e.target.checked; }); });
        el.querySelector('input[name="home"]').addEventListener('change', function (e) { KG.updateSettings(function (s) { s.home.sections.find(function (x) { return x.key === 'kgPlusSection'; }).visible = e.target.checked; }); });
    }
    function refreshPlus() { if (KG.renderPlusHome) KG.renderPlusHome(); applyPlusVisibility(); }

    /* =================== init =================== */
    KG.addAdminTab('home-layout', 'Homepage', renderHomeAdmin);
    KG.addAdminTab('hero-slider', 'Hero slider', renderHeroAdmin);
    KG.addAdminTab('plus-launch', 'Launch mode', renderLaunchAdmin);
    KG.initHome = function () {
        KG.renderHeroSlider();
        KG.applyHomeLayout();
        watchHome();
        applyPlusVisibility();
        // Plus hub honours the published "hub visible" switch
        const openHub = KG.openPlusHub;
        if (openHub) KG.openPlusHub = function () { if (KG.setting('plus.hubVisible') === false) return; return openHub.apply(this, arguments); };
        const lang = window.applyLang;
        window.applyLang = function (l) { lang(l); KG.applyHomeLayout(); };
        KG.onSettings(function () { KG.renderHeroSlider(); KG.applyHomeLayout(); refreshPlus(); });
    };
})();
