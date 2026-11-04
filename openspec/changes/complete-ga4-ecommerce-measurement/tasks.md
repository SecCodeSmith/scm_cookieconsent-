# Tasks

Specs: `specs/ga4-ecommerce-events/spec.md`, `specs/ga4-user-events/spec.md`. Approach: `design.md` (D1–D8). Front-office JS stays ES5 with no dependencies and no new `Object.assign`. The repo has no test suite. The Node harness below lives in the session scratchpad, is not committed, and is the executable check for every JS task.

## 1. Harness and bootstrap entry point for non-ecommerce events

- [x] 1.1 Write the Node harness in the scratchpad. It stubs `window`, `document` (`readyState`, `cookie`, `querySelector`, `closest` on fake elements, `addEventListener` capturing `DOMContentLoaded`, `click` and `change` listeners), `sessionStorage`, `localStorage` and a `prestashop` object with `on`/`emit`. It loads a bootstrap source string plus `scm_ecommerce.js` with a given `SCM_GCM_DATA` and `SCM_EC`, and returns the `dataLayer`. Verify: run against the current 1.7.0 files; the existing `view_item`, `view_cart`, `add_to_cart` scenarios PASS and every new-event scenario FAILS.
- [x] 1.2 Add `SCM_GCM.event(name, params)` to `views/js/src/gcm_bootstrap.src.js` per D1: shared pending queue (third entry kind), `gtag('event', …)` in `gtag` mode, a flat `{ event: name, …params }` object built with an ES5 copy loop otherwise, no `{ ecommerce: null }`. Verify: harness scenarios *Login in GTM mode*, *Login in direct gtag.js mode* and a mixed `track`/`event` queue-order scenario PASS.
- [x] 1.3 Re-minify (`npx terser views/js/src/gcm_bootstrap.src.js -c -m`), paste into `{literal}` in `views/templates/hook/gcm_bootstrap.tpl` and add `event()` to the header comment. Verify: the harness run against the minified text extracted from the tpl gives the same PASS matrix as the source.

## 2. Shared item shape and safe payload encoding

- [x] 2.1 Add `jsonForScript()` to `scm_cookieconsent.php` (`JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE`) and use it for every `json_encode()` printed into a `<script>` (bootstrap data, `scm_ec`, `scm_purchase`, `scm_js_categories`). Verify: `php -l`; `php -r` check that a value `</script><img onerror=x>` encodes with no `<` or `>` characters.
- [x] 2.2 Add `buildGa4Item()` per D2: category name via `Category` for `id_category_default`, variant via `Product::getAttributesParams()` as `Group: Value, …`, `discount` when regular − price > 0.005, empty keys omitted, per-request caches. Confirm `getAttributesParams` exists with that signature in PrestaShop 1.7.8, 8.2 and 9.0 core before using it. Verify: `php -l`; a `php -r` stub run shows a simple product has no `item_variant`/`item_brand` and a discounted one has `discount`.
- [x] 2.3 Rework `mapItem()` in `views/js/scm_ecommerce.js` per D2: variant from `attributes` (`Label: Value, …`, fallback `attributes_small`), `discount` from `regular_price_amount − price_amount`, category only from `category_name`, empty keys omitted. Keep the last cart snapshot's full items so a deleted line reports name, price and quantity. Verify: harness scenarios *Product without manufacturer*, *Discounted product*, *Simple product*, *Line deleted*, *Add two units* PASS.
- [x] 2.4 Switch the server `view_item` in `buildEcommercePageData()` and the order items in `hookDisplayOrderConfirmation()` to `buildGa4Item()` with the selected `id_product_attribute`, and use the base product name for purchase `item_name`. Verify: harness fed the PHP-built JSON for a combination product and a JS-mapped cart line for the same combination gets equal `item_variant` (*Same combination across events* PASS); `php -l` passes.
- [x] 2.5 Add a README note under "Google tag modes and event routing" describing the item shape and the `item_variant` change from reference to combination label. Verify: every key named in the README matches the spec item shape.

## 3. Product lists and product detail

- [x] 3.1 Extend `buildEcommercePageData()` for `category`, `search`, `manufacturer`, `supplier`, `new-products`, `best-sales`, `prices-drop` per D3: `SCM_EC.list = { id, name, items }` from Smarty `listing.products`, names from the entity or `listing.label`, `index` and `item_list_*` on each item, no list when empty. Verify: `php -l`; manual render on a staging category page shows `SCM_EC.list.items.length` equal to the products displayed.
- [x] 3.2 Emit `view_item_list` from `SCM_EC.list` in `scm_ecommerce.js`, keep the id → item map, re-emit on `updateProductList` only when `data.products` is an array. Verify: harness scenarios *Category page load*, *Facet filter applied*, *Empty list*, *Search results list*, plus an `updateProductList` payload without `products` emitting nothing, all PASS.
- [x] 3.3 Add the delegated capture-phase `click` listener for `select_item` per D3 (closest `.js-product-miniature`, look up the map, never `preventDefault`). Verify: harness scenarios *Click third product* and *Click outside a tracked list* PASS and the fake click event's `defaultPrevented` stays false.
- [x] 3.4 Add the `updatedProduct` listener that re-emits `view_item` from `#product-details[data-product]` per D4, only when the combination changed. Verify: harness scenario *Combination switched* PASS; a missing `data-product` attribute emits nothing.
- [x] 3.5 Update README event table and the admin GTM how-to in `views/templates/admin/configure.tpl` (Polish copy) with `view_item_list` and `select_item` trigger names. Verify: the tpl compiles in the back office Integrations and GDPR help tabs with no Smarty error.

## 4. Checkout funnel and purchase

- [x] 4.1 Add `SCM_EC.coupon` from `Cart::getCartRules()` (codes, fallback names) and use it in `begin_checkout`. Verify: harness scenario *Checkout with a voucher* PASS; `php -l`.
- [x] 4.2 Add `SCM_EC.shipping` per D5 from the cart's `checkout_session_data` (`checkout-delivery-step.step_is_complete`) and carrier name, and emit `add_shipping_info` once per `id_cart_id_carrier` key via `sessionStorage`. Verify: harness scenarios *Delivery confirmed*, *Step revisited without change*, *Carrier changed* PASS; on staging, read `checkout_session_data` after the delivery step and confirm the key name and JSON shape before relying on them.
- [x] 4.3 Add the delegated `change` listener on `input[name="payment-option"]` emitting `add_payment_info` with `payment_type` from `data-module-name`, once per distinct value per page. Verify: harness scenarios *Payment option chosen* and *Same option clicked twice* PASS.
- [x] 4.4 Add purchase `coupon` in `hookDisplayOrderConfirmation()` from `Order::getCartRules()` joined to `CartRule::code`, falling back to the `name` column. Verify: harness scenarios *Order with two vouchers* and *Order without vouchers* PASS against PHP-built payloads; `php -l`.
- [x] 4.5 Document the checkout events, the shipping detection and the one-page-checkout-module limitation in README, and add the trigger names to the admin GTM how-to. Verify: README event names match the spec event names exactly.

## 5. Account and search events

- [x] 5.1 Add `hookActionCustomerAccountAdd` (skip guests, set `sign_up`) and `hookActionAuthentication` (set `login` unless `sign_up` is pending) per D6, register both in `install()`. Verify: `php -l`; on staging, registration then login leaves the cookie key set to the expected value before the next page renders.
- [x] 5.2 In `renderBannerAndEcommerce()` move the pending value into `SCM_EC.userEvent` with a random id, unset the cookie key and call `cookie->write()`; in JS emit it via `SCM_GCM.event()` once per id. Verify: harness scenarios *Successful login*, *Page reloaded after login*, *Registration form*, *Guest checkout*, *Redirect after login* PASS; *Payload inspected* asserts no `@` or customer id in the dataLayer.
- [x] 5.3 Add `SCM_EC.search` per D7 and emit `search` via `SCM_GCM.event()`. Verify: harness scenarios *Search submitted*, *Empty query* PASS; on staging, searching `</script><img src=x onerror=alert(1)>` runs no script and DebugView shows the term verbatim (*Script-like query*).
- [x] 5.4 Document `login`, `sign_up`, `search`, their flat GTM dataLayer shape and the no-personal-data rule in README and the admin how-to. Verify: README examples match the harness output for the GTM-mode scenarios.

## 6. Version, upgrade and integration checks

- [x] 6.1 Set `$this->version = '1.8.0'` and add `upgrade/upgrade-1.8.0.php` registering `actionAuthentication` and `actionCustomerAccountAdd`, with the same header and licence comment as `upgrade-1.7.0.php`. Verify: `php -l upgrade/upgrade-1.8.0.php`; upgrading a staging 1.7.0 install shows both hooks for the module in Design → Positions.
- [x] 6.2 Run `find . -name '*.php' -print0 | xargs -0 -n1 php -l` and `./build.ps1`. Verify: zero lint errors and a `dist/scm_cookieconsent-1.8.0.*.zip` listing `upgrade/upgrade-1.8.0.php`.
- [x] 6.3 Run the full harness matrix (source bootstrap, minified bootstrap, `scm_ecommerce.js`, purchase template) in one invocation, plus a non-regression run comparing 1.7.0 and 1.8.0 for `view_cart`, `add_to_cart`, `begin_checkout`, `purchase` event names and order. Verify: every spec scenario reports PASS and the existing events keep their names and order.
- [ ] 6.4 Manual staging check with GA4 DebugView (direct `gtag.js` mode) and GTM Preview (GTM mode) covering a full journey: category, filter, product click, combination switch, add to cart, delete line, checkout with voucher, carrier, payment, purchase, login, registration, search. Verify: record which events appeared in each mode; every spec event is present once with the expected key parameters.

## 7. Automated staging: Docker e2e suite

The staging checks in tasks 3.1, 3.5, 4.2, 5.1, 5.3, 6.1 and 6.4 run against a Dockerised PrestaShop 8.1 in WSL with Playwright, per the user's request, in place of a manual staging store.

- [x] 7.1 Add `tests/e2e/docker-compose.yml` (PrestaShop 8.1 + MariaDB 11, demo catalog, port 8088) and `tests/e2e/stack.sh` (up, sync working tree or git ref, install, uninstall, upgrade, reset, config, sql, down). Verify: `./stack.sh reset` installs module 1.8.0 with all seven hooks and the storefront prints `window.SCM_EC` with the list payload on `/3-clothes`.
- [x] 7.2 Add `tests/e2e/playwright.config.js` (system Edge, serial) and `specs/helpers.js` (dataLayer recorder across navigations, Google/Meta requests blocked, `stack`/`sql`/`setMode` helpers). Verify: the suite in 7.3 runs with it.
- [x] 7.3 Write specs `01-upgrade` (6.1), `02-catalog` (3.1, 5.3), `03-checkout` (4.2, 6.4), `04-account` (5.1, 5.2), `05-admin` (3.5) and `tests/e2e/README.md`. Verify: `npx playwright test` passes in full; any failure caused by the module is fixed in the module, not by weakening a test.
- [x] 7.4 Exclude `tests/` from `build.ps1` packaging and ignore Playwright output in `.gitignore`. Verify: the built zip has no `tests/` entry.

## Workflow follow-up

- Finish the open manual check (task 5.3) of `add-google-ads-conversion-tracking` and archive it before archiving this change, so the `google-tag-integration` spec exists when this one lands.
- Run `graphify update .` after the code changes.
- Follow-ups listed in the proposal: enhanced conversions, promotions, wishlist, refunds, Measurement Protocol, GA4 debug mode.
