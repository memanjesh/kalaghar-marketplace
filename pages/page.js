/* Shared header/footer + business details for policy pages */
(function () {
    try {
        var t = localStorage.getItem('kg-theme');
        if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
    } catch (e) {}
    // The cookie paragraph follows the analytics switches published from Admin
    function trackerStatement() {
        var el = document.getElementById('kgTrackerStatement'); if (!el || !window.fetch) return;
        fetch('../content/site-settings.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
            var m = s && s.marketing; if (!m || !m.analyticsEnabled) return;
            var parts = [];
            if (m.plausibleDomain) parts.push('Plausible Analytics, which counts visits without cookies');
            if (m.ga4Id) parts.push('Google Analytics, which uses cookies to understand how the site is used');
            if (m.metaPixelId) parts.push('the Meta (Facebook/Instagram) pixel, an advertising tracker that measures our ads');
            if (!parts.length) return;
            el.textContent = 'We use ' + parts.join('; ') + '.' + (m.consentBanner ? ' Cookie-based tools only run if you choose "Allow" in the banner, and you can change your mind by clearing this site\'s data.' : '');
        }).catch(function () {});
    }
    document.addEventListener('DOMContentLoaded', trackerStatement);
    document.addEventListener('DOMContentLoaded', function () {
        var C = window.KG_CONFIG || { business: { complaintOfficer: {} } };
        var b = C.business;
        var pend = 'pending registration';
        var vals = {
            name: b.legalName || b.name, address: b.address, pan: b.pan || pend, reg: b.registrationNo || pend,
            listing: b.docListingNo || pend, email: b.email, phone: b.phone,
            officer: b.complaintOfficer.name || 'to be appointed', officerEmail: b.complaintOfficer.email, officerPhone: b.complaintOfficer.phone,
            effective: b.policyEffectiveDate,
            returnDays: C.protection ? C.protection.returnWindowDays : 7, caseDays: C.protection ? C.protection.caseWindowDays : 30,
            coverage: C.protection ? 'NPR ' + C.protection.coverageNpr.toLocaleString('en-US') : '',
            freeOver: C.shipping ? 'NPR ' + C.shipping.freeDomesticOver.toLocaleString('en-US') : '',
            releaseDays: C.payments ? C.payments.autoReleaseDays : 7,
            commission: C.payments ? Math.round(C.payments.commissionRate * 100) + '%' : '',
            insurance: C.shipping ? Math.round(C.shipping.insuranceRate * 100) + '%' : ''
        };
        document.querySelectorAll('[data-biz]').forEach(function (el) { el.textContent = vals[el.dataset.biz] != null ? vals[el.dataset.biz] : ''; });
        var zones = document.getElementById('zones');
        if (zones && C.shipping) {
            zones.innerHTML = '<tr><th>Destination</th><th>Delivery time</th><th>Starting price</th></tr>' + C.shipping.zones.map(function (z) {
                return '<tr><td>' + z.label + '</td><td>' + z.days + ' business days</td><td>NPR ' + z.base.toLocaleString('en-US') + (z.perKg ? ' + NPR ' + z.perKg.toLocaleString('en-US') + ' per extra kg' : '') + (z.domestic ? ' · free over ' + vals.freeOver : '') + '</td></tr>';
            }).join('');
        }
        document.body.insertAdjacentHTML('afterbegin',
            '<header><div class="in"><a class="logo" href="../index.html"><span class="k">क</span>KalaGhar</a><nav>' +
            '<a href="terms.html">Terms</a><a href="privacy.html">Privacy</a><a href="returns.html">Returns</a><a href="delivery.html">Delivery</a><a href="purchase-protection.html">Protection</a><a href="../index.html#complaint">Complaints</a></nav></div></header>');
        document.body.insertAdjacentHTML('beforeend',
            '<footer><div class="in">&copy; ' + new Date().getFullYear() + ' KalaGhar Marketplace. All rights reserved.</div></footer>');
    });
})();
