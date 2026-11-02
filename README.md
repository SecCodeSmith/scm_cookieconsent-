# scm_cookieconsent — GDPR / RODO Cookie Consent

A professional cookie consent module for PrestaShop **1.7 / 8.x / 9.x** — compliant with the **GDPR** (Regulation 2016/679), Polish **UODO** guidelines and **Google Consent Mode v2**.

![Cookie consent banner — centered modal, Polish locale](docs/banner-modal-pl.png)

## Key features

| Status | Feature |
| --- | --- |
| ✅ | Granular consent per category (Essential, Analytics, Marketing, custom) |
| ✅ | **Multilanguage out of the box: Polish, English, German, French** (other shop languages fall back to English); every text editable per language from the admin panel |
| ✅ | Google Consent Mode v2 — `consent default` before any tags load, `consent update` after the user's choice |
| ✅ | Automatic tag injection: **Google Tag Manager**, **Google Analytics 4**, **Google Ads** (gtag.js) — gated by Consent Mode |
| ✅ | **Google Ads purchase conversions** sent by the module itself (`conversion` event with `send_to`, value, currency, transaction_id) — in direct `gtag.js` mode, or alongside GTM with an opt-in switch |
| ✅ | **Meta Pixel** loaded only after marketing consent (`ad_storage=granted`) — zero requests to Meta before consent; `fbq consent grant/revoke` |
| ✅ | `scm_consent_update` dataLayer event after every consent change — ready-made GTM trigger |
| ✅ | Three banner positions: bottom bar, centered modal, bottom-left panel |
| ✅ | Active cookie removal on rejection (wildcard `*` support) |
| ✅ | Configurable consent lifetime (default 365 days), JSON `scm_consent` cookie with `SameSite=Lax` |
| ✅ | Reopen widget + "change settings later" link |
| ✅ | No pre-checked optional toggles (GDPR art. 4(11) compliant) |
| ✅ | Editable brand colors (HEX) with live preview |
| ✅ | Legal footer with GDPR art. 6(1)(a) legal basis, data subject rights and the right to lodge a complaint |
| ✅ | Full accessibility: `role="dialog"`, `role="switch"`, focus trap, ESC, `focus-visible` |
| ✅ | Zero JS dependencies (~7 kB), ES5, works in IE 11+ |
| ✅ | `prefers-reduced-motion` respected |

## Languages

Default texts and default cookie categories ship in **Polish, English, German and French**. The module picks the right language automatically:

- **Banner texts** are stored per shop language (`Configuration` multilang values). Each installed language gets the bundled translation for its ISO code; any other language receives the English fallback. All texts are editable per language in the **Texts** tab.
- **Cookie categories** store their name and description per language (`scm_cookie_categories_lang` table). The CRUD form in the **Cookie categories** tab shows one field per installed language; empty translations inherit the default-language value.
- The front-office banner always renders in the visitor's current shop language.

## Admin panel (7 tabs)

1. **Settings** — data controller (name, address, e-mail), privacy policy URL, consent lifetime, banner position, reopen widget visibility
2. **Texts** — title, intro, all button labels, toggle labels and the legal footer — each editable per language
3. **Cookie categories** — full CRUD with per-language name/description: add, edit, enable/disable, delete (required categories are protected)
4. **Integrations** — GTM / GA4 / Google Ads / Meta Pixel IDs with format validation, the **Google Ads conversion label (purchase)** and a *send Ads conversions directly from the module* switch, plus a status table that tells you whether conversions are sent by the module, expected from your GTM container, or missing a label; the module injects the tags itself in the correct order
5. **Consent Mode v2** — enable switch, `wait_for_update`, `url_passthrough`, `ads_data_redaction`, `security_storage`, regional scoping, signal map
6. **Appearance** — brand colors (primary + accent) with instant preview
7. **GDPR help** — compliance checklists, key legal bases, links to UODO, EUR-Lex, EDPB

## Requirements

| | |
| --- | --- |
| PrestaShop | 1.7.0+, 8.x, 9.x |
| PHP | 7.1+ (8.1 – 8.4 on PrestaShop 9) |
| Theme | **any** theme — see "Theme independence" below |

Front-office assets are loaded through the modern `registerStylesheet` / `registerJavascript` API with an automatic fallback to legacy `addCSS` / `addJS` on older installations.

## Theme independence

The banner, the cookie categories and Consent Mode v2 all render from the module itself — no theme template override, no theme-specific CSS classes, no jQuery/Bootstrap dependency on the front end (ES5 vanilla JS, `scm-*` prefixed CSS in its own stylesheet).

The only thing a theme must do is call the standard `displayHeader` hook, which essentially every PrestaShop theme does (it's how `<head>` assets get injected in the first place). Everything else the module needs to *display* — the banner markup and the GA4 ecommerce payload — used to depend solely on the `displayBeforeBodyClosingTag` hook, which some minimal/custom themes never call, silently leaving the shop with no consent banner at all. As of 1.6.0 that same rendering is registered on **three** hooks — `displayBeforeBodyClosingTag`, `displayFooter`, `displayFooterAfter` — and de-duplicated internally so it prints exactly once no matter how many of the three the active theme actually fires. In practice this covers Classic, Hummingbird and virtually every commercial/custom theme without any per-theme configuration.

The one hook the module cannot route around is `displayOrderConfirmation` (used for the GA4 `purchase` event and the Google Ads conversion) — if a theme's order confirmation page omits it, purchase tracking and the Ads conversion (not the banner itself) won't fire for that theme.

**1.6.4 reverted the 1.6.3 cache-busting attempt — it broke asset loading entirely.** 1.6.3 appended `?v=<module version>` to the CSS/JS URLs passed to `registerStylesheet()`/`registerJavascript()`/`addCSS()`/`addJS()` to fight stale caches. On a live store (hialumed.pl) this made the banner disappear completely: PrestaShop's asset registration runs `file_exists()` against the literal path string and does not strip the query string first, so the check failed and the CSS/JS silently never got emitted into `<head>` at all — no error, just a banner with no styles or behavior. 1.6.4 removes the query string and goes back to plain, unversioned paths. **The takeaway: don't cache-bust PrestaShop module assets via a query string on the registered path.** If stale assets are suspected after an update, clear the cache manually (Preferences → Performance, plus any CDN/reverse-proxy cache in front of the shop) instead.

**1.6.3 (reverted, see 1.6.4 above) attempted a stale-asset fix:** the 1.6.2 fixes below were verified correct in isolation, but stores that copied the updated files over a live install kept showing the old broken behavior anyway, because `scm_cookieconsent.css` / `scm_cookieconsent.min.js` / `scm_ecommerce.js` were always registered at the exact same URL, letting browsers/CDNs/PrestaShop's CCC keep serving the byte-identical old file after an update.

**1.6.2 fixed two rendering bugs surfaced by testing on a default-theme demo store:**

- The dimmed backdrop was only ever shown when `position` was `"center"` — but the banner is marked `role="dialog" aria-modal="true"` in every position, so a store using the default `"bottom"` position (most stores) got no dimming at all behind the banner. The overlay now shows for every position, matching what it already claims to be (a modal).
- `.scm-btn` had an explicit `min-width: 110px` smaller than some translated button labels (e.g. long Polish text), which let a button shrink narrower than its own text — since the text couldn't wrap (`white-space: nowrap`), it spilled outside the button's background. Removing the explicit min-width restores the browser's default "never shrink below content" protection for flex items, so buttons that don't fit wrap onto a new row (`.scm-actions` already has `flex-wrap: wrap`) instead of clipping.

**1.6.1 fixed a second, more subtle theme dependency:** the banner is centered with `position: fixed; top/left: 50%; transform: translate(-50%,-50%)`, which is normally relative to the viewport — *unless* an ancestor element has its own `transform`/`filter`/`perspective` set, in which case that ancestor becomes the containing block instead (a CSS spec quirk, not a bug in this module). Since the banner markup is injected wherever the theme's hook zone happens to sit in the DOM, a theme with a transformed ancestor there (image sliders and off-canvas mobile-menu panels commonly use one) would trap the "fixed" banner inside that small box instead of centering it on the real viewport — exactly the kind of squashed-into-a-corner rendering that showed up on a default/Classic-theme demo store while a customized theme rendered it fine. `scm_cookieconsent.js` now re-parents the banner, overlay and reopen widget onto `<body>` directly at `DOMContentLoaded`, before anything else runs — regardless of which of the three hooks placed them or how deeply the theme nested that hook zone, their containing block is always the true viewport.

## Installation

1. Copy the `scm_cookieconsent/` directory into `<prestashop_root>/modules/`
2. In the PrestaShop back office: **Modules → Module Manager** → search for *SCM Cookie Consent* → **Install**
3. Click **Configure** and fill in the data controller details and the privacy policy URL

## Default categories

| Name | Required | Consent Mode | Patterns |
| --- | --- | --- | --- |
| Essential | Yes | `security_storage` | `PrestaShop-*`, `PHPSESSID`, `id_cart`, `ps_*` |
| Functional | No | `functionality_storage` | `currency`, `language`, `viewed_products` |
| Analytics (Google Analytics) | No | `analytics_storage` | `_ga`, `_ga_*`, `_gid`, `_gat` |
| Marketing (Google Ads, Meta, TikTok) | No | `ad_storage,ad_user_data,ad_personalization` | `_fbp`, `_gcl_*`, `_gac_*`, `fr` |
| Personalisation and remarketing | No | `personalization_storage` | `personalization_id`, `test_cookie` |

## Google Consent Mode v2

The module automatically calls:

```js
gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ... });  // before the choice
gtag('consent', 'update',  { analytics_storage: 'granted', ... });                       // after the choice
```

**Important:** if you enter IDs in the **Integrations** tab, the module injects the tags itself directly **after** the `default` signal — do not add the same tags manually. **GTM is the preferred path**: when a GTM container is configured (your own or from an external marketing module), direct `gtag.js` (GA4/Ads) is NOT loaded — configure GA4/Ads tags inside the GTM container instead. Direct `gtag.js` works only as a fallback when no GTM container exists.

### Google tag modes and event routing (1.7.0)

At `DOMContentLoaded` the head bootstrap decides which Google tag it actually ended up with and exposes the result as `window.SCM_GCM.mode`:

| Situation | `mode.ecommerce` | `mode.ads` |
| --- | --- | --- |
| GTM container present (own or external), direct-send switch off | `gtm` | `container` |
| GTM container present, direct-send switch on | `gtm` | `gtag` |
| No container — module loaded `gtag.js` itself | `gtag` | `gtag` (or `none` without an Ads ID) |
| External `gtag.js` only, direct-send on | `none` | `gtag` |
| Consent Mode disabled / nothing configured | `none` | `none` |

All ecommerce events go through one entry point, `window.SCM_GCM.track(name, params)`, and the purchase through `window.SCM_GCM.purchase(payload)`:

- `mode.ecommerce === 'gtag'` → events are sent as `gtag('event', name, params)`, so GA4 (and Ads remarketing) receive them. Before 1.7.0 they were silently dropped in this mode.
- `mode.ecommerce === 'gtm'` or `'none'` → the **unchanged** dataLayer contract: `dataLayer.push({ ecommerce: null })` followed by `dataLayer.push({ event: name, ecommerce: params })`. Existing GTM triggers keep working.
- Calls made before the mode is resolved (the inline purchase script runs during HTML parsing) are queued and flushed in order right after resolution.
- If the bootstrap is missing on a page, `scm_ecommerce.js` and the purchase template fall back to the dataLayer object pair.

Supported Consent Mode signals: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`, `functionality_storage`, `personalization_storage`, `security_storage`.

## Working with external marketing modules (GTM / TagConcierge / PS Marketing with Google)

If another module already injects Google tags (e.g. **TagConcierge GTM**, **PS Marketing with Google**, Google Analytics modules), this module automatically:

1. **Does not load a second container** — it detects active marketing modules (and an existing `gtm.js`/`gtag.js` script in the DOM) and skips its own GTM/GA4/Ads injection; a warning is shown in the admin panel.
2. **Places itself first in the `displayHeader` hook** — the `consent default` signal is emitted before the external module's GTM snippet.
3. **For returning visitors it sends `consent update` already in `<head>`** — `update` takes precedence over any later external `consent default`, so the saved choice is never overwritten.
4. **Resolves the tag mode at runtime** (`window.SCM_GCM.mode`) and routes ecommerce events accordingly — an external container keeps receiving the unchanged `{ event, ecommerce }` dataLayer pushes.

The external module's tags are still governed by this module's Consent Mode v2 (default + update), and the `scm_consent_update` event can be used as a GTM trigger.

## Meta Pixel integration

The `fbevents.js` script is **not loaded** until the user accepts the marketing category (`ad_storage` signal) — no request reaches Meta's servers before consent (UODO / EDPB Guidelines 5/2020 requirement). After consent the pixel starts immediately (no page reload): `fbq('consent', 'grant')` → `init` → `PageView`. After consent withdrawal `fbq('consent', 'revoke')` is called and the `_fbp` / `_fbc` cookies are actively removed.

After every consent change the module publishes a `dataLayer` event:

```js
{ event: 'scm_consent_update', scm_consent: { analytics_storage: 'granted', ad_storage: 'denied', ... } }
```

— use it in GTM as a trigger for consent-dependent tags.

## Google Ads conversion tracking

1. In Google Ads open the purchase conversion action → *Tag setup* → *Install the tag yourself* → **event snippet**. It contains `send_to: 'AW-123456789/AbCdEfGh_123'`.
2. In **Integrations** enter the part before the slash as the *Google Ads conversion ID* and the part after the slash as the *conversion label (purchase)*. The label is case-sensitive.
3. On the order-confirmation page the module sends:

```js
gtag('event', 'conversion', {
  send_to: 'AW-123456789/AbCdEfGh_123',
  value: 149.9,           // total paid incl. tax (same figure as the GA4 purchase value)
  currency: 'PLN',
  transaction_id: 'ORDER_REFERENCE'
});
```

The GA4 `purchase` event is still sent separately. Both are sent at most once per order per browser session (reloading the confirmation page does not report the order again), and Google de-duplicates on `transaction_id` as a second line.

**With a GTM container** the module stays hands-off by default: build the Ads conversion tag inside GTM with a *Custom Event* trigger on `purchase` and map `ecommerce.value`, `ecommerce.currency`, `ecommerce.transaction_id` from the data layer. If you prefer the module to send conversions itself, switch on *send Ads conversions directly from the module* — the module then loads `gtag.js` for the `AW-` ID next to the container and fires the conversion — and **remove the conversion tag from GTM**. Exactly one of the two must own the tag, otherwise every order is counted twice; the Integrations status table shows which one currently does.

**Consent:** the conversion event is submitted regardless of the visitor's choice; Consent Mode v2 decides what the Google tag does with it. With marketing consent denied the tag sends a cookieless, modelled ping (no advertising cookies), exactly as for pageviews. With Consent Mode disabled no Google tag is loaded at all, so nothing is sent.

## Configuration keys (`Configuration`)

| Key | Default value |
| --- | --- |
| `SCM_COOKIE_COMPANY_NAME` | shop name from PrestaShop |
| `SCM_COOKIE_COMPANY_ADDRESS` | *(empty)* |
| `SCM_COOKIE_COMPANY_EMAIL` | shop e-mail from PrestaShop |
| `SCM_COOKIE_PRIVACY_URL` | *(empty)* |
| `SCM_COOKIE_EXPIRY_DAYS` | `365` |
| `SCM_COOKIE_POSITION` | `bottom` |
| `SCM_COOKIE_SHOW_REOPEN` | `1` |
| `SCM_COOKIE_COLOR_PRIMARY` | `#2fb5d2` |
| `SCM_COOKIE_COLOR_ACCENT` | `#69b92d` |
| `SCM_COOKIE_GTM_ID` | *(empty — GTM disabled)* |
| `SCM_COOKIE_GA4_ID` | *(empty — GA4 disabled)* |
| `SCM_COOKIE_ADS_ID` | *(empty — Google Ads disabled)* |
| `SCM_COOKIE_ADS_CONVERSION_LABEL` | *(empty — Ads conversions not sent)* |
| `SCM_COOKIE_ADS_FORCE_DIRECT` | `0` (with GTM the container owns the Ads tag) |
| `SCM_COOKIE_META_PIXEL_ID` | *(empty — Meta Pixel disabled)* |
| `SCM_COOKIE_GCM_*` | Consent Mode v2 settings (`GCM_ENABLED=1`, `GCM_WAIT_MS=500`, …) |
| `SCM_COOKIE_TXT_*` | banner texts, stored **per language** (PL/EN/DE/FR defaults) |

## File structure

```text
scm_cookieconsent/
├── scm_cookieconsent.php
├── views/
│   ├── css/
│   │   ├── scm_cookieconsent.css      — banner styles (front)
│   │   └── admin.css                  — admin panel styles
│   ├── js/
│   │   ├── scm_cookieconsent.js       — IIFE logic (SOURCE — edit here)
│   │   ├── scm_cookieconsent.min.js   — build loaded on the front
│   │   └── src/gcm_bootstrap.src.js   — source of the inline bootstrap in gcm_bootstrap.tpl
│   └── templates/
│       ├── admin/configure.tpl        — configuration page
│       └── hook/
│           ├── cookie_banner.tpl      — banner template
│           └── gcm_bootstrap.tpl      — Consent Mode v2 bootstrap (minified)
├── LICENSE
└── README.md
```

The front office only receives minified code. After changing the sources, rebuild:

```bash
npx terser views/js/scm_cookieconsent.js -c -m -o views/js/scm_cookieconsent.min.js
npx terser views/js/src/gcm_bootstrap.src.js -c -m   # paste the result into {literal} in gcm_bootstrap.tpl
```

## Database

| Table | Purpose |
| --- | --- |
| `scm_cookie_categories` | cookie categories (base data + default-language name/description) |
| `scm_cookie_categories_lang` | per-language category name/description |

## Hooks

| Hook | Purpose |
| --- | --- |
| `displayHeader` | CSS + JS loading, Consent Mode v2 bootstrap |
| `displayBeforeBodyClosingTag` | banner rendering + inline configuration (1st candidate — see "Theme independence") |
| `displayFooter` | banner rendering fallback for themes that don't call the hook above |
| `displayFooterAfter` | banner rendering fallback for themes that don't call either hook above |
| `displayOrderConfirmation` | GA4 `purchase` event with real order data + Google Ads `conversion` event (when a conversion label is configured) |

The three banner-rendering hooks all call the same internal `renderBannerAndEcommerce()` method, which renders the banner exactly once per page even if a theme fires more than one of them.

## Disclaimer

This module is a technical tool that supports GDPR compliance, but it does not replace legal advice. Consult your privacy policy and record of processing activities with a lawyer or DPO.

## License

**SecCodeSmith Commercial License v1.1** — © 2026 SCM Jakub Berechowski

| User type | Terms |
| --- | --- |
| Individuals, non-commercial projects | Free |
| Small and medium businesses (< 500 employees and < €50M revenue) | Free |
| Enterprises (≥ 500 employees or ≥ €50M revenue) | Commercial license required |

To purchase an Enterprise license, contact: [admin@seccodesmith.pl](mailto:admin@seccodesmith.pl)

Full license text: [LICENSE](LICENSE)
