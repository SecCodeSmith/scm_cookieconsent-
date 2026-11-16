# Spec Delta

## Purpose

Defines the GA4 ecommerce events the storefront emits across the whole shopping journey (product lists, product detail, cart, checkout steps, purchase), when each event fires, how repeats are prevented, and the shared payload shape every event uses.

## ADDED Requirements

### Requirement: Single delivery path for ecommerce events
Every ecommerce event in this capability SHALL be submitted through the module's existing tracking entry point, so it reaches the loaded Google tag in GTM mode as the dataLayer object pair and in direct `gtag.js` mode as a `gtag` event command. When the entry point is absent, the dataLayer object pair SHALL be pushed directly.

#### Scenario: New event in GTM mode
- **WHEN** the ecommerce target is `gtm` and a `view_item_list` event fires
- **THEN** the dataLayer receives `{ ecommerce: null }` followed by `{ event: 'view_item_list', ecommerce: … }`

#### Scenario: New event in direct gtag.js mode
- **WHEN** the ecommerce target is `gtag` and an `add_payment_info` event fires
- **THEN** the dataLayer receives a `gtag` command `event add_payment_info` and no `{ event: 'add_payment_info' }` object

### Requirement: Item payload shape
Every item in every ecommerce event SHALL contain `item_id` (product ID as a string), `item_name` and `quantity`. It SHALL contain `price` (unit price incl. tax, rounded to 2 decimals) whenever known, and `item_brand`, `item_category`, `item_variant` and `discount` whenever the source data has a non-empty value. Empty values SHALL be omitted, not sent as empty strings.

#### Scenario: Product without manufacturer
- **WHEN** a product with no manufacturer is added to the cart
- **THEN** its item has no `item_brand` key

#### Scenario: Discounted product
- **WHEN** a product with a regular price of 100.00 and a reduced price of 80.00 appears in any event
- **THEN** its item has `price: 80` and `discount: 20`

### Requirement: Consistent item variant
`item_variant` SHALL be the human-readable combination label (for example `Size: M, Color: Blue`) in every event for a product combination, and SHALL be omitted for a product without combinations. The product reference SHALL NOT be used as `item_variant`.

#### Scenario: Same combination across events
- **WHEN** a visitor views combination "Size: M" of a product and then adds it to the cart
- **THEN** the `view_item` item and the `add_to_cart` item carry the same `item_variant`

#### Scenario: Simple product
- **WHEN** a product without combinations is viewed
- **THEN** its `view_item` item has no `item_variant` key

### Requirement: Event value and currency
Every ecommerce event except `select_item` and `view_item_list` SHALL carry `currency` (shop currency ISO code) and `value` (sum of `price × quantity` over its items, rounded to 2 decimals, or the order total for `purchase`).

#### Scenario: Add two units
- **WHEN** a visitor adds 2 units of a product priced 49.95 in PLN
- **THEN** `add_to_cart` carries `currency: 'PLN'` and `value: 99.9`

### Requirement: Product list view
On a product listing page (category, search results, manufacturer, supplier, new products, best sales, prices drop) the storefront SHALL emit `view_item_list` with `item_list_id`, `item_list_name` and the displayed products as items, each with its 1-based position as `index`. It SHALL emit again after an in-page list update (filter, sort, pagination) with the products then displayed.

#### Scenario: Category page load
- **WHEN** a visitor opens category "Shoes" (ID 12) showing 24 products
- **THEN** one `view_item_list` is emitted with `item_list_id: 'category_12'`, `item_list_name: 'Shoes'` and 24 items with `index` 1 to 24

#### Scenario: Facet filter applied
- **WHEN** the visitor applies a filter and the list is replaced without a page reload
- **THEN** a new `view_item_list` is emitted with the products now displayed

#### Scenario: Empty list
- **WHEN** a listing page shows no products
- **THEN** no `view_item_list` is emitted

### Requirement: Product list identifiers
`item_list_id` SHALL be `<page type>` or `<page type>_<entity ID>` (for example `category_12`, `manufacturer_3`, `search`, `best_sales`), and `item_list_name` SHALL be the page heading in the shop language. Both values SHALL be copied to every item of the list events.

#### Scenario: Search results list
- **WHEN** a visitor searches for "boots"
- **THEN** `view_item_list` has `item_list_id: 'search'` and each item carries `item_list_id: 'search'`

### Requirement: Product selection from a list
When a visitor clicks a product miniature link in a list for which `view_item_list` was emitted, the storefront SHALL emit `select_item` with that list's `item_list_id`, `item_list_name` and the clicked product as the single item, including its `index`. Navigation SHALL NOT be delayed or blocked.

#### Scenario: Click third product
- **WHEN** the visitor clicks the third product on category "Shoes"
- **THEN** `select_item` is emitted with `item_list_id: 'category_12'` and one item with `index: 3`

#### Scenario: Click outside a tracked list
- **WHEN** the visitor clicks a product link in a block that did not emit `view_item_list`
- **THEN** no `select_item` is emitted

### Requirement: Product detail view
On a product page the storefront SHALL emit `view_item` with the displayed product as the single item, using the combination selected at page load. When the visitor switches combination without a page reload, a new `view_item` SHALL be emitted for the new combination.

#### Scenario: Combination switched
- **WHEN** the visitor changes the size from M to L on a product page
- **THEN** a second `view_item` is emitted whose item has the "Size: L" variant and its price

### Requirement: Cart change events
The storefront SHALL emit `add_to_cart` when a cart line's quantity increases and `remove_from_cart` when it decreases or the line is removed, with the changed quantity as the item `quantity`. A removed line SHALL be reported with the full item data last seen for it.

#### Scenario: Line deleted
- **WHEN** the visitor deletes a cart line of 3 units of product "Boot" priced 120.00
- **THEN** `remove_from_cart` is emitted with an item carrying `item_name: 'Boot'`, `price: 120`, `quantity: 3` and `value: 360`

### Requirement: Cart and checkout start
The storefront SHALL emit `view_cart` on the cart page and `begin_checkout` once per checkout page load, both with all cart lines as items. `begin_checkout` SHALL carry `coupon` when cart rules with a code are applied.

#### Scenario: Checkout with a voucher
- **WHEN** a visitor with voucher code `WELCOME10` applied opens the checkout
- **THEN** `begin_checkout` carries `coupon: 'WELCOME10'`

### Requirement: Shipping information event
The storefront SHALL emit `add_shipping_info` with `shipping_tier` (selected carrier name), all cart lines as items, `currency` and `value` on the first checkout page shown after the delivery step is completed. It SHALL NOT emit it again for the same cart in the same browser session unless the selected carrier changed.

#### Scenario: Delivery confirmed
- **WHEN** the visitor selects carrier "InPost Paczkomaty" and continues to payment
- **THEN** the checkout page showing the payment step emits `add_shipping_info` with `shipping_tier: 'InPost Paczkomaty'`

#### Scenario: Carrier changed
- **WHEN** the visitor goes back, picks a different carrier and continues again
- **THEN** a new `add_shipping_info` is emitted with the new carrier name

#### Scenario: Step revisited without change
- **WHEN** the visitor returns to the delivery step and continues again with the same carrier
- **THEN** no second `add_shipping_info` is emitted

### Requirement: Payment information event
The storefront SHALL emit `add_payment_info` with `payment_type` (technical name of the selected payment module), all cart lines as items, `currency` and `value` when the visitor selects a payment option. It SHALL emit again only when a different payment option is selected.

#### Scenario: Payment option chosen
- **WHEN** the visitor selects the bank wire option
- **THEN** `add_payment_info` is emitted with `payment_type: 'ps_wirepayment'`

#### Scenario: Same option clicked twice
- **WHEN** the visitor clicks the already selected payment option again
- **THEN** no second `add_payment_info` is emitted

### Requirement: Purchase payload completeness
The `purchase` event SHALL carry `transaction_id`, `value`, `tax`, `shipping`, `currency` and items built from the confirmed order. It SHALL carry `coupon` with the order's voucher codes (comma-separated, falling back to voucher names when a voucher has no code) when the order used vouchers. Items SHALL follow the item payload shape.

#### Scenario: Order with two vouchers
- **WHEN** an order used vouchers with codes `WELCOME10` and `FREESHIP`
- **THEN** `purchase` carries `coupon: 'WELCOME10,FREESHIP'`

#### Scenario: Order without vouchers
- **WHEN** an order used no voucher
- **THEN** `purchase` has no `coupon` key

### Requirement: Existing ecommerce contract preserved
Event names, top-level `ecommerce` keys and the event order already emitted by previous versions SHALL be preserved. New data SHALL only be added as new keys, except that `item_variant` on `view_item` changes from the product reference to the combination label.

#### Scenario: GTM trigger on add_to_cart
- **WHEN** a GTM container has a Custom Event trigger on `add_to_cart` reading `ecommerce.items`
- **THEN** it keeps firing with the same event name and an `items` array after the upgrade
