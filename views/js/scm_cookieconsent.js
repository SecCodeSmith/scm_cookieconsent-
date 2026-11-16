/**
 * scm_cookieconsent — banner UI logic
 * Consent Mode v2 bootstrap runs inline in <head> (see gcm_bootstrap.tpl).
 * This file handles the banner UI + cookie purge + consent persistence.
 *
 * ES5 / no dependencies / IIFE.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 */
(function () {
    'use strict';

    var COOKIE_NAME = 'scm_consent';

    // Defaults only. The real config is injected by cookie_banner.tpl at the
    // END of <body> — i.e. AFTER this file (loaded in <head>) is evaluated —
    // so it MUST be resolved lazily at DOMContentLoaded, never at load time.
    var config = {
        expiryDays: 365,
        position:   'bottom',
        showReopen: true,
        labels:     { enabled: 'Enabled', disabled: 'Disabled' },
        categories: []
    };

    function resolveConfig() {
        if (window.SCM_COOKIE_CONFIG) {
            config = window.SCM_COOKIE_CONFIG;
        } else if (window.SCM_GCM && window.SCM_GCM.categories) {
            // Banner config missing — at least reuse categories from the
            // head bootstrap so consent persistence still works.
            config.categories = window.SCM_GCM.categories;
        }
    }

    /* ===== Cookie helpers ===== */

    function readCookie(name) {
        var safe  = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var match = document.cookie.match('(?:^|;)\\s*' + safe + '=([^;]*)');
        return match ? decodeURIComponent(match[1]) : null;
    }

    function writeCookie(name, value, days) {
        var expires = '';
        if (days) {
            var d = new Date();
            d.setTime(d.getTime() + days * 86400000);
            expires = '; expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    }

    function deleteCookie(name) {
        var host = location.hostname;
        var base = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
        document.cookie = base;
        document.cookie = base + '; domain=' + host;
        if (host.indexOf('www.') === 0) {
            document.cookie = base + '; domain=' + host.slice(4);
            document.cookie = base + '; domain=.' + host.slice(4);
        } else {
            document.cookie = base + '; domain=.' + host;
        }
    }

    /* localStorage mirror — survives blocked/evicted cookies (e.g. ITP,
       privacy extensions). Cookie stays primary: the <head> bootstrap
       must read consent synchronously before tags load. */

    function lsGet() {
        try { return window.localStorage.getItem(COOKIE_NAME); } catch (e) { return null; }
    }

    function lsSet(value) {
        try { window.localStorage.setItem(COOKIE_NAME, value); } catch (e) {}
    }

    function lsRemove() {
        try { window.localStorage.removeItem(COOKIE_NAME); } catch (e) {}
    }

    function readConsentStore() {
        var raw = readCookie(COOKIE_NAME) || lsGet();
        if (!raw) { return null; }

        var store;
        try { store = JSON.parse(raw); } catch (e) { return null; }

        // localStorage never expires on its own — honour the consent TTL
        if (store && store.__ts) {
            var age = Date.now() - Date.parse(store.__ts);
            if (isFinite(age) && age > config.expiryDays * 86400000) {
                lsRemove();
                return null;
            }
        }
        return store;
    }

    /**
     * A stored consent is usable only if it has an explicit decision for every
     * current optional category. If categories changed since the consent was
     * given (reinstall, new ids, added category), RODO requires re-asking —
     * and stale ids would otherwise render all toggles as off.
     */
    function isStoreComplete(store) {
        if (!store) { return false; }
        for (var i = 0; i < config.categories.length; i++) {
            var cat = config.categories[i];
            if (cat.required) { continue; }
            if (!(cat.id in store)) { return false; }
        }
        return true;
    }

    function writeConsentStore(store) {
        // Stamp the consent so we know WHEN it was given (audit trail / TTL)
        store.__ts = new Date().toISOString();
        var json = JSON.stringify(store);
        writeCookie(COOKIE_NAME, json, config.expiryDays);
        lsSet(json);
    }

    /* ===== Google Consent Mode v2 — delegate to bootstrap ===== */

    function pushConsentUpdate(store) {
        if (window.SCM_GCM && typeof window.SCM_GCM.update === 'function') {
            window.SCM_GCM.update(store);
            return;
        }
        // Fallback: bootstrap was disabled — push minimal update via dataLayer
        window.dataLayer = window.dataLayer || [];
        function gtag(){ window.dataLayer.push(arguments); }

        var payload = {};
        config.categories.forEach(function (cat) {
            if (!cat.signals || !cat.signals.length) { return; }
            var granted = cat.required || !!(store && store[cat.id]);
            cat.signals.forEach(function (sig) {
                payload[sig] = granted ? 'granted' : 'denied';
            });
        });
        if (Object.keys(payload).length) { gtag('consent', 'update', payload); }
    }

    /* ===== Cookie purge ===== */

    function patternToRegex(pattern) {
        var escaped = pattern.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        return new RegExp('^' + escaped + '$');
    }

    function purgeRejectedCookies(store) {
        config.categories.forEach(function (cat) {
            if (cat.required || (store && store[cat.id])) { return; }
            var patterns = cat.cookieNames || [];
            if (!patterns.length) { return; }

            var allCookies = document.cookie.split(';').map(function (c) {
                return c.trim().split('=')[0];
            }).filter(Boolean);

            patterns.forEach(function (pattern) {
                var re = patternToRegex(pattern);
                allCookies.forEach(function (cookieName) {
                    if (re.test(cookieName)) { deleteCookie(cookieName); }
                });
            });
        });
    }

    /* ===== UI ===== */

    var banner, overlay, widget;
    var currentScreen = 'main';
    // Motion state of the dialog, mirrored in data-state on the banner and the overlay:
    // closed -> opening -> open -> closing -> closed. Consent logic never waits for it.
    var state = 'closed';
    var motionCancel = null;   // cancels the pending end of opening/closing
    var sw = null;             // screen switch in progress

    function screenEl(name) { return document.getElementById('scm-screen-' + name); }

    function reducedMotion() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function setState(s) {
        state = s;
        if (banner)  { banner.setAttribute('data-state', s); }
        if (overlay) { overlay.setAttribute('data-state', s); }
    }

    function setHidden(el, hide) {
        if (!el) { return; }
        el.hidden = !!hide;
        if (hide) { el.setAttribute('hidden', ''); } else { el.removeAttribute('hidden'); }
    }

    /** Run fn when `el` finishes its CSS animation; a timer a little longer than the animation is the safety net. */
    function afterMotion(el, ms, fn) {
        var done = false, t;
        function end(e) {
            if (done || (e && e.target !== el)) { return; }
            done = true;
            clearTimeout(t);
            el.removeEventListener('animationend', end);
            motionCancel = null;
            fn();
        }
        el.addEventListener('animationend', end);
        t = setTimeout(end, ms + 150);
        return function () { done = true; clearTimeout(t); el.removeEventListener('animationend', end); motionCancel = null; };
    }

    /**
     * Phone: the buttons are stacked as Accept, Settings, Reject. Desktop row (card at least 768px
     * wide, not the narrow corner panel): Settings, Reject, Accept. The DOM is reordered to match,
     * so the Tab order always follows what is on screen. The layout decision is read from the CSS.
     * (The settings screen keeps one DOM order in both layouts: Wróć, Odrzuć, Zapisz, Akceptuję.)
     */
    function orderActions() {
        var actions = screenEl('main') ? screenEl('main').querySelector('.scm-actions') : null;
        if (!actions) { return; }
        var row = window.getComputedStyle(actions).flexDirection === 'row';
        var a = document.getElementById('scm-btn-accept-all');
        var st = document.getElementById('scm-btn-settings');
        var r = document.getElementById('scm-btn-reject-all');
        if (!a || !st || !r) { return; }
        var want = row ? [st, r, a] : [a, st, r];
        for (var i = 0; i < want.length; i++) { actions.appendChild(want[i]); }
    }

    function focusTitle(name) {
        var t = document.getElementById(name === 'settings' ? 'scm-settings-title' : 'scm-banner-title');
        if (!t) { return; }
        try { t.focus({ preventScroll: true }); } catch (e) { try { t.focus(); } catch (e2) {} }
    }

    /** Show one screen at once (no motion): swap the visible block and move the dialog's label. */
    function setScreen(name, focus) {
        currentScreen = name;
        var screens = banner.querySelectorAll('.scm-screen');
        for (var i = 0; i < screens.length; i++) {
            setHidden(screens[i], screens[i].getAttribute('data-screen') !== name);
        }
        banner.setAttribute('aria-labelledby', name === 'settings' ? 'scm-settings-title' : 'scm-banner-title');
        banner.setAttribute('aria-describedby', name === 'settings' ? 'scm-settings-desc' : 'scm-banner-desc');
        orderActions();
        banner.scrollTop = 0;
        if (focus) { focusTitle(name); }
    }

    /** Settle a screen switch that is still running: final visibility, no leftover classes or inline height. */
    function finishSwitch() {
        if (!sw) { return; }
        var s = sw;
        sw = null;
        clearTimeout(s.t1);
        clearTimeout(s.t2);
        s.out.classList.remove('scm-leave-fwd', 'scm-leave-back');
        s.inn.classList.remove('scm-enter-fwd', 'scm-enter-back');
        setHidden(s.out, true);
        setHidden(s.inn, false);
        banner.style.height = '';
        banner.removeAttribute('data-switching');
        banner.scrollTop = 0;
    }

    /**
     * Go to the other screen with motion (about 300 ms): the outgoing screen fades and slides 16px away
     * (forward = left, back = right) while the sheet's height moves to the height of the incoming one,
     * then the incoming screen fades and slides in. Heights are measured once, before anything is painted.
     */
    function switchScreen(name) {
        if (name === currentScreen) { return; }
        finishSwitch();
        if (reducedMotion() || !banner || banner.hidden || state === 'closing') { setScreen(name, true); return; }
        var dir = name === 'settings' ? 'fwd' : 'back';
        var out = screenEl(currentScreen);
        var inn = screenEl(name);
        var h0 = banner.offsetHeight;
        setScreen(name, false);                 // incoming shown, outgoing hidden: measure the target height
        var h1 = banner.offsetHeight;
        setHidden(inn, true);                   // put the outgoing screen back for its fade-out
        setHidden(out, false);
        banner.setAttribute('data-switching', dir);   // clips the content while the height moves (no scrollbar flicker)
        banner.style.height = h0 + 'px';
        void banner.offsetHeight;               // commit the start height so the transition has a start
        out.classList.add('scm-leave-' + dir);
        banner.style.height = h1 + 'px';
        sw = { out: out, inn: inn };
        sw.t1 = setTimeout(function () {
            out.classList.remove('scm-leave-' + dir);
            setHidden(out, true);
            setHidden(inn, false);
            inn.classList.add('scm-enter-' + dir);
            banner.scrollTop = 0;
            focusTitle(name);
        }, 130);
        sw.t2 = setTimeout(finishSwitch, 310);
    }

    /**
     * Show the banner on its first screen (design D7, owner request 2026-11-16: the footer link, the
     * round button and SCM_Consent.reopen all open screen 1; the settings screen is one click away
     * and shows the saved switches).
     */
    function showBanner(screen) {
        if (!banner) { return; }
        if (motionCancel) { motionCancel(); }
        finishSwitch();

        // Always re-read stored consent from cookie before showing — handles
        // reload, cross-tab edits, and DevTools tampering.
        var fresh = readConsentStore();
        if (fresh && isStoreComplete(fresh)) {
            applyToggleState(fresh);
        } else {
            // No stored consent → reset all optional toggles to OFF (never pre-ticked)
            setAllOptional(false);
        }
        collapseAll();

        var name = screen === 'settings' ? 'settings' : 'main';
        var running = !banner.hidden && state !== 'closing' && state !== 'closed';
        banner.hidden = false;
        banner.removeAttribute('hidden');
        banner.classList.add('scm-banner-visible');
        setScreen(name, true);

        // The dimmed backdrop (phones) backs up aria-modal; on desktop CSS makes it invisible.
        if (overlay) {
            overlay.hidden = false;
            overlay.removeAttribute('hidden');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('scm-modal-open');
        }
        if (widget) {
            widget.hidden = true;
            widget.setAttribute('hidden', '');
        }
        if (running) { return; }
        if (reducedMotion()) {
            setState('open');
        } else {
            setState('opening');
            motionCancel = afterMotion(banner, 330, function () { if (state === 'opening') { setState('open'); } });
        }
    }

    function finishHide(withWidget) {
        banner.classList.remove('scm-banner-visible');
        banner.hidden = true;
        banner.setAttribute('hidden', '');
        setState('closed');
        if (overlay) {
            overlay.hidden = true;
            overlay.setAttribute('hidden', '');
            overlay.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('scm-modal-open');
        if (withWidget) { showWidget(); }
    }

    /** Close with the reverse motion (about 230 ms); the element is hidden only when it has finished. */
    function hideBanner(withWidget) {
        if (!banner) { return; }
        if (motionCancel) { motionCancel(); }
        finishSwitch();
        if (banner.hidden) { if (withWidget) { showWidget(); } return; }
        if (reducedMotion()) { finishHide(withWidget); return; }
        setState('closing');
        motionCancel = afterMotion(banner, 240, function () { finishHide(withWidget); });
    }

    /** Card descriptions are collapsed by default and whenever the banner opens. */
    function collapseAll() {
        var cards = banner.querySelectorAll('.scm-category');
        for (var i = 0; i < cards.length; i++) { setExpanded(cards[i], false); }
    }

    /** Open or close a card. The height animation is CSS (grid-template-rows on .scm-category-body); no layout is measured here. */
    function setExpanded(card, open) {
        var btn = card.querySelector('.scm-cat-toggle[aria-expanded]');
        if (!btn || !card.querySelector('.scm-category-desc')) { return; }
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) { card.classList.add('scm-expanded'); } else { card.classList.remove('scm-expanded'); }
    }

    function showWidget() {
        if (!widget || !config.showReopen) { return; }
        widget.hidden = false;
        widget.removeAttribute('hidden');
    }

    function setToggle(toggleBtn, on) {
        var wrap   = toggleBtn.parentNode;
        var labelEl = wrap ? wrap.querySelector('.scm-toggle-label') : null;

        if (on) {
            toggleBtn.classList.add('scm-toggle-on');
            toggleBtn.setAttribute('aria-checked', 'true');
            if (labelEl) {
                labelEl.textContent = labelEl.getAttribute('data-label-on') || config.labels.enabled;
            }
        } else {
            toggleBtn.classList.remove('scm-toggle-on');
            toggleBtn.setAttribute('aria-checked', 'false');
            if (labelEl) {
                labelEl.textContent = labelEl.getAttribute('data-label-off') || config.labels.disabled;
            }
        }
    }

    function getToggleState() {
        var store = {};
        config.categories.forEach(function (cat) {
            if (cat.required) { store[cat.id] = true; return; }
            var toggle = document.querySelector('.scm-toggle[data-category-id="' + cat.id + '"]');
            store[cat.id] = toggle ? toggle.getAttribute('aria-checked') === 'true' : false;
        });
        return store;
    }

    function applyToggleState(store) {
        config.categories.forEach(function (cat) {
            if (cat.required) { return; }
            var toggle = document.querySelector('.scm-toggle[data-category-id="' + cat.id + '"]');
            if (toggle) { setToggle(toggle, !!(store && store[cat.id])); }
        });
    }

    function setAllOptional(value) {
        config.categories.forEach(function (cat) {
            if (cat.required) { return; }
            var toggle = document.querySelector('.scm-toggle[data-category-id="' + cat.id + '"]');
            if (toggle) { setToggle(toggle, value); }
        });
    }

    /* ===== Finalize ===== */

    /** The consent logic runs at once on the click; only the closing motion follows (hideBanner). */
    function finalizeConsent(store) {
        writeConsentStore(store);
        pushConsentUpdate(store);
        purgeRejectedCookies(store);
        hideBanner(true);
    }

    /** Restore the switches to the saved choice (all off when there is none). */
    function restoreToggles() {
        var stored = readConsentStore();
        if (stored && isStoreComplete(stored)) { applyToggleState(stored); } else { setAllOptional(false); }
    }

    /** "Wróć": back to the first screen, switches return to the saved state, nothing is stored. */
    function goBack() {
        restoreToggles();
        switchScreen('main');
    }

    /**
     * Close (X), overlay click and Escape on the first screen:
     *  - first decision (no stored consent) -> reject optional, per UODO closing
     *    a banner without a choice cannot be treated as consent;
     *  - editing an existing decision -> just dismiss, the saved choice stays.
     */
    function dismissBanner() {
        if (state === 'closing') { return; }
        var stored = readConsentStore();
        if (stored && isStoreComplete(stored)) {
            applyToggleState(stored);
            hideBanner(true);
        } else {
            setAllOptional(false);
            finalizeConsent(getToggleState());
        }
    }

    /* ===== Focus trap ===== */

    function trapFocus(e) {
        if (e.key !== 'Tab' || !banner || banner.hidden) { return; }
        var all = banner.querySelectorAll(
            'button:not([disabled]):not([tabindex="-1"]), a[href], input, select, textarea'
        );
        var focusable = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].offsetParent !== null) { focusable.push(all[i]); }
        }
        if (!focusable.length) { return; }
        var first = focusable[0];
        var last  = focusable[focusable.length - 1];
        var active = document.activeElement;

        if (e.shiftKey && (active === first || active === banner || active.tabIndex === -1)) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault(); first.focus();
        }
    }

    /* ===== Public status API ===== */

    function getStatus() {
        var stored = readConsentStore();
        var perCategory = {};
        var perSignal = {};

        config.categories.forEach(function (cat) {
            var granted = cat.required || !!(stored && stored[cat.id]);
            perCategory[cat.id] = {
                granted: granted,
                required: !!cat.required,
                signals:  cat.signals || []
            };
            (cat.signals || []).forEach(function (sig) {
                // OR-combine: if any granting category controls this signal, it's granted
                perSignal[sig] = perSignal[sig] || granted;
            });
        });

        return {
            hasConsent: !!stored,
            timestamp:  stored ? (stored.__ts || null) : null,
            categories: perCategory,
            signals:    perSignal,
            raw:        stored
        };
    }

    window.SCM_Consent = {
        version: '1.9.0',
        status:  getStatus,
        reopen:  function () { showBanner('main'); },
        screen:  function () { return banner && !banner.hidden ? currentScreen : null; },
        reset:   function () {
            deleteCookie('scm_consent');
            lsRemove();
            location.reload();
        }
    };

    /* ===== Bootstrap ===== */

    /**
     * Themes place the displayFooter/displayFooterAfter/displayBeforeBodyClosingTag
     * hook zone wherever their own markup nests it — sliders, off-canvas nav
     * panels, sticky footers, etc. often set a CSS transform/filter/perspective
     * on one of those ancestors, which per spec makes THAT box (not the
     * viewport) the containing block for any `position: fixed` descendant.
     * The banner/overlay/widget are fixed-positioned and centered via
     * top/left 50% + transform, so under such a theme they'd get trapped
     * inside that ancestor's small box instead of centering on the real
     * viewport. Re-parenting them directly onto <body> sidesteps whatever
     * DOM structure the theme wrapped the hook output in.
     */
    function detachFromThemeMarkup(el) {
        if (el && el.parentNode !== document.body) {
            document.body.appendChild(el);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        resolveConfig();

        banner  = document.getElementById('scm-cookie-banner');
        overlay = document.getElementById('scm-overlay');
        widget  = document.getElementById('scm-reopen-widget');

        if (!banner) { return; }

        detachFromThemeMarkup(overlay);
        detachFromThemeMarkup(banner);
        detachFromThemeMarkup(widget);

        var stored = readConsentStore();

        // Consent saved for a different category set (old ids / new categories)
        // is stale — re-ask instead of silently mapping nothing.
        if (stored && !isStoreComplete(stored)) {
            stored = null;
        }

        if (!stored) {
            // GCM default already pushed in <head>; just show the banner
            showBanner('main');
        } else {
            applyToggleState(stored);
            // GCM defaults already projected stored consent in <head>;
            // we still push update() so dynamic tags loaded later see the state
            pushConsentUpdate(stored);
            purgeRejectedCookies(stored);
            showWidget();
        }

        document.querySelectorAll('.scm-toggle[data-category-id]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setToggle(btn, btn.getAttribute('aria-checked') !== 'true');
            });
        });

        function acceptAll() {
            setAllOptional(true);
            finalizeConsent(getToggleState());
        }
        ['scm-btn-accept-all', 'scm-btn-accept-settings'].forEach(function (id) {
            var b = document.getElementById(id);
            if (b) { b.addEventListener('click', acceptAll); }
        });

        // Odrzuć opcjonalne: the same button on both screens, the same action
        function rejectAll() {
            setAllOptional(false);
            finalizeConsent(getToggleState());
        }
        ['scm-btn-reject-all', 'scm-btn-reject-settings'].forEach(function (id) {
            var b = document.getElementById(id);
            if (b) { b.addEventListener('click', rejectAll); }
        });

        var btnSettings = document.getElementById('scm-btn-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', function () { switchScreen('settings'); });
        }

        var btnBack = document.getElementById('scm-btn-back');
        if (btnBack) { btnBack.addEventListener('click', goBack); }

        var btnSave = document.getElementById('scm-btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', function () {
                finalizeConsent(getToggleState());
            });
        }

        // Card: the name button expands the description; a click on the chevron cell does the same.
        document.querySelectorAll('.scm-category-header').forEach(function (head) {
            head.addEventListener('click', function (e) {
                var card = head.parentNode;
                if (!card.querySelector('.scm-category-desc')) { return; }
                var t = e.target;
                while (t && t !== head) {
                    if (t.className && /scm-toggle-wrap/.test(t.className)) { return; }
                    t = t.parentNode;
                }
                setExpanded(card, !card.classList.contains('scm-expanded'));
            });
        });

        if (window.addEventListener) {
            window.addEventListener('resize', function () { if (banner && !banner.hidden) { orderActions(); } });
        }

        var btnClose = document.getElementById('scm-btn-close');
        if (btnClose) {
            btnClose.addEventListener('click', dismissBanner);
        }

        if (overlay) {
            overlay.addEventListener('click', dismissBanner);
        }

        if (widget) {
            widget.addEventListener('click', function () { showBanner('main'); });
        }

        document.querySelectorAll('.scm-reopen-link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                showBanner('main');
            });
        });

        document.addEventListener('keydown', function (e) {
            if (banner && !banner.hidden) {
                if (e.key === 'Escape') {
                    if (state === 'closing') { return; }
                    if (currentScreen === 'settings') { goBack(); } else { dismissBanner(); }
                } else {
                    trapFocus(e);
                }
            }
        });
    });

}());
