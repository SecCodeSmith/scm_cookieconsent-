/**
 * scm_cookieconsent — Consent Mode v2 head bootstrap (readable source)
 * Minified output is pasted into views/templates/hook/gcm_bootstrap.tpl.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 */
(function () {
    'use strict';

    var GCM  = window.SCM_GCM_DATA.config;
    var CATS = window.SCM_GCM_DATA.categories;
    var TAGS = window.SCM_GCM_DATA.tags;

    // === 1. dataLayer + gtag() shim BEFORE GTM/gtag.js loads ===
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    if (typeof window.gtag !== 'function') { window.gtag = gtag; }

    // === 2. Read previously stored consent (cookie, then localStorage mirror) ===
    var stored = null;
    var m = document.cookie.match(/(?:^|;)\s*scm_consent=([^;]*)/);
    if (m) { try { stored = JSON.parse(decodeURIComponent(m[1])); } catch (e) {} }
    if (!stored) {
        try { stored = JSON.parse(window.localStorage.getItem('scm_consent')); } catch (e) {}
    }

    // === 3. Project categories onto the 7 v2 signals (OR-combined grants) ===
    function buildPayload(store) {
        var payload = {};
        GCM.signals.forEach(function (sig) { payload[sig] = 'denied'; });
        CATS.forEach(function (cat) {
            if (!cat.signals.length) { return; }
            var granted = cat.required || !!(store && store[cat.id]);
            if (!granted) { return; }
            cat.signals.forEach(function (sig) { payload[sig] = 'granted'; });
        });
        if (GCM.securityGranted) { payload.security_storage = 'granted'; }
        return payload;
    }

    var initial = buildPayload(stored);

    // Expose for the banner JS to reuse
    window.SCM_GCM = { config: GCM, categories: CATS, tags: TAGS, stored: stored };

    // === 4. Consent Mode v2 default — MUST precede any Google tag ===
    if (GCM.enabled) {
        var defaults = {};
        GCM.signals.forEach(function (sig) { defaults[sig] = initial[sig]; });
        if (GCM.waitMs && GCM.waitMs > 0) { defaults.wait_for_update = GCM.waitMs; }

        if (GCM.region && GCM.region.length) {
            // Region-scoped: only listed countries get denied-by-default
            gtag('consent', 'default', Object.assign({}, defaults, { region: GCM.region }));

            // Outside the listed region — full grant (no consent required by law)
            var grants = {};
            GCM.signals.forEach(function (sig) { grants[sig] = 'granted'; });
            gtag('consent', 'default', grants);
        } else {
            gtag('consent', 'default', defaults);
        }

        // Privacy-preserving extras
        if (GCM.adsRedaction)   { gtag('set', 'ads_data_redaction', true); }
        if (GCM.urlPassthrough) { gtag('set', 'url_passthrough',    true); }

        // Returning visitor: also push an UPDATE. External marketing modules
        // (e.g. TagConcierge GTM) emit their own consent 'default' later in
        // the page — an update outranks any default, so the stored choice
        // survives regardless of snippet order.
        if (stored) { gtag('consent', 'update', initial); }
    }

    // === 5. Meta Pixel — script is NOT loaded until ad consent is granted ===
    // (Stricter than fbq('consent','revoke') alone: no request leaves the
    //  browser before consent — UODO/EROD 5/2020 compliant.)
    var metaLoaded = false;

    function loadMetaPixel() {
        if (metaLoaded || !TAGS.metaPixelId) { return; }
        metaLoaded = true;
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) { return; }
            n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) { f._fbq = n; }
            n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
            t = b.createElement(e); t.async = true; t.src = v;
            s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('consent', 'grant');
        window.fbq('init', TAGS.metaPixelId);
        window.fbq('track', 'PageView');
    }

    function applyMetaConsent(payload) {
        if (!TAGS.metaPixelId) { return; }
        if (payload.ad_storage === 'granted') {
            if (metaLoaded && window.fbq) { window.fbq('consent', 'grant'); }
            else { loadMetaPixel(); }
        } else if (metaLoaded && window.fbq) {
            window.fbq('consent', 'revoke');
        }
    }

    // === 6. Public update API — called by the banner after a user choice ===
    window.SCM_GCM.update = function (storeObj) {
        var payload = buildPayload(storeObj);
        if (GCM.enabled) { gtag('consent', 'update', payload); }
        applyMetaConsent(payload);
        // Custom event for GTM triggers (fire tags on consent change)
        window.dataLayer.push({ event: 'scm_consent_update', scm_consent: payload });
    };

    // === 7+8. Google tag injection — deferred to DOMContentLoaded ===
    // This bootstrap is printed FIRST in <head>, so at execution time it
    // cannot see snippets that other marketing modules print after it.
    // Deferring to DOMContentLoaded lets the runtime dedup check observe the
    // whole document: if another module already pulled gtm.js / gtag.js, we
    // skip ours (consent default/update governs its tags anyway). Server-side
    // "installed module" detection proved unreliable — an installed module is
    // not necessarily an emitting one.
    function injectGoogleTags() {
        if (!GCM.enabled) { return; }

        var hasGtm = !!window.google_tag_manager
            || !!document.querySelector('script[src*="googletagmanager.com/gtm.js?"]');

        // GTM — the preferred path. No <noscript> iframe on purpose: without
        // JS no consent can be given, so it would fire without a legal basis.
        if (TAGS.gtmId && !hasGtm) {
            (function (w, d, s, l, i) {
                w[l] = w[l] || [];
                w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                var f = d.getElementsByTagName(s)[0], j = d.createElement(s);
                j.async = true;
                j.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(i);
                f.parentNode.insertBefore(j, f);
            })(window, document, 'script', 'dataLayer', TAGS.gtmId);
            return;
        }

        // gtag.js direct — FALLBACK ONLY when no GTM container exists at all.
        // With GTM present, GA4/Ads tags belong in the container — loading
        // gtag.js next to it double-counts.
        if ((TAGS.ga4Id || TAGS.adsId) && !TAGS.gtmId && !hasGtm
            && !document.querySelector('script[src*="googletagmanager.com/gtag/js?"]')) {
            var gs = document.createElement('script');
            gs.async = true;
            gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(TAGS.ga4Id || TAGS.adsId);
            var first = document.getElementsByTagName('script')[0];
            first.parentNode.insertBefore(gs, first);

            gtag('js', new Date());
            if (TAGS.ga4Id) { gtag('config', TAGS.ga4Id); }
            if (TAGS.adsId) { gtag('config', TAGS.adsId); }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectGoogleTags);
    } else {
        injectGoogleTags();
    }

    // === 9. Returning visitor with stored consent → apply Meta immediately ===
    applyMetaConsent(initial);
}());
