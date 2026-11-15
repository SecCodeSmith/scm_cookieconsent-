# Tasks

Specs: `specs/consent-gated-tag-loading/spec.md`, `specs/consent-banner-choices/spec.md`. Approach: `design.md` (D1-D10 and "Reconciliation"). Front-office JS stays ES5 with no dependencies. The code is read with `graphify query` first (project rule); run `graphify update .` after code changes. Land after the two in-flight changes are archived (see design, Migration Plan).

## 1. Request log and failing tests first

- [ ] 1.1 Add a `requests` fixture to `tests/e2e/specs/helpers.js`: record every request URL with `page.on('request')`, answer analytics/advertising hosts (`googletagmanager.com`, `google-analytics.com`, `analytics.google.com`, `doubleclick.net`, `googleadservices.com`, `googlesyndication.com`, `connect.facebook.net`) with an empty stub script, expose `requests.toHosts()` and `requests.since(mark)`. Verify: a throwaway test that loads the shop on 1.8.0 shows the tag request in the log (proves the fixture sees it).
- [ ] 1.2 Write `tests/e2e/specs/06-consent-basic.spec.js` with the seven groups listed in design D9 (no choice, reject, late grant, analytics only, withdrawal, purchase guard, geometry/footer/retention). Verify: run against 1.8.0 and see the no-choice, reject, analytics-only and geometry tests fail for the expected reasons (tag requested early, no footer link, unequal buttons); the full-journey test is written so it passes both before and after.
- [ ] 1.3 Update existing specs `02-catalog`, `03-checkout`, `04-account` so reads of `SCM_GCM.mode` and of tag-dependent events wait for `SCM_GCM.ready` after the grant in `go()`. Verify: `npx playwright test 02 03 04` still passes on 1.8.0.

## 2. Loading, queue and update order (bootstrap)

- [ ] 2.1 In `views/js/src/gcm_bootstrap.src.js` replace `injectGoogleTags()` by an idempotent `loadTags(granted)` per D1 (analytics grant: GA4 config; advertising grant: Ads config, conversion, Meta Pixel; GTM mode: container on any of the four signals), keeping the runtime de-duplication check and `adsForceDirect`. Verify: with nothing granted the Node harness (stubbed `document`, as in the earlier changes) records no script insertion; with analytics only, one `gtag.js` insertion and no Ads `config`.
- [ ] 2.2 Rework the queue per D3 (hold until a grant has started its tag, never push to the dataLayer before, empty on reject, cap 100) and the order in `SCM_GCM.update()` per D2 (tag, consent `update`, `scm_consent_update`, flush). Verify: harness asserts the command order for a late grant and that a reject empties the queue and the dataLayer holds no event.
- [ ] 2.3 Add the optional guard-key argument to `track`, `event` and `purchase`, recorded at dispatch (D4); change `views/templates/hook/ecommerce_purchase.tpl` and the `once()` callers in `views/js/scm_ecommerce.js` (`scm_ship_*`, `scm_uevt_*`) to pass the key instead of writing it. Update the header comment of `scm_ecommerce.js` ("pushes are made unconditionally"). Verify: harness covers reload-before-choice then grant (one `purchase`) and reload-after-delivery (none).
- [ ] 2.6 Fix the two funnel defects found by the shop's theme check (workspace `scmedical-prestashop`, `tests/e2e/specs/ga4-funnel.spec.ts`, 2026-11-15):
  - `begin_checkout` is pushed on every checkout reload, 4 times in one order, because `views/js/scm_ecommerce.js:275-277` has no once-guard. Guard it per cart id with the delivery-time guard of 2.3.
  - `add_payment_info` listens only for `change`, so a single preselected payment option sends none. Also deliver it once on load when a `payment-option` radio is already checked.

  Verify: the e2e test in group 6 of `06-consent-basic.spec.js` shows `begin_checkout` once across the step reloads, and `add_payment_info` once with a single preselected method.
- [ ] 2.4 Re-minify with `npx terser views/js/src/gcm_bootstrap.src.js -c -m`, paste into the `{literal}` block of `views/templates/hook/gcm_bootstrap.tpl`, update the template's header comment (order of loading). Verify: a script that extracts the `.tpl` payload, minifies the source and compares them reports identical; the same check is added to `build.ps1` and fails the build on a mismatch.
- [ ] 2.5 Run e2e groups 1 to 6 of `06-consent-basic.spec.js` for both tag modes (GTM stub and direct). Verify: all pass; the request log has no analytics/advertising host in the no-choice and reject cases.

## 3. Banner and footer link

- [ ] 3.1 CSS: one shared style for `.scm-btn-reject`, `.scm-btn-accept` (and `.scm-btn-save`) in `views/css/scm_cookieconsent.css` (lines 229-265 and the mobile block at 329), per D7; brand colour only on focus rings and toggles. Verify: group 7 of the new spec (computed style and size equal at 390 by 844 and 1366 by 768, no vertical scrolling inside the banner).
- [ ] 3.2 Add config key `SHOW_FOOTER_LINK` (default 1) in `installConfig()`, `uninstallConfig()`, `getAllConfig()` field lists and the Settings tab (`views/templates/admin/configure.tpl`, save handler `saveSettings()`); print the link from `renderBannerAndEcommerce()` / `cookie_banner.tpl`; hide the round reopen button under 600 px when the link is on. Verify: group 7 (link on home, category, product, cart, confirmation; click opens the banner with saved toggles; setting off removes it) and a geometry assertion that no module element overlaps the add-to-cart button at 390 by 844.
- [ ] 3.3 Integrations tab notice for scripts printed by other modules and the GTM container checklist (D6), Polish copy in `configure.tpl`. Verify: the notice text is present on the Integrations tab in the e2e admin spec `05-admin`.

## 4. Retention and upgrade

- [ ] 4.1 Limit the lifetime to 1-365 in `saveSettings()` (`scm_cookieconsent.php:608`, message text) and the input `max` in `configure.tpl`; add `upgrade/upgrade-1.9.0.php` (clamp a larger `SCM_COOKIE_EXPIRY_DAYS` to 365, seed `SHOW_FOOTER_LINK`). Verify: `php -l` on PHP 7.4 and 8.3 (CI job), and an e2e `01-upgrade` case that sets 730, upgrades, and reads 365 from `ps_configuration`; saving 400 in the admin is refused.

## 5. Docs, version and release

- [ ] 5.1 Set `$this->version = '1.9.0'` (`scm_cookieconsent.php:40`); update `README.md` (Google tag modes, Consent Mode v2 section, "Measurement effect" with the owner's trade-off, container checklist, hooks, new key, e2e instructions in `tests/e2e/README.md`). Verify: `Select-String` finds no remaining statement that tags load before consent; README table of modes matches the spec.
- [ ] 5.2 Run the whole e2e suite (`npx playwright test`) and the `php -l` lint. Verify: all green, output kept in the change notes.
- [ ] 5.3 Build the release with `./build.ps1`. Verify: `dist/<version>.<build>-<branch>.zip` exists, contains a single top-level `scm_cookieconsent/` folder, no `tests/`, `openspec/`, `graphify-out/` or `.claude/` entries, and installs on a clean PrestaShop 8.1 (the e2e `reset` command) showing version 1.9.0.
- [ ] 5.4 Manual staging check with a real consent flow and the browser network panel: no Google host before a choice and after rejection; after "Akceptuję wszystkie" the tag loads and GA4 DebugView (direct) or GTM Preview (GTM) shows the six events once. Verify: observed results recorded in the change notes.

## Workflow follow-up

- After the in-flight changes are archived, convert the two spec deltas to `MODIFIED` where design "Reconciliation" lists them, run `openspec validate --strict`, then archive this change.
- Tell the shop repository's owner which module version to install and that GA4 and Ads figures will drop from that day.
