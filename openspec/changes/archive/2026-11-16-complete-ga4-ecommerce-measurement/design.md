# Design

## Context

See proposal.md (Why) for motivation and the two spec files for required behaviour. Current state that shapes the approach (1.7.0):

- `views/js/src/gcm_bootstrap.src.js` resolves the tag mode at `DOMContentLoaded` and exposes `SCM_GCM.track(name, params)` and `SCM_GCM.purchase(p)`, with a pending queue. In GTM/none mode `track()` always pushes `{ ecommerce: null }` + `{ event, ecommerce: params }`. That shape is right for ecommerce events and wrong for `login`/`sign_up`/`search`, which GTM users expect as flat keys. The minified copy lives in `views/templates/hook/gcm_bootstrap.tpl`. The bootstrap already uses `Object.assign`, which IE 11 lacks; new code must not add more of that.
- `views/js/scm_ecommerce.js` (ES5, unminified, registered in `<head>`) builds cart events client-side from `prestashop.cart` and reads `window.SCM_EC` for server-built data. Its `mapItem()` is the only client item mapper.
- `renderBannerAndEcommerce()` prints `window.SCM_EC` once per page from one of three footer hooks; `buildEcommercePageData()` currently handles only the product page. Footer hooks run while Smarty renders the page, after controllers assigned `listing`, `product`, `cart`, and before output is flushed.
- Payloads are serialised with plain `json_encode()` into a `<script>` block. That is safe today only because all values are merchant-controlled. A visitor-controlled search term makes it an XSS sink.
- Verified against PrestaShop 8.2.x core and the classic-theme repo:
  - Listing controllers assign Smarty `listing` with `products` and `label`. AJAX listing responses are JSON with `products` and `rendered_products`.
  - The theme listens to `updateProductList` with that JSON; the emitter is core JS, so the payload shape is not guaranteed by the theme.
  - Product miniatures are `article.js-product-miniature[data-id-product][data-id-product-attribute]`.
  - Payment options are `input[name="payment-option"][data-module-name]`.
  - Delivery options are `input[name="delivery_option[…]"]` inside `.delivery-option` with `.carrier-name`.
  - Checkout step section ids are derived from class names at runtime, not literal in templates, and the theme emits no step-change event.
  - `actionAuthentication` fires in `CustomerLoginForm` with `customer`; `actionCustomerAccountAdd` fires in `CustomerPersister::create()` with `newCustomer`.
  - `Cookie` supports `__set`/`__get` and an explicit `write()`.
  - `Order::getCartRules()` reads `order_cart_rule` (which has a `name` column).
  - `category_name` and `attributes` are NOT guaranteed keys of presented products.
- No automated test suite. CI runs `php -l` on PHP 7.4 and 8.3 and `build.ps1`.

## Goals / Non-Goals

**Goals:**
- One item shape produced by one PHP builder (server data) and one JS mapper (client data), checked against each other by the harness.
- Every new event works in both tag modes with no new routing logic beyond one sibling entry point.
- Prefer server-observable facts over theme DOM where both are possible, so behaviour survives non-Classic themes.

**Non-Goals:**
- Support for third-party one-page-checkout modules that replace the core checkout (they skip core step handling). Documented as a limitation.
- `index` across pages: `index` is the position on the displayed page, not the global rank.
- Any change to consent handling, Ads conversion logic or admin settings.
- `user_id`, enhanced conversions, promotions, wishlist, refunds, Measurement Protocol, GA4 debug mode (proposal lists them as follow-ups).

## Decisions

### D1 — `SCM_GCM.event(name, params)` for non-ecommerce events
Add a sibling to `track()` in the bootstrap that shares the pending queue and the resolved mode. In `gtag` mode it calls `gtag('event', name, params)`. Otherwise it pushes one flat object `{ event: name, …params }` built with an ES5 key-copy loop, with no `{ ecommerce: null }` before it. The queue entries gain a third kind (`'event'`) and flush in submission order with the others.

Alternative: a flag on `track()` (`track(name, params, { flat: true })`). Rejected because it changes the meaning of an entry point that integrators may already call, and the two shapes are different contracts.

`scm_ecommerce.js` gets a matching `pushUserEvent()` with the flat-object fallback when the bootstrap is absent.

### D2 — Item builders: `buildGa4Item()` in PHP, `mapItem()` in JS, same output
- **PHP** `buildGa4Item(array $source, $qty, $idLang)` produces the spec shape from a presented product, an order detail row or a cart row. It resolves the category name with `Category` for `id_category_default` (cached per request) instead of trusting `category_name`. It resolves `item_variant` with `Product::getAttributesParams($idProduct, $idProductAttribute)` formatted as `Group: Value, Group: Value` (cached per combination). It sets `discount` as `regular − price` when that is greater than 0.005. It omits empty keys.
- **JS** `mapItem(p, qty)` uses the same rules on client cart/listing products. `item_variant` comes from the cart product's `attributes` object (label → value) joined as `Label: Value, …`, falling back to `attributes_small` only if `attributes` is missing. `discount` comes from `regular_price_amount − price_amount`. Category: `category_name`, else omitted (never the link-rewrite `category`).
- Purchase `item_name` is the base product name (`Product::getProductName($id, null, $idLang)`), not `product_name` from the order row, which already contains the variant text.

Why server-side resolution: presented arrays differ across PrestaShop 1.7 / 8 / 9 and controllers. Two cached lookups per page are cheaper than per-version special cases.

### D3 — Lists: server payload on load, `updateProductList` on AJAX, delegated click for `select_item`
- `buildEcommercePageData()` handles `category`, `search`, `manufacturer`, `supplier`, `new-products`, `best-sales`, `prices-drop` (by `php_self`). It reads Smarty `listing.products` and builds `SCM_EC.list = { id, name, items }`. `item_list_name` is the entity name for category/manufacturer/supplier, else `listing.label`. Items get `index`, `item_list_id`, `item_list_name`.
- `scm_ecommerce.js` emits `view_item_list` from `SCM_EC.list` and keeps a map `id_product + '_' + id_product_attribute → item`.
- On `prestashop.on('updateProductList', data)`: if `data.products` is an array, it maps them with `mapItem()`, re-indexes, replaces the map and emits `view_item_list`. If not, it does nothing; a list event built from guessed DOM data would be worse than none.
- `select_item`: one delegated `click` listener on `document` (capture phase, never `preventDefault`). It finds the closest `.js-product-miniature`, looks up its ids in the map, and emits `select_item`. Miniatures not in the map (cross-selling blocks, other modules) are ignored. The click delay risk is accepted (see Risks).

Alternative: emit lists from the DOM only. Rejected because miniatures don't carry price or brand.

### D4 — `view_item` on combination change
Listen to `prestashop.on('updatedProduct', …)`, then read the JSON in the `data-product` attribute of `#product-details` (the core product template refreshes it) and map it with `mapItem()`. If the attribute is missing or unchanged, emit nothing. The server-built initial `view_item` switches to `buildGa4Item()` and uses the selected `id_product_attribute`.

### D5 — Checkout: server-detected shipping, client-detected payment
- **Shipping**: on the `order` page, `buildEcommercePageData()` reads `checkout_session_data` of the current cart (JSON column on `cart`) and checks `checkout-delivery-step.step_is_complete`. When it is complete and the cart has a carrier, it adds `SCM_EC.shipping = { tier: <carrier name>, key: <id_cart>_<id_carrier> }`. JS emits `add_shipping_info` once per key, guarded by `sessionStorage`. This needs no theme markup and works whether the delivery form posts or reloads.
- **Payment**: delegated `change` listener for `input[name="payment-option"]`. It emits `add_payment_info` with `payment_type = data-module-name` when the value differs from the last emitted one on this page.
- **Coupon**: `SCM_EC.coupon` is built server-side from `Cart::getCartRules()` codes (falling back to names), used by `begin_checkout`, `add_shipping_info` and `add_payment_info`. Purchase coupon comes from `Order::getCartRules()` joined to `CartRule::code`, falling back to `order_cart_rule.name`.

Alternative for shipping: listen to the delivery form `submit`. Rejected; it depends on theme markup and races with navigation.

### D6 — Account events via the Context cookie
- `hookActionCustomerAccountAdd`: skip when `newCustomer->is_guest`; set `cookie->scm_ga4_evt = 'sign_up'`.
- `hookActionAuthentication`: set `'login'` only when the value is not already `'sign_up'`, so registration never reports both.
- `renderBannerAndEcommerce()` reads the value and puts `SCM_EC.userEvent = { name, method: 'PrestaShop', id: <random hex> }`. It then unsets the key and calls `cookie->write()` explicitly. Templates render before output is flushed, so headers are still writable.
- JS emits through `SCM_GCM.event()` once per `id` (`sessionStorage`). If the cookie write ever fails after headers were sent, the event does not repeat in this tab. The cost is a possible repeat in a new tab.
- Only the event name and the constant method leave the server: no customer data.
- New hooks are registered in `install()` and in `upgrade/upgrade-1.8.0.php`.

Alternative: emit on the login page response itself. Rejected; it redirects, so nothing renders.

### D7 — Search event and safe JSON
On `search`, `SCM_EC.search = mb_substr(trim(Tools::getValue('s', Tools::getValue('search_query'))), 0, 100)` when non-empty. JS emits `search` via `SCM_GCM.event()`. All `json_encode()` calls feeding `<script>` blocks (`ecommerce_data.tpl`, `ecommerce_purchase.tpl`, the bootstrap data) switch to `JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT`, plus `JSON_UNESCAPED_UNICODE`, through one helper `jsonForScript()`.

### D8 — Version and upgrade
Version `1.7.0 → 1.8.0`. `upgrade-1.8.0.php` calls `registerHook('actionAuthentication')` and `registerHook('actionCustomerAccountAdd')` and returns their result. No configuration or schema changes.

## Risks / Trade-offs

- [`updateProductList` payload lacks `products` on some PrestaShop version or theme] → no `view_item_list` after filtering, but the page-load event still fires. The harness covers both shapes; staging check confirms on the target store.
- [`select_item` dispatched as the browser navigates away] → gtag.js uses beacon transport, so it is usually delivered; GTM GA4 tags may lose some. Accepted to keep navigation unblocked, as the spec requires.
- [Third-party one-page-checkout modules] → `checkout_session_data` may never mark the delivery step complete, so no `add_shipping_info`. Documented in README as a limitation.
- [`#product-details[data-product]` missing in a custom theme] → no second `view_item` after a combination switch; the initial one is correct.
- [Larger `SCM_EC` on listing pages, about 300 bytes per product] → around 15 kB for 48 products, inline and uncached. Acceptable; items carry only the spec keys.
- [Cookie write after headers were sent, for example a theme echoing early] → `sessionStorage` id guard prevents repeats in the same tab.
- [`item_variant` on `view_item` changes from reference to combination label] → visible change for GTM users mapping it; called out in the README upgrade notes.
- [Minified bootstrap drifts from source] → harness runs against the minified text extracted from the tpl, same as the previous change.

## Migration Plan

1. Requires the 1.7.0 routing from `add-google-ads-conversion-tracking`, which is already in the codebase.
2. Install the 1.8.0 files; PrestaShop runs `upgrade-1.8.0.php`, which registers the two hooks.
3. Clear Preferences → Performance cache and any CDN so the new `scm_ecommerce.js` is served.
4. GTM stores: add Custom Event triggers for the new event names (README lists them). GA4 tags configured with "Send ecommerce data" read them as-is.
5. Verify in GA4 DebugView and GTM Preview.
6. Rollback: reinstall 1.7.0 files; the two extra hook registrations call methods that no longer exist, which PrestaShop skips. Unhook them in Design → Positions if desired.
