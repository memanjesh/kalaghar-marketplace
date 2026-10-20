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
        { key: 'kgStory', label: 'Scroll story “From the hills to your home” (Modern theme)' },
        { key: 'marketplace', label: 'Product catalog' },
        { key: 'kgDiscoveryShelf', label: 'Personal picks (recently viewed)' },
        { key: 'kgBuyAgain', label: 'Buy it again (signed-in shoppers)' },
        { key: 'spotlight', label: 'Featured spotlight' },
        { key: 'craft-of-week', label: 'Craft of the week' },
        { key: 'regions', label: 'Shop by Region map' },
        { key: 'makers', label: 'Meet the Makers' },
        { key: 'kgPhotoWall', label: 'Customer photo wall (Modern theme)' },
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
        delivery: {
            enabled: true, showOnProduct: true, showInCart: true, showAtCheckout: true,
            processingMin: 1, processingMax: 3, cutoffHour: 14,
            nonWorkingDays: [6],            // 0 = Sunday … 6 = Saturday (Nepal's weekly holiday)
            holidays: []                    // closed dates, e.g. Dashain/Tihar: ["2026-10-20", …]
        },
        buyer: {
            savedAddresses: true, rememberPayment: true, buyAgain: true, giftTeaser: true,
            teaserSubject: 'A gift is on its way to you!',
            teaserBody: 'Namaste {recipient}! {sender} has sent you something handmade from Nepal for {occasion}. It should arrive around {arrival}. We won\'t spoil the surprise — keep an eye out for your parcel.\n\nMessage from {sender}: {message}'
        },
        discovery: {
            shipsFromFilter: true, nearMe: true,
            bestseller: true, inCarts: true, popularNow: true, lowStock: true,
            bestsellerMinSales: 3, inCartsMin: 3, popularViews: 10, lowStockMax: 3,
            sellerOnCards: true, cardShopName: true, cardRating: true, cardSales: true, cardSince: true,
            badgeOverrides: {}              // { productId: { force: ['bestseller'], hide: ['inCarts'] } }
        },
        layout: { header: 'classic', home: 'classic', catalog: 'classic', cards: 'classic', product: 'classic', checkout: 'classic', account: 'classic', seller: 'classic', admin: 'classic', buttons: 'classic', darkmode: 'classic', nepali: 'classic', perPage: 8, underPrice: 2000 },
        footer: {
            style: 'classic', palette: 'cream', pattern: true, adminLink: false,
            newsletter: true, newsletterTitle: 'Stories from the hills, in your inbox', newsletterTitleNe: 'पहाडका कथा, तपाईंको इमेलमा', newsletterText: 'New collections, maker stories and festival offers. No spam.', newsletterTextNe: 'नयाँ संग्रह, शिल्पीका कथा र चाडपर्व अफर।',
            trust: true,
            trustItems: [
                { icon: 'fa-hand-holding-heart', text: 'Handmade in Nepal', ne: 'नेपालमा हस्तनिर्मित' },
                { icon: 'fa-shield-halved', text: 'Money held until delivery', ne: 'डेलिभरीसम्म रकम सुरक्षित' },
                { icon: 'fa-earth-asia', text: 'Ships worldwide', ne: 'विश्वभर ढुवानी' }
            ],
            about: 'A marketplace for authentic Nepali crafts, bought directly from the artisans who make them.', aboutNe: 'कारीगरबाट सिधै किनिने प्रामाणिक नेपाली हस्तकलाको बजार।',
            tagline: 'Made with love in Kathmandu 🇳🇵', taglineNe: 'काठमाडौंमा मायाले बनाइएको 🇳🇵',
            socials: { instagram: '', facebook: '', tiktok: '', youtube: '', whatsapp: 'https://wa.me/9779851022453' },
            columns: [
                { title: 'Shop', ne: 'किनमेल', links: [{ text: 'All crafts', ne: 'सबै शिल्प', href: 'kg:all' }, { text: 'Gift Mode', ne: 'उपहार मोड', href: 'kg:giftmode' }, { text: 'Festival gifts', ne: 'चाडपर्व उपहार', href: '#festival' }, { text: 'Shop by region', ne: 'क्षेत्र अनुसार', href: '#regions' }, { text: 'Send a gift home', ne: 'घरमा उपहार पठाउनुहोस्', href: '#send-home' }] },
                { title: 'Sell on KalaGhar', ne: 'KalaGhar मा बेच्नुहोस्', links: [{ text: 'Open your shop', ne: 'पसल खोल्नुहोस्', href: 'kg:sell' }, { text: 'Seller dashboard', ne: 'विक्रेता ड्यासबोर्ड', href: 'kg:seller-dashboard' }, { text: 'Export Hub', ne: 'निर्यात हब', href: 'pages/export-hub.html' }, { text: 'Wholesale', ne: 'थोक', href: '#wholesale' }] },
                { title: 'Help & About', ne: 'सहायता र हाम्रोबारे', links: [{ text: 'Help centre', ne: 'सहायता केन्द्र', href: 'kg:support' }, { text: 'Track my order', ne: 'अर्डर ट्र्याक', href: 'kg:track' }, { text: 'Returns & refunds', ne: 'फिर्ता र रिफन्ड', href: 'pages/returns.html' }, { text: 'Meet the makers', ne: 'शिल्पीहरू', href: '#makers' }, { text: 'Our impact', ne: 'हाम्रो प्रभाव', href: '#impact' }] }
            ],
            classicColumns: [
                { title: 'Shop', ne: 'किनमेल', links: [{ text: 'All Crafts', ne: 'सबै शिल्प', href: 'kg:all' }, { text: 'Gift Mode', ne: 'उपहार मोड', href: 'kg:giftmode' }, { text: 'Festival Gifts', ne: 'चाडपर्व उपहार', href: '#festival' }, { text: 'Shop by Region', ne: 'क्षेत्र अनुसार', href: '#regions' }, { text: 'Send a Gift Home', ne: 'घरमा उपहार पठाउनुहोस्', href: '#send-home' }] },
                { title: 'Sell', ne: 'बेच्नुहोस्', links: [{ text: 'Sell on KalaGhar', ne: 'KalaGhar मा बेच्नुहोस्', href: 'kg:sell' }, { text: 'Seller Dashboard', ne: 'विक्रेता ड्यासबोर्ड', href: 'kg:seller-dashboard' }, { text: 'Export Hub', ne: 'निर्यात हब', href: 'pages/export-hub.html' }, { text: 'Seller Policies', ne: 'विक्रेता नीति', href: 'pages/terms.html#sellers' }, { text: 'Seller Support', ne: 'विक्रेता सहायता', href: 'kg:support' }] },
                { title: 'About', ne: 'हाम्रोबारे', links: [{ text: 'Meet the Makers', ne: 'शिल्पीहरू', href: '#makers' }, { text: 'Our Impact', ne: 'हाम्रो प्रभाव', href: '#impact' }, { text: 'Workshops', ne: 'कार्यशाला', href: '#workshops' }, { text: 'Purchase Protection', ne: 'खरिद सुरक्षा', href: 'pages/purchase-protection.html' }, { text: 'Wholesale & Corporate', ne: 'थोक र कर्पोरेट', href: '#wholesale' }] },
                { title: 'Help', ne: 'सहायता', links: [{ text: 'Help Centre', ne: 'सहायता केन्द्र', href: 'kg:support' }, { text: 'Track My Order', ne: 'अर्डर ट्र्याक', href: 'kg:track' }, { text: 'Delivery', ne: 'डेलिभरी', href: 'pages/delivery.html' }, { text: 'Returns & Refunds', ne: 'फिर्ता र रिफन्ड', href: 'pages/returns.html' }, { text: 'File a Complaint', ne: 'उजुरी दिनुहोस्', href: '#complaint' }] }
            ],
            legal: [{ text: 'Terms', ne: 'सर्तहरू', href: 'pages/terms.html' }, { text: 'Privacy', ne: 'गोपनीयता', href: 'pages/privacy.html' }, { text: 'Delivery', ne: 'डेलिभरी', href: 'pages/delivery.html' }, { text: 'Purchase Protection', ne: 'खरिद सुरक्षा', href: 'pages/purchase-protection.html' }, { text: 'File a complaint', ne: 'उजुरी', href: '#complaint' }],
            payments: true
        },
        theme: {
            active: 'classic',
            modern: {
                fonts: true, headingFont: 'fraunces', bodyFont: 'inter',
                phoneGrid: true, motion: true, tabBar: true,
                calmHome: true, calmHidden: ['hero', 'spotlight', 'craft-of-week', 'why-shop', 'kgPlusSection', 'impact', 'shipping-calc', 'wholesale'],
                patterns: true, patternStyle: 'dhaka',
                story: true, storyTitle: 'From the hills to your home', storySub: 'Every piece on KalaGhar starts in a Nepali village. Scroll to follow its journey.',
                storySteps: [
                    { title: 'It begins at 14,000 ft', text: 'In Mustang, Chyangra goats grow a soft undercoat against the Himalayan winter. Each spring it is combed out by hand.', image: p('11733651') },
                    { title: 'Spun and woven by hand', text: 'Weavers in Palpa and Kathmandu spin the fibre and work it on wooden looms, one pattern at a time.', image: p('6634555') },
                    { title: 'Checked and wrapped', text: 'Every piece gets a Craft Passport with its maker, place and technique, then is wrapped in lokta paper.', image: p('18681553') },
                    { title: 'Delivered to your door', text: 'Your money is held until it arrives safely, then paid straight to the artisan.', image: p('11404647') }
                ],
                makerVideos: true, videos: {},
                map: true,
                photoWall: true, photoWallTitle: 'Loved in homes everywhere', includeReviewPhotos: true, photos: [],
                gallery: 'premium', galleryCategories: ['thangka', 'metal', 'singingbowl', 'pashmina']
            }
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

    const FOOT_ICONS = ['fa-hand-holding-heart', 'fa-shield-halved', 'fa-earth-asia', 'fa-truck-fast', 'fa-gift', 'fa-leaf', 'fa-certificate', 'fa-heart', 'fa-rotate-left', 'fa-headset', 'fa-star', 'fa-lock'];
    const SOCIALS = ['instagram', 'facebook', 'tiktok', 'youtube', 'whatsapp'];
    // Footer links: page sections, site pages, https/mailto/tel links, or built-in actions (kg:…)
    const footHref = function (v) { v = str(v, 300); return /^#[\w-]*$/.test(v) || /^pages\/[\w./#-]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/i.test(v) || /^(mailto|tel):[^\s"'<>]+$/i.test(v) || /^kg:[a-z-]+$/.test(v) ? v : '#'; };
    const footLink = function (x) { x = x || {}; return { text: str(x.text, 40), ne: str(x.ne, 60), href: footHref(x.href) }; };
    const LAYOUT_AREAS = ['header', 'home', 'catalog', 'cards', 'product', 'checkout', 'account', 'seller', 'admin', 'buttons', 'darkmode', 'nepali'];
    KG.LAYOUT_AREAS = LAYOUT_AREAS;
    function sanitizeLayout(l) {
        const out = {}; LAYOUT_AREAS.forEach(function (k) { out[k] = l[k] === 'clean' ? 'clean' : 'classic'; });
        out.perPage = num(l.perPage, 4, 48, 8); out.underPrice = num(l.underPrice, 100, 1000000, 2000);
        return out;
    }
    // Optional text: missing → default, but an admin can clear it on purpose
    const txt = function (v, max, fb) { return v === undefined ? fb : str(v, max); };
    const cleanCols = function (v, fb) { return (Array.isArray(v) ? v : fb).slice(0, 4).map(function (c) { c = c || {}; return { title: str(c.title, 40), ne: str(c.ne, 60), links: (Array.isArray(c.links) ? c.links : []).slice(0, 10).map(footLink).filter(function (l) { return l.text; }) }; }).filter(function (c) { return c.title; }); };
    function sanitizeFooter(f) {
        const d = DEFAULTS.footer, so = f.socials || {};
        const socials = {}; SOCIALS.forEach(function (k) { const v = str(so[k], 300); socials[k] = /^https:\/\/[^\s"'<>]+$/i.test(v) ? v : ''; });
        return {
            style: f.style === 'clean' ? 'clean' : 'classic', palette: ['cream', 'charcoal', 'red'].indexOf(f.palette) > -1 ? f.palette : 'cream',
            pattern: bool(f.pattern, true), adminLink: bool(f.adminLink, false), newsletter: bool(f.newsletter, true),
            newsletterTitle: str(f.newsletterTitle, 80, d.newsletterTitle), newsletterTitleNe: txt(f.newsletterTitleNe, 100, d.newsletterTitleNe), newsletterText: txt(f.newsletterText, 160, d.newsletterText), newsletterTextNe: txt(f.newsletterTextNe, 200, d.newsletterTextNe),
            trust: bool(f.trust, true),
            trustItems: (Array.isArray(f.trustItems) ? f.trustItems : d.trustItems).slice(0, 4).map(function (x) { x = x || {}; return { icon: FOOT_ICONS.indexOf(x.icon) > -1 ? x.icon : 'fa-star', text: str(x.text, 50), ne: str(x.ne, 70) }; }).filter(function (x) { return x.text; }),
            about: txt(f.about, 300, d.about), aboutNe: txt(f.aboutNe, 400, d.aboutNe), tagline: txt(f.tagline, 80, d.tagline), taglineNe: txt(f.taglineNe, 100, d.taglineNe),
            socials: socials,
            columns: cleanCols(f.columns, d.columns),
            classicColumns: cleanCols(f.classicColumns, d.classicColumns),
            legal: (Array.isArray(f.legal) ? f.legal : d.legal).slice(0, 8).map(footLink).filter(function (l) { return l.text; }),
            payments: bool(f.payments, true)
        };
    }
    KG.FOOTER_ICONS = FOOT_ICONS; KG.FOOTER_SOCIALS = SOCIALS;
    const FONTS_H = ['fraunces', 'playfair', 'dm-serif', 'inter'], FONTS_B = ['inter', 'dm-sans', 'manrope'];
    const video = function (v) { v = str(v, 500); return /^https:\/\/[^\s"'<>]+\.(mp4|webm)(\?[^\s"'<>]*)?$/i.test(v) || /^videos\/[\w./-]+\.(mp4|webm)$/i.test(v) ? v : ''; };
    function sanitizeTheme(t) {
        const d = DEFAULTS.theme.modern, m = t.modern || {};
        const sectionKeys = HOME_SECTIONS.map(function (x) { return x.key; });
        const videos = {};
        Object.keys(m.videos || {}).slice(0, 2000).forEach(function (k) { const v = video(m.videos[k]); if (/^\d{1,9}$/.test(k) && v) videos[k] = v; });
        return {
            active: t.active === 'modern' ? 'modern' : 'classic',
            modern: {
                fonts: bool(m.fonts, d.fonts), headingFont: FONTS_H.indexOf(m.headingFont) > -1 ? m.headingFont : d.headingFont, bodyFont: FONTS_B.indexOf(m.bodyFont) > -1 ? m.bodyFont : d.bodyFont,
                phoneGrid: bool(m.phoneGrid, true), motion: bool(m.motion, true), tabBar: bool(m.tabBar, true),
                calmHome: bool(m.calmHome, true),
                calmHidden: (Array.isArray(m.calmHidden) ? m.calmHidden : d.calmHidden).filter(function (k, i, a) { return sectionKeys.indexOf(k) > -1 && a.indexOf(k) === i; }),
                patterns: bool(m.patterns, true), patternStyle: ['dhaka', 'mithila', 'lokta'].indexOf(m.patternStyle) > -1 ? m.patternStyle : 'dhaka',
                story: bool(m.story, true), storyTitle: str(m.storyTitle, 80, d.storyTitle), storySub: str(m.storySub, 200),
                storySteps: (Array.isArray(m.storySteps) ? m.storySteps : d.storySteps).slice(0, 8).map(function (x) { x = x || {}; return { title: str(x.title, 80), text: str(x.text, 300), image: url(x.image) }; }).filter(function (x) { return x.title || x.text; }),
                makerVideos: bool(m.makerVideos, true), videos: videos,
                map: bool(m.map, true),
                photoWall: bool(m.photoWall, true), photoWallTitle: str(m.photoWallTitle, 80, d.photoWallTitle), includeReviewPhotos: bool(m.includeReviewPhotos, true),
                photos: (Array.isArray(m.photos) ? m.photos : []).slice(0, 60).map(function (x, i) { x = x || {}; return { id: id(x.id, 'ph-' + (i + 1)), image: url(x.image), caption: str(x.caption, 140), name: str(x.name, 60), productId: /^\d{1,9}$/.test(String(x.productId)) ? +x.productId : null, visible: x.visible !== false }; }).filter(function (x) { return x.image; }),
                gallery: ['off', 'premium', 'all'].indexOf(m.gallery) > -1 ? m.gallery : 'premium',
                galleryCategories: (Array.isArray(m.galleryCategories) ? m.galleryCategories : d.galleryCategories).map(function (c) { return id(c, ''); }).filter(Boolean).slice(0, 40)
            }
        };
    }
    KG.sanitizeTheme = sanitizeTheme;

    function sanitize(raw) {
        const s = raw && typeof raw === 'object' ? raw : {}, d = DEFAULTS;
        const h = s.home || {}, hero = s.hero || {}, plus = s.plus || {}, sh = s.shopping || {}, m = s.marketing || {}, c = s.courier || {};
        const known = HOME_SECTIONS.map(function (x) { return x.key; });
        let sections = (Array.isArray(h.sections) ? h.sections : []).filter(function (x) { return x && known.indexOf(x.key) > -1; })
            .map(function (x) { return { key: x.key, visible: x.visible !== false, mobile: x.mobile !== false, title: str(x.title, 80) }; });
        d.home.sections.forEach(function (x, i) {
            if (sections.some(function (y) { return y.key === x.key; })) return;
            const prev = i ? d.home.sections[i - 1].key : null, at = prev ? sections.findIndex(function (y) { return y.key === prev; }) : -1;
            sections.splice(at + 1, 0, Object.assign({}, x));
        });
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
        const sender = c.sender || {}, dv = s.delivery || {}, by = s.buyer || {}, ds = s.discovery || {};
        const BADGES = ['bestseller', 'inCarts', 'popularNow', 'lowStock'];
        const overrides = {};
        Object.keys(ds.badgeOverrides || {}).slice(0, 2000).forEach(function (k) {
            const o = ds.badgeOverrides[k] || {}; if (!/^\d{1,9}$/.test(k)) return;
            const f = (o.force || []).filter(function (b) { return BADGES.indexOf(b) > -1; }), h = (o.hide || []).filter(function (b) { return BADGES.indexOf(b) > -1; });
            if (f.length || h.length) overrides[k] = { force: f, hide: h };
        });
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
            delivery: {
                enabled: bool(dv.enabled, true), showOnProduct: bool(dv.showOnProduct, true), showInCart: bool(dv.showInCart, true), showAtCheckout: bool(dv.showAtCheckout, true),
                processingMin: num(dv.processingMin, 0, 60, 1), processingMax: Math.max(num(dv.processingMin, 0, 60, 1), num(dv.processingMax, 0, 90, 3)), cutoffHour: num(dv.cutoffHour, 0, 23, 14),
                nonWorkingDays: (Array.isArray(dv.nonWorkingDays) ? dv.nonWorkingDays : d.delivery.nonWorkingDays).map(Number).filter(function (n) { return n >= 0 && n <= 6; }).filter(function (n, i, a) { return a.indexOf(n) === i; }).slice(0, 6),
                holidays: (Array.isArray(dv.holidays) ? dv.holidays : []).map(date).filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort().slice(0, 120)
            },
            buyer: {
                savedAddresses: bool(by.savedAddresses, true), rememberPayment: bool(by.rememberPayment, true), buyAgain: bool(by.buyAgain, true), giftTeaser: bool(by.giftTeaser, true),
                teaserSubject: str(by.teaserSubject, 120, d.buyer.teaserSubject), teaserBody: str(by.teaserBody, 1200, d.buyer.teaserBody)
            },
            discovery: {
                shipsFromFilter: bool(ds.shipsFromFilter, true), nearMe: bool(ds.nearMe, true),
                bestseller: bool(ds.bestseller, true), inCarts: bool(ds.inCarts, true), popularNow: bool(ds.popularNow, true), lowStock: bool(ds.lowStock, true),
                bestsellerMinSales: num(ds.bestsellerMinSales, 1, 1000, 3), inCartsMin: num(ds.inCartsMin, 1, 1000, 3), popularViews: num(ds.popularViews, 1, 100000, 10), lowStockMax: num(ds.lowStockMax, 1, 50, 3),
                sellerOnCards: bool(ds.sellerOnCards, true), cardShopName: bool(ds.cardShopName, true), cardRating: bool(ds.cardRating, true), cardSales: bool(ds.cardSales, true), cardSince: bool(ds.cardSince, true),
                badgeOverrides: overrides
            },
            layout: sanitizeLayout(s.layout || {}),
            footer: sanitizeFooter(s.footer || {}),
            theme: sanitizeTheme(s.theme || {}),
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
    // How many individual settings differ between the draft and what visitors see
    KG.settingsChangeCount = function () {
        const d = draft(); if (!d) return 0;
        let n = 0;
        (function walk(a, b) {
            if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
                Object.keys(Object.assign({}, a, b)).forEach(function (k) { walk(a[k], b[k]); });
            } else if (JSON.stringify(a) !== JSON.stringify(b)) n++;
        })(d, published);
        return n;
    };
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
            .then(function () { KG.settingsLoaded = true; apply(); refreshPublishBar(); });
    };
    KG.SETTINGS_DEFAULTS = DEFAULTS;
    KG.sanitizeSettings = sanitize;
})();
