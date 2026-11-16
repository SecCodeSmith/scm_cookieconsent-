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
    var openedFromMain = false;

    function screenEl(name) { return document.getElementById('scm-screen-' + name); }

    /**
     * Phone: the buttons are stacked as Accept, Settings, Reject. Desktop row (card at least 768px
     * wide, not the narrow corner panel): Settings, Reject, Accept. The DOM is reordered to match,
     * so the Tab order always follows what is on screen. The layout decision is read from the CSS.
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

    /** Show one screen: swap the visible block, move the dialog's label, hide Back when there is no screen 1 to go back to. */
    function setScreen(name, focusTitle) {
        currentScreen = name;
        var screens = banner.querySelectorAll('.scm-screen');
        for (var i = 0; i < screens.length; i++) {
            var on = screens[i].getAttribute('data-screen') === name;
            screens[i].hidden = !on;
            if (on) { screens[i].removeAttribute('hidden'); } else { screens[i].setAttribute('hidden', ''); }
        }
        banner.setAttribute('aria-labelledby', name === 'settings' ? 'scm-settings-title' : 'scm-banner-title');
        banner.setAttribute('aria-describedby', name === 'settings' ? 'scm-settings-desc' : 'scm-banner-desc');
        var back = document.getElementById('scm-btn-back');
        if (back) {
            back.hidden = !openedFromMain;
            if (openedFromMain) { back.removeAttribute('hidden'); } else { back.setAttribute('hidden', ''); }
            back.style.display = openedFromMain ? '' : 'none';
        }
        orderActions();
        banner.scrollTop = 0;
        if (focusTitle) {
            var t = document.getElementById(name === 'settings' ? 'scm-settings-title' : 'scm-banner-title');
            if (t) { try { t.focus(); } catch (e) {} }
        }
    }

    /**
     * Show the banner. First visit (no usable stored choice): screen 1. Reopened with a stored
     * choice (footer link, round button, SCM_Consent.reopen): the settings screen, so the saved
     * state is visible and "Wróć" is not offered (there is no first screen to go back to).
     */
    function showBanner(screen) {
        if (!banner) { return; }

        // Always re-read stored consent from cookie before showing — handles
        // reload, cross-tab edits, and DevTools tampering.
        var fresh = readConsentStore();
        var hasChoice = !!(fresh && isStoreComplete(fresh));
        if (hasChoice) {
            applyToggleState(fresh);
        } else {
            // No stored consent → reset all optional toggles to OFF (never pre-ticked)
            setAllOptional(false);
        }

        var name = screen || (hasChoice ? 'settings' : 'main');
        openedFromMain = (name === 'settings' && screen === 'settings' && !hasChoice);
        collapseAll();

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
    }

    function hideBanner() {
        if (!banner) { return; }
        banner.classList.remove('scm-banner-visible');
        banner.hidden = true;
        banner.setAttribute('hidden', '');
        if (overlay) {
            overlay.hidden = true;
            overlay.setAttribute('hidden', '');
            overlay.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('scm-modal-open');
    }

    /** Card descriptions are collapsed by default and whenever the banner opens. */
    function collapseAll() {
        var cards = banner.querySelectorAll('.scm-category');
        for (var i = 0; i < cards.length; i++) { setExpanded(cards[i], false); }
    }

    function setExpanded(card, open) {
        var btn  = card.querySelector('.scm-cat-toggle[aria-expanded]');
        var desc = card.querySelector('.scm-category-desc');
        if (!btn || !desc) { return; }
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        desc.hidden = !open;
        if (open) { desc.removeAttribute('hidden'); } else { desc.setAttribute('hidden', ''); }
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

    function finalizeConsent(store) {
        writeConsentStore(store);
        pushConsentUpdate(store);
        purgeRejectedCookies(store);
        hideBanner();
        showWidget();
    }

    /**
     * Close (X), ESC and overlay click:
     *  - first decision (no stored consent) → reject optional, per UODO closing
     *    a banner without a choice cannot be treated as consent;
     *  - editing an existing decision → just dismiss, the saved choice stays.
     */
    function goBack() {
        openedFromMain = false;
        setScreen('main', true);
    }

    function dismissBanner() {
        var stored = readConsentStore();
        if (stored && isStoreComplete(stored)) {
            applyToggleState(stored);
            hideBanner();
            showWidget();
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
        reopen:  function () { showBanner(); },
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
            showBanner();
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

        var btnReject = document.getElementById('scm-btn-reject-all');
        if (btnReject) {
            btnReject.addEventListener('click', function () {
                setAllOptional(false);
                finalizeConsent(getToggleState());
            });
        }

        var btnSettings = document.getElementById('scm-btn-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', function () {
                openedFromMain = true;
                setScreen('settings', true);
            });
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
            widget.addEventListener('click', function () { showBanner(); });
        }

        document.querySelectorAll('.scm-reopen-link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                showBanner();
            });
        });

        document.addEventListener('keydown', function (e) {
            if (banner && !banner.hidden) {
                if (e.key === 'Escape') {
                    if (currentScreen === 'settings' && openedFromMain) { goBack(); } else { dismissBanner(); }
                } else {
                    trapFocus(e);
                }
            }
        });
    });

}());
