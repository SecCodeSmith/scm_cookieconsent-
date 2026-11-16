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
    window.SCM_GCM = {
        config: GCM, categories: CATS, tags: TAGS, stored: stored,
        mode: { ecommerce: 'none', ads: 'none' },
        ready: false
    };

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

    // === 6. Consent Mode "basic": tags load on a grant, events wait for it ===
    // Nothing optional is requested until the visitor (or a stored choice) has granted a
    // category that needs it (D1). Events raised earlier are kept in memory only: never
    // pushed to the dataLayer, never stored, dropped on a reject or when the page is left (D3).
    var ANY_TAG_SIGNALS = ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'];
    var QUEUE_CAP = 100;
    var pending = [];
    var onceMem = {};
    var loaded = { gtm: false, gtagjs: false, ga4: false, ads: false };

    function isGranted(payload, sig) { return payload[sig] === 'granted'; }

    function tagGrant(payload) {
        for (var i = 0; i < ANY_TAG_SIGNALS.length; i++) {
            if (isGranted(payload, ANY_TAG_SIGNALS[i])) { return true; }
        }
        return false;
    }

    // Once-guard recorded at DELIVERY time (D4). Storage blocked: in-memory fallback.
    function once(key) {
        if (!key) { return true; }
        try {
            if (window.sessionStorage) {
                if (window.sessionStorage.getItem(key)) { return false; }
                window.sessionStorage.setItem(key, '1');
                return true;
            }
        } catch (e) {}
        if (onceMem[key]) { return false; }
        onceMem[key] = true;
        return true;
    }

    function dispatchTrack(name, params) {
        if (window.SCM_GCM.mode.ecommerce === 'gtag') {
            gtag('event', name, params);
        } else {
            // GTM (or no Google tag): the dataLayer object pair GTM triggers read.
            window.dataLayer.push({ ecommerce: null });
            window.dataLayer.push({ event: name, ecommerce: params });
        }
    }

    // The Ads conversion needs ad_storage (D5): mode.ads becomes 'gtag' only after the
    // advertising grant has loaded the Ads config. In GTM mode the conversion is the container's.
    function dispatchPurchase(p) {
        dispatchTrack('purchase', p);
        if (window.SCM_GCM.mode.ads === 'gtag' && TAGS.adsId && TAGS.adsConversionLabel) {
            gtag('event', 'conversion', {
                send_to:        TAGS.adsId + '/' + TAGS.adsConversionLabel,
                value:          p.value,
                currency:       p.currency,
                transaction_id: p.transaction_id
            });
        }
    }

    // Non-ecommerce GA4 events (login, sign_up, search): same mode and queue
    // as track(), but GTM users expect FLAT keys — no { ecommerce: null }
    // reset and no ecommerce wrapper. ES5 key copy (no Object.assign).
    function dispatchFlat(name, params) {
        if (window.SCM_GCM.mode.ecommerce === 'gtag') {
            gtag('event', name, params);
            return;
        }
        var obj = { event: name };
        for (var k in params) {
            if (Object.prototype.hasOwnProperty.call(params, k)) { obj[k] = params[k]; }
        }
        window.dataLayer.push(obj);
    }

    // entry = [kind, a, b, guardKey]
    function deliver(q) {
        if (!once(q[3])) { return; }
        if (q[0] === 'purchase') { dispatchPurchase(q[1]); }
        else if (q[0] === 'event') { dispatchFlat(q[1], q[2]); }
        else { dispatchTrack(q[1], q[2]); }
    }

    function submit(entry) {
        if (window.SCM_GCM.ready) { deliver(entry); return; }
        pending.push(entry);
        if (pending.length > QUEUE_CAP) { pending.shift(); }
    }

    // Optional last argument = once-guard key (checked and recorded at delivery).
    window.SCM_GCM.event = function (name, params, guardKey) {
        submit(['event', name, params || {}, guardKey]);
    };

    window.SCM_GCM.track = function (name, params, guardKey) {
        submit(['track', name, params, guardKey]);
    };

    window.SCM_GCM.purchase = function (payload, guardKey) {
        submit(['purchase', payload, null, guardKey]);
    };

    // A grant exists and its tag has been started: deliver the page's queued events in order.
    function becomeReady() {
        window.SCM_GCM.ready = true;
        var queue = pending;
        pending = [];
        queue.forEach(deliver);
    }

    function loadScript(src) {
        var s = document.createElement('script');
        s.async = true;
        s.src = src;
        var first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(s, first);
    }

    // Idempotent (D1): remembers what this page already loaded, requests gtag.js / gtm.js at
    // most once and only adds a `config` for a newly granted id. With nothing granted it does
    // nothing — no request, no cookie, no cookieless ping.
    //
    // Phases, so the tag sees the right consent state: (1) the script is requested,
    // (2) `between` runs (the consent update), (3) the dataLayer commands that start the tag
    // (`gtm.start`, `js`, `config`) are pushed. Both gtag.js and gtm.js read the dataLayer in
    // order once loaded, so a `config` pushed before the update would be evaluated as denied.
    function loadTags(payload, between) {
        var cmds = [];
        var mode = window.SCM_GCM.mode;

        if (GCM.enabled && tagGrant(payload)) {
            var analytics = isGranted(payload, 'analytics_storage');
            var ads       = isGranted(payload, 'ad_storage');

            // Runtime dedup: other modules print their snippets after this bootstrap, so
            // the check runs here (DOMContentLoaded or later), not when the script executes.
            var hasGtm = loaded.gtm || !!window.google_tag_manager
                || !!document.querySelector('script[src*="googletagmanager.com/gtm.js?"]');

            // GTM — the preferred path. No <noscript> iframe on purpose: without JS no
            // consent can be given, so it would fire without a legal basis.
            if (TAGS.gtmId && !hasGtm) {
                loaded.gtm = true;
                hasGtm = true;
                loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(TAGS.gtmId));
                cmds.push(function () {
                    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                });
            }

            var directTag = function (id) {
                if (!loaded.gtagjs) {
                    loaded.gtagjs = true;
                    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
                    cmds.push(function () { gtag('js', new Date()); });
                }
                cmds.push(function () { gtag('config', id); });
            };

            if (hasGtm) {
                mode.ecommerce = 'gtm';
                mode.ads = 'container';
            } else if ((TAGS.ga4Id || TAGS.adsId) && !TAGS.gtmId
                && (loaded.gtagjs || !document.querySelector('script[src*="googletagmanager.com/gtag/js?"]'))) {
                // gtag.js direct — FALLBACK ONLY when no GTM container exists at all.
                // Each category adds only its own config: analytics -> GA4, advertising -> Ads.
                if (analytics && TAGS.ga4Id && !loaded.ga4) { loaded.ga4 = true; directTag(TAGS.ga4Id); }
                if (ads && TAGS.adsId && !loaded.ads)       { loaded.ads = true;  directTag(TAGS.adsId); }
                if (loaded.ga4 || loaded.ads) { mode.ecommerce = 'gtag'; }
                if (loaded.ads) { mode.ads = 'gtag'; }
            }

            // Ads-only direct tag — opt-in, works next to a container or an external
            // gtag.js. Configures the AW id only (never GA4: no double-counting).
            if (ads && !loaded.ads && TAGS.adsForceDirect && TAGS.adsId) {
                loaded.ads = true;
                directTag(TAGS.adsId);
                mode.ads = 'gtag';
            }
        }

        if (between) { between(); }
        cmds.forEach(function (c) { c(); });
    }

    // === 7. Public update API — called by the banner after a user choice ===
    // D2 order: tag requested, consent `update`, `scm_consent_update`, then the queue.
    window.SCM_GCM.update = function (storeObj) {
        var payload = buildPayload(storeObj);
        var grant = tagGrant(payload);
        var pushUpdate = function () { if (GCM.enabled) { gtag('consent', 'update', payload); } };

        if (grant) { loadTags(payload, pushUpdate); } else { pushUpdate(); }
        applyMetaConsent(payload);
        // Custom event for GTM triggers (fire tags on consent change)
        window.dataLayer.push({ event: 'scm_consent_update', scm_consent: payload });

        if (grant) {
            becomeReady();
        } else {
            // Reject / withdrawal: nothing pending is ever delivered, later events wait again.
            window.SCM_GCM.ready = false;
            pending = [];
        }
    };

    // === 8. Returning visitor with a stored grant — DOMContentLoaded ===
    // The default and the update are already in the dataLayer (head); load the tag the stored
    // choice allows, then deliver the events raised so far.
    function startFromStored() {
        if (tagGrant(initial)) {
            loadTags(initial);
            becomeReady();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startFromStored);
    } else {
        startFromStored();
    }

    // === 9. Returning visitor with stored consent → apply Meta immediately ===
    applyMetaConsent(initial);
}());
