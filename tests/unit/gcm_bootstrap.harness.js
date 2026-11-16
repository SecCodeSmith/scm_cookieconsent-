#!/usr/bin/env node
/**
 * Node harness for views/js/src/gcm_bootstrap.src.js (Consent Mode "basic", change consent-mode-basic).
 * Evaluates the bootstrap against a stubbed window/document and checks which scripts it requests and
 * in which order it pushes to the dataLayer. No dependencies.
 *
 *   node tests/unit/gcm_bootstrap.harness.js [path/to/gcm_bootstrap.src.js]
 *
 * Exit code 0 when every scenario passes. Ids below are placeholders.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var SRC = process.argv[2] || path.join(__dirname, '..', '..', 'views', 'js', 'src', 'gcm_bootstrap.src.js');
var source = fs.readFileSync(SRC, 'utf8');

var SIGNALS = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage',
    'functionality_storage', 'personalization_storage', 'security_storage'];
var CATS = [
    { id: 1, required: true,  signals: ['functionality_storage', 'security_storage'] },
    { id: 2, required: false, signals: ['analytics_storage'] },
    { id: 3, required: false, signals: ['ad_storage', 'ad_user_data', 'ad_personalization'] }
];

function makeStorage(seed) {
    var data = seed || {};
    return {
        data: data,
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
        setItem: function (k, v) { data[k] = String(v); },
        removeItem: function (k) { delete data[k]; }
    };
}

/**
 * opts: tags, gcm (overrides), stored (consent store object or null), externalScripts (existing script
 * srcs in the document), session (shared sessionStorage data object).
 */
function boot(opts) {
    opts = opts || {};
    var log = [];                 // ordered: 'script:<src>' and dataLayer entries
    var scripts = [];             // requested script srcs
    var listeners = [];
    var existing = (opts.externalScripts || []).slice();
    var dataLayer = [];
    var origPush = dataLayer.push;
    dataLayer.push = function () {
        for (var i = 0; i < arguments.length; i++) {
            var a = arguments[i];
            log.push(Object.prototype.toString.call(a) === '[object Arguments]'
                ? { gtag: Array.prototype.slice.call(a) } : a);
        }
        return origPush.apply(dataLayer, arguments);
    };
    var cookie = '';
    if (opts.stored) { cookie = 'scm_consent=' + encodeURIComponent(JSON.stringify(opts.stored)); }
    var doc = {
        readyState: 'loading',
        cookie: cookie,
        addEventListener: function (n, fn) { if (n === 'DOMContentLoaded') { listeners.push(fn); } },
        querySelector: function (sel) {
            var m = /src\*="([^"]+)"/.exec(sel);
            if (!m) { return null; }
            for (var i = 0; i < existing.length; i++) {
                if (existing[i].indexOf(m[1]) !== -1) { return { src: existing[i] }; }
            }
            return null;
        },
        createElement: function () { return {}; },
        getElementsByTagName: function () {
            return [{ parentNode: { insertBefore: function (el) {
                scripts.push(el.src); existing.push(el.src); log.push('script:' + el.src);
            } } }];
        }
    };
    var win = {
        dataLayer: dataLayer,
        localStorage: makeStorage(),
        sessionStorage: makeStorage(opts.session),
        SCM_GCM_DATA: {
            config: Object.assign({ enabled: true, signals: SIGNALS, waitMs: 0, region: [], securityGranted: true,
                adsRedaction: false, urlPassthrough: false }, opts.gcm || {}),
            categories: CATS,
            tags: Object.assign({ gtmId: '', ga4Id: '', adsId: '', adsConversionLabel: '', adsForceDirect: false,
                metaPixelId: '' }, opts.tags || {})
        }
    };
    win.window = win;
    win.document = doc;
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', source)(win, doc);
    return {
        win: win, doc: doc, log: log, scripts: scripts, dataLayer: dataLayer,
        fireDomReady: function () { doc.readyState = 'interactive'; listeners.forEach(function (fn) { fn(); }); },
        gcm: win.SCM_GCM
    };
}

var failures = 0, passes = 0;
function check(name, cond, detail) {
    if (cond) { passes++; console.log('PASS  ' + name); }
    else { failures++; console.log('FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}
function json(x) { return JSON.stringify(x); }

var isScript = function (e) { return typeof e === 'string' && e.indexOf('script:') === 0; };
var cmd = function (e, a, b) { return !!(e && e.gtag && e.gtag[0] === a && (b === undefined || e.gtag[1] === b)); };
function eventsNamed(log, name) {
    return log.filter(function (e) {
        return (e && e.event === name) || (e && e.gtag && e.gtag[0] === 'event' && e.gtag[1] === name);
    });
}
function idx(log, pred) { for (var i = 0; i < log.length; i++) { if (pred(log[i])) { return i; } } return -1; }

var DIRECT = { ga4Id: 'G-TEST123', adsId: 'AW-1000000', adsConversionLabel: 'LABEL1' };
var GTM = { gtmId: 'GTM-TEST1', ga4Id: '', adsId: 'AW-1000000', adsConversionLabel: 'LABEL1' };
var NOTHING = { 1: true, 2: false, 3: false };
var ANALYTICS = { 1: true, 2: true, 3: false };
var ALL = { 1: true, 2: true, 3: true };
var PURCHASE = { transaction_id: 'REF1', value: 10, currency: 'EUR', items: [{ item_id: '1' }] };

// ---------- 2.1 loading ----------
(function () {
    var h = boot({ tags: DIRECT });
    h.gcm.track('view_item', { items: [] });
    h.fireDomReady();
    check('no choice, direct: no script is requested', h.scripts.length === 0, json(h.scripts));
    check('no choice, direct: default recorded with every signal denied',
        cmd(h.log[0], 'consent', 'default') && h.log[0].gtag[2].analytics_storage === 'denied' && h.log[0].gtag[2].ad_storage === 'denied');
    check('no choice: no event reaches the dataLayer, not ready, mode none',
        eventsNamed(h.log, 'view_item').length === 0 && h.gcm.ready === false && h.gcm.mode.ecommerce === 'none');
})();

(function () {
    var h = boot({ tags: GTM });
    h.fireDomReady();
    check('no choice, GTM: gtm.js is not requested', h.scripts.length === 0);
})();

(function () {
    var h = boot({ tags: DIRECT, stored: ANALYTICS });
    h.fireDomReady();
    var gt = h.scripts.filter(function (s) { return s.indexOf('gtag/js') !== -1; });
    check('analytics only (stored): exactly one gtag.js, for GA4', gt.length === 1 && gt[0].indexOf('id=G-TEST123') !== -1, json(h.scripts));
    check('analytics only: config for GA4, none for Ads', idx(h.log, function (e) { return cmd(e, 'config', 'G-TEST123'); }) > -1
        && idx(h.log, function (e) { return cmd(e, 'config', 'AW-1000000'); }) === -1);
    check('analytics only: Ads mode stays none, ecommerce is gtag', h.gcm.mode.ads === 'none' && h.gcm.mode.ecommerce === 'gtag');
    h.gcm.purchase(PURCHASE);
    check('analytics only: GA4 purchase delivered, no conversion',
        eventsNamed(h.log, 'purchase').length === 1 && eventsNamed(h.log, 'conversion').length === 0);
})();

(function () {
    var h = boot({ tags: DIRECT, stored: ALL });
    h.fireDomReady();
    h.gcm.purchase(PURCHASE);
    var conv = eventsNamed(h.log, 'conversion');
    check('all granted (stored): Ads config added and conversion sent once with the exact payload',
        idx(h.log, function (e) { return cmd(e, 'config', 'AW-1000000'); }) > -1 && conv.length === 1
        && json(conv[0].gtag[2]) === json({ send_to: 'AW-1000000/LABEL1', value: 10, currency: 'EUR', transaction_id: 'REF1' }),
        json(conv));
    check('all granted: gtag.js requested once', h.scripts.length === 1, json(h.scripts));
})();

(function () {
    var h = boot({ tags: GTM, stored: ANALYTICS });
    h.fireDomReady();
    check('GTM, analytics granted: only gtm.js, mode gtm / container',
        h.scripts.length === 1 && h.scripts[0].indexOf('gtm.js?id=GTM-TEST1') !== -1 && h.gcm.mode.ecommerce === 'gtm' && h.gcm.mode.ads === 'container');
    h.gcm.purchase(PURCHASE);
    check('GTM: purchase is the object pair and there is no direct conversion',
        eventsNamed(h.log, 'purchase').length === 1 && eventsNamed(h.log, 'conversion').length === 0
        && idx(h.log, function (e) { return e && e.ecommerce === null; }) > -1);
})();

(function () {
    var h = boot({ tags: Object.assign({}, GTM, { adsForceDirect: true }), stored: ALL });
    h.fireDomReady();
    check('GTM + force-direct Ads, everything granted: gtm.js and gtag.js for the Ads id, config for AW only',
        h.scripts.length === 2 && h.scripts[1].indexOf('gtag/js?id=AW-1000000') !== -1
        && idx(h.log, function (e) { return cmd(e, 'config', 'AW-1000000'); }) > -1 && h.gcm.mode.ads === 'gtag');
    var h2 = boot({ tags: Object.assign({}, GTM, { adsForceDirect: true }), stored: ANALYTICS });
    h2.fireDomReady();
    check('GTM + force-direct Ads, analytics only: no Ads gtag.js', h2.scripts.length === 1 && h2.scripts[0].indexOf('gtm.js') !== -1);
})();

(function () {
    var h = boot({ tags: GTM, stored: ALL, externalScripts: ['https://www.googletagmanager.com/gtm.js?id=GTM-OTHER'] });
    h.fireDomReady();
    check('external container present: this module requests no second container, mode gtm', h.scripts.length === 0 && h.gcm.mode.ecommerce === 'gtm');
})();

(function () {
    var h = boot({ tags: DIRECT, stored: ALL, gcm: { enabled: false } });
    h.fireDomReady();
    check('Consent Mode disabled: no tag whatever the stored choice', h.scripts.length === 0);
})();

// ---------- 2.2 queue and update order ----------
(function () {
    var h = boot({ tags: DIRECT });
    h.gcm.track('view_item', { items: ['a'] });
    h.gcm.event('search', { search_term: 'x' });
    h.fireDomReady();
    h.gcm.track('add_to_cart', { items: ['b'] });
    var before = h.log.length;
    h.gcm.update(ALL);
    var l = h.log.slice(before);
    var iScript = idx(l, isScript);
    var iUpdate = idx(l, function (e) { return cmd(e, 'consent', 'update'); });
    var iJs = idx(l, function (e) { return cmd(e, 'js'); });
    var iConfig = idx(l, function (e) { return cmd(e, 'config'); });
    var iScm = idx(l, function (e) { return e && e.event === 'scm_consent_update'; });
    var iView = idx(l, function (e) { return cmd(e, 'event', 'view_item'); });
    var iSearch = idx(l, function (e) { return cmd(e, 'event', 'search'); });
    var iAdd = idx(l, function (e) { return cmd(e, 'event', 'add_to_cart'); });
    check('late grant: script, consent update, js, config, scm_consent_update, then the events in raised order',
        iScript === 0 && iScript < iUpdate && iUpdate < iJs && iJs < iConfig && iConfig < iScm && iScm < iView && iView < iSearch && iSearch < iAdd,
        [iScript, iUpdate, iJs, iConfig, iScm, iView, iSearch, iAdd].join(','));
    check('late grant: ready, each event once', h.gcm.ready === true && eventsNamed(l, 'view_item').length === 1);
    h.gcm.update(ALL);
    check('grant repeated: no event twice, no second script',
        eventsNamed(h.log, 'view_item').length === 1 && h.scripts.length === 1);
})();

(function () {
    var h = boot({ tags: DIRECT });
    h.fireDomReady();
    h.gcm.track('view_item', { items: [] });
    h.gcm.update(NOTHING);
    check('reject: the dataLayer holds no event', eventsNamed(h.log, 'view_item').length === 0);
    h.gcm.update(ANALYTICS);
    check('reject then grant: the dropped event does not come back', eventsNamed(h.log, 'view_item').length === 0);
    h.gcm.track('add_to_cart', { items: [] });
    check('events after the grant are delivered at once', eventsNamed(h.log, 'add_to_cart').length === 1);
})();

(function () {
    var h = boot({ tags: DIRECT });
    h.fireDomReady();
    h.gcm.update(ANALYTICS);
    var scriptsBefore = h.scripts.length;
    h.gcm.update(ALL);
    check('marketing added later: Ads config pushed, gtag.js not requested again',
        h.scripts.length === scriptsBefore && idx(h.log, function (e) { return cmd(e, 'config', 'AW-1000000'); }) > -1 && h.gcm.mode.ads === 'gtag');
    h.gcm.update(NOTHING);
    h.gcm.track('view_item', {});
    check('withdrawal: later events wait again (nothing pushed)', h.gcm.ready === false && eventsNamed(h.log, 'view_item').length === 0);
})();

(function () {
    var h = boot({ tags: GTM });
    h.fireDomReady();
    h.gcm.track('view_item', { items: [] });
    var before = h.log.length;
    h.gcm.update(ANALYTICS);
    var l = h.log.slice(before);
    var iScript = idx(l, isScript);
    var iUpdate = idx(l, function (e) { return cmd(e, 'consent', 'update'); });
    var iStart = idx(l, function (e) { return e && e.event === 'gtm.js'; });
    var iView = idx(l, function (e) { return e && e.event === 'view_item'; });
    check('GTM late grant: gtm.js requested, consent update, gtm.start, then the event',
        iScript === 0 && iScript < iUpdate && iUpdate < iStart && iStart < iView, [iScript, iUpdate, iStart, iView].join(','));
})();

(function () {
    var h = boot({ tags: DIRECT });
    h.fireDomReady();
    for (var i = 1; i <= 150; i++) { h.gcm.track('e' + i, {}); }
    h.gcm.update(ANALYTICS);
    var delivered = h.log.filter(function (e) { return e && e.gtag && e.gtag[0] === 'event'; });
    check('queue is capped at the 100 newest entries',
        delivered.length === 100 && delivered[0].gtag[1] === 'e51' && delivered[99].gtag[1] === 'e150', delivered.length + ' ' + (delivered[0] && delivered[0].gtag[1]));
})();

(function () {
    var h = boot({ tags: DIRECT, stored: ANALYTICS });
    h.gcm.track('view_item', { items: [] });
    h.gcm.event('search', { search_term: 'x' });
    var before = h.log.length;
    h.fireDomReady();
    var l = h.log.slice(before);
    check('returning visitor: tag, then the pre-DOM events in order',
        idx(l, isScript) === 0 && idx(l, function (e) { return cmd(e, 'event', 'view_item'); }) < idx(l, function (e) { return cmd(e, 'event', 'search'); })
        && idx(l, function (e) { return cmd(e, 'event', 'view_item'); }) > -1);
})();

// ---------- 2.3 once-guards at delivery ----------
(function () {
    var session = {};
    var h = boot({ tags: DIRECT, session: session });
    h.gcm.purchase(PURCHASE, 'scm_purchase_REF1');
    h.fireDomReady();
    check('reload before the choice: guard is not written while the purchase is queued', !session.scm_purchase_REF1 && eventsNamed(h.log, 'purchase').length === 0);
    var h2 = boot({ tags: DIRECT, session: session });
    h2.gcm.purchase(PURCHASE, 'scm_purchase_REF1');
    h2.fireDomReady();
    h2.gcm.update(ANALYTICS);
    check('reload before the choice, then grant: purchase delivered once and the guard written at delivery',
        eventsNamed(h2.log, 'purchase').length === 1 && session.scm_purchase_REF1 === '1');
    var h3 = boot({ tags: DIRECT, stored: ANALYTICS, session: session });
    h3.gcm.purchase(PURCHASE, 'scm_purchase_REF1');
    h3.fireDomReady();
    check('reload after delivery: no second purchase', eventsNamed(h3.log, 'purchase').length === 0);
    var h4 = boot({ tags: DIRECT, stored: ANALYTICS, session: {} });
    h4.fireDomReady();
    h4.gcm.track('add_shipping_info', {}, 'scm_ship_K');
    h4.gcm.track('add_shipping_info', {}, 'scm_ship_K');
    check('the guard also stops a duplicate on the same page', eventsNamed(h4.log, 'add_shipping_info').length === 1);
})();

console.log('\n' + passes + ' passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
