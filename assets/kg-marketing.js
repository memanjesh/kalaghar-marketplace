/* =====================================================================
   KALAGHAR MARKETING — #10 Google Shopping / Instagram & Facebook feeds,
   #11 real product web pages for Google (+ sitemap), #12 analytics with
   a consent banner. All published and switched from Admin.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG, esc = KG.esc, ui = KG.ui;
    const M = function (k) { return KG.setting('marketing.' + k); };
    const xml = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]; }); };
    const csv = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"'; };

    /* ---------------------------- shared product data ---------------------------- */
    KG.slugFor = function (p) {
        const base = String(p.name || 'item').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'item';
        return base + '-' + p.id;
    };
    const site = function () { return M('siteUrl'); };
    const absImage = function (src) { if (!src || /^data:/.test(src)) return ''; if (/^https:\/\//.test(src)) return src; return site() + src.replace(/^\.?\//, ''); };
    KG.productUrl = function (p) { return M('seoPagesEnabled') && KG.publishedPages && KG.publishedPages[p.id] ? site() + 'p/' + KG.publishedPages[p.id] + '.html' : site() + '#product-' + p.id; };
    function describe(p) { return [p.description || p.sub, p.materials ? 'Materials: ' + p.materials : '', p.size ? 'Size: ' + p.size : '', 'Handmade in ' + (KG.regionName(p.region) || 'Nepal') + ', Nepal.'].filter(Boolean).join(' '); }
    function inStock(p, key) { return (KG.availableStock ? KG.availableStock(p, key || '') : (p.stock == null ? 1 : p.stock)) > 0; }
    function feedItems() {
        const excluded = M('feedExcluded') || [];
        const items = [];
        KG.products().filter(function (p) { return excluded.indexOf(p.id) === -1; }).forEach(function (p) {
            const shop = (KG.seller(p.sellerId) || {}).shopName || M('feedBrandFallback');
            const base = { id: 'KG-' + p.id, group: '', title: p.name, description: describe(p), link: KG.productUrl(p), image: absImage(p.image), extra: (p.images || []).slice(1, 6).map(absImage).filter(Boolean),
                price: p.price, available: inStock(p), brand: shop, type: KG.catName(p.category), size: '', color: '', placeholder: !!p.placeholder || !absImage(p.image) };
            if (KG.hasVariants && KG.hasVariants(p)) {
                p.variants.forEach(function (v) {
                    const parts = v.key.split('|'); const it = Object.assign({}, base, { id: 'KG-' + p.id + '-' + v.key.replace(/[^a-z0-9]+/gi, '-').toLowerCase(), group: 'KG-' + p.id, title: p.name + ' — ' + parts.join(' / '), price: v.price, available: v.stock > 0 });
                    p.options.forEach(function (o, i) { const n = o.name.toLowerCase(); if (/size|length/.test(n)) it.size = parts[i]; if (/colou?r/.test(n)) it.color = parts[i]; });
                    items.push(it);
                });
            } else items.push(base);
        });
        return items;
    }
    KG.feedItems = feedItems;

    /* =================== #10 PRODUCT FEEDS =================== */
    KG.googleFeed = function () {
        const items = feedItems().filter(function (i) { return !i.placeholder; });
        return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>KalaGhar — handmade in Nepal</title>\n<link>' + xml(site()) + '</link>\n<description>Authentic Nepali crafts sold directly by artisans</description>\n' +
            items.map(function (i) {
                return '<item>\n  <g:id>' + xml(i.id) + '</g:id>\n  <g:title>' + xml(i.title.slice(0, 150)) + '</g:title>\n  <g:description>' + xml(i.description.slice(0, 5000)) + '</g:description>\n  <g:link>' + xml(i.link) + '</g:link>\n  <g:image_link>' + xml(i.image) + '</g:image_link>\n' +
                    i.extra.map(function (x) { return '  <g:additional_image_link>' + xml(x) + '</g:additional_image_link>\n'; }).join('') +
                    '  <g:availability>' + (i.available ? 'in_stock' : 'out_of_stock') + '</g:availability>\n  <g:price>' + Number(i.price).toFixed(2) + ' NPR</g:price>\n  <g:brand>' + xml(i.brand) + '</g:brand>\n  <g:condition>' + xml(M('feedCondition')) + '</g:condition>\n  <g:identifier_exists>no</g:identifier_exists>\n  <g:product_type>' + xml(i.type) + '</g:product_type>\n' +
                    (i.group ? '  <g:item_group_id>' + xml(i.group) + '</g:item_group_id>\n' : '') + (i.size ? '  <g:size>' + xml(i.size) + '</g:size>\n' : '') + (i.color ? '  <g:color>' + xml(i.color) + '</g:color>\n' : '') + '</item>\n';
            }).join('') + '</channel>\n</rss>\n';
    };
    KG.metaFeed = function () {
        const head = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'additional_image_link', 'brand', 'product_type', 'item_group_id', 'size', 'color'];
        return [head.join(',')].concat(feedItems().filter(function (i) { return !i.placeholder; }).map(function (i) {
            return [i.id, i.title.slice(0, 200), i.description.slice(0, 9999), i.available ? 'in stock' : 'out of stock', M('feedCondition'), Number(i.price).toFixed(2) + ' NPR', i.link, i.image, i.extra.join(','), i.brand, i.type, i.group, i.size, i.color].map(csv).join(',');
        })).join('\n') + '\n';
    };
    function renderFeedsAdmin(el) {
        const all = KG.products(), excluded = M('feedExcluded') || [], items = feedItems(), skipped = items.filter(function (i) { return i.placeholder; });
        const authed = window.KG_CONTENT && KG_CONTENT.isAuthenticated();
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Google Shopping, Instagram & Facebook feeds</h3><p class="' + ui.muted + ' mb-4">A product feed is a file that lists your products so Google Shopping and your Instagram/Facebook shop can show them. Publish it, then paste its web address into Google Merchant Center and Meta Commerce Manager once — they re-read it automatically every day.</p>' +
            '<form id="fd-form" class="' + ui.card + ' p-4 grid sm:grid-cols-3 gap-4 mb-4">' + KG.adminField.toggle('feedsEnabled', 'Feeds on', M('feedsEnabled')) + KG.adminField.text('feedBrandFallback', 'Brand when a shop has no name', M('feedBrandFallback')) + KG.adminField.select('feedCondition', 'Condition', M('feedCondition'), [['new', 'New'], ['used', 'Used / vintage']]) + '</form>' +
            '<div class="grid md:grid-cols-2 gap-4 mb-4"><div class="' + ui.card + ' p-4"><p class="text-sm"><strong>' + items.filter(function (i) { return !i.placeholder; }).length + '</strong> feed items from <strong>' + (all.length - excluded.length) + '</strong> products' + (skipped.length ? ' · <span class="text-amber-700">' + skipped.length + ' skipped (no real photo yet)</span>' : '') + '</p>' +
                '<div class="flex flex-wrap gap-2 mt-3"><button type="button" id="fd-g" class="' + ui.btn2 + ' !text-xs"><i class="fa-brands fa-google mr-1"></i>Download Google feed</button><button type="button" id="fd-m" class="' + ui.btn2 + ' !text-xs"><i class="fa-brands fa-meta mr-1"></i>Download Meta feed</button>' +
                '<button type="button" id="fd-pub" class="' + ui.btn + ' !text-xs"' + (authed && M('feedsEnabled') ? '' : ' disabled title="Sign in with your GitHub token and turn feeds on"') + '><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Publish feeds</button></div></div>' +
                '<div class="' + ui.card + ' p-4 text-xs space-y-2"><p><strong>Feed web addresses</strong> (after publishing):</p><p>Google Merchant Center: <code class="break-all">' + esc(site()) + 'feeds/google-merchant.xml</code></p><p>Meta Commerce Manager (Instagram/Facebook): <code class="break-all">' + esc(site()) + 'feeds/meta-catalog.csv</code></p><p class="' + ui.muted + '">Feeds use your own prices in NPR. Re-publish after big catalog changes (or set Merchant Center to fetch daily).</p></div></div>' +
            '<h4 class="font-bold mb-2">Products in the feed</h4><div class="' + ui.card + ' p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">' + all.map(function (p) {
                return '<label class="flex items-center gap-2 text-sm"><input type="checkbox" data-feed="' + p.id + '"' + (excluded.indexOf(p.id) === -1 ? ' checked' : '') + '>' + esc(p.name) + (p.placeholder ? ' <span class="text-[10px] text-amber-700">no photo</span>' : '') + '</label>';
            }).join('') + '</div>';
        KG.bindSettingsForm(el.querySelector('#fd-form'), 'marketing', function () { renderFeedsAdmin(el); });
        el.querySelectorAll('[data-feed]').forEach(function (c) {
            c.addEventListener('change', function () { const id = +c.dataset.feed; KG.updateSettings(function (s) { const ex = s.marketing.feedExcluded.filter(function (x) { return x !== id; }); if (!c.checked) ex.push(id); s.marketing.feedExcluded = ex; }); });
        });
        el.querySelector('#fd-g').addEventListener('click', function () { KG.downloadText('google-merchant.xml', KG.googleFeed(), 'application/xml'); });
        el.querySelector('#fd-m').addEventListener('click', function () { KG.downloadText('meta-catalog.csv', KG.metaFeed(), 'text/csv'); });
        el.querySelector('#fd-pub').addEventListener('click', async function (e) {
            const b = e.currentTarget; b.disabled = true; b.textContent = 'Publishing…';
            try { await KG_CONTENT.commitFiles([{ path: 'feeds/google-merchant.xml', content: KG.googleFeed() }, { path: 'feeds/meta-catalog.csv', content: KG.metaFeed() }], 'Publish product feeds'); KG.toast('Feeds published.'); }
            catch (x) { KG.toast(x.message, 'error'); }
            renderFeedsAdmin(el);
        });
    }

    /* =================== #11 PRODUCT PAGES FOR GOOGLE =================== */
    KG.publishedPages = {};
    function pageHtml(p) {
        const shop = KG.seller(p.sellerId) || {}, url = site() + 'p/' + KG.slugFor(p) + '.html', img = absImage(p.image) || site() + 'assets/icon.svg';
        const desc = describe(p).slice(0, 300), available = inStock(p);
        const r = KG.rating ? KG.rating(p.id) : { count: 0 };
        const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: describe(p), image: [img].concat((p.images || []).slice(1, 5).map(absImage).filter(Boolean)), sku: 'KG-' + p.id, category: KG.catName(p.category), brand: { '@type': 'Brand', name: shop.shopName || 'KalaGhar' }, countryOfOrigin: 'NP', url: url,
            offers: { '@type': 'Offer', url: url, priceCurrency: 'NPR', price: p.price, availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' } };
        if (KG.hasVariants && KG.hasVariants(p)) ld.offers = { '@type': 'AggregateOffer', priceCurrency: 'NPR', lowPrice: p.price, highPrice: Math.max.apply(null, p.variants.map(function (v) { return v.price; })), offerCount: p.variants.length, availability: ld.offers.availability };
        if (r.count) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: r.avg.toFixed(1), reviewCount: r.count };
        const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'KalaGhar', item: site() }, { '@type': 'ListItem', position: 2, name: KG.catName(p.category), item: site() + '#marketplace' }, { '@type': 'ListItem', position: 3, name: p.name, item: url }] };
        const buy = '../index.html#product-' + p.id;
        const rows = [['Materials', p.materials], ['Size', p.size], ['Made in', (KG.regionName(p.region) || '') + ', Nepal'], ['Sold by', shop.shopName], ['Care', p.care]].filter(function (x) { return x[1]; });
        const related = KG.products().filter(function (x) { return x.id !== p.id && x.category === p.category; }).slice(0, 4);
        return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
            '<title>' + esc(p.name) + ' — Handmade in Nepal | KalaGhar</title>\n<meta name="description" content="' + esc(desc) + '">\n<link rel="canonical" href="' + esc(url) + '">\n' +
            '<meta property="og:type" content="product">\n<meta property="og:title" content="' + esc(p.name) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:image" content="' + esc(img) + '">\n<meta property="og:url" content="' + esc(url) + '">\n<meta property="product:price:amount" content="' + p.price + '">\n<meta property="product:price:currency" content="NPR">\n<meta name="twitter:card" content="summary_large_image">\n' +
            '<link rel="icon" href="../assets/icon.svg">\n<link rel="stylesheet" href="../assets/product-page.css">\n' +
            '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n<script type="application/ld+json">' + JSON.stringify(crumbs).replace(/</g, '\\u003c') + '</script>\n</head>\n<body>\n' +
            '<header class="pp-head"><a href="../index.html" class="pp-logo"><span>क</span>KalaGhar</a><a href="' + buy + '" class="pp-btn pp-btn-sm">Shop now</a></header>\n<main class="pp-main">\n' +
            '<nav class="pp-crumbs" aria-label="Breadcrumb"><a href="../index.html">KalaGhar</a> › <a href="../index.html#marketplace">' + esc(KG.catName(p.category)) + '</a> › <span>' + esc(p.name) + '</span></nav>\n' +
            '<article class="pp-grid"><figure class="pp-media"><img src="' + esc(img) + '" alt="' + esc(p.name) + '" width="900" height="675"></figure>\n<div class="pp-info"><p class="pp-cat">' + esc(KG.catName(p.category)) + '</p><h1>' + esc(p.name) + '</h1>' + (p.sub ? '<p class="pp-sub">' + esc(p.sub) + '</p>' : '') +
            '<p class="pp-price">' + (KG.hasVariants && KG.hasVariants(p) ? 'From ' : '') + 'NPR ' + Math.round(p.price).toLocaleString('en-US') + '</p><p class="pp-stock ' + (available ? 'in' : 'out') + '">' + (available ? 'In stock — ships from Nepal' : 'Currently sold out') + '</p>' +
            '<a class="pp-btn" href="' + buy + '">' + (available ? 'Buy on KalaGhar' : 'View & get a restock alert') + '</a>' +
            '<p class="pp-desc">' + esc(p.description || p.sub || '') + '</p><dl class="pp-facts">' + rows.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl>' +
            '<p class="pp-trust">✓ Handmade by a verified Nepali artisan · ✓ Payment held until delivery · ✓ Worldwide shipping</p></div></article>\n' +
            (related.length ? '<section class="pp-related"><h2>More ' + esc(KG.catName(p.category)) + '</h2><ul>' + related.map(function (x) { return '<li><a href="' + KG.slugFor(x) + '.html"><img src="' + esc(absImage(x.image) || '../assets/icon.svg') + '" alt="" loading="lazy" width="300" height="225"><span>' + esc(x.name) + '</span><b>NPR ' + Math.round(x.price).toLocaleString('en-US') + '</b></a></li>'; }).join('') + '</ul></section>\n' : '') +
            '</main>\n<footer class="pp-foot">© ' + new Date().getFullYear() + ' KalaGhar Marketplace · <a href="../pages/delivery.html">Delivery</a> · <a href="../pages/returns.html">Returns</a> · <a href="../pages/privacy.html">Privacy</a></footer>\n</body>\n</html>\n';
    }
    KG.productPageHtml = pageHtml;
    function sitemapXml(products) {
        const today = KG.today(), base = site();
        const urls = [[base, 'daily', '1.0']].concat(['pages/delivery.html', 'pages/returns.html', 'pages/purchase-protection.html', 'pages/export-hub.html', 'pages/terms.html', 'pages/privacy.html'].map(function (u) { return [base + u, 'monthly', '0.3']; }))
            .concat(products.map(function (p) { return [base + 'p/' + KG.slugFor(p) + '.html', 'weekly', '0.8']; }));
        return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(function (u) { return '  <url><loc>' + xml(u[0]) + '</loc><lastmod>' + today + '</lastmod><changefreq>' + u[1] + '</changefreq><priority>' + u[2] + '</priority></url>'; }).join('\n') + '\n</urlset>\n';
    }
    KG.sitemapXml = sitemapXml;
    async function publishPages() {
        const products = KG.products();
        const old = Object.keys(KG.publishedPages).map(function (id) { return 'p/' + KG.publishedPages[id] + '.html'; });
        const files = products.map(function (p) { return { path: 'p/' + KG.slugFor(p) + '.html', content: pageHtml(p) }; });
        const keep = files.map(function (f) { return f.path; });
        old.filter(function (path) { return keep.indexOf(path) === -1; }).forEach(function (path) { files.push({ path: path, content: null }); });   // remove pages of deleted/renamed products
        const index = {}; products.forEach(function (p) { index[p.id] = KG.slugFor(p); });
        files.push({ path: 'content/product-pages.json', content: JSON.stringify({ publishedAt: KG.now(), siteUrl: site(), pages: index }, null, 2) + '\n' });
        files.push({ path: 'sitemap.xml', content: sitemapXml(products) });
        files.push({ path: 'robots.txt', content: 'User-agent: *\nAllow: /\nDisallow: /server/\nDisallow: /db/\n\nSitemap: ' + site() + 'sitemap.xml\n' });
        const r = await KG_CONTENT.commitFiles(files, 'Publish ' + products.length + ' product pages and sitemap');
        KG.publishedPages = index; return r;
    }
    function renderSeoAdmin(el) {
        const products = KG.products(), authed = window.KG_CONTENT && KG_CONTENT.isAuthenticated();
        const published = Object.keys(KG.publishedPages).length;
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Product pages for Google</h3><p class="' + ui.muted + ' mb-4">Products inside the shop open in a pop-up (#product-12), which Google can\'t index well. This publishes a real web page for every product (like <code>p/pure-chyangra-pashmina-shawl-1.html</code>) with its photo, price, description and Google\'s product data, plus an updated sitemap. Shoppers who land on one tap "Buy on KalaGhar".</p>' +
            '<form id="seo-form" class="' + ui.card + ' p-4 grid sm:grid-cols-2 gap-4 mb-4">' + KG.adminField.toggle('seoPagesEnabled', 'Use product pages for sharing & feeds', M('seoPagesEnabled'), 'Share buttons and feeds link to the product pages once published') + KG.adminField.text('siteUrl', 'Your website address', site(), 'type="url" placeholder="https://…/"') + '</form>' +
            '<div class="' + ui.card + ' p-4 mb-4 flex flex-wrap items-center gap-3"><span class="flex-1 min-w-[220px] text-sm">' + (published ? '<i class="fa-solid fa-circle-check text-green-700 mr-1"></i><strong>' + published + '</strong> product pages published.' : '<i class="fa-solid fa-circle-info text-amber-600 mr-1"></i>No product pages published yet.') + ' Re-publish after adding, renaming or repricing products.</span>' +
                '<button type="button" id="seo-pub" class="' + ui.btn + '"' + (authed ? '' : ' disabled title="Sign in with your GitHub token"') + '><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Publish ' + products.length + ' pages + sitemap</button></div>' +
            '<div class="' + ui.card + ' p-4 text-xs mb-4"><strong>After the first publish:</strong> add your site in <a class="underline" href="https://search.google.com/search-console" target="_blank" rel="noopener">Google Search Console</a> and submit <code>' + esc(site()) + 'sitemap.xml</code>. Google usually starts showing new pages within days to a few weeks.</div>' +
            '<div class="' + ui.card + ' overflow-x-auto"><table class="w-full text-sm min-w-[560px]"><thead><tr class="text-left text-xs text-gray-500"><th class="p-3">Product</th><th>Page address</th><th></th></tr></thead><tbody>' + products.map(function (p) {
                const live = KG.publishedPages[p.id] === KG.slugFor(p);
                return '<tr class="border-t border-gray-100 dark:border-gray-800"><td class="p-3">' + esc(p.name) + '</td><td class="text-xs"><code>p/' + esc(KG.slugFor(p)) + '.html</code> ' + (live ? '<span class="text-green-700">published</span>' : '<span class="text-amber-700">not yet</span>') + '</td><td class="pr-3 text-right"><button type="button" data-prev="' + p.id + '" class="text-xs text-red-700 font-semibold">Preview</button></td></tr>';
            }).join('') + '</tbody></table></div>';
        KG.bindSettingsForm(el.querySelector('#seo-form'), 'marketing', function () { renderSeoAdmin(el); });
        el.querySelector('#seo-pub').addEventListener('click', async function (e) {
            const b = e.currentTarget; b.disabled = true; b.textContent = 'Publishing…';
            try { await publishPages(); KG.toast('Product pages and sitemap published.'); } catch (x) { KG.toast(x.message, 'error'); }
            renderSeoAdmin(el);
        });
        el.querySelectorAll('[data-prev]').forEach(function (b) {
            b.addEventListener('click', function () {
                const p = KG.product(+b.dataset.prev);
                const html = pageHtml(p).replace('<head>', '<head><base href="' + location.href.replace(/[^/]*$/, '') + 'p/">');
                const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
            });
        });
    }
    // Use the published page address when sharing a product
    function hookShare() {
        const share = KG.shareProduct; if (!share) return;
        KG.shareProduct = function (id) {
            const p = KG.product(id);
            if (!p || !M('seoPagesEnabled') || !KG.publishedPages[id]) return share.apply(this, arguments);
            const link = KG.productUrl(p);
            if (navigator.share) navigator.share({ title: p.name, text: p.sub, url: link }).catch(function () {});
            else navigator.clipboard.writeText(link).then(function () { KG.toast(KG.tx('Link copied', 'लिङ्क कपी भयो')); });
        };
    }

    /* =================== #12 ANALYTICS =================== */
    const CONSENT_KEY = 'kg-analytics-consent';
    const loaded = { ga: false, plausible: false, pixel: false };
    function consent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
    function script(src, attrs) { const s = document.createElement('script'); s.async = true; s.src = src; Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); }); document.head.appendChild(s); }
    function startAnalytics() {
        if (!M('analyticsEnabled')) return;
        // Plausible is cookie-free, so it doesn't need consent
        const pd = M('plausibleDomain');
        if (pd && !loaded.plausible) { loaded.plausible = true; window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); }; script('https://plausible.io/js/script.js', { 'data-domain': pd }); }
        const needConsent = M('consentBanner');
        if ((M('ga4Id') || M('metaPixelId')) && needConsent && consent() == null) return showBanner();
        if (needConsent && consent() !== 'yes') return;
        const ga = M('ga4Id');
        if (ga && !loaded.ga) {
            loaded.ga = true; window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
            gtag('js', new Date()); gtag('config', ga, { anonymize_ip: true }); script('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga));
        }
        const px = M('metaPixelId');
        if (px && !loaded.pixel) {
            loaded.pixel = true;
            const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
            if (!window._fbq) window._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
            script('https://connect.facebook.net/en_US/fbevents.js'); fbq('init', px); fbq('track', 'PageView');
        }
    }
    function showBanner() {
        if (document.getElementById('kgConsent')) return;
        const b = document.createElement('div'); b.id = 'kgConsent'; b.className = 'kg-consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookie choice');
        b.innerHTML = '<p><strong>' + KG.tx('Help us improve KalaGhar?', 'KalaGhar सुधार्न मद्दत गर्नुहुन्छ?') + '</strong> ' + KG.tx('We\'d like to use analytics' + (M('metaPixelId') ? ' and advertising' : '') + ' cookies to understand visits' + (M('metaPixelId') ? ' and measure our ads' : '') + '. ', 'भ्रमण बुझ्न कुकी प्रयोग गर्न चाहन्छौं। ') + '<a href="pages/privacy.html" class="underline">' + KG.tx('Privacy policy', 'गोपनीयता नीति') + '</a></p><div><button type="button" data-c="no" class="kg-consent-no">' + KG.tx('No thanks', 'पर्दैन') + '</button><button type="button" data-c="yes" class="kg-consent-yes">' + KG.tx('Allow', 'अनुमति दिनुहोस्') + '</button></div>';
        document.body.appendChild(b);
        b.querySelectorAll('[data-c]').forEach(function (x) { x.addEventListener('click', function () { try { localStorage.setItem(CONSENT_KEY, x.dataset.c); } catch (e) {} b.remove(); startAnalytics(); }); });
    }
    function track(name, params) {
        if (!M('analyticsEnabled')) return;
        if (window.gtag && loaded.ga) gtag('event', name, params || {});
        if (window.plausible && loaded.plausible) plausible(name, { props: params && params.item_name ? { item: params.item_name } : {} });
        const fbMap = { view_item: 'ViewContent', add_to_cart: 'AddToCart', purchase: 'Purchase', search: 'Search', begin_checkout: 'InitiateCheckout' };
        if (window.fbq && loaded.pixel && fbMap[name]) fbq('track', fbMap[name], params && params.value != null ? { value: params.value, currency: 'NPR' } : {});
    }
    KG.trackEvent = track;
    function hookEvents() {
        const op = KG.openProduct; KG.openProduct = function (id) { const r = op.apply(this, arguments); const p = KG.product(id); if (p) track('view_item', { currency: 'NPR', value: p.price, item_name: p.name, items: [{ item_id: 'KG-' + p.id, item_name: p.name, price: p.price }] }); return r; };
        const add = KG.addToCart; KG.addToCart = function (id, qty) { const before = KG.cart().length + KG.cart().reduce(function (s, l) { return s + l.qty; }, 0); const r = add.apply(this, arguments); const after = KG.cart().length + KG.cart().reduce(function (s, l) { return s + l.qty; }, 0); const p = KG.product(id); if (p && after > before) track('add_to_cart', { currency: 'NPR', value: p.price * (+qty || 1), item_name: p.name, items: [{ item_id: 'KG-' + p.id, item_name: p.name, price: p.price, quantity: +qty || 1 }] }); return r; };
        const co = KG.openCheckout; if (co) KG.openCheckout = function () { const r = co.apply(this, arguments); track('begin_checkout', { currency: 'NPR' }); return r; };
        const placed = KG.onOrdersPlaced; KG.onOrdersPlaced = function (orders) { if (placed) placed.apply(this, arguments); const total = orders.reduce(function (s, o) { return s + o.total; }, 0); track('purchase', { currency: 'NPR', value: total, transaction_id: orders.map(function (o) { return o.id; }).join(',') }); };
    }
    function renderAnalyticsAdmin(el) {
        const A = KG.adminField;
        const status = function (on, label) { return '<li><i class="fa-solid ' + (on ? 'fa-circle-check text-green-700' : 'fa-circle-minus text-gray-400') + ' mr-1"></i>' + label + '</li>'; };
        el.innerHTML = '<h3 class="font-bold text-lg mb-1">Visitor analytics</h3><p class="' + ui.muted + ' mb-4">See how many people visit, what they look at and buy. Fill in only the services you use. IDs are checked so nothing unsafe is added to your site.</p>' +
            '<form id="an-form" class="grid md:grid-cols-2 gap-4"><div class="' + ui.card + ' p-4 space-y-4">' +
                A.toggle('analyticsEnabled', 'Analytics on', M('analyticsEnabled'), 'Master switch for everything on this page') +
                A.toggle('consentBanner', 'Ask visitors before using cookies', M('consentBanner'), 'Recommended — required for EU/UK visitors. Plausible doesn\'t use cookies so it never needs asking.') + '</div>' +
                '<div class="' + ui.card + ' p-4 space-y-3">' +
                A.text('ga4Id', 'Google Analytics 4 measurement ID', M('ga4Id'), 'placeholder="G-XXXXXXXXXX" pattern="G-[A-Z0-9]{4,15}"') +
                A.text('plausibleDomain', 'Plausible domain (privacy-friendly, paid)', M('plausibleDomain'), 'placeholder="memanjesh.github.io"') +
                A.text('metaPixelId', 'Meta (Facebook/Instagram) pixel ID', M('metaPixelId'), 'placeholder="123456789012345" inputmode="numeric"') +
                '<p class="' + ui.muted + '">Events sent: product views, add to bag, checkout started and purchases (with order value in NPR).</p></div></form>' +
            (M('metaPixelId') ? '<div class="mt-4 text-xs bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-lg p-3"><i class="fa-solid fa-triangle-exclamation mr-1"></i>The Meta pixel is an advertising tracker. Your Privacy Policy page updates its cookie section automatically to say so once you publish.</div>' : '') +
            '<div class="' + ui.card + ' p-4 mt-4 flex flex-wrap items-center gap-4"><ul class="text-sm space-y-1 flex-1">' + status(loaded.ga, 'Google Analytics loaded on this page') + status(loaded.plausible, 'Plausible loaded') + status(loaded.pixel, 'Meta pixel loaded') + '<li class="' + ui.muted + '">Your own consent choice: ' + esc(consent() || 'not chosen') + '</li></ul><button type="button" id="an-reset" class="' + ui.btn2 + ' !text-xs">Reset my cookie choice</button></div>';
        const form = el.querySelector('#an-form');
        form.addEventListener('change', function (e) {
            const t = e.target; if (t.name && t.type !== 'checkbox' && t.value && !t.checkValidity()) KG.toast('That ID doesn\'t look right — check the format.', 'warn');
        });
        KG.bindSettingsForm(form, 'marketing', function () { renderAnalyticsAdmin(el); });
        el.querySelector('#an-reset').addEventListener('click', function () { try { localStorage.removeItem(CONSENT_KEY); } catch (e) {} KG.toast('Cleared — the banner will show on your next page load.'); renderAnalyticsAdmin(el); });
    }

    KG.addAdminTab('feeds', 'Product feeds', renderFeedsAdmin);
    KG.addAdminTab('seo-pages', 'Google product pages', renderSeoAdmin);
    KG.addAdminTab('analytics', 'Analytics', renderAnalyticsAdmin);

    KG.initMarketing = function () {
        hookShare(); hookEvents();
        fetch('content/product-pages.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { KG.publishedPages = j.pages || {}; }).catch(function () {});
        KG.onSettings(startAnalytics);
        startAnalytics();
    };
})();
