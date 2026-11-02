# Design

## Context

See proposal.md — Why. The relevant current state (1.6.7):

- `views/js/src/gcm_bootstrap.src.js` is printed inline and **first** in `<head>` (hookDisplayHeader, position 1). It pushes the Consent Mode default, exposes `window.SCM_GCM` (`config`, `categories`, `tags`, `stored`, `update()`), and defers the Google tag injection to `DOMContentLoaded` so it can run a runtime de-dup check against containers other modules print later in the page. The injection logic is: own GTM if `gtmId` and no container present → return; else direct `gtag.js` only if a GA4/Ads ID is set **and** no GTM ID **and** no container **and** no `gtag/js` script present. Its minified form is pasted into `views/templates/hook/gcm_bootstrap.tpl` by hand (`npx terser … -c -m`).
- `views/js/scm_ecommerce.js` (registered in `<head>`, priority 160, unminified) and the inline `views/templates/hook/ecommerce_purchase.tpl` push GTM-style objects straight to `dataLayer`. The purchase template runs during HTML parsing, i.e. before the bootstrap resolves which tag exists; `scm_ecommerce.js` fires page events in its own `DOMContentLoaded` listener.
- `hookDisplayOrderConfirmation()` already builds the purchase payload from the real `Order` (reference, `total_paid_tax_incl`, tax, shipping, currency ISO, items).
- Tag IDs come from `Configuration` (`SCM_COOKIE_GTM_ID`, `GA4_ID`, `ADS_ID`, `META_PIXEL_ID`) through `getAllConfig()` and are serialised to JS as `SCM_GCM_DATA.tags`. `saveIntegrations()` validates formats and already warns about GTM + direct tags double counting.
- No automated tests exist; CI runs `php -l` (PHP 7.4 and 8.3) and `build.ps1`. Front-office JS must stay ES5 (README promise: IE 11+, zero dependencies).

Constraints that shape the approach: the module must keep working next to external containers (TagConcierge, PS Marketing with Google); GTM-mode stores rely on the exact `{ event, ecommerce }` contract for their existing triggers; the bootstrap must stay small and ES5; everything the browser receives must still be governed by Consent Mode v2 with no extra blocking (the module's documented position is "tags load immediately, Consent Mode decides cookies vs. cookieless pings").

## Goals / Non-Goals

**Goals:**
- A merchant who enters `AW-…` + label gets Ads purchase conversions without touching GTM, in direct `gtag.js` mode by default and in GTM mode when they opt in.
- GA4 ecommerce events reach GA4 in direct `gtag.js` mode (today they are silently dropped there).
- Zero behavioural change for stores in GTM mode with the opt-in switch off, and for stores without an Ads ID.
- One place (the head bootstrap) decides how events are dispatched; the ecommerce script and the purchase template become thin callers with a safe fallback.

**Non-Goals:**
- Enhanced conversions (`gtag('set','user_data', …)` with hashed e-mail/phone/address) — a separate change; it needs its own `ad_user_data` policy and admin consent copy.
- Dynamic remarketing item attributes (`google_business_vertical`, `id` aliases) and additional Ads conversion actions (`begin_checkout`, `add_to_cart`, lead forms).
- A configurable conversion `value` basis (excluding shipping/tax). `value` is the total paid incl. tax, the same figure GA4 `purchase.value` already uses.
- Server-side / offline conversion upload, GA4 key-event import setup in Google Ads, GTM container templates.
- A build-time guard that the minified bootstrap in the `.tpl` matches the source (would be useful; left out to keep this change focused — tracked as a follow-up).

## Decisions

### D1 — Mode-aware dispatch lives in the head bootstrap, resolved at `DOMContentLoaded`, with a queue
`SCM_GCM` gains:

```js
SCM_GCM.mode    = { ecommerce: 'gtm'|'gtag'|'none', ads: 'gtag'|'container'|'none' }  // set once
SCM_GCM.ready   = false → true after injectGoogleTags()
SCM_GCM.track(name, params)     // GA4 ecommerce event
SCM_GCM.purchase(payload)       // GA4 purchase + Ads conversion
```

`injectGoogleTags()` (already deferred to `DOMContentLoaded`) sets `mode`, flips `ready`, then flushes a `pending` array in order. `track()` before `ready` only appends to `pending`. Dispatch rules per the `google-tag-integration` spec: `ecommerce: 'gtag'` → `gtag('event', name, params)`; `'gtm'`/`'none'` → `dataLayer.push({ ecommerce: null }); dataLayer.push({ event: name, ecommerce: params })`.

Why here: the bootstrap is the only script that (a) runs before every other module's snippet, (b) already owns the loader and the de-dup check, and (c) is guaranteed to exist whenever a Google tag exists. The listener order also works out: the bootstrap's `DOMContentLoaded` listener is registered inline in `<head>` before registered JS files load, so `mode` is resolved before `scm_ecommerce.js`'s own listener fires; the inline purchase script runs during parsing and is covered by the queue. If a theme prints the header hook after the JS assets, the queue still covers the ecommerce script's early events.

Alternatives considered:
- *Always push both formats* (object + `gtag()` command): rejected. Tag Assistant shows duplicate events, and a store with both an external container and our `gtag.js` could process an event twice.
- *Decide the mode server-side* from installed modules: rejected — the code already documents that "installed ≠ emitting" (TagConcierge can be installed but silent), which is why de-dup moved to runtime in the first place.
- *Let `scm_ecommerce.js` detect the loaded tag itself*: rejected; it would duplicate the detection and introduce a second place that must agree on ordering.

### D2 — Ads conversions are sent as the native `conversion` event with `send_to`, not via GA4 import
In `gtag` Ads mode, `SCM_GCM.purchase(p)` calls `track('purchase', p)` and then, if `tags.adsId && tags.adsConversionLabel`:

```js
gtag('event', 'conversion', {
  send_to: tags.adsId + '/' + tags.adsConversionLabel,
  value: p.value, currency: p.currency, transaction_id: p.transaction_id
});
```

This is Google's standard event snippet for purchase conversion actions: it works without GA4, de-duplicates on `transaction_id` on Google's side, and attributes in Ads immediately. GA4 key-event import remains possible as a side effect of GA4 now receiving `purchase` in direct mode, but it requires Ads-side configuration and has attribution lag, so it is not the primary path.

### D3 — With a GTM container the module stays hands-off by default; `ADS_FORCE_DIRECT` opts in
The existing rule "GTM owns the tags; never load `gtag.js` next to a container" is preserved as the default, because the documented GTM setup (admin how-to step 3) already tells merchants to put the Ads conversion tag inside the container; firing it from the module too would double count for every store that followed the docs.

When `ADS_FORCE_DIRECT=1` and an Ads ID is set, `injectGoogleTags()` additionally loads `gtag/js?id=AW-…` and issues `gtag('js', …)` + `gtag('config', adsId)` **only** (never GA4), and `mode.ads` becomes `'gtag'` while `mode.ecommerce` stays `'gtm'`. Google explicitly supports the Ads Google tag side by side with a GTM container, and the two never see each other's events (GTM ignores `gtag()` command pushes for tag firing; `gtag.js` ignores plain object pushes). Loading a second `gtag/js` script when an external one exists is harmless (same loader, additional target). The double-counting warning on save and the status row make the trade-off explicit.

Alternatives considered:
- *Always send the conversion via `gtag()` even with GTM*: rejected (double counting for the documented setup).
- *Push a dedicated `scm_ads_conversion` dataLayer event for GTM*: rejected — adds nothing over the existing `purchase` event, which an Ads conversion tag in GTM already uses as its trigger with `ecommerce.value/currency/transaction_id`.

### D4 — The purchase template stays the de-dup owner and becomes a thin caller
`ecommerce_purchase.tpl` keeps its `sessionStorage` guard keyed by `transaction_id` and wraps **one** call: `SCM_GCM.purchase(p)` when available, else the current two object pushes. Putting the guard around the single entry point guarantees GA4 purchase and Ads conversion share one de-dup decision. `scm_ecommerce.js` replaces its `pushEvent` body with `SCM_GCM.track` + the same fallback.

### D5 — Settings and payload plumbing
- New `Configuration` keys: `SCM_COOKIE_ADS_CONVERSION_LABEL` (string, default `''`) and `SCM_COOKIE_ADS_FORCE_DIRECT` (0/1, default `0`). Added to `installConfig()`, `uninstallConfig()`, `getAllConfig()`.
- `saveIntegrations()`: label regex `^[A-Za-z0-9_-]{4,40}$`, **not** uppercased (labels are case-sensitive; the Ads ID keeps its existing uppercase normalisation). Error if label set without Ads ID. Warnings after a successful save per the spec (label missing while module is sender; GTM + force-direct; force-direct without Ads ID).
- `hookDisplayHeader()`: `tags` gains `adsConversionLabel` and `adsForceDirect` (bool).
- `configure.tpl` Integrations tab: label input (`pattern` mirrors the regex) under the Ads ID, radio pair for direct-send (same markup style as the Consent Mode tab radios), status row computed in Smarty from the four config values, help-text and "How it works"/GTM step-3 copy updated. Copy stays Polish like the rest of the admin UI.
- Admin status wording is derived server-side from config only (no browser detection), so it describes *intent*; the actual runtime mode is observable in `window.SCM_GCM.mode` for support/debugging.

### D6 — Versioning and upgrade
Module version `1.6.7 → 1.7.0` (new merchant-facing capability). `upgrade/upgrade-1.7.0.php` seeds the two keys with `Configuration::updateValue` only when `Configuration::get()` returns `false`, and returns `true`; no hook registrations or schema changes are needed. Keeps the existing pattern of `upgrade-1.5.0.php` / `upgrade-1.6.0.php`.

### D7 — Verification without a test suite
- A throwaway Node harness (kept in the session scratchpad, not committed) stubs `window`, `document` (`readyState`, `querySelector`, `createElement`, `getElementsByTagName`, `addEventListener`), `localStorage` and `document.cookie`, loads `gcm_bootstrap.src.js` with a given `SCM_GCM_DATA`, simulates the `DOMContentLoaded` callback, and asserts the `dataLayer` contents for: direct mode (`gtag` command for `view_item`, `conversion` payload), GTM mode (object pair, no `conversion`), GTM + force-direct (`gtag/js?id=AW` requested, `config` for AW only, `conversion` sent), and queue ordering (events pushed before resolution).
- The same harness runs against the **minified** bootstrap text extracted from `gcm_bootstrap.tpl` to prove the pasted build matches the source.
- `php -l` on all PHP files (both CI PHP versions if available locally), `build.ps1` to produce the zip.
- Manual check documented in tasks: Google Tag Assistant on a staging store — direct mode shows a `conversion` hit to `googleads.g.doubleclick.net/pagead/viewthroughconversion/<id>/?label=<label>&value=…`; GTM mode shows the `purchase` event in Preview.

## Risks / Trade-offs

- [Double counting when a merchant enables direct-send while the GTM container also holds the Ads conversion tag] → save-time warning naming the exact condition, status row says "sent by the module", README section explains that exactly one of the two must own the tag; default remains off.
- [An external `gtag.js` already configured for the same `AW-` ID plus force-direct] → both would send the conversion; Google de-duplicates on `transaction_id` for the same conversion action, and the setting is opt-in and documented as "only when the Ads tag is not deployed elsewhere".
- [Theme prints the header hook after JS assets, so the ecommerce script's `DOMContentLoaded` runs before the bootstrap resolves the mode] → the pending queue absorbs it; `track()` never drops an event, it only delays until resolution.
- [Bootstrap deferred to `DOMContentLoaded` while `document.readyState` is already past `loading` (e.g. injected late by a cache plugin)] → the existing code path calls `injectGoogleTags()` synchronously in that case, so `ready` flips immediately.
- [First-time visitor converts before giving consent] → with `wait_for_update` (default 500 ms) the tag holds briefly, then sends a cookieless modelled conversion ping; this is the consent-mode behaviour the module already relies on for pageviews, so no new legal exposure.
- [Minified bootstrap in the `.tpl` drifts from the source] → tasks require re-minifying and running the harness against the pasted text; a permanent build guard is a noted follow-up.
- [Stores with CCC / CDN caches keep serving old `scm_ecommerce.js`] → not new; README already instructs clearing caches after an update (no query-string cache busting, see the 1.6.4 note).
- [`displayOrderConfirmation` not called by a theme] → existing limitation, unchanged: no purchase and no conversion for that theme; documented in README.

## Migration Plan

1. Upload the 1.7.0 module files over the existing install (or install the built zip); PrestaShop runs `upgrade-1.7.0.php`, which only seeds the two new settings.
2. Clear Preferences → Performance cache (and any CDN) so the new `scm_ecommerce.js` and header output are served.
3. In Integrations, enter the Ads conversion label; for GTM stores decide whether the container keeps the Ads tag (default) or switch on direct-send and remove the tag from the container.
4. Verify with Google Tag Assistant / Ads "Conversions → Diagnostics" within 24–48 h.
5. Rollback: re-upload the 1.6.7 files; the two extra `Configuration` rows are inert for the old code and can be left in place.

## Open Questions

- Which mode the store that reported the problem runs (GTM vs direct `gtag.js`) — does not change the design, only which of the two rollout paths in the Migration Plan applies during verification.
- Whether merchants will want `value` without shipping/tax — deferred; can be added later as a setting without touching the event routing.
