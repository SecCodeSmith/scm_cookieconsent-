# Proposal

## Why

Today the module loads the Google tag (GTM container or `gtag.js`) on **every** page view, before the visitor has chosen anything, with Consent Mode v2 "denied" defaults. That is Consent Mode **advanced**: Google receives cookieless pings from visitors who never consented or who refused. The shop owner decided on 2026-11-15 to run Consent Mode **basic** instead: nothing is requested from Google (or any other optional service) until the visitor grants a category that needs it. This is the more cautious reading of the ePrivacy rule on access to a visitor's device and of Polish data-protection authority practice, and the shop's conversion work depends on measurement that is lawful.

Observed in the current code (1.8.0):

- `injectGoogleTags()` in `views/js/src/gcm_bootstrap.src.js` runs at `DOMContentLoaded` on every page and requests `gtm.js` or `gtag/js` whatever the stored choice is. Only the Meta Pixel is already consent-gated.
- Both in-flight changes assume advanced mode: `add-google-ads-conversion-tracking` says the Ads conversion "SHALL be submitted regardless of the visitor's marketing consent state", and its manual check 5.3(e) expects a hit with ad storage denied.
- The module renders a floating "reopen" button but no text link "Zmień ustawienia cookies" in the footer (the `.scm-reopen-link` click handler exists in `views/js/scm_cookieconsent.js` but nothing prints such a link).
- The first layer of the banner has three buttons with three different styles; "Akceptuję wszystkie" is filled and shadowed, "Odrzuć opcjonalne" is plain white, so rejecting is visibly the weaker choice.
- The admin accepts a consent lifetime up to 3650 days, longer than the 12 months the shop's policy allows.

## What Changes

- **Basic mode loading.** No Google tag, container or other optional script is requested before the matching category is granted. After a grant on the current page the module loads the tag, applies the consent update, then flushes the events queued on that page exactly once, in order. On later pages a stored grant loads the tag at once. Withdrawing consent stops tags from the next page view. An analytics-only grant loads no Ads or remarketing tag (direct mode; see design for GTM mode).
- **Both tag modes** (GTM container id; direct GA4/Ads ids) follow the same rule.
- **Event queue.** Events raised before a grant are held in the page's memory only (never written to the dataLayer, never stored), delivered after the grant, and dropped when the page is left or the visitor rejects. "Once" guards for `purchase` and the checkout events move from queue time to dispatch time so a late grant is not blocked by a guard that was set earlier.
- **Banner first layer.** "Odrzuć opcjonalne" and "Akceptuję wszystkie" become equal in size and visual weight at 390 by 844; neither is styled as the main action. The banner stays out of the way of the page's main purchase button after the first choice.
- **Footer link.** A text link "Zmień ustawienia cookies" is printed in the footer of every page (switchable in Settings, on by default) and opens the banner.
- **Retention.** The stored choice lasts at most 365 days: the admin limit drops from 3650 to 365 and existing larger values are clamped on upgrade.
- **Tests.** The Playwright suite gains a request log that proves no request to an analytics or advertising host before a choice or after rejection, and that queued events are delivered after a late grant.
- **Release.** Version 1.9.0, an `upgrade-1.9.0.php`, README and release zip.
- **BREAKING for measurement, by the owner's choice.** GA4 and Google Ads figures fall, because Google no longer receives modelled signals for visitors who refuse. The shop's own order data is unaffected.

## Capabilities

### New Capabilities

- `consent-gated-tag-loading`: when Google tags and other optional scripts may be requested, how the page's event queue behaves around a consent grant, the two tag modes and the Ads conversion under basic mode.
- `consent-banner-choices`: the first-layer choices of the banner (equal weight, not covering the purchase button), the footer link to change the choice, and how long the choice is kept.

### Modified Capabilities

_None._ `openspec/specs/` is empty: the two in-flight changes have not been archived, so their requirements do not yet exist as main specs and cannot be modified by a delta. `design.md` ("Reconciliation") lists which of their requirements this change supersedes and how to convert these deltas to `MODIFIED` once they are archived.

## Impact

- `views/js/src/gcm_bootstrap.src.js` and its minified copy in `views/templates/hook/gcm_bootstrap.tpl` (loading, queue, update API).
- `views/js/scm_ecommerce.js` and `views/templates/hook/ecommerce_purchase.tpl` (once-guards at dispatch time).
- `views/templates/hook/cookie_banner.tpl`, `views/css/scm_cookieconsent.css`, `views/js/scm_cookieconsent.js` (+ `.min.js`) (button layout, footer link).
- `scm_cookieconsent.php` (version, config key, expiry validation, footer link output, README of tag modes), `upgrade/upgrade-1.9.0.php`, `README.md`.
- `tests/e2e/` (request-log fixture, new spec, existing specs that assume the tag mode is resolved right after `go()`).
- No new dependency, no database table, no new third-party request.
- Stores using an external container module (TagConcierge, PS Marketing with Google) keep loading that container themselves; basic mode cannot gate scripts this module does not print (see design, open questions).
