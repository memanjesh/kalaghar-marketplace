/* =====================================================================
   KALAGHAR NEPALI COMPLETION (#29) — when the shopper picks नेपाली, any
   shopper-facing site text that was still English is shown in Nepali.
   Works on whole text pieces only (never on product names, seller stories
   or anything typed by people), and puts the English back on switching.
   Admin stays English.
   ===================================================================== */
(function () {
    'use strict';
    const KG = window.KG;
    const EXACT = {
        // announcement bar
        '✨ Empowering 1,200+ Nepali Artisans & Rural Cooperatives': '✨ १,२००+ नेपाली शिल्पी र ग्रामीण सहकारीलाई सशक्त बनाउँदै',
        '✈️ Free Shipping across Nepal over NPR 3,000 | Global Express Delivery': '✈️ रु. ३,००० माथि नेपालभर निःशुल्क ढुवानी | विश्वव्यापी एक्सप्रेस डेलिभरी',
        '📜 100% Certified Authentic Craftsmanship from all over Nepal': '📜 नेपालभरका १००% प्रमाणित मौलिक हस्तकला',
        // header links
        'Gifts': 'उपहार', 'Koseli': 'कोसेली', 'Pashmina & Wool': 'पश्मिना र ऊन', 'Home Favorites': 'घरका मनपर्ने', 'Fashion Finds': 'फेसन', 'Send a Gift Home': 'घरमा उपहार पठाउनुहोस्', 'Categories': 'वर्गहरू', 'Search for anything': 'जे पनि खोज्नुहोस्',
        // hero slides (defaults)
        'Authentic Nepali Heritage Crafts': 'मौलिक नेपाली सम्पदा हस्तकला', 'Handcrafted Heritage, Nepal\'s Identity': 'हस्तनिर्मित सम्पदा, नेपालको पहिचान',
        'Buy directly from master weavers, bronze sculptors and paper artisans. Certified origin & fair trade.': 'सिपालु बुनकर, कांस्य मूर्तिकार र कागज शिल्पीबाट सिधै किन्नुहोस्। प्रमाणित उत्पत्ति र उचित व्यापार।',
        'Explore the catalog': 'सूची हेर्नुहोस्', 'Mustang · Chyangra goats': 'मुस्ताङ · च्याङ्ग्रा बाख्रा', 'Himalayan Pashmina & Wool': 'हिमाली पश्मिना र ऊन',
        'Hand-spun at 14,000 ft and woven on wooden looms.': '१४,००० फिटमा हातले कातिएको र काठको तानमा बुनिएको।', 'Shop pashmina': 'पश्मिना किन्नुहोस्',
        'For Nepalis abroad': 'विदेशमा रहेका नेपालीका लागि', 'Send a gift home this festival': 'यो चाडमा घरमा उपहार पठाउनुहोस्',
        'Pay by card, we deliver to your family anywhere in Nepal with your message.': 'कार्डबाट तिर्नुहोस्, हामी तपाईंको सन्देशसहित नेपालभर परिवारसम्म पुर्‍याउँछौं।', 'Send a gift': 'उपहार पठाउनुहोस्',
        // homepage
        'Handmade in Nepal': 'नेपालमा हस्तनिर्मित', 'Made for your journey': 'तपाईंको यात्राका लागि', 'Beyond the marketplace': 'बजारभन्दा पर', 'More ways to experience Nepali craft': 'नेपाली शिल्प अनुभव गर्ने थप तरिका',
        'Buyer Protection': 'खरिदकर्ता सुरक्षा', 'Tracked cases, evidence, refunds and fair dispute review.': 'उजुरी ट्र्याकिङ, प्रमाण, रिफन्ड र निष्पक्ष विवाद समीक्षा।',
        'Digital Craft Passport': 'डिजिटल शिल्प राहदानी', 'Origin, maker, materials, care and authenticity in one record.': 'उत्पत्ति, शिल्पी, सामग्री, हेरचाह र प्रामाणिकता एउटै अभिलेखमा।',
        'Artisan Experiences': 'शिल्पी अनुभव', 'Book workshops and studio visits with Nepali makers.': 'नेपाली शिल्पीसँग कार्यशाला र स्टुडियो भ्रमण बुक गर्नुहोस्।',
        'Corporate Gifting': 'कर्पोरेट उपहार', 'Branded gift boxes, recipient lists and scheduled delivery.': 'ब्रान्डेड उपहार बाकस, प्राप्तकर्ता सूची र तालिकाबद्ध डेलिभरी।',
        'Craft Encyclopedia': 'शिल्प विश्वकोश', 'Learn techniques, regions, materials and care before buying.': 'किन्नुअघि प्रविधि, क्षेत्र, सामग्री र हेरचाह जान्नुहोस्।',
        'Marketplace Trust Center': 'बजार विश्वास केन्द्र', 'Report safety, counterfeit, listing and conduct concerns.': 'सुरक्षा, नक्कली सामान, सूची र आचरणसम्बन्धी चिन्ता रिपोर्ट गर्नुहोस्।',
        // filters
        'Min NPR': 'न्यूनतम रु.', 'Max NPR': 'अधिकतम रु.', 'Rating': 'मूल्याङ्कन', 'Any rating': 'सबै मूल्याङ्कन', 'Verified': 'प्रमाणित', 'Customizable': 'अनुकूलन', 'In stock': 'स्टकमा',
        'Ships from': 'यहाँबाट पठाइन्छ', 'Anywhere in Nepal': 'नेपालभर', 'Near me': 'मेरो नजिक', 'Nearest first': 'नजिकको पहिले', 'Sort': 'क्रम', 'Featured': 'विशेष', 'Newest': 'नयाँ', 'Top rated': 'उच्च मूल्याङ्कन',
        'Price: low to high': 'मूल्य: कमदेखि बढी', 'Price: high to low': 'मूल्य: बढीदेखि कम',
        // card tags
        'ECO PAPER': 'इको कागज', 'PATAN CRAFT': 'पाटन शिल्प', 'FOOTWEAR': 'जुत्ता', 'BAGS': 'झोला', 'HOME DECOR': 'घर सजावट', 'CLOTHING': 'लुगा', 'ACCESSORIES': 'सामग्री', 'HAND-KNOTTED': 'हाते गाँठो', 'POTE': 'पोते', 'FELT': 'फेल्ट',
        // footer (Classic)
        'Promoting authentic Nepali craftsmanship, empowering local weavers, and delivering heritage goods worldwide.': 'मौलिक नेपाली हस्तकला प्रवर्द्धन गर्दै, स्थानीय बुनकरलाई सशक्त बनाउँदै र सम्पदाका सामान विश्वभर पुर्‍याउँदै।',
        'Support Center': 'सहायता केन्द्र', 'FAQ': 'बारम्बार सोधिने प्रश्न', 'Track My Order': 'अर्डर ट्र्याक गर्नुहोस्', 'Delivery Policy': 'डेलिभरी नीति', 'Return & Refund Policy': 'फिर्ता र रिफन्ड नीति',
        'Purchase Protection': 'खरिद सुरक्षा', 'File a Complaint': 'उजुरी दिनुहोस्', 'WHATSAPP': 'ह्वाट्सएप', 'We accept': 'हामी स्वीकार्छौं', 'Cash': 'नगद', 'Terms': 'सर्तहरू', 'Privacy': 'गोपनीयता', 'Sitemap': 'साइटम्याप',
        'Email address': 'इमेल ठेगाना',
        // product page
        'Heritage Wrap': 'सम्पदा र्‍याप', 'Lokta paper · Dhaka ribbon': 'लोक्ता कागज · ढाका रिबन', 'Signature Box': 'सिग्नेचर बाकस', 'Keepsake box · gift card': 'सम्झनाको बाकस · उपहार कार्ड',
        'Minimal Eco Wrap': 'सामान्य इको र्‍याप', 'Recycled paper · jute twine': 'पुनः प्रयोग गरिएको कागज · जुटको डोरी', 'Quantity': 'परिमाण',
        'Traceable craft story': 'पहिचान गर्न सकिने शिल्प कथा', 'KalaGhar Craft Passport': 'KalaGhar शिल्प राहदानी', 'Maker': 'शिल्पी', 'Place': 'स्थान', 'Technique': 'प्रविधि', 'Making time': 'बनाउन लाग्ने समय',
        'Maker profile verified by KalaGhar. Passport details follow this listing from maker to delivery.': 'शिल्पीको प्रोफाइल KalaGhar ले प्रमाणित गरेको। राहदानीको विवरण शिल्पीदेखि डेलिभरीसम्म यो सूचीसँगै रहन्छ।',
        'Maker profile review in progress. Passport details follow this listing from maker to delivery.': 'शिल्पीको प्रोफाइल जाँच हुँदैछ। राहदानीको विवरण शिल्पीदेखि डेलिभरीसम्म यो सूचीसँगै रहन्छ।',
        'Hand-combed & hand-finished': 'हातले कोरेर हातैले तयार', 'Handloom geometric weave': 'हाते तानको ज्यामितीय बुनाइ', 'Bark-fibre sheet making': 'बोक्राको रेसाबाट कागज बनाउने',
        'Lost-wax casting & hand finishing': 'लस्ट-वाक्स ढलाइ र हाते फिनिसिङ', 'Hand-hammering & tonal tuning': 'हातले पिटेर स्वर मिलाउने', 'Mineral-pigment hand painting': 'खनिज रङले हाते चित्रकारी',
        'Wet felting by hand': 'हातैले भिजाएर फेल्ट बनाउने', 'Small-batch orthodox processing': 'सानो मात्रामा अर्थोडक्स प्रशोधन', 'Traditional bead stringing': 'परम्परागत पोते उनाइ', 'Hand carving': 'हाते कुँदाइ',
        'Tibetan hand-knotting': 'तिब्बती हाते गाँठो', 'Seasonal harvest': 'मौसमी टिपाइ', 'Varies by piece': 'वस्तु अनुसार फरक', 'Your question': 'तपाईंको प्रश्न',
        // checkout
        'Courier delivery': 'कुरियर डेलिभरी', 'Home or office': 'घर वा कार्यालय', 'Hotel delivery': 'होटल डेलिभरी', 'Reception handoff': 'रिसेप्सनमा हस्तान्तरण', 'Partner pickup': 'साझेदार पिकअप',
        'Admin confirms point': 'स्थान हामी पुष्टि गर्छौं', 'Hotel name, booking name, or preferred pickup area': 'होटलको नाम, बुकिङ नाम वा पिकअप क्षेत्र', 'Pathao Courier': 'पठाओ कुरियर',
        'International card (Visa / Mastercard)': 'अन्तर्राष्ट्रिय कार्ड (Visa / Mastercard)', 'Cash on delivery': 'डेलिभरीमा नगद', 'Coupon': 'कुपन',
        // sign-in
        'Customer Sign In': 'ग्राहक साइन इन', 'Create Account': 'खाता बनाउनुहोस्', 'Email Address': 'इमेल ठेगाना', 'Password': 'पासवर्ड', 'Sign In': 'साइन इन', 'Full Name': 'पूरा नाम', 'Your name': 'तपाईंको नाम'
    };
    // Patterns for text with numbers in it
    const DIGITS = '०१२३४५६७८९';
    const RULES = [
        [/^(\d+) items?$/, function (m, n) { return n + ' वस्तु'; }],
        [/^Explore all (\d+) services$/, function (m, n) { return 'सबै ' + n + ' सेवा हेर्नुहोस्'; }],
        [/^© (\d{4}) KalaGhar Marketplace\.?( All rights reserved\.)?$/, function (m, y) { return '© ' + y + ' KalaGhar मार्केटप्लेस।'; }],
        [/^(\d+)–(\d+) (days|weeks)$/, function (m, a, b, u) { return a + '–' + b + (u === 'days' ? ' दिन' : ' हप्ता'); }],
        [/^Nepal — (.+)$/, function (m, r) { return 'नेपाल — ' + r; }],
        [/^(.+), Nepal$/, function (m, r) { return r + ', नेपाल'; }],
        [/^Khalti, eSewa, (.+)$/, function (m) { return m.replace('International card', 'अन्तर्राष्ट्रिय कार्ड').replace('Cash on delivery', 'डेलिभरीमा नगद'); }]
    ];
    void DIGITS;
    let dict = null;
    function build() {
        dict = Object.assign({}, EXACT);
        (KG.CATEGORIES || []).forEach(function (c) { if (c.en && c.ne) dict[c.en] = c.ne; });
        (KG.REGIONS || []).forEach(function (r) { dict[r.en.toUpperCase()] = r.ne; if (BLURBS[r.id]) dict[r.blurb] = BLURBS[r.id]; });
    }
    const BLURBS = {
        mustang: 'उच्च हिमाली च्याङ्ग्रा बाख्राले सबैभन्दा मसिनो पश्मिना रेसा दिन्छ।',
        palpa: 'ढाका तान र तानसेनका तामा-पित्तलका कामको घर।',
        baglung: 'पहाडमा लोक्ताको बोक्रा संकलन गरी हाते कागज बनाइन्छ।',
        kathmandu: 'थाङ्का स्टुडियो, फेल्ट कार्यशाला र इन्द्रचोकका पोते बजार।',
        patan: 'नेवार शिल्पीहरूको शताब्दीयौं पुरानो लस्ट-वाक्स कांस्य ढलाइ।',
        bhaktapur: 'माटाका भाँडा चोक र नेवारी काष्ठकलाका प्रसिद्ध झ्यालहरू।',
        janakpur: 'मिथिला चित्रकला — तराईका महिलाले पुस्तौंदेखि सारेको चम्किलो लोककला।',
        ilam: 'हरिया चिया बगान, जहाँ अर्थोडक्स हिमाली चिया उत्पादन हुन्छ।'
    };
    const ORIG = new WeakMap(), PH = new WeakMap();
    const skip = function (el) { return !el || el.closest('#adminOverlay, script, style, textarea, .product-card h3, [data-kg-no-translate]'); };
    function tr(text) {
        const t = text.trim(); if (!t || !/[A-Za-z]/.test(t)) return null;
        if (dict[t]) return text.replace(t, dict[t]);
        for (let i = 0; i < RULES.length; i++) { const m = t.match(RULES[i][0]); if (m) { const out = RULES[i][1].apply(null, m); return out === t ? null : text.replace(t, out); } }
        return null;
    }
    function translate(root) {
        if (!root || KG.lang() !== 'ne') return;
        if (!dict) build();
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let n; const todo = [];
        while ((n = w.nextNode())) { if (!skip(n.parentElement)) todo.push(n); }
        todo.forEach(function (node) { const out = tr(node.nodeValue); if (out != null) { if (!ORIG.has(node)) ORIG.set(node, node.nodeValue); node.nodeValue = out; } });
        (root.querySelectorAll ? root.querySelectorAll('input[placeholder], textarea[placeholder]') : []).forEach(function (i) {
            if (skip(i)) return; const out = tr(i.placeholder); if (out != null) { if (!PH.has(i)) PH.set(i, i.placeholder); i.placeholder = out; }
        });
    }
    function restore() {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
        while ((n = w.nextNode())) if (ORIG.has(n)) { n.nodeValue = ORIG.get(n); ORIG.delete(n); }
        document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function (i) { if (PH.has(i)) { i.placeholder = PH.get(i); PH.delete(i); } });
    }
    const enabled = function () { return KG.layoutClean ? KG.layoutClean('nepali') : false; };
    KG.translatePage = function () { if (KG.lang() === 'ne' && enabled()) translate(document.body); else restore(); };
    KG.initI18n = function () {
        let pending = false;
        if ('MutationObserver' in window) new MutationObserver(function (muts) {
            if (KG.lang() !== 'ne' || !enabled() || pending) return;
            pending = true;
            requestAnimationFrame(function () { pending = false; muts.length && translate(document.body); });
        }).observe(document.body, { childList: true, subtree: true });
        const al = window.applyLang;
        if (al) window.applyLang = function () { const r = al.apply(this, arguments); setTimeout(KG.translatePage, 0); return r; };
        setTimeout(KG.translatePage, 0);
        KG.onSettings(function () { setTimeout(KG.translatePage, 0); });
    };
})();
