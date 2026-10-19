/* KalaGhar editable site content.
   Public content is read from content/site-content.json. Admin publishing uses
   GitHub's Contents API with a repository-scoped token kept only in memory. */
(function () {
    'use strict';

    const REPOSITORY = 'memanjesh/kalaghar-marketplace';
    const CONTENT_PATH = 'content/site-content.json';
    const API = 'https://api.github.com/repos/' + REPOSITORY;
    const DEFAULT_CONTENT = {
        version: 3,
        header: {
            brand: { text: 'KalaGhar', color: '#111827', fontSize: 26, visible: true },
            featuredNav: { visible: true, useThemeBackground: true, backgroundColor: '#ffffff', gap: 32 },
            items: [
                { id: 'artisan-impact', text: '✨ Empowering 1,200+ Nepali Artisans & Rural Cooperatives', color: '#ffffff', fontSize: 12, visible: true },
                { id: 'free-shipping', text: '✈️ Free Shipping across Nepal over NPR 3,000 | Global Express Delivery', color: '#ffffff', fontSize: 12, visible: true },
                { id: 'authentic-craft', text: '📜 100% Certified Authentic Craftsmanship from Kathmandu, Patan & Palpa', color: '#ffffff', fontSize: 12, visible: true }
            ],
            featuredLinks: [
                { id: 'gifts', text: 'Gifts', action: 'gift', target: '', icon: 'fa-gift', color: '#1f2937', fontSize: 15, visible: true },
                { id: 'festival-gifts', text: 'Dashain Gifts', action: 'section', target: 'festival', icon: '', color: '#1f2937', fontSize: 15, visible: true },
                { id: 'pashmina', text: 'Himalayan Pashmina & Wool', action: 'category', target: 'pashmina', icon: '', color: '#1f2937', fontSize: 15, visible: true },
                { id: 'home-favorites', text: 'Home Favorites', action: 'category', target: 'homedecor', icon: '', color: '#1f2937', fontSize: 15, visible: true },
                { id: 'fashion-finds', text: 'Fashion Finds', action: 'category', target: 'clothes', icon: '', color: '#1f2937', fontSize: 15, visible: true },
                { id: 'singing-bowls', text: 'Singing Bowls', action: 'category', target: 'singingbowl', icon: '', color: '#1f2937', fontSize: 15, visible: true },
                { id: 'thangka-paubha', text: 'Thangka & Paubha', action: 'category', target: 'thangka', icon: '', color: '#1f2937', fontSize: 15, visible: true },
                { id: 'send-gift-home', text: 'Send a Gift Home', action: 'section', target: 'send-home', icon: '', color: '#1f2937', fontSize: 15, visible: true }
            ]
        },
        dispatch: {
            visible: true,
            backgroundColor: '#ffffff',
            items: [{ id: 'kathmandu-dispatch', text: 'Order today for dispatch from Kathmandu within 1–2 business days.', color: '#4b5563', fontSize: 12, visible: true }]
        },
        floatingSupport: {
            visible: true,
            position: 'right',
            size: 48,
            gap: 12,
            bottom: 20,
            mobileCollapse: true,
            items: [
                { id: 'support', text: 'Support Center', action: 'support', target: '', icon: 'fa-headset', iconStyle: 'solid', color: '#d97706', visible: true },
                { id: 'call', text: 'Call Support', action: 'call', target: 'tel:+9779851022453', icon: 'fa-phone', iconStyle: 'solid', color: '#b91c1c', visible: true },
                { id: 'whatsapp', text: 'WhatsApp support', action: 'whatsapp', target: 'https://wa.me/9779851022453?text=Namaste%20KalaGhar%2C%20I%20have%20a%20question', icon: 'fa-whatsapp', iconStyle: 'brands', color: '#25d366', visible: true },
                { id: 'chat', text: 'Live chat', action: 'chat', target: '', icon: 'fa-comment-dots', iconStyle: 'solid', color: '#b91c1c', visible: true }
            ]
        },
        catalog: {
            categories: [
                { id: 'pashmina', en: 'Himalayan Pashmina & Wool', ne: 'हिमाली पश्मिना र ऊन', icon: 'fa-mitten', visible: true },
                { id: 'dhaka', en: 'Palpali Dhaka', ne: 'पाल्पाली ढाका', icon: 'fa-shirt', visible: true },
                { id: 'lokta', en: 'Lokta Paper', ne: 'लोक्ता कागज', icon: 'fa-book', visible: true },
                { id: 'metal', en: 'Patan Statues', ne: 'पाटनका मूर्ति', icon: 'fa-om', visible: true },
                { id: 'singingbowl', en: 'Singing Bowls', ne: 'सिङ्गिङ बोल', icon: 'fa-bell', visible: true },
                { id: 'thangka', en: 'Thangka & Paubha', ne: 'थाङ्का र पौभा', icon: 'fa-palette', visible: true },
                { id: 'felt', en: 'Felt Crafts', ne: 'फेल्ट शिल्प', icon: 'fa-circle', visible: true },
                { id: 'tea', en: 'Tea & Spices', ne: 'चिया र मसला', icon: 'fa-mug-hot', visible: true },
                { id: 'beads', en: 'Beads, Pote & Jewelry', ne: 'पोते, मोती र गहना', icon: 'fa-gem', visible: true },
                { id: 'wood', en: 'Wood Carving', ne: 'काष्ठकला', icon: 'fa-tree', visible: true },
                { id: 'rugs', en: 'Rugs & Carpets', ne: 'राडी र गलैंचा', icon: 'fa-rug', visible: true },
                { id: 'shoes', en: 'Shoes', ne: 'जुत्ता', icon: 'fa-shoe-prints', visible: true },
                { id: 'bags', en: 'Bags', ne: 'झोला', icon: 'fa-bag-shopping', visible: true },
                { id: 'homedecor', en: 'Home Decor', ne: 'घर सजावट', icon: 'fa-couch', visible: true },
                { id: 'clothes', en: 'Clothes', ne: 'लुगा', icon: 'fa-vest', visible: true },
                { id: 'accessories', en: 'Accessories', ne: 'सामग्री', icon: 'fa-glasses', visible: true }
            ]
        },
        footer: {
            about: { text: 'Promoting authentic Nepali craftsmanship, empowering local weavers, and delivering heritage goods worldwide.', color: '#ffffff', fontSize: 14, visible: true },
            items: [
                { id: 'support-center', text: 'Support Center', href: '#support', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'faq', text: 'FAQ', href: '#faq', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'track-order', text: 'Track My Order', href: '#account', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'delivery', text: 'Delivery Policy', href: 'pages/delivery.html', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'returns', text: 'Return & Refund Policy', href: 'pages/returns.html', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'purchase-protection', text: 'Purchase Protection', href: 'pages/purchase-protection.html', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'complaint', text: 'File a Complaint', href: '#complaint', color: '#ffffff', fontSize: 14, visible: true }
            ],
            bottom: {
                copyright: { text: '© 2026 KalaGhar Marketplace. All rights reserved.', color: '#ffffff', fontSize: 12, visible: true },
                paymentLabel: { text: 'We accept', color: '#ffffff', fontSize: 10, visible: true },
                payments: [
                    { id: 'visa', text: 'Visa', visible: true },
                    { id: 'mastercard', text: 'Mastercard', visible: true },
                    { id: 'esewa', text: 'eSewa', visible: true },
                    { id: 'khalti', text: 'Khalti', visible: true },
                    { id: 'fonepay', text: 'fonepay', visible: true },
                    { id: 'connectips', text: 'connectIPS', visible: true },
                    { id: 'cash', text: 'Cash', visible: true }
                ],
                links: [
                    { id: 'terms', text: 'Terms', href: 'pages/terms.html', color: '#ffffff', fontSize: 12, visible: true },
                    { id: 'privacy', text: 'Privacy', href: 'pages/privacy.html', color: '#ffffff', fontSize: 12, visible: true },
                    { id: 'sitemap', text: 'Sitemap', href: 'sitemap.xml', color: '#ffffff', fontSize: 12, visible: true },
                    { id: 'admin', text: 'Admin', href: '#admin', color: '#ffffff', fontSize: 12, visible: true }
                ]
            }
        }
    };

    let content = clone(DEFAULT_CONTENT);
    let adminToken = '';
    let adminUser = '';
    let contentSha = '';
    let defaultBranch = 'main';

    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function cleanText(value, max) { return String(value == null ? '' : value).trim().slice(0, max || 240); }
    function cleanColor(value, fallback) { return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback; }
    function cleanSize(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? Math.max(10, Math.min(48, Math.round(n))) : fallback;
    }
    function cleanId(value, prefix, index) {
        const id = String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
        return id || prefix + '-' + (index + 1);
    }
    function cleanHref(value) {
        const href = cleanText(value, 300);
        if (!href) return '#';
        if (/^#[a-z0-9_-]+$/i.test(href)) return href;
        if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
        if (!href.startsWith('//') && /^[a-z0-9][a-z0-9._/-]*(?:#[a-z0-9_-]+)?$/i.test(href)) return href;
        return '#';
    }
    function cleanItem(item, index, prefix, withHref) {
        const source = item && typeof item === 'object' ? item : {};
        const result = {
            id: cleanId(source.id, prefix, index),
            text: cleanText(source.text, 240),
            color: cleanColor(source.color, '#ffffff'),
            fontSize: cleanSize(source.fontSize, 14),
            visible: source.visible !== false
        };
        if (withHref) result.href = cleanHref(source.href);
        return result;
    }
    function cleanPayment(item, index) {
        const source = item && typeof item === 'object' ? item : {};
        return {
            id: cleanId(source.id, 'payment', index),
            text: cleanText(source.text, 40),
            visible: source.visible !== false
        };
    }
    function cleanCategory(item, index) {
        const source = item && typeof item === 'object' ? item : {};
        return {
            id: cleanId(source.id, 'category', index),
            en: cleanText(source.en, 80),
            ne: cleanText(source.ne, 80),
            icon: /^fa-[a-z0-9-]+$/i.test(String(source.icon || '')) ? source.icon : 'fa-border-all',
            visible: source.visible !== false
        };
    }
    function cleanFeatured(item, index) {
        const source = item && typeof item === 'object' ? item : {};
        const actions = ['gift', 'category', 'section', 'link', 'support', 'features'];
        return {
            id: cleanId(source.id, 'featured', index),
            text: cleanText(source.text, 80),
            action: actions.indexOf(source.action) > -1 ? source.action : 'section',
            target: cleanText(source.target, 160),
            icon: /^fa-[a-z0-9-]+$/i.test(String(source.icon || '')) ? source.icon : '',
            color: cleanColor(source.color, '#1f2937'),
            fontSize: cleanSize(source.fontSize, 15),
            emphasis: source.emphasis === true,
            visible: source.visible !== false
        };
    }
    function cleanFloatingAction(item, index) {
        const source = item && typeof item === 'object' ? item : {};
        const actions = ['support', 'call', 'whatsapp', 'chat', 'link'];
        const action = actions.indexOf(source.action) > -1 ? source.action : 'link';
        return {
            id: cleanId(source.id, 'contact', index),
            text: cleanText(source.text, 80),
            action: action,
            target: action === 'support' || action === 'chat' ? '' : cleanHref(source.target),
            icon: /^fa-[a-z0-9-]+$/i.test(String(source.icon || '')) ? source.icon : 'fa-circle-question',
            iconStyle: source.iconStyle === 'brands' ? 'brands' : 'solid',
            color: cleanColor(source.color, '#b91c1c'),
            visible: source.visible !== false
        };
    }
    function sanitize(raw) {
        const source = raw && typeof raw === 'object' ? raw : {};
        const header = source.header && typeof source.header === 'object' ? source.header : {};
        const dispatch = source.dispatch && typeof source.dispatch === 'object' ? source.dispatch : {};
        const floatingSupport = source.floatingSupport && typeof source.floatingSupport === 'object' ? source.floatingSupport : {};
        const catalog = source.catalog && typeof source.catalog === 'object' ? source.catalog : {};
        const footer = source.footer && typeof source.footer === 'object' ? source.footer : {};
        const bottom = footer.bottom && typeof footer.bottom === 'object' ? footer.bottom : {};
        const brandSource = header.brand && typeof header.brand === 'object' ? header.brand : {};
        const aboutSource = footer.about && typeof footer.about === 'object' ? footer.about : {};
        const copyrightSource = bottom.copyright && typeof bottom.copyright === 'object' ? bottom.copyright : {};
        const paymentLabelSource = bottom.paymentLabel && typeof bottom.paymentLabel === 'object' ? bottom.paymentLabel : {};
        return {
            version: 3,
            header: {
                brand: {
                    text: cleanText(brandSource.text || DEFAULT_CONTENT.header.brand.text, 60),
                    color: cleanColor(brandSource.color, DEFAULT_CONTENT.header.brand.color),
                    fontSize: cleanSize(brandSource.fontSize, DEFAULT_CONTENT.header.brand.fontSize),
                    visible: brandSource.visible !== false
                },
                featuredNav: {
                    visible: !header.featuredNav || header.featuredNav.visible !== false,
                    useThemeBackground: !header.featuredNav || header.featuredNav.useThemeBackground !== false,
                    backgroundColor: cleanColor(header.featuredNav && header.featuredNav.backgroundColor, '#ffffff'),
                    gap: Math.max(8, Math.min(64, Number(header.featuredNav && header.featuredNav.gap) || 32))
                },
                items: (Array.isArray(header.items) ? header.items : DEFAULT_CONTENT.header.items).slice(0, 12).map(function (item, index) { return cleanItem(item, index, 'header', false); }),
                featuredLinks: (Array.isArray(header.featuredLinks) ? header.featuredLinks : DEFAULT_CONTENT.header.featuredLinks).slice(0, 16).map(cleanFeatured).filter(function (item) { return item.text; })
            },
            dispatch: {
                visible: dispatch.visible !== false,
                backgroundColor: cleanColor(dispatch.backgroundColor, DEFAULT_CONTENT.dispatch.backgroundColor),
                items: (Array.isArray(dispatch.items) ? dispatch.items : DEFAULT_CONTENT.dispatch.items).slice(0, 8).map(function (item, index) { return cleanItem(item, index, 'dispatch', false); })
            },
            floatingSupport: {
                visible: !source.floatingSupport || floatingSupport.visible !== false,
                position: floatingSupport.position === 'left' ? 'left' : 'right',
                size: Math.max(36, Math.min(72, Number(floatingSupport.size) || DEFAULT_CONTENT.floatingSupport.size)),
                gap: Math.max(4, Math.min(32, Number(floatingSupport.gap) || DEFAULT_CONTENT.floatingSupport.gap)),
                bottom: Math.max(8, Math.min(120, Number(floatingSupport.bottom) || DEFAULT_CONTENT.floatingSupport.bottom)),
                mobileCollapse: floatingSupport.mobileCollapse !== false,
                items: (Array.isArray(floatingSupport.items) ? floatingSupport.items : DEFAULT_CONTENT.floatingSupport.items).slice(0, 8).map(cleanFloatingAction).filter(function (item) { return item.text; })
            },
            catalog: {
                categories: (Array.isArray(catalog.categories) ? catalog.categories : DEFAULT_CONTENT.catalog.categories).slice(0, 40).map(cleanCategory).filter(function (item) { return item.en; })
            },
            footer: {
                about: {
                    text: cleanText(aboutSource.text || DEFAULT_CONTENT.footer.about.text, 500),
                    color: cleanColor(aboutSource.color, DEFAULT_CONTENT.footer.about.color),
                    fontSize: cleanSize(aboutSource.fontSize, DEFAULT_CONTENT.footer.about.fontSize),
                    visible: aboutSource.visible !== false
                },
                items: (Array.isArray(footer.items) ? footer.items : DEFAULT_CONTENT.footer.items).slice(0, 16).map(function (item, index) { return cleanItem(item, index, 'footer', true); }),
                bottom: {
                    copyright: {
                        text: cleanText(copyrightSource.text || DEFAULT_CONTENT.footer.bottom.copyright.text, 160),
                        color: cleanColor(copyrightSource.color, DEFAULT_CONTENT.footer.bottom.copyright.color),
                        fontSize: cleanSize(copyrightSource.fontSize, DEFAULT_CONTENT.footer.bottom.copyright.fontSize),
                        visible: copyrightSource.visible !== false
                    },
                    paymentLabel: {
                        text: cleanText(paymentLabelSource.text || DEFAULT_CONTENT.footer.bottom.paymentLabel.text, 60),
                        color: cleanColor(paymentLabelSource.color, DEFAULT_CONTENT.footer.bottom.paymentLabel.color),
                        fontSize: cleanSize(paymentLabelSource.fontSize, DEFAULT_CONTENT.footer.bottom.paymentLabel.fontSize),
                        visible: paymentLabelSource.visible !== false
                    },
                    payments: (Array.isArray(bottom.payments) ? bottom.payments : DEFAULT_CONTENT.footer.bottom.payments).slice(0, 12).map(cleanPayment),
                    links: (Array.isArray(bottom.links) ? bottom.links : DEFAULT_CONTENT.footer.bottom.links).slice(0, 10).map(function (item, index) { return cleanItem(item, index, 'legal', true); })
                }
            }
        };
    }

    function styleText(el, item) {
        el.textContent = item.text;
        el.style.color = item.color;
        el.style.fontSize = item.fontSize + 'px';
        el.hidden = item.visible === false;
    }
    function apply(next) {
        content = sanitize(next);
        if (window.KG && typeof window.KG.setCategories === 'function') window.KG.setCategories(content.catalog.categories);
        document.querySelectorAll('[data-kg-content="header-brand"]').forEach(function (el) { styleText(el, content.header.brand); });

        const announcements = document.getElementById('kgAnnouncementTrack');
        if (announcements) {
            announcements.replaceChildren();
            const visibleItems = content.header.items.filter(function (item) { return item.visible; });
            visibleItems.concat(visibleItems).forEach(function (item) {
                const span = document.createElement('span');
                span.className = 'flex items-center gap-2';
                styleText(span, item);
                announcements.appendChild(span);
            });
            announcements.closest('[data-kg-section="announcement"]').hidden = visibleItems.length === 0;
        }

        const featured = document.getElementById('kgFeatured');
        if (featured) {
            const featuredNav = featured.closest('nav');
            featuredNav.hidden = !content.header.featuredNav.visible;
            featuredNav.style.backgroundColor = content.header.featuredNav.useThemeBackground ? '' : content.header.featuredNav.backgroundColor;
            featured.style.gap = content.header.featuredNav.gap + 'px';
            featured.replaceChildren();
            content.header.featuredLinks.filter(function (item) { return item.visible; }).forEach(function (item) {
                const li = document.createElement('li'), button = document.createElement('button');
                button.type = 'button'; button.className = 'kg-feat'; button.dataset.featuredAction = item.action;
                if (item.color.toLowerCase() !== '#1f2937') button.style.color = item.color;
                button.style.fontSize = item.fontSize + 'px';
                button.style.fontWeight = item.emphasis ? '800' : '';
                if (item.icon) { const icon = document.createElement('i'); icon.className = 'fa-solid ' + item.icon + ' mr-1.5'; icon.setAttribute('aria-hidden', 'true'); button.appendChild(icon); }
                button.appendChild(document.createTextNode(item.text));
                button.addEventListener('click', function () {
                    if (item.action === 'gift' && window.KG && KG.openGiftMode) return KG.openGiftMode();
                    if (item.action === 'category' && window.KG && KG.goCategory) return KG.goCategory(item.target);
                    if (item.action === 'section') { const section = document.getElementById(item.target.replace(/^#/, '')); if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
                    if (item.action === 'link') window.location.href = cleanHref(item.target);
                    if (item.action === 'support' && window.KG && KG.openSupportCenter) return KG.openSupportCenter();
                    if (item.action === 'features' && window.KG && KG.openPlusHub) return KG.openPlusHub();
                });
                li.appendChild(button); featured.appendChild(li);
            });
            if (window.KG && typeof KG.alignFeatured === 'function') KG.alignFeatured();
        }

        const dispatch = document.getElementById('kgDispatchNotice');
        if (dispatch) {
            const visibleDispatch = content.dispatch.items.filter(function (item) { return item.visible; });
            dispatch.replaceChildren();
            visibleDispatch.forEach(function (item, index) {
                if (index) {
                    const separator = document.createElement('span');
                    separator.className = 'mx-2 opacity-50'; separator.textContent = '•';
                    dispatch.appendChild(separator);
                }
                const span = document.createElement('span'); styleText(span, item); dispatch.appendChild(span);
            });
            dispatch.style.backgroundColor = content.dispatch.backgroundColor;
            dispatch.hidden = !content.dispatch.visible || visibleDispatch.length === 0;
        }

        const float = document.getElementById('kgFloat'), floatActions = document.getElementById('kgFloatActions');
        if (float && floatActions) {
            const cfg = content.floatingSupport;
            const visibleActions = cfg.items.filter(function (item) { return item.visible; });
            float.hidden = !cfg.visible || visibleActions.length === 0;
            float.style.bottom = cfg.bottom + 'px';
            float.style.right = cfg.position === 'right' ? '20px' : 'auto';
            float.style.left = cfg.position === 'left' ? '20px' : 'auto';
            float.classList.toggle('items-end', cfg.position === 'right');
            float.classList.toggle('items-start', cfg.position === 'left');
            floatActions.style.gap = cfg.gap + 'px';
            floatActions.replaceChildren();
            visibleActions.forEach(function (item) {
                const isLink = item.action === 'call' || item.action === 'whatsapp' || item.action === 'link';
                const control = document.createElement(isLink ? 'a' : 'button');
                control.className = 'rounded-full text-white shadow-lg flex items-center justify-center transition hover:scale-105';
                control.style.width = cfg.size + 'px'; control.style.height = cfg.size + 'px'; control.style.backgroundColor = item.color;
                control.title = item.text; control.setAttribute('aria-label', item.text); control.dataset.floatingAction = item.action;
                if (item.action === 'support') control.id = 'kgSupportButton';
                const icon = document.createElement('i'); icon.className = 'fa-' + item.iconStyle + ' ' + item.icon; icon.setAttribute('aria-hidden', 'true'); control.appendChild(icon);
                if (isLink) {
                    control.href = cleanHref(item.target);
                    if (item.action === 'whatsapp' || item.action === 'link') { control.target = '_blank'; control.rel = 'noopener'; }
                } else if (item.action === 'support') {
                    control.type = 'button'; control.addEventListener('click', function () { if (window.KG && KG.openSupportCenter) KG.openSupportCenter(); });
                } else if (item.action === 'chat') {
                    control.type = 'button'; control.addEventListener('click', function () { if (window.toggleChat) window.toggleChat(); });
                }
                floatActions.appendChild(control);
            });
            // Phones: fold the buttons into one so they don't cover the page
            const collapse = cfg.mobileCollapse && visibleActions.length > 1;
            floatActions.classList.toggle('kg-float-collapse', collapse);
            floatActions.classList.remove('is-open');
            if (collapse) {
                const toggle = document.createElement('button');
                toggle.type = 'button'; toggle.className = 'kg-float-toggle rounded-full text-white shadow-lg items-center justify-center';
                toggle.style.width = cfg.size + 'px'; toggle.style.height = cfg.size + 'px'; toggle.style.backgroundColor = visibleActions[0].color;
                toggle.setAttribute('aria-label', 'Contact and support'); toggle.setAttribute('aria-expanded', 'false');
                toggle.innerHTML = '<i class="fa-solid fa-headset" aria-hidden="true"></i>';
                toggle.addEventListener('click', function () {
                    const open = floatActions.classList.toggle('is-open');
                    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                    toggle.innerHTML = '<i class="fa-solid ' + (open ? 'fa-xmark' : 'fa-headset') + '" aria-hidden="true"></i>';
                });
                floatActions.appendChild(toggle);
            }
            const hasChat = visibleActions.some(function (item) { return item.action === 'chat'; });
            const chatPanel = document.getElementById('chatPanel');
            if (!hasChat && chatPanel) { chatPanel.classList.add('hidden'); chatPanel.classList.remove('flex'); }
        }

        const about = document.getElementById('kgFooterAbout');
        if (about) styleText(about, content.footer.about);
        const footerLinks = document.getElementById('kgFooterHelpLinks');
        if (footerLinks) {
            footerLinks.replaceChildren();
            content.footer.items.filter(function (item) { return item.visible; }).forEach(function (item) {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.className = 'kg-flink'; link.href = cleanHref(item.href); link.rel = 'noopener';
                styleText(link, item); li.appendChild(link); footerLinks.appendChild(li);
            });
        }
        const copyright = document.getElementById('kgFooterCopyright');
        if (copyright) styleText(copyright, content.footer.bottom.copyright);
        const paymentLabel = document.getElementById('kgPaymentLabel');
        if (paymentLabel) styleText(paymentLabel, content.footer.bottom.paymentLabel);
        const paymentMethods = document.getElementById('kgPaymentMethods');
        if (paymentMethods) {
            paymentMethods.replaceChildren();
            content.footer.bottom.payments.filter(function (item) { return item.visible && item.text; }).forEach(function (item) {
                const tile = document.createElement('span');
                tile.className = 'kg-payment-tile kg-pay-' + cleanId(item.id, 'payment', 0);
                tile.title = item.text;
                if (item.id === 'visa' || item.id === 'mastercard') {
                    const icon = document.createElement('i');
                    icon.className = 'fa-brands fa-cc-' + item.id; icon.setAttribute('aria-hidden', 'true'); tile.appendChild(icon);
                    const hidden = document.createElement('span'); hidden.className = 'sr-only'; hidden.textContent = item.text; tile.appendChild(hidden);
                } else {
                    if (item.id === 'cash') { const icon = document.createElement('i'); icon.className = 'fa-solid fa-money-bill-1'; icon.setAttribute('aria-hidden', 'true'); tile.appendChild(icon); }
                    tile.appendChild(document.createTextNode(item.text));
                }
                paymentMethods.appendChild(tile);
            });
        }
        const paymentRow = document.getElementById('kgPaymentRow');
        if (paymentRow) paymentRow.hidden = content.footer.bottom.paymentLabel.visible === false && !content.footer.bottom.payments.some(function (item) { return item.visible; });
        const legalLinks = document.getElementById('kgFooterUtilityLinks');
        if (legalLinks) {
            legalLinks.replaceChildren();
            content.footer.bottom.links.filter(function (item) { return item.visible; }).forEach(function (item) {
                const link = document.createElement('a'); link.className = 'kg-flink'; link.href = cleanHref(item.href); link.rel = 'noopener'; styleText(link, item);
                if (item.id === 'admin' || item.href === '#admin') link.addEventListener('click', function (event) { event.preventDefault(); if (window.openAdminPanel) window.openAdminPanel(); });
                legalLinks.appendChild(link);
            });
        }
        window.dispatchEvent(new CustomEvent('kg:content-applied', { detail: clone(content) }));
        return clone(content);
    }

    function headers() {
        return {
            Accept: 'application/vnd.github+json',
            Authorization: 'Bearer ' + adminToken,
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }
    function decodeBase64(value) {
        const binary = atob(String(value || '').replace(/\s/g, ''));
        const bytes = Uint8Array.from(binary, function (char) { return char.charCodeAt(0); });
        return new TextDecoder().decode(bytes);
    }
    function encodeBase64(value) {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
        return btoa(binary);
    }
    async function githubJson(url, options) {
        const response = await fetch(url, options || {});
        const payload = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(payload.message || ('GitHub request failed (' + response.status + ')'));
        return payload;
    }
    async function readFromGitHub() {
        const file = await githubJson(API + '/contents/' + CONTENT_PATH + '?ref=' + encodeURIComponent(defaultBranch), { headers: headers(), cache: 'no-store' });
        contentSha = file.sha;
        return sanitize(JSON.parse(decodeBase64(file.content)));
    }

    const manager = {
        repository: REPOSITORY,
        path: CONTENT_PATH,
        defaults: function () { return clone(DEFAULT_CONTENT); },
        get: function () { return clone(content); },
        apply: apply,
        isAuthenticated: function () { return !!adminToken; },
        user: function () { return adminUser; },
        login: async function (token) {
            adminToken = cleanText(token, 500);
            if (!adminToken) throw new Error('Enter a GitHub access token.');
            try {
                const results = await Promise.all([
                    githubJson('https://api.github.com/user', { headers: headers(), cache: 'no-store' }),
                    githubJson(API, { headers: headers(), cache: 'no-store' })
                ]);
                const repo = results[1];
                if (!repo.permissions || (!repo.permissions.push && !repo.permissions.admin && !repo.permissions.maintain)) {
                    throw new Error('This token does not have write access to ' + REPOSITORY + '.');
                }
                adminUser = results[0].login || 'GitHub admin';
                defaultBranch = repo.default_branch || 'main';
                apply(await readFromGitHub());
                return adminUser;
            } catch (error) {
                manager.logout();
                throw error;
            }
        },
        logout: function () { adminToken = ''; adminUser = ''; contentSha = ''; },
        /* Generic repository files (site settings, product feeds, product pages). */
        readFile: async function (path) {
            if (!adminToken) throw new Error('Sign in first.');
            const response = await fetch(API + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(defaultBranch), { headers: headers(), cache: 'no-store' });
            if (response.status === 404) return null;
            const file = await response.json().catch(function () { return {}; });
            if (!response.ok) throw new Error(file.message || ('GitHub request failed (' + response.status + ')'));
            return { text: decodeBase64(file.content), sha: file.sha };
        },
        // isBase64: pass already-encoded binary (e.g. an uploaded image)
        putFile: async function (path, text, message, isBase64) {
            if (!adminToken) throw new Error('Sign in first.');
            const existing = await manager.readFile(path);
            const result = await githubJson(API + '/contents/' + path.split('/').map(encodeURIComponent).join('/'), {
                method: 'PUT',
                headers: Object.assign({ 'Content-Type': 'application/json' }, headers()),
                body: JSON.stringify({ message: message || ('Update ' + path), content: isBase64 ? text : encodeBase64(text), sha: existing ? existing.sha : undefined, branch: defaultBranch })
            });
            return { commitUrl: result.commit && result.commit.html_url ? result.commit.html_url : '' };
        },
        // Several files in ONE commit (Git Data API). files: [{ path, content }]; content null deletes the file.
        commitFiles: async function (files, message) {
            if (!adminToken) throw new Error('Sign in first.');
            if (!files.length) throw new Error('Nothing to publish.');
            const ref = await githubJson(API + '/git/ref/heads/' + encodeURIComponent(defaultBranch), { headers: headers(), cache: 'no-store' });
            const parent = await githubJson(API + '/git/commits/' + ref.object.sha, { headers: headers(), cache: 'no-store' });
            const jsonHeaders = Object.assign({ 'Content-Type': 'application/json' }, headers());
            const tree = await githubJson(API + '/git/trees', {
                method: 'POST', headers: jsonHeaders,
                body: JSON.stringify({ base_tree: parent.tree.sha, tree: files.map(function (f) { return f.content === null ? { path: f.path, mode: '100644', type: 'blob', sha: null } : { path: f.path, mode: '100644', type: 'blob', content: f.content }; }) })
            });
            const commit = await githubJson(API + '/git/commits', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ message: message, tree: tree.sha, parents: [ref.object.sha] }) });
            await githubJson(API + '/git/refs/heads/' + encodeURIComponent(defaultBranch), { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ sha: commit.sha }) });
            return { commitUrl: commit.html_url || ('https://github.com/' + REPOSITORY + '/commit/' + commit.sha), files: files.length };
        },
        refresh: async function () {
            if (!adminToken) throw new Error('Sign in first.');
            const next = await readFromGitHub(); apply(next); return clone(next);
        },
        save: async function (next) {
            if (!adminToken || !contentSha) throw new Error('Sign in first.');
            const clean = sanitize(next);
            const result = await githubJson(API + '/contents/' + CONTENT_PATH, {
                method: 'PUT',
                headers: Object.assign({ 'Content-Type': 'application/json' }, headers()),
                body: JSON.stringify({
                    message: 'Update site content and contact buttons',
                    content: encodeBase64(JSON.stringify(clean, null, 2) + '\n'),
                    sha: contentSha,
                    branch: defaultBranch
                })
            });
            contentSha = result.content && result.content.sha ? result.content.sha : contentSha;
            apply(clean);
            return { content: clone(clean), commitUrl: result.commit && result.commit.html_url ? result.commit.html_url : '' };
        }
    };

    window.KG_CONTENT = manager;
    document.addEventListener('DOMContentLoaded', function () {
        fetch('content/site-content.json', { cache: 'no-cache' })
            .then(function (response) { if (!response.ok) throw new Error('Content unavailable'); return response.json(); })
            .then(apply)
            .catch(function () { apply(DEFAULT_CONTENT); });
    });
})();
