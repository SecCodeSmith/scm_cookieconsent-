# Proposal

## Why

The module advertises itself as a replacement for dedicated GA4 dataLayer modules (TagConcierge), but it only sends six of the GA4 recommended ecommerce events. GA4's standard *Ecommerce purchases*, *Purchase journey* and *Checkout journey* reports, product-list performance and Google Ads audience building all depend on events the module never sends, so stores that switch to it lose reporting they had before.

Observed in the current code (1.7.0):

- `views/js/scm_ecommerce.js` sends `view_item`, `view_cart`, `begin_checkout`, `add_to_cart`, `remove_from_cart`, and the order-confirmation template sends `purchase`. There is no `view_item_list`, `select_item`, `add_shipping_info`, `add_payment_info`, `login`, `sign_up` or `search` event.
- `view_cart` and `begin_checkout` fire on the same page in PrestaShop's one-page checkout, but the shipping and payment steps that follow never produce an event. The *Checkout journey* report therefore stops after its first step.
- The `purchase` payload has no `coupon`, and items carry no `discount`, `item_variant` from the combination, `index` or `item_list_name`. Promotion and list attribution in GA4 stays empty.
- `item_variant` on the product page holds the product reference, while cart events use the combination attributes. The same product reports two different variants depending on the event.
- `remove_from_cart` for a deleted cart line carries only `item_id` and `quantity`, so GA4 records it with no name or price.

The previous change (`add-google-ads-conversion-tracking`) introduced the single routing entry point `SCM_GCM.track()`. That makes it cheap to add events now: every new event is delivered correctly in both GTM and direct `gtag.js` modes without new routing code.

## What Changes

- **Product list events**: `view_item_list` on category, search, manufacturer, supplier, new-products, best-sales and prices-drop pages, including after AJAX facet filtering and pagination. `select_item` when a visitor clicks a product miniature in such a list. Both carry `item_list_id`, `item_list_name` and per-item `index`.
- **Checkout funnel events**: `add_shipping_info` (with `shipping_tier` = carrier name) when the visitor confirms the delivery step, and `add_payment_info` (with `payment_type` = payment module) when the visitor selects a payment option. Each fires at most once per checkout page view per distinct value.
- **Account events**: `login` and `sign_up` (with `method`) after a successful customer login or account creation, including guest-to-customer conversion at checkout. The server records the outcome in the PrestaShop session cookie and the next storefront page emits the event once.
- **Search event**: `search` with `search_term` on the search results page, so GTM-mode stores get it without configuring enhanced measurement in the container.
- **Richer payloads, consistently built**: one item shape for every event (`item_id`, `item_name`, `item_brand`, `item_category`, `item_variant`, `price`, `discount`, `quantity`, plus `index`/`item_list_*` where relevant). `item_variant` is the combination label everywhere. `purchase` gains `coupon` from the order's cart rules. Lines deleted from the cart report full item data from the last known cart snapshot.
- **Routing reused, one small addition**: ecommerce events go through the existing `SCM_GCM.track()` entry point, so GTM-mode stores receive the same `{ ecommerce: null }` + `{ event, ecommerce }` pair for the new event names. Non-ecommerce events (`login`, `sign_up`, `search`) need a flat dataLayer shape in GTM mode, so the head bootstrap gains a sibling entry point that routes by the same tag mode and queue. No new configuration key, no admin setting. Consent Mode v2 continues to govern what the Google tag stores and sends. Account events carry no personal data.
- **Docs**: README event table and the admin GTM how-to list every event the module sends, with the trigger names a GTM container needs.

Not a breaking change: existing event names, payload keys and order are preserved. The only visible differences for existing GTM triggers are added keys inside `ecommerce`, a corrected `item_variant` on `view_item`, and full item data on removed cart lines.

## Capabilities

### New Capabilities

- `ga4-ecommerce-events`: the complete set of GA4 ecommerce events the storefront emits (list, item, cart, checkout, purchase), when each one fires, de-duplication rules, and the shared item and event payload shape.
- `ga4-user-events`: GA4 events about the visitor's account and site activity that are not ecommerce events, namely `login`, `sign_up` and `search`, including how a server-side outcome is handed to the next page and the rule that no personal data is sent.

### Modified Capabilities

_None._ `openspec/specs/` is empty. The routing contract these events depend on is specified as `google-tag-integration` in the in-progress change `add-google-ads-conversion-tracking`, which is not yet archived. This change relies on that contract and only adds a sibling entry point for non-ecommerce events, specified here under `ga4-user-events`.

## Impact

- **Head bootstrap**: `views/js/src/gcm_bootstrap.src.js` gains the non-ecommerce entry point, and its minified copy in `views/templates/hook/gcm_bootstrap.tpl` must be regenerated.
- **Front-office JS**: `views/js/scm_ecommerce.js` gains list, click, checkout-step, account and search event handlers and a shared item mapper. It stays ES5, dependency-free and unminified as today.
- **PHP module** `scm_cookieconsent.php`: `buildEcommercePageData()` builds list payloads for listing pages, a search payload and a pending account event. `hookDisplayOrderConfirmation()` adds `coupon` and item `discount`/`item_variant`. Two new hook registrations, `actionAuthentication` and `actionCustomerAccountAdd`, plus `upgrade/upgrade-1.8.0.php` to register them on existing installs. Module version `1.7.0 → 1.8.0`.
- **Templates**: `views/templates/hook/ecommerce_data.tpl` and `ecommerce_purchase.tpl` carry the larger payloads. The template shape stays the same.
- **Admin template and docs**: GTM how-to and "How it works" copy in `views/templates/admin/configure.tpl`, event table in `README.md`.
- **Dependency**: requires the `SCM_GCM.track()` routing from `add-google-ads-conversion-tracking`. That code is already committed, so only its manual staging check remains open.
- **Assumptions recorded**: "other important tags" is read as the remaining GA4 recommended events for an online store. Out of scope and noted as follow-ups in design: enhanced conversions and any `user_id`/`user_data` (personal data), promotion events (`view_promotion`, `select_promotion`) because PrestaShop has no standard promotion markup, `add_to_wishlist` because wishlist is not a core feature, refunds, server-side Measurement Protocol, and a GA4 debug-mode switch.
- **No new runtime dependencies.** Verification follows the previous change: a Node harness in the session scratchpad, `php -l`, `build.ps1`, and a documented manual check with GA4 DebugView and GTM Preview.
