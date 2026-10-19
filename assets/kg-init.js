/* KalaGhar — start all feature modules after the page's own setup has run */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    var KG = window.KG;
    KG.initShop();
    KG.initCheckout();
    KG.initDiscover();
    KG.initAdmin();

    // Re-draw the new sections whenever the language changes
    var origApplyLang = window.applyLang;
    window.applyLang = function (lang) {
        origApplyLang(lang);
        KG.renderDiscover();
        KG.refreshAccountLabel();
        KG.updateCartCount();
    };
    window.applyLang(typeof currentLang !== 'undefined' ? currentLang : 'en');
});
