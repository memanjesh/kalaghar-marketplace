/* =====================================================================
   KALAGHAR SITE CONFIG
   ---------------------------------------------------------------------
   This is the one file to edit with your real business details.
   Anything left empty ('') shows as "pending" on the site instead of
   inventing a value.
   ===================================================================== */
window.KG_CONFIG = {

    /* ---------- Business & legal (E-Commerce Act 2081 footer) ---------- */
    business: {
        name: 'KalaGhar Marketplace',
        legalName: '',                 // Registered company/firm name
        address: 'Kathmandu-14, Nepal',
        pan: '',                       // PAN / VAT number
        registrationNo: '',            // Company / OCR / Ward registration number
        docListingNo: '',              // Dept. of Commerce e-commerce portal listing number
        specialPermits: '',            // Any special permits (leave empty if none)
        email: 'support@kalanepal.com',
        phone: '+977 9851022453',
        whatsapp: '9779851022453',
        complaintOfficer: {
            name: '',                  // Designated grievance / complaint officer
            email: 'support@kalanepal.com',
            phone: '+977 9851022453'
        },
        policyEffectiveDate: '2026-10-19'
    },

    /* ---------- Tax ---------- */
    tax: {
        vatRate: 0.13,                 // 13% VAT
        pricesIncludeVat: true         // Product prices are shown VAT-inclusive
    },

    /* ---------- Currency ---------- */
    currency: {
        base: 'NPR',
        // Fallback rates (1 NPR = x). Live rates load automatically from
        // open.er-api.com when available; these are only used if that fails.
        fallbackRates: { NPR: 1, USD: 0.0072, EUR: 0.0066, GBP: 0.0056, AUD: 0.011, INR: 0.625, JPY: 1.08 },
        liveRatesUrl: 'https://open.er-api.com/v6/latest/NPR'
    },

    /* ---------- Shipping (illustrative rates — replace with your courier quotes) ---------- */
    shipping: {
        freeDomesticOver: 3000,
        zones: [
            { id: 'np-valley', label: 'Nepal — Kathmandu Valley', base: 100, perKg: 0,   days: '1–2', domestic: true },
            { id: 'np-outside', label: 'Nepal — Outside Valley',  base: 200, perKg: 50,  days: '2–5', domestic: true },
            { id: 'in', label: 'India',                           base: 1200, perKg: 600, days: '5–9' },
            { id: 'us', label: 'United States / Canada',          base: 2500, perKg: 1400, days: '5–8' },
            { id: 'eu', label: 'Europe / UK',                     base: 2200, perKg: 1300, days: '5–7' },
            { id: 'au', label: 'Australia / New Zealand',         base: 2400, perKg: 1400, days: '6–9' },
            { id: 'jp', label: 'Japan / Korea',                   base: 2000, perKg: 1100, days: '5–8' },
            { id: 'gulf', label: 'Gulf (UAE, Qatar, Saudi)',      base: 1800, perKg: 1000, days: '5–8' },
            { id: 'row', label: 'Rest of world',                  base: 3000, perKg: 1600, days: '7–14' }
        ],
        insuranceRate: 0.02,           // Optional shipping insurance: 2% of order value
        couriers: {
            domestic: [
                { id: 'ncm', name: 'Nepal Can Move', site: 'https://nepalcanmove.com', apiKey: '' },
                { id: 'pathao', name: 'Pathao Courier', site: 'https://pathao.com/np/', apiKey: '' }
            ],
            international: [
                { id: 'hub', name: 'KalaGhar Export Hub (EMS / express)', site: '' }
            ]
        }
    },

    /* ---------- Payments ----------
       Online payments need a small server (see /server) because merchant
       secret keys must never be put in this public file.
       Set paymentApiBase to where that server runs, e.g. 'https://pay.kalaghar.com'.
       While it is empty, checkout runs in TEST MODE: orders are saved but no
       money is taken.                                                    */
    payments: {
        paymentApiBase: '',
        methods: [
            { id: 'khalti',    name: 'Khalti',      domesticOnly: true },
            { id: 'esewa',     name: 'eSewa',       domesticOnly: true },
            { id: 'fonepay',   name: 'Fonepay QR',  domesticOnly: true },
            { id: 'connectips',name: 'ConnectIPS',  domesticOnly: true },
            { id: 'card',      name: 'International card (Visa / Mastercard)', domesticOnly: false },
            { id: 'cod',       name: 'Cash on delivery', domesticOnly: true }
        ],
        // Days after "delivered" before seller payout auto-releases if buyer doesn't confirm
        autoReleaseDays: 7,
        // Marketplace commission kept by KalaGhar (seller gets the rest)
        commissionRate: 0.10
    },

    /* ---------- Buyer protection ---------- */
    protection: {
        coverageNpr: 30000,            // Max covered per order
        caseWindowDays: 30,
        returnWindowDays: 7
    },

    /* ---------- Coupons (admin can add more in the Admin panel) ---------- */
    coupons: [
        { code: 'NAMASTE10', type: 'percent', value: 10, minOrder: 0,    note: '10% off your first order' },
        { code: 'FESTIVE15', type: 'percent', value: 15, minOrder: 5000, note: '15% off orders over NPR 5,000' },
        { code: 'FREESHIP',  type: 'freeship', value: 0, minOrder: 2000, note: 'Free shipping over NPR 2,000' }
    ],

    /* ---------- Promoted listings ---------- */
    promotion: { pricePerDayNpr: 50 },

    /* ---------- Festival storefront (update dates each year) ---------- */
    festivals: [
        { id: 'teej',      name: 'Teej',            ne: 'तीज',       start: '08-15', end: '09-10', color: 'from-red-700 to-pink-600',   categories: ['clothes', 'accessories', 'dhaka'] },
        { id: 'dashain',   name: 'Dashain',         ne: 'दशैं',       start: '09-20', end: '10-24', color: 'from-red-800 to-amber-600',  categories: ['pashmina', 'dhaka', 'clothes', 'metal'] },
        { id: 'tihar',     name: 'Tihar',           ne: 'तिहार',      start: '10-25', end: '11-15', color: 'from-amber-600 to-orange-500', categories: ['homedecor', 'accessories', 'tea', 'beads'] },
        { id: 'holiday',   name: 'Holiday Gifting', ne: 'चाडपर्व उपहार', start: '11-20', end: '12-31', color: 'from-green-800 to-red-700', categories: ['pashmina', 'singingbowl', 'felt', 'tea'] },
        { id: 'losar',     name: 'Losar',           ne: 'ल्होसार',     start: '01-20', end: '02-28', color: 'from-blue-800 to-amber-600', categories: ['thangka', 'singingbowl', 'rugs'] }
    ],

    /* ---------- Impact page ---------- */
    impact: {
        // Optional starting totals from before the website (leave 0 if none)
        baselinePaidToArtisansNpr: 0,
        baselineArtisans: 0
    },

    /* ---------- Optional AI translation for Nepali voice listings ----------
       URL of your own endpoint that accepts {text, from:'ne', to:'en'} and
       returns {translation}. Leave empty to have admin translate on approval. */
    translateEndpoint: '',

    /* ---------- Database ----------
       Leave empty to keep data in each visitor's browser (testing mode).
       Fill in to switch to a shared Supabase database (see db/schema.sql). */
    database: { supabaseUrl: '', supabaseAnonKey: '' }
};
