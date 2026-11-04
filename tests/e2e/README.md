# scm_cookieconsent - end-to-end tests (Playwright)

Real-storefront proof for the GA4 events of module version 1.8.0 (OpenSpec change
`complete-ga4-ecommerce-measurement`). The logic is unit-tested elsewhere; these tests drive a real
PrestaShop 8.1 (classic theme, demo catalog) and read every `dataLayer` push.

## Prerequisites

- Windows with Docker running inside a WSL distro (default name `Debian`, override with
  `SCM_E2E_WSL_DISTRO`). No sudo needed.
- Microsoft Edge installed (tests use `channel: 'msedge'`; override with `SCM_E2E_CHANNEL`).
  Do NOT run `playwright install`.
- Node.js on Windows; `cd tests/e2e && npm install` once.

## Stack control

`stack.sh` runs inside WSL (compose project `scmcc-e2e`, shop on http://localhost:8088, override with
`SCM_E2E_PORT`). From Git Bash:

```
wsl -d Debian -e bash -lc 'cd /mnt/c/Users/Kuba/Desktop/RORO/scm_cookieconsent/tests/e2e && ./stack.sh <cmd>'
```

| command | effect |
| --- | --- |
| `up` | start PrestaShop + MariaDB, wait until the shop answers |
| `reset` | up + sync working tree + (re)install module - a clean starting point (module 1.8.0) |
| `sync [git-ref]` | copy the module into the shop (working tree, or a git ref such as `HEAD`) |
| `install` / `uninstall` / `upgrade` | module lifecycle through the PrestaShop console |
| `config KEY VALUE` | set `SCM_COOKIE_<KEY>` |
| `sql "..."` | run SQL against the shop database |
| `down` | stop and delete the stack (database included) |

Admin: http://localhost:8088/admin-e2e/ - `e2e@example.com` / `e2e-Passw0rd`.

## Running

```
cd tests/e2e
npx playwright test                 # everything, serial, list reporter
npx playwright test 03              # one spec
```

Specs run in numeric order on one worker (one shared shop). Each spec sets the Google tag mode it needs
(`setMode('gtag'|'gtm')`) and only requires the module to be installed. `01-upgrade` uninstalls and
reinstalls the module and runs `stack.sh reset` afterwards, so later specs find 1.8.0 installed.
Whole suite takes about 4 minutes. `SCM_E2E_TEST_TIMEOUT` (ms) shortens the checkout journey timeout when debugging.

Failures keep a trace in `test-results/` (`npx playwright show-trace <trace.zip>`).

## Helpers (`specs/helpers.js`)

- fixture `ga`: records every `dataLayer` push of every page of a test (survives navigations); `ga.events(name)`
  works for both shapes (GTM object `{event, ecommerce}` / flat `{event, ...}` and gtag command
  `{gtag:['event', name, params]}`); `ga.waitFor(name, n)`; JS dialogs are recorded too. Google/Meta network
  requests are blocked.
- `stack()`, `sql()`, `setMode()`, `go()` (opens a URL and accepts the cookie banner), `createVoucher()`,
  `addToCart()`, `fillGuest()`, `fillAddress()`, `chooseCarrier()`.

## What each spec covers

| spec | OpenSpec task | proves |
| --- | --- | --- |
| `01-upgrade.spec.js` | 6.1 | 1.7.0 (git HEAD) installs without `actionAuthentication` / `actionCustomerAccountAdd`; the 1.8.0 upgrade registers both; version is 1.8.0 |
| `02-catalog.spec.js` | 3.1, 5.3 | category `view_item_list` (id/name/index = displayed miniatures); facet filter re-emits; `select_item` with list and index recorded before navigation; `view_item` with combination label + discount; size switch emits a second `view_item`; `search` (trimmed term, `search` list); empty query silent; script-like query reported verbatim, no dialog; GTM mode: search is flat, no `ecommerce`, no `{ecommerce:null}` before it |
| `03-checkout.spec.js` | 4.2, 6.4 (checkout) | `add_to_cart` variant equals `view_item` variant; `view_cart`; voucher `E2E10` -> `begin_checkout.coupon`; guest checkout (Poland, "My carrier") -> `add_shipping_info` with tier + coupon, and SQL check of `ps_cart.checkout_session_data` (`*delivery*` step complete); `add_payment_info` (`ps_wirepayment`) once; `purchase` with order reference, coupon, EUR, base item name + variant; no second `purchase` on reload; no `sign_up` for guests; `remove_from_cart` of a deleted line |
| `04-account.spec.js` | 5.1, 5.2 | registration -> exactly one `sign_up`, no `login`, none after reload; logout/login -> one `login`; wrong password -> none; no e-mail/hash/customer id in any event; GTM mode: `login` is flat |
| `05-admin.spec.js` | 3.5 | back-office config page, Integrations tab ("Jak to dziala" lists `add_shipping_info`), Consent Mode tab (GTM how-to "Krok 4" with the new trigger names) and GDPR help tab render without Smarty/PHP errors |

## Notes

- Searching uses `/search?controller=search&s=...`. `/index.php?controller=search&s=...` is 302-redirected by
  PrestaShop core to `/search` and drops the query.
- The vouchers UI is only shown when `PS_CART_RULE_FEATURE_ACTIVE=1`; `createVoucher()` sets it because the
  voucher is created by SQL.
- Task 6.4 (manual GA4 DebugView / GTM Preview run) is not replaceable by these tests: the tests prove what
  the page pushes, not what Google receives.
