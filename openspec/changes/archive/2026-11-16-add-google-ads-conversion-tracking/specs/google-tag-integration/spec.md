# Spec Delta

## Purpose

Defines how the cookie-consent module takes ownership of the Google tag on a storefront page: which Google script it loads, how it avoids duplicating a container another module already placed, how it determines which tag it ended up with, and how ecommerce and marketing events are routed so that the loaded tag actually receives them.

## ADDED Requirements

### Requirement: Google tags load only when Consent Mode is enabled
The module SHALL request a Google tag script (GTM container or `gtag.js`) only when Google Consent Mode v2 is enabled in the module settings, and the Consent Mode default state SHALL be recorded on the page before any Google tag script is requested.

#### Scenario: Consent Mode disabled
- **WHEN** Consent Mode v2 is disabled and a GTM, GA4 or Ads ID is configured
- **THEN** the module requests no Google tag script and the admin Integrations tab shows a warning that tags are not loaded

#### Scenario: Consent default precedes the tag
- **WHEN** Consent Mode v2 is enabled and a Google tag is configured
- **THEN** the dataLayer contains the consent `default` command before the first request to `googletagmanager.com`

### Requirement: Container precedence
When a GTM container ID is configured, the module SHALL load that container and SHALL NOT load direct `gtag.js` for GA4 or Ads. Direct `gtag.js` SHALL be loaded only when no GTM container ID is configured and no container is otherwise present on the page.

#### Scenario: GTM configured
- **WHEN** a GTM ID and a GA4 ID are both configured
- **THEN** only `gtm.js` is requested and no `gtag/js` request is made for the GA4 ID

#### Scenario: Direct gtag.js fallback
- **WHEN** no GTM ID is configured and a GA4 ID or Ads ID is configured
- **THEN** `gtag/js` is requested once and a `config` command is issued for each configured GA4 and Ads ID

### Requirement: Runtime de-duplication against external containers
Before loading its own Google tag the module SHALL inspect the page for a GTM container or `gtag.js` script already present (placed by a theme or another module) and SHALL NOT load a second one of the same kind.

#### Scenario: External GTM present
- **WHEN** another module already loaded `gtm.js` on the page
- **THEN** the module does not load its own container and does not load direct `gtag.js`, and consent default/update commands still apply to the external container

#### Scenario: External gtag.js present without GTM
- **WHEN** no GTM container is present but a `gtag/js` script already exists on the page
- **THEN** the module does not load another `gtag/js` script

### Requirement: Ads-only direct tag alongside a container
When the *send Ads conversions directly* setting is enabled and an Ads ID is configured, the module SHALL load `gtag.js` for the Ads ID (and only the Ads ID) even if a GTM container (own or external) or an external `gtag.js` is present, so the module can send Ads conversions itself. With the setting disabled the container remains the sole owner of Ads tags.

#### Scenario: Direct Ads tag with own GTM
- **WHEN** a GTM ID, an Ads ID and the direct-send setting are configured
- **THEN** both `gtm.js` and `gtag/js?id=AW-…` are requested, a `config` command is issued for the Ads ID only, and no `config` is issued for a GA4 ID

#### Scenario: Setting off with GTM
- **WHEN** a GTM ID and an Ads ID are configured and the direct-send setting is off
- **THEN** only `gtm.js` is requested

### Requirement: Tag mode resolution
After deciding which Google scripts to load, the module SHALL resolve a page-level tag mode consisting of an ecommerce target (`gtm`, `gtag` or `none`) and an Ads conversion target (`gtag`, `container` or `none`), and SHALL expose it to the module's other front-office scripts. The ecommerce target is `gtag` only when the module itself loaded direct `gtag.js` for GA4/Ads; it is `gtm` when a container (own or external) is present; otherwise `none`.

#### Scenario: Own direct gtag.js
- **WHEN** the module loaded `gtag.js` because no container exists
- **THEN** the ecommerce target is `gtag` and the Ads conversion target is `gtag` if an Ads ID is configured, else `none`

#### Scenario: Container present, no direct Ads tag
- **WHEN** a GTM container (own or external) is present and the direct-send setting is off
- **THEN** the ecommerce target is `gtm` and the Ads conversion target is `container`

#### Scenario: Container present with direct Ads tag
- **WHEN** a GTM container is present and the module loaded the Ads-only `gtag.js`
- **THEN** the ecommerce target is `gtm` and the Ads conversion target is `gtag`

#### Scenario: No Google tag
- **WHEN** Consent Mode is disabled, or no Google ID is configured and no external container exists
- **THEN** both targets are `none`

### Requirement: Ecommerce event routing by mode
The module SHALL deliver every GA4 ecommerce event (`view_item`, `view_cart`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`) through a single tracking entry point that dispatches according to the ecommerce target: as a `gtag('event', name, params)` command when the target is `gtag`, and as the existing dataLayer object pair (`{ ecommerce: null }` followed by `{ event: name, ecommerce: params }`) when the target is `gtm` or `none`.

#### Scenario: Direct gtag.js receives ecommerce
- **WHEN** the ecommerce target is `gtag` and a visitor opens a product page
- **THEN** the dataLayer receives a `gtag` command `event view_item` whose parameters equal the ecommerce payload, and no `{ event: 'view_item' }` object is pushed

#### Scenario: GTM contract unchanged
- **WHEN** the ecommerce target is `gtm` and a visitor adds a product to the cart
- **THEN** the dataLayer receives `{ ecommerce: null }` followed by `{ event: 'add_to_cart', ecommerce: … }` exactly as in previous versions, and no `gtag` `event` command is issued

#### Scenario: No tag present
- **WHEN** the ecommerce target is `none`
- **THEN** events are still pushed as dataLayer objects so an externally managed listener can consume them

### Requirement: Pre-resolution event queue
Events submitted to the tracking entry point before the tag mode is resolved SHALL be queued and dispatched in submission order immediately after resolution, so server-rendered inline events (such as the purchase event printed on the order-confirmation page) are never lost or reordered.

#### Scenario: Inline purchase before DOMContentLoaded
- **WHEN** the order-confirmation page emits the purchase event during HTML parsing and the tag mode is resolved at `DOMContentLoaded`
- **THEN** the purchase event is dispatched once, after resolution, using the resolved target

#### Scenario: Order preserved
- **WHEN** two events are submitted before resolution
- **THEN** they are dispatched in the same order they were submitted

### Requirement: Routing fallback without the bootstrap
If the module's tracking entry point is unavailable on a page (bootstrap not rendered), the module's ecommerce scripts SHALL fall back to pushing the dataLayer object pair so no event is dropped.

#### Scenario: Bootstrap missing
- **WHEN** the head bootstrap did not execute and the ecommerce script fires a `view_cart` event
- **THEN** `{ ecommerce: null }` and `{ event: 'view_cart', ecommerce: … }` are pushed to the dataLayer
