## MODIFIED Requirements

### Requirement: Pre-resolution event queue
Events submitted to the tracking entry point before a consent grant has started a Google tag SHALL be held in the page's memory in submission order, and dispatched only after a grant has requested the tag and applied the Consent Mode update. Without a grant, or after a rejection, they SHALL be discarded and never pushed to the dataLayer. Server-rendered inline events, such as the purchase on the order-confirmation page, follow the same rule.

#### Scenario: Inline purchase before DOMContentLoaded
- **WHEN** the order-confirmation page emits the purchase event during HTML parsing and the visitor has a stored analytics grant, or grants analytics on that page
- **THEN** the purchase event is dispatched once, after the grant has started the tag and the consent update was applied, using the resolved target

#### Scenario: Inline purchase without a grant
- **WHEN** the order-confirmation page emits the purchase event and the visitor rejects optional cookies or makes no choice
- **THEN** the purchase event is not dispatched and the dataLayer holds no purchase entry

#### Scenario: Order preserved
- **WHEN** two events are submitted before the grant
- **THEN** they are dispatched in the same order they were submitted

### Requirement: Tag mode resolution
When a consent grant has started a Google tag, the module SHALL resolve a page-level tag mode consisting of an ecommerce target (`gtm`, `gtag` or `none`) and an Ads conversion target (`gtag`, `container` or `none`), and SHALL expose it to the module's other front-office scripts. Until a grant exists both targets are `none`. The ecommerce target is `gtag` only when the module itself loaded direct `gtag.js` for GA4/Ads; it is `gtm` when a container (own or external) is present; otherwise `none`.

#### Scenario: Own direct gtag.js
- **WHEN** a grant made the module load `gtag.js` because no container exists
- **THEN** the ecommerce target is `gtag` and the Ads conversion target is `gtag` if an Ads ID is configured and advertising was granted, else `none`

#### Scenario: Container present, no direct Ads tag
- **WHEN** after a grant a GTM container (own or external) is present and the direct-send setting is off
- **THEN** the ecommerce target is `gtm` and the Ads conversion target is `container`

#### Scenario: Container present with direct Ads tag
- **WHEN** a GTM container is present and, after an advertising grant, the module loaded the Ads-only `gtag.js`
- **THEN** the ecommerce target is `gtm` and the Ads conversion target is `gtag`

#### Scenario: No Google tag
- **WHEN** Consent Mode is disabled, no Google ID is configured and no external container exists, or the visitor has not granted any category
- **THEN** both targets are `none`
