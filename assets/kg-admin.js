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
        ['content', 'Site content'], ['categories', 'Categories'], ['complaints', 'Complaints'], ['inquiries', 'Inquiries'], ['translations', 'Translations'],
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

    /* ---------------------------- editable site content ---------------------------- */
    let contentDraft = null;
    function contentItemCard(section, item, index, includeHref) {
        return '<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3" data-content-card data-section="' + section + '" data-index="' + index + '">' +
            '<div class="flex items-center justify-between gap-3"><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="visible"' + (item.visible ? ' checked' : '') + '> Show</label><button type="button" data-action="remove" class="text-xs font-semibold text-red-700 dark:text-red-400"><i class="fa-solid fa-trash mr-1"></i>Remove</button></div>' +
            '<div><label class="' + ui.label + '">Text</label><textarea rows="2" maxlength="240" data-field="text" class="' + ui.input + '">' + esc(item.text) + '</textarea></div>' +
            (includeHref ? '<div><label class="' + ui.label + '">Link</label><input maxlength="300" data-field="href" value="' + esc(item.href) + '" class="' + ui.input + '" placeholder="#section or https://…"></div>' : '') +
            '<div class="grid grid-cols-2 gap-3"><div><label class="' + ui.label + '">Text color</label><input type="color" data-field="color" value="' + esc(item.color) + '" class="w-full h-10 rounded border border-gray-300 dark:border-gray-700 bg-transparent p-1"></div>' +
            '<div><label class="' + ui.label + '">Size (px)</label><input type="number" min="10" max="48" data-field="fontSize" value="' + Number(item.fontSize || 14) + '" class="' + ui.input + '"></div></div></div>';
    }
    function styledTextCard(section, title, item, maxLength) {
        return '<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3" data-content-card data-section="' + section + '">' +
            '<div class="flex items-center justify-between gap-3"><strong class="text-sm">' + title + '</strong><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="visible"' + (item.visible ? ' checked' : '') + '> Show</label></div>' +
            '<input maxlength="' + (maxLength || 160) + '" data-field="text" value="' + esc(item.text) + '" class="' + ui.input + '">' +
            '<div class="grid grid-cols-2 gap-3"><div><label class="' + ui.label + '">Text color</label><input type="color" data-field="color" value="' + esc(item.color) + '" class="w-full h-10 rounded border border-gray-300 dark:border-gray-700 bg-transparent p-1"></div>' +
            '<div><label class="' + ui.label + '">Size (px)</label><input type="number" min="10" max="48" data-field="fontSize" value="' + Number(item.fontSize || 12) + '" class="' + ui.input + '"></div></div></div>';
    }
    function paymentCard(item, index) {
        return '<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3" data-content-card data-section="payment" data-index="' + index + '">' +
            '<div class="flex items-center gap-3"><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="visible"' + (item.visible ? ' checked' : '') + '> Show</label>' +
            '<input maxlength="40" aria-label="Payment method name" data-field="text" value="' + esc(item.text) + '" class="' + ui.input + ' flex-1">' +
            '<button type="button" data-action="remove" class="text-xs font-semibold text-red-700 dark:text-red-400" aria-label="Remove payment method"><i class="fa-solid fa-trash"></i></button></div></div>';
    }
    function featuredLinkCard(item, index) {
        const option = function (value, label) { return '<option value="' + value + '"' + (item.action === value ? ' selected' : '') + '>' + label + '</option>'; };
        return '<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3" data-content-card data-section="featured" data-index="' + index + '">' +
            '<div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-3"><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="visible"' + (item.visible ? ' checked' : '') + '> Show</label><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="emphasis"' + (item.emphasis ? ' checked' : '') + '> Bold</label></div><div class="flex gap-1"><button type="button" data-action="move-featured" data-direction="-1" class="text-xs border rounded px-2 py-1" aria-label="Move left"><i class="fa-solid fa-arrow-left"></i></button><button type="button" data-action="move-featured" data-direction="1" class="text-xs border rounded px-2 py-1" aria-label="Move right"><i class="fa-solid fa-arrow-right"></i></button><button type="button" data-action="duplicate-featured" class="text-xs border rounded px-2 py-1" aria-label="Duplicate"><i class="fa-regular fa-copy"></i></button><button type="button" data-action="remove" class="text-xs font-semibold text-red-700 dark:text-red-400 px-2"><i class="fa-solid fa-trash mr-1"></i>Remove</button></div></div>' +
            '<div><label class="' + ui.label + '">Label</label><input maxlength="80" data-field="text" value="' + esc(item.text) + '" class="' + ui.input + '"></div>' +
            '<div class="grid sm:grid-cols-2 gap-3"><div><label class="' + ui.label + '">Action</label><select data-field="action" class="' + ui.input + '">' + option('gift', 'Open Gift Mode') + option('category', 'Open category') + option('section', 'Scroll to section') + option('link', 'Open link') + option('support', 'Open Support Center') + option('features', 'Open all services') + '</select></div>' +
            '<div><label class="' + ui.label + '">Target</label><input maxlength="160" data-field="target" value="' + esc(item.target) + '" class="' + ui.input + '" placeholder="pashmina, send-home, or URL"></div></div>' +
            '<div class="grid grid-cols-3 gap-3"><div><label class="' + ui.label + '">Icon</label><input maxlength="40" data-field="icon" value="' + esc(item.icon) + '" class="' + ui.input + '" placeholder="fa-gift"></div><div><label class="' + ui.label + '">Color</label><input type="color" data-field="color" value="' + esc(item.color) + '" class="w-full h-10 rounded border p-1"></div><div><label class="' + ui.label + '">Size</label><input type="number" min="10" max="48" data-field="fontSize" value="' + Number(item.fontSize || 15) + '" class="' + ui.input + '"></div></div></div>';
    }
    function floatingActionCard(item, index) {
        const option = function (value, label) { return '<option value="' + value + '"' + (item.action === value ? ' selected' : '') + '>' + label + '</option>'; };
        const iconType = function (value, label) { return '<option value="' + value + '"' + (item.iconStyle === value ? ' selected' : '') + '>' + label + '</option>'; };
        return '<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3" data-content-card data-section="floating" data-index="' + index + '">' +
            '<div class="flex flex-wrap items-center justify-between gap-3"><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="visible"' + (item.visible ? ' checked' : '') + '> Show</label><div class="flex gap-1"><button type="button" data-action="move-floating" data-direction="-1" class="text-xs border rounded px-2 py-1" aria-label="Move left"><i class="fa-solid fa-arrow-left"></i></button><button type="button" data-action="move-floating" data-direction="1" class="text-xs border rounded px-2 py-1" aria-label="Move right"><i class="fa-solid fa-arrow-right"></i></button><button type="button" data-action="duplicate-floating" class="text-xs border rounded px-2 py-1" aria-label="Duplicate"><i class="fa-regular fa-copy"></i></button><button type="button" data-action="remove" class="text-xs font-semibold text-red-700 dark:text-red-400 px-2"><i class="fa-solid fa-trash mr-1"></i>Remove</button></div></div>' +
            '<div><label class="' + ui.label + '">Button name</label><input maxlength="80" data-field="text" value="' + esc(item.text) + '" class="' + ui.input + '"></div>' +
            '<div class="grid sm:grid-cols-2 gap-3"><div><label class="' + ui.label + '">Action</label><select data-field="action" class="' + ui.input + '">' + option('support', 'Open Support Center') + option('chat', 'Open live chat') + option('call', 'Call phone number') + option('whatsapp', 'Open WhatsApp') + option('link', 'Open custom link') + '</select></div><div><label class="' + ui.label + '">Destination</label><input maxlength="300" data-field="target" value="' + esc(item.target || '') + '" class="' + ui.input + '" placeholder="tel:+977… or https://wa.me/…"></div></div>' +
            '<div class="grid sm:grid-cols-3 gap-3"><div><label class="' + ui.label + '">Icon</label><input maxlength="40" data-field="icon" value="' + esc(item.icon) + '" class="' + ui.input + '" placeholder="fa-phone"></div><div><label class="' + ui.label + '">Icon type</label><select data-field="iconStyle" class="' + ui.input + '">' + iconType('solid', 'Standard') + iconType('brands', 'Brand — WhatsApp etc.') + '</select></div><div><label class="' + ui.label + '">Button color</label><input type="color" data-field="color" value="' + esc(item.color) + '" class="w-full h-10 rounded border p-1"></div></div></div>';
    }
    function renderContentEditor(el) {
        const d = contentDraft;
        const card = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5';
        el.innerHTML = '<div class="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h3 class="text-lg font-bold">Site content &amp; contact buttons</h3><p class="text-xs text-gray-500 mt-1">Changes preview immediately. Publish creates a commit and GitHub Pages then updates the live site.</p></div><div class="flex flex-wrap gap-2"><button type="button" data-action="reload" class="' + ui.btn2 + ' !py-2 !text-xs">Reload published</button><button type="button" data-action="reset" class="' + ui.btn2 + ' !py-2 !text-xs">Restore defaults</button><button type="button" data-action="save" class="' + ui.btn + ' !py-2 !text-xs"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Publish changes</button></div></div>' +
            '<div id="kgContentStatus" class="hidden mb-4 rounded-lg p-3 text-xs" role="status"></div>' +
            '<div class="grid xl:grid-cols-2 gap-4">' +
            '<section class="' + card + '"><h4 class="font-bold mb-1">Header</h4><p class="text-xs text-gray-500 mb-4">Brand and announcement-bar messages.</p>' +
                '<div data-content-card data-section="brand" class="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 mb-3 space-y-3"><div class="flex items-center justify-between"><strong class="text-sm">Brand name</strong><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="visible"' + (d.header.brand.visible ? ' checked' : '') + '> Show</label></div><input data-field="text" maxlength="60" value="' + esc(d.header.brand.text) + '" class="' + ui.input + '"><div class="grid grid-cols-2 gap-3"><input type="color" aria-label="Brand color" data-field="color" value="' + esc(d.header.brand.color) + '" class="w-full h-10 rounded border p-1"><input type="number" aria-label="Brand size" min="10" max="48" data-field="fontSize" value="' + Number(d.header.brand.fontSize) + '" class="' + ui.input + '"></div></div>' +
                '<div class="space-y-3">' + d.header.items.map(function (item, i) { return contentItemCard('header', item, i, false); }).join('') + '</div><button type="button" data-action="add" data-section="header" class="' + ui.btn2 + ' mt-3 !py-1.5 !text-xs">+ Add header message</button>' +
                '<div class="border-t border-gray-200 dark:border-gray-700 mt-5 pt-5"><h5 class="font-bold text-sm mb-1">Featured navigation</h5><p class="text-xs text-gray-500 mb-3">This is the highlighted horizontal strip below the mobile header. Rename, reorder, duplicate, hide or remove every shortcut.</p><div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 mb-3 grid sm:grid-cols-4 gap-3"><label class="flex items-center gap-2 text-xs font-semibold"><input id="kgFeaturedVisible" type="checkbox"' + (d.header.featuredNav.visible ? ' checked' : '') + '> Show strip</label><label class="flex items-center gap-2 text-xs font-semibold"><input id="kgFeaturedTheme" type="checkbox"' + (d.header.featuredNav.useThemeBackground ? ' checked' : '') + '> Match light/dark theme</label><div><label class="' + ui.label + '">Background</label><input id="kgFeaturedBackground" type="color" value="' + esc(d.header.featuredNav.backgroundColor) + '" class="w-full h-9 rounded border p-1"></div><div><label class="' + ui.label + '">Spacing</label><input id="kgFeaturedGap" type="number" min="8" max="64" value="' + d.header.featuredNav.gap + '" class="' + ui.input + ' !py-1.5"></div></div><div class="space-y-3">' + d.header.featuredLinks.map(featuredLinkCard).join('') + '</div><button type="button" data-action="add" data-section="featured" class="' + ui.btn2 + ' mt-3 !py-1.5 !text-xs">+ Add shortcut</button></div></section>' +
            '<section class="' + card + '"><div class="flex justify-between gap-3"><div><h4 class="font-bold mb-1">Dispatch banner</h4><p class="text-xs text-gray-500 mb-4">Add, edit, remove, or hide dispatch messages.</p></div><label class="flex items-center gap-2 text-xs font-semibold"><input id="kgDispatchVisible" type="checkbox"' + (d.dispatch.visible ? ' checked' : '') + '> Show banner</label></div>' +
                '<div class="mb-3"><label class="' + ui.label + '">Banner background</label><input id="kgDispatchBackground" type="color" value="' + esc(d.dispatch.backgroundColor) + '" class="w-28 h-10 rounded border p-1"></div><div class="space-y-3">' + d.dispatch.items.map(function (item, i) { return contentItemCard('dispatch', item, i, false); }).join('') + '</div><button type="button" data-action="add" data-section="dispatch" class="' + ui.btn2 + ' mt-3 !py-1.5 !text-xs">+ Add dispatch message</button></section>' +
            '<section class="' + card + '"><div class="flex flex-wrap justify-between gap-3"><div><h4 class="font-bold mb-1">Floating contact &amp; support buttons</h4><p class="text-xs text-gray-500 mb-4">Control the Support, Call, WhatsApp, Chat and custom-link buttons shown over the storefront.</p></div><label class="flex items-center gap-2 text-xs font-semibold"><input id="kgFloatingVisible" type="checkbox"' + (d.floatingSupport.visible ? ' checked' : '') + '> Show button group</label><label class="flex items-center gap-2 text-xs font-semibold"><input id="kgFloatingCollapse" type="checkbox"' + (d.floatingSupport.mobileCollapse !== false ? ' checked' : '') + '> On phones, fold into one button</label></div><div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 mb-3 grid sm:grid-cols-4 gap-3"><div><label class="' + ui.label + '">Screen side</label><select id="kgFloatingPosition" class="' + ui.input + '"><option value="right"' + (d.floatingSupport.position === 'right' ? ' selected' : '') + '>Right</option><option value="left"' + (d.floatingSupport.position === 'left' ? ' selected' : '') + '>Left</option></select></div><div><label class="' + ui.label + '">Button size</label><input id="kgFloatingSize" type="number" min="36" max="72" value="' + d.floatingSupport.size + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '">Spacing</label><input id="kgFloatingGap" type="number" min="4" max="32" value="' + d.floatingSupport.gap + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '">Bottom distance</label><input id="kgFloatingBottom" type="number" min="8" max="120" value="' + d.floatingSupport.bottom + '" class="' + ui.input + '"></div></div><div class="space-y-3">' + d.floatingSupport.items.map(floatingActionCard).join('') + '</div><button type="button" data-action="add" data-section="floating" class="' + ui.btn2 + ' mt-3 !py-1.5 !text-xs">+ Add contact button</button></section>' +
            '<section class="' + card + '"><h4 class="font-bold mb-1">Footer introduction</h4><p class="text-xs text-gray-500 mb-4">Edit the text shown below the footer logo.</p><div data-content-card data-section="about" class="space-y-3"><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-field="visible"' + (d.footer.about.visible ? ' checked' : '') + '> Show</label><textarea rows="4" maxlength="500" data-field="text" class="' + ui.input + '">' + esc(d.footer.about.text) + '</textarea><div class="grid grid-cols-2 gap-3"><input type="color" aria-label="About text color" data-field="color" value="' + esc(d.footer.about.color) + '" class="w-full h-10 rounded border p-1"><input type="number" aria-label="About text size" min="10" max="48" data-field="fontSize" value="' + Number(d.footer.about.fontSize) + '" class="' + ui.input + '"></div></div></section>' +
            '<section class="' + card + '"><h4 class="font-bold mb-1">Footer help links</h4><p class="text-xs text-gray-500 mb-4">FAQ is the default label; links can be added, hidden, or removed.</p><div class="space-y-3">' + d.footer.items.map(function (item, i) { return contentItemCard('footer', item, i, true); }).join('') + '</div><button type="button" data-action="add" data-section="footer" class="' + ui.btn2 + ' mt-3 !py-1.5 !text-xs">+ Add footer link</button></section>' +
            '<section class="' + card + '"><h4 class="font-bold mb-1">Footer bottom bar</h4><p class="text-xs text-gray-500 mb-4">Manage the copyright and the centered payment strip.</p><div class="space-y-3">' +
                styledTextCard('copyright', 'Copyright', d.footer.bottom.copyright, 160) +
                styledTextCard('payment-label', 'Payment heading', d.footer.bottom.paymentLabel, 60) +
                '<div class="space-y-2">' + d.footer.bottom.payments.map(paymentCard).join('') + '</div><button type="button" data-action="add" data-section="payment" class="' + ui.btn2 + ' !py-1.5 !text-xs">+ Add payment method</button></div></section>' +
            '<section class="' + card + '"><h4 class="font-bold mb-1">Footer bottom links</h4><p class="text-xs text-gray-500 mb-4">These links stay aligned at the far right. The Admin link is hidden from shoppers unless you turn it on in the Footer tab — you can always open Admin by adding #admin to the site address.</p><div class="space-y-3">' + d.footer.bottom.links.map(function (item, i) { return contentItemCard('legal', item, i, true); }).join('') + '</div><button type="button" data-action="add" data-section="legal" class="' + ui.btn2 + ' mt-3 !py-1.5 !text-xs">+ Add bottom link</button></section></div>';

        function status(message, kind, url) {
            const box = el.querySelector('#kgContentStatus'); box.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'bg-red-50', 'text-red-800', 'bg-amber-50', 'text-amber-900');
            box.classList.add(kind === 'error' ? 'bg-red-50' : kind === 'success' ? 'bg-green-50' : 'bg-amber-50', kind === 'error' ? 'text-red-800' : kind === 'success' ? 'text-green-800' : 'text-amber-900');
            box.textContent = message;
            if (url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.className = 'underline font-semibold ml-2'; a.textContent = 'View commit'; box.appendChild(a); }
        }
        function targetFor(card) {
            if (card.dataset.section === 'brand') return d.header.brand;
            if (card.dataset.section === 'about') return d.footer.about;
            if (card.dataset.section === 'copyright') return d.footer.bottom.copyright;
            if (card.dataset.section === 'payment-label') return d.footer.bottom.paymentLabel;
            const list = listFor(card.dataset.section);
            return list[Number(card.dataset.index)];
        }
        function listFor(section) {
            if (section === 'header') return d.header.items;
            if (section === 'dispatch') return d.dispatch.items;
            if (section === 'featured') return d.header.featuredLinks;
            if (section === 'floating') return d.floatingSupport.items;
            if (section === 'payment') return d.footer.bottom.payments;
            if (section === 'legal') return d.footer.bottom.links;
            return d.footer.items;
        }
        el.querySelectorAll('[data-content-card] [data-field]').forEach(function (input) {
            input.addEventListener(input.type === 'checkbox' || input.type === 'color' ? 'change' : 'input', function () {
                const target = targetFor(input.closest('[data-content-card]'));
                target[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
                window.KG_CONTENT.apply(d);
            });
        });
        el.querySelector('#kgDispatchVisible').addEventListener('change', function (e) { d.dispatch.visible = e.target.checked; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgDispatchBackground').addEventListener('change', function (e) { d.dispatch.backgroundColor = e.target.value; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFeaturedVisible').addEventListener('change', function (e) { d.header.featuredNav.visible = e.target.checked; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFeaturedTheme').addEventListener('change', function (e) { d.header.featuredNav.useThemeBackground = e.target.checked; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFeaturedBackground').addEventListener('change', function (e) { d.header.featuredNav.backgroundColor = e.target.value; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFeaturedGap').addEventListener('input', function (e) { d.header.featuredNav.gap = Math.max(8, Math.min(64, Number(e.target.value) || 32)); window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFloatingVisible').addEventListener('change', function (e) { d.floatingSupport.visible = e.target.checked; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFloatingCollapse').addEventListener('change', function (e) { d.floatingSupport.mobileCollapse = e.target.checked; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFloatingPosition').addEventListener('change', function (e) { d.floatingSupport.position = e.target.value; window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFloatingSize').addEventListener('input', function (e) { d.floatingSupport.size = Math.max(36, Math.min(72, Number(e.target.value) || 48)); window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFloatingGap').addEventListener('input', function (e) { d.floatingSupport.gap = Math.max(4, Math.min(32, Number(e.target.value) || 12)); window.KG_CONTENT.apply(d); });
        el.querySelector('#kgFloatingBottom').addEventListener('input', function (e) { d.floatingSupport.bottom = Math.max(8, Math.min(120, Number(e.target.value) || 20)); window.KG_CONTENT.apply(d); });
        el.querySelectorAll('[data-action="remove"]').forEach(function (button) {
            button.addEventListener('click', function () {
                const cardEl = button.closest('[data-content-card]');
                const list = listFor(cardEl.dataset.section);
                list.splice(Number(cardEl.dataset.index), 1); window.KG_CONTENT.apply(d); renderContentEditor(el);
            });
        });
        el.querySelectorAll('[data-action="move-featured"]').forEach(function (button) {
            button.addEventListener('click', function () { const cardEl = button.closest('[data-content-card]'), from = Number(cardEl.dataset.index), to = from + Number(button.dataset.direction); if (to < 0 || to >= d.header.featuredLinks.length) return; const item = d.header.featuredLinks.splice(from, 1)[0]; d.header.featuredLinks.splice(to, 0, item); window.KG_CONTENT.apply(d); renderContentEditor(el); });
        });
        el.querySelectorAll('[data-action="duplicate-featured"]').forEach(function (button) {
            button.addEventListener('click', function () { const from = Number(button.closest('[data-content-card]').dataset.index), item = JSON.parse(JSON.stringify(d.header.featuredLinks[from])); item.id = item.id + '-copy-' + Date.now().toString(36); item.text = item.text + ' Copy'; d.header.featuredLinks.splice(from + 1, 0, item); window.KG_CONTENT.apply(d); renderContentEditor(el); });
        });
        el.querySelectorAll('[data-action="move-floating"]').forEach(function (button) {
            button.addEventListener('click', function () { const cardEl = button.closest('[data-content-card]'), from = Number(cardEl.dataset.index), to = from + Number(button.dataset.direction); if (to < 0 || to >= d.floatingSupport.items.length) return; const item = d.floatingSupport.items.splice(from, 1)[0]; d.floatingSupport.items.splice(to, 0, item); window.KG_CONTENT.apply(d); renderContentEditor(el); });
        });
        el.querySelectorAll('[data-action="duplicate-floating"]').forEach(function (button) {
            button.addEventListener('click', function () { const from = Number(button.closest('[data-content-card]').dataset.index), item = JSON.parse(JSON.stringify(d.floatingSupport.items[from])); item.id = item.id + '-copy-' + Date.now().toString(36); item.text = item.text + ' Copy'; d.floatingSupport.items.splice(from + 1, 0, item); window.KG_CONTENT.apply(d); renderContentEditor(el); });
        });
        el.querySelectorAll('[data-action="add"]').forEach(function (button) {
            button.addEventListener('click', function () {
                const section = button.dataset.section;
                const list = listFor(section);
                const item = { id: section + '-' + Date.now().toString(36), text: section === 'payment' ? 'Payment' : section === 'footer' || section === 'legal' || section === 'featured' ? 'New link' : 'New message', color: section === 'featured' ? '#1f2937' : '#ffffff', fontSize: section === 'featured' ? 15 : section === 'header' || section === 'dispatch' || section === 'legal' ? 12 : 14, visible: true };
                if (section === 'dispatch') item.color = '#4b5563';
                if (section === 'footer' || section === 'legal') item.href = '#';
                if (section === 'featured') { item.action = 'section'; item.target = 'marketplace'; item.icon = ''; item.emphasis = false; }
                if (section === 'floating') { item.text = 'New contact button'; item.action = 'link'; item.target = '#'; item.icon = 'fa-link'; item.iconStyle = 'solid'; item.color = '#b91c1c'; }
                if (section === 'payment') { delete item.color; delete item.fontSize; }
                list.push(item); window.KG_CONTENT.apply(d); renderContentEditor(el);
            });
        });
        el.querySelector('[data-action="reset"]').addEventListener('click', function () { if (confirm('Restore the default site content and contact buttons in this editor?')) { contentDraft = window.KG_CONTENT.defaults(); window.KG_CONTENT.apply(contentDraft); renderContentEditor(el); } });
        el.querySelector('[data-action="reload"]').addEventListener('click', async function () { try { status('Reloading published content…'); contentDraft = await window.KG_CONTENT.refresh(); renderContentEditor(el); } catch (error) { status(error.message, 'error'); } });
        el.querySelector('[data-action="save"]').addEventListener('click', async function (e) {
            const button = e.currentTarget; button.disabled = true; button.textContent = 'Publishing…';
            try { const result = await window.KG_CONTENT.save(d); contentDraft = result.content; status('Published. GitHub Pages normally updates within a few minutes.', 'success', result.commitUrl); }
            catch (error) { status(error.message || 'Publishing failed.', 'error'); }
            finally { button.disabled = false; button.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-1"></i>Publish changes'; }
        });
    }
    function contentEditor(el) {
        contentDraft = window.KG_CONTENT.get();
        renderContentEditor(el);
    }

    /* ---------------------------- category manager ---------------------------- */
    function categoriesEditor(el) {
        const draft = window.KG_CONTENT.get();
        const categories = draft.catalog.categories;
        function draw(message, kind) {
            el.innerHTML = '<div class="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h3 class="text-lg font-bold">Store categories</h3><p class="text-xs text-gray-500 mt-1">Add, rename, hide, or delete categories across the menus, product forms, and storefront.</p></div><div class="flex gap-2"><button id="cat-add" class="' + ui.btn2 + ' !py-2 !text-xs">+ Add category</button><button id="cat-save" class="' + ui.btn + ' !py-2 !text-xs"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Publish categories</button></div></div>' +
                '<div id="cat-status" class="' + (message ? '' : 'hidden ') + 'mb-4 rounded-lg p-3 text-xs ' + (kind === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800') + '">' + esc(message || '') + '</div>' +
                '<div class="grid lg:grid-cols-2 gap-3">' + categories.map(function (category, index) {
                    const productCount = KG.products().filter(function (product) { return product.category === category.id; }).length;
                    return '<article class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4" data-category-index="' + index + '">' +
                        '<div class="flex items-center justify-between gap-3 mb-3"><div class="flex items-center gap-2"><span class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 flex items-center justify-center"><i class="fa-solid ' + esc(category.icon) + '"></i></span><div><strong class="text-sm">' + esc(category.en) + '</strong><p class="text-[11px] text-gray-500">' + esc(category.id) + ' · ' + productCount + ' product' + (productCount === 1 ? '' : 's') + '</p></div></div>' +
                        '<div class="flex items-center gap-3"><label class="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-category-field="visible"' + (category.visible ? ' checked' : '') + '> Show</label><button type="button" data-delete-category class="text-xs font-semibold text-red-700 dark:text-red-400">Delete</button></div></div>' +
                        '<div class="grid sm:grid-cols-2 gap-3"><div><label class="' + ui.label + '">English name</label><input data-category-field="en" maxlength="80" value="' + esc(category.en) + '" class="' + ui.input + '"></div><div><label class="' + ui.label + '">Nepali name</label><input data-category-field="ne" maxlength="80" value="' + esc(category.ne) + '" class="' + ui.input + '"></div></div>' +
                        '<div class="mt-3"><label class="' + ui.label + '">Icon class</label><input data-category-field="icon" maxlength="40" value="' + esc(category.icon) + '" class="' + ui.input + '" placeholder="fa-gem"><p class="text-[11px] text-gray-500 mt-1">Use a Font Awesome icon such as fa-gem, fa-shirt, or fa-bag-shopping.</p></div></article>';
                }).join('') + '</div>';

            el.querySelectorAll('[data-category-field]').forEach(function (input) {
                input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', function () {
                    const category = categories[Number(input.closest('[data-category-index]').dataset.categoryIndex)];
                    category[input.dataset.categoryField] = input.type === 'checkbox' ? input.checked : input.value;
                    window.KG_CONTENT.apply(draft);
                });
            });
            el.querySelectorAll('[data-delete-category]').forEach(function (button) {
                button.addEventListener('click', function () {
                    const index = Number(button.closest('[data-category-index]').dataset.categoryIndex), category = categories[index];
                    const count = KG.products().filter(function (product) { return product.category === category.id; }).length;
                    if (count) { draw('“' + category.en + '” still has ' + count + ' product' + (count === 1 ? '' : 's') + '. Reassign those products or hide the category instead.', 'error'); return; }
                    if (categories.length === 1) { draw('Keep at least one category in the store.', 'error'); return; }
                    if (!confirm('Delete the category “' + category.en + '”?')) return;
                    categories.splice(index, 1); window.KG_CONTENT.apply(draft); draw('Category removed from this draft. Publish to make it live.', 'success');
                });
            });
            el.querySelector('#cat-add').addEventListener('click', function () {
                let number = categories.length + 1, id = 'new-category-' + number;
                while (categories.some(function (category) { return category.id === id; })) { number += 1; id = 'new-category-' + number; }
                categories.push({ id: id, en: 'New Category', ne: 'नयाँ वर्ग', icon: 'fa-border-all', visible: true });
                window.KG_CONTENT.apply(draft); draw('New category added to this draft. Rename it, then publish.', 'success');
            });
            el.querySelector('#cat-save').addEventListener('click', async function () {
                const button = this; button.disabled = true; button.textContent = 'Publishing…';
                try { await window.KG_CONTENT.save(draft); draw('Categories published. GitHub Pages normally updates within a few minutes.', 'success'); }
                catch (error) { draw(error.message || 'Publishing failed.', 'error'); }
            });
        }
        draw('', 'success');
    }

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
            item(!!(window.KG_CONTENT && window.KG_CONTENT.isAuthenticated()), 'Secure admin publishing', 'The public demo password has been removed. Content publishing now requires repository-scoped GitHub authorization.') +
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

    const RENDER = { content: contentEditor, categories: categoriesEditor, complaints: complaints, inquiries: inquiries, translations: translations, coupons: coupons, payouts: payouts, qr: qr, launch: launch };
    KG.initAdmin = function () { addTabs(); };
})();
