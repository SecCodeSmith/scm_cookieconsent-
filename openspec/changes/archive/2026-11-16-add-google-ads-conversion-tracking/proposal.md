# Proposal

## Why

Stores that enter a Google Ads conversion ID (`AW-…`) in the Integrations tab see **no conversions in Google Ads** — the module loads the Google tag and emits Consent Mode v2 signals, but never sends a conversion event, and in direct `gtag.js` mode the GA4 ecommerce events it pushes are never received by the Google tag either. The banner is supposed to be the single owner of the Google tag; today it owns loading and consent but not measurement, so the most important event (the purchase) is silently lost.

Observed in the current code (1.6.7):

- `views/js/src/gcm_bootstrap.src.js` calls `gtag('config', 'AW-…')` only. There is no conversion-label setting and no `gtag('event', 'conversion', { send_to: 'AW-…/LABEL', … })` anywhere, so Google Ads has nothing to count.
- `views/js/scm_ecommerce.js` and `views/templates/hook/ecommerce_purchase.tpl` push GTM-style objects (`dataLayer.push({ event: 'purchase', ecommerce: … })`). `gtag.js` only processes `gtag()` command pushes, so when the module runs in direct `gtag.js` mode (no GTM container) GA4 receives **no** ecommerce events — `view_item`, `add_to_cart`, `begin_checkout` and `purchase` are all dropped, which also closes the "import GA4 purchase into Ads" fallback.
- When a GTM container is in use, the module never fires conversions itself and gives the admin no indication that the Ads conversion tag must live inside GTM; an admin who only filled in the `AW-` ID reasonably expects the module to handle it.

## What Changes

- **Google Ads purchase conversion**: new Integrations setting *Google Ads conversion label (purchase)*. When an Ads ID and label are configured, the module fires the standard Ads conversion event on the order-confirmation page with `send_to: AW-ID/LABEL`, `value`, `currency` and `transaction_id` taken from the real order, protected by the existing per-order double-count guard. Consent Mode v2 keeps governing the hit (cookieless modelled ping when `ad_storage` is denied) — no extra blocking is added.
- **Mode-aware event routing**: the head bootstrap resolves, once per page, which Google tag it actually ended up with (own GTM / external GTM / own `gtag.js` / none) and exposes a single tracking entry point. In direct `gtag.js` mode, ecommerce events are delivered as `gtag('event', …)` calls so GA4 (and Ads remarketing) receive them; in GTM mode the existing `dataLayer.push({ event, ecommerce })` contract is preserved unchanged so existing container triggers keep working. Events emitted before the mode is known (the inline purchase script runs before `DOMContentLoaded`) are queued and flushed in order.
- **Direct Ads tag alongside GTM (opt-in)**: new Integrations switch *Send Google Ads conversions directly from the module (also with GTM)*. When enabled and a GTM container is present, the module additionally loads `gtag.js` for the `AW-` ID only and fires conversions itself, so stores that cannot or do not want to configure the Ads tag inside GTM still get conversions. Default off: with GTM the container remains the owner of Ads tags, exactly as today.
- **Admin visibility and validation**: the Integrations status table shows whether conversions are *sent by the module*, *expected from the GTM container*, or *not configured*; saving validates the label format, rejects a label without an Ads ID, warns when an Ads ID has no label in a mode where the module is the sender, and warns about double counting when direct Ads tag + GTM are both on.
- **Install / upgrade**: two new configuration keys (`SCM_COOKIE_ADS_CONVERSION_LABEL`, `SCM_COOKIE_ADS_FORCE_DIRECT`) with defaults on install and an `upgrade-1.7.0.php` that seeds them on existing installs; module version bumps to 1.7.0.
- **Documentation**: README (feature table, Consent Mode / integrations section, configuration keys), Integrations-tab help texts and the GTM how-to in the admin panel describe the conversion setup for both modes.

Not a breaking change: stores without an Ads ID, or with GTM and the switch left off, observe identical dataLayer behaviour to 1.6.7.

## Capabilities

### New Capabilities

- `google-tag-integration`: how the module takes ownership of the Google tag on the page — which script it loads (GTM vs direct `gtag.js`, runtime de-duplication against external containers, the opt-in Ads-only `gtag.js` next to GTM), how it resolves the resulting tag mode, and how ecommerce/marketing events are routed to that tag (GTM-style dataLayer objects vs `gtag()` commands, pre-resolution queueing, fallback when no tag is present).
- `google-ads-conversion-tracking`: the Google Ads purchase conversion — configuration (conversion ID + label, direct-send switch), the conversion event payload sourced from the confirmed order, per-order de-duplication, behaviour under each tag mode and under denied consent, and the admin validation/status rules for the conversion settings.

### Modified Capabilities

_None — the project has no existing specs; related existing behaviour (tag loading order, GA4 ecommerce dataLayer) is captured as ADDED requirements inside the new capabilities where this change depends on it._

## Impact

- **Front-office JS**: `views/js/src/gcm_bootstrap.src.js` (mode resolution, `track`/`purchase` API, Ads-only `gtag.js` loader) and its minified copy inside `views/templates/hook/gcm_bootstrap.tpl` (must be re-minified); `views/js/scm_ecommerce.js` and `views/templates/hook/ecommerce_purchase.tpl` switch to the new entry point with a dataLayer fallback.
- **PHP module** `scm_cookieconsent.php`: new config keys in `installConfig()`, `uninstallConfig()`, `getAllConfig()`, `saveIntegrations()` (validation + warnings), `hookDisplayHeader()` (`tags` payload gains `adsConversionLabel`, `adsForceDirect`); version `1.7.0`.
- **Admin template** `views/templates/admin/configure.tpl`: Integrations tab (two new fields, status row, help texts, GTM how-to step).
- **Upgrade**: new `upgrade/upgrade-1.7.0.php`.
- **Docs**: `README.md`.
- **Assumptions recorded** (the request did not say which mode the affected store uses): the design covers both GTM and direct `gtag.js` modes; the direct-with-GTM switch defaults to off to preserve the "GTM owns the tags" rule and the existing double-counting safeguards. Enhanced conversions (`user_data`), dynamic-remarketing item attributes, and additional conversion actions (e.g. `begin_checkout`) are out of scope and noted as follow-ups in the design.
- **No new runtime dependencies**; `terser` via `npx` is still the only build tool. The repo has no automated test suite (CI runs `php -l` and `build.ps1`), so verification is a scripted bootstrap harness plus a documented manual check with Google Tag Assistant.
