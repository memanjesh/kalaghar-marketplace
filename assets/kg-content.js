/* KalaGhar editable site content.
   Public content is read from content/site-content.json. Admin publishing uses
   GitHub's Contents API with a repository-scoped token kept only in memory. */
(function () {
    'use strict';

    const REPOSITORY = 'memanjesh/kalaghar-marketplace';
    const CONTENT_PATH = 'content/site-content.json';
    const API = 'https://api.github.com/repos/' + REPOSITORY;
    const DEFAULT_CONTENT = {
        version: 1,
        header: {
            brand: { text: 'KalaGhar', color: '#111827', fontSize: 26, visible: true },
            items: [
                { id: 'artisan-impact', text: '✨ Empowering 1,200+ Nepali Artisans & Rural Cooperatives', color: '#ffffff', fontSize: 12, visible: true },
                { id: 'free-shipping', text: '✈️ Free Shipping across Nepal over NPR 3,000 | Global Express Delivery', color: '#ffffff', fontSize: 12, visible: true },
                { id: 'authentic-craft', text: '📜 100% Certified Authentic Craftsmanship from Kathmandu, Patan & Palpa', color: '#ffffff', fontSize: 12, visible: true }
            ]
        },
        dispatch: {
            visible: true,
            backgroundColor: '#ffffff',
            items: [{ id: 'kathmandu-dispatch', text: 'Order today for dispatch from Kathmandu within 1–2 business days.', color: '#4b5563', fontSize: 12, visible: true }]
        },
        footer: {
            about: { text: 'Promoting authentic Nepali craftsmanship, empowering local weavers, and delivering heritage goods worldwide.', color: '#ffffff', fontSize: 14, visible: true },
            items: [
                { id: 'faq', text: 'FAQ', href: '#faq', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'track-order', text: 'Track My Order', href: '#account', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'delivery', text: 'Delivery Policy', href: 'pages/delivery.html', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'returns', text: 'Return & Refund Policy', href: 'pages/returns.html', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'purchase-protection', text: 'Purchase Protection', href: 'pages/purchase-protection.html', color: '#ffffff', fontSize: 14, visible: true },
                { id: 'complaint', text: 'File a Complaint', href: '#complaint', color: '#ffffff', fontSize: 14, visible: true }
            ]
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
    function sanitize(raw) {
        const source = raw && typeof raw === 'object' ? raw : {};
        const header = source.header && typeof source.header === 'object' ? source.header : {};
        const dispatch = source.dispatch && typeof source.dispatch === 'object' ? source.dispatch : {};
        const footer = source.footer && typeof source.footer === 'object' ? source.footer : {};
        const brandSource = header.brand && typeof header.brand === 'object' ? header.brand : {};
        const aboutSource = footer.about && typeof footer.about === 'object' ? footer.about : {};
        return {
            version: 1,
            header: {
                brand: {
                    text: cleanText(brandSource.text || DEFAULT_CONTENT.header.brand.text, 60),
                    color: cleanColor(brandSource.color, DEFAULT_CONTENT.header.brand.color),
                    fontSize: cleanSize(brandSource.fontSize, DEFAULT_CONTENT.header.brand.fontSize),
                    visible: brandSource.visible !== false
                },
                items: (Array.isArray(header.items) ? header.items : DEFAULT_CONTENT.header.items).slice(0, 12).map(function (item, index) { return cleanItem(item, index, 'header', false); })
            },
            dispatch: {
                visible: dispatch.visible !== false,
                backgroundColor: cleanColor(dispatch.backgroundColor, DEFAULT_CONTENT.dispatch.backgroundColor),
                items: (Array.isArray(dispatch.items) ? dispatch.items : DEFAULT_CONTENT.dispatch.items).slice(0, 8).map(function (item, index) { return cleanItem(item, index, 'dispatch', false); })
            },
            footer: {
                about: {
                    text: cleanText(aboutSource.text || DEFAULT_CONTENT.footer.about.text, 500),
                    color: cleanColor(aboutSource.color, DEFAULT_CONTENT.footer.about.color),
                    fontSize: cleanSize(aboutSource.fontSize, DEFAULT_CONTENT.footer.about.fontSize),
                    visible: aboutSource.visible !== false
                },
                items: (Array.isArray(footer.items) ? footer.items : DEFAULT_CONTENT.footer.items).slice(0, 16).map(function (item, index) { return cleanItem(item, index, 'footer', true); })
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
                    message: 'Update header, footer and dispatch content',
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
