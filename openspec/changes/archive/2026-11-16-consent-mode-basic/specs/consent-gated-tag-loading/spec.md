# Spec Delta

## Purpose

Defines when the module may request Google tags and other optional scripts (Consent Mode "basic"), how events raised before a consent grant are held and delivered, and how the two supported tag modes and the Ads conversion behave under it. Terms: the "analytics category" is the category that controls `analytics_storage`; the "advertising category" is the one that controls `ad_storage`.

## ADDED Requirements

### Requirement: No optional request before a grant
The module SHALL NOT request any Google tag script, GTM container or other optional script, and SHALL NOT cause any request to an analytics or advertising host, until the visitor has granted a category that needs that script. Hosts covered include `googletagmanager.com`, `google-analytics.com`, `analytics.google.com`, `doubleclick.net`, `googleadservices.com`, `googlesyndication.com` and `connect.facebook.net`.

#### Scenario: First visit, no choice
- **WHEN** a visitor with no stored choice opens a product page and does not touch the banner
- **THEN** no request is made to any analytics or advertising host and no `_ga`, `_gid`, `_gcl` or similar cookie is set

#### Scenario: Visitor rejects
- **WHEN** a visitor clicks "Odrzuć opcjonalne" and browses three more pages
- **THEN** no request is made to any analytics or advertising host on any of the four pages

#### Scenario: Banner closed without a choice
- **WHEN** a visitor closes the banner with the close button, the Escape key or the backdrop on a first visit
- **THEN** the choice is stored as "optional rejected" and no optional request is made

### Requirement: Consent Mode default does not trigger a request
The module SHALL use Consent Mode "basic", not "advanced": no cookieless pings are sent. The Consent Mode `default` command (all signals denied unless a stored grant exists) SHALL still be recorded on the page, but it SHALL NOT by itself cause a request.

#### Scenario: Consent Mode disabled
- **WHEN** Consent Mode v2 is disabled in the module settings
- **THEN** no Google tag is requested on any page, whatever the stored choice

#### Scenario: Default recorded without a request
- **WHEN** a visitor with no stored choice opens any page
- **THEN** the dataLayer holds a Consent Mode `default` with every signal denied and the request log still has no analytics or advertising host

### Requirement: A grant loads the tag, then updates consent, then delivers queued events
After the visitor grants a category on the current page, the module SHALL, in this order: request the tag that the category allows, apply the Consent Mode `update`, and deliver the events that were raised on that page before the grant. Each queued event SHALL be delivered exactly once and in the order it was raised. The module's `scm_consent_update` dataLayer event SHALL be pushed after the consent update and before any queued event.

#### Scenario: Late grant on a product page
- **WHEN** a visitor opens a product page (which raises `view_item`), then clicks "Akceptuję wszystkie"
- **THEN** the tag is requested, the consent update is applied, and `view_item` is delivered once after both

#### Scenario: Several events before the grant
- **WHEN** a visitor on the checkout page raises `begin_checkout`, then `add_shipping_info`, then `add_payment_info` before granting consent
- **THEN** after the grant the three events are delivered once each, in that order

#### Scenario: Grant repeated
- **WHEN** the visitor opens the banner again on the same page and saves the same choice
- **THEN** no queued event is delivered a second time and the tag is not requested a second time

### Requirement: Queued events live only in the page
Events raised while no grant exists SHALL be kept in the page's memory only. They SHALL NOT be pushed to the dataLayer, written to cookies, `localStorage` or `sessionStorage`, or sent anywhere. They SHALL be discarded when the visitor rejects or leaves the page, and SHALL NOT be replayed on a later page.

#### Scenario: Events before a rejection
- **WHEN** a visitor raises `view_item` and then clicks "Odrzuć opcjonalne"
- **THEN** the dataLayer contains no `view_item` entry and nothing is delivered later

#### Scenario: Navigation without a choice
- **WHEN** a visitor raises `add_to_cart` on one page and navigates to another without choosing
- **THEN** the `add_to_cart` event is not delivered on the next page

### Requirement: Once-only guards are recorded at delivery
The guards that prevent an event from being sent twice (the per-order `purchase` guard and the checkout step guards) SHALL be recorded when the event is delivered, not when it is queued, so that an event raised before a grant is not lost by a later reload or a late grant.

#### Scenario: Reload before the choice
- **WHEN** a visitor with no choice reloads the order-confirmation page and then grants analytics
- **THEN** the `purchase` event is delivered once

#### Scenario: Reload after delivery
- **WHEN** the `purchase` event was delivered and the visitor reloads the confirmation page
- **THEN** it is not delivered again

### Requirement: Stored grant on later pages
When a stored choice grants a category, the module SHALL request the tag that category allows on every following page view, and SHALL deliver that page's events through it, without showing the banner again. A page view with no stored grant SHALL behave as the first-visit rule above.

#### Scenario: Returning visitor with analytics granted
- **WHEN** a visitor who granted analytics opens a new page
- **THEN** the analytics tag is requested without waiting for a click and that page's events are delivered in order

### Requirement: Withdrawing consent
When the visitor withdraws a grant, the module SHALL send the Consent Mode `update` with the signal denied on the current page, SHALL remove the cookies of the withdrawn category, and SHALL NOT request the tag from the next page view on.

#### Scenario: Analytics switched off
- **WHEN** a visitor who accepted analytics opens "Zmień ustawienia cookies", switches analytics off and saves, then opens another page
- **THEN** no request is made to an analytics host on the other page and no `_ga` cookie remains

### Requirement: Each category loads only the tag it allows in direct mode
In direct mode (no GTM container id configured), the module SHALL load the GA4 configuration only when `analytics_storage` is granted, and the Ads configuration, the Ads conversion and the Meta Pixel only when `ad_storage` is granted. A grant that does not include a tag's category SHALL NOT load that tag.

#### Scenario: Analytics only
- **WHEN** a visitor grants only the analytics category in direct mode with a GA4 id and an Ads id configured
- **THEN** `gtag.js` is requested for GA4 only, the Ads id is not configured, no Ads request is made and the Meta Pixel is not loaded

#### Scenario: Marketing granted later on the same page
- **WHEN** the visitor who granted analytics later also grants the advertising category on the same page
- **THEN** the Ads configuration is added to the already loaded tag and the script is not requested again

### Requirement: GTM container mode
In GTM mode (a container id is configured), the module SHALL request the container only when at least one of `analytics_storage`, `ad_storage`, `ad_user_data` or `ad_personalization` is granted, and SHALL pass the granted signals to the container through the Consent Mode `update` before queued events are delivered. The module SHALL document that the container's own tags must require the matching consent, because the module cannot gate tags inside a container.

#### Scenario: Container with analytics granted
- **WHEN** a visitor grants analytics in GTM mode
- **THEN** `gtm.js` is requested, the consent update precedes the first delivered event, and events use the existing `{ ecommerce: null }` plus `{ event, ecommerce }` pair

#### Scenario: Nothing granted in GTM mode
- **WHEN** a visitor has made no choice or rejected optional cookies in GTM mode
- **THEN** `gtm.js` is not requested

### Requirement: Ads conversion only after advertising consent
The module SHALL send the Google Ads purchase conversion only when `ad_storage` is granted. With analytics granted and advertising not granted, the GA4 `purchase` event SHALL still be delivered and the Ads conversion SHALL NOT be sent.

#### Scenario: Purchase with analytics only
- **WHEN** a visitor who granted analytics only completes an order in direct mode with an Ads id and a conversion label
- **THEN** the GA4 `purchase` event is delivered and no `conversion` event or Ads request is made

#### Scenario: Purchase with everything granted
- **WHEN** a visitor who granted all categories completes an order in direct mode
- **THEN** the GA4 `purchase` event and the Ads `conversion` event are each delivered once

### Requirement: The six e-commerce events survive a late grant
Under basic mode the module SHALL still deliver `view_item`, `add_to_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info` and `purchase` with the same names and payloads as before this change, in both tag modes, whenever the visitor has granted the analytics category.

#### Scenario: Full journey with a grant on the product page
- **WHEN** a visitor grants analytics on a product page and then adds the product, completes checkout and pays
- **THEN** all six events are delivered once each, in funnel order, with unchanged payload keys

### Requirement: Scripts the module does not print are out of its control
The admin Integrations tab SHALL tell the merchant that basic mode applies to scripts printed by this module only, and that a container or tag printed by another module is not gated by it.

#### Scenario: Integrations tab
- **WHEN** an administrator opens the Integrations tab
- **THEN** a note states that a Google container or tag added by another module is not blocked before consent

### Requirement: Checkout events are sent once per order
`begin_checkout` SHALL be delivered once per checkout, not on every reload of the checkout page. `add_payment_info` SHALL be delivered when a payment option is selected, including when the shop offers a single payment option that the page shows already selected.

#### Scenario: Checkout reloads between steps
- **WHEN** a consenting visitor goes from the personal details step through the address and delivery steps to payment, and the checkout page reloads after each step
- **THEN** `begin_checkout` is delivered once for that cart

#### Scenario: One payment option, already selected
- **WHEN** the payment step offers one payment option and shows it selected on load
- **THEN** `add_payment_info` is delivered once with that option's module name, without a click
