# Spec Delta

## Purpose

Defines how the module reports a completed order to Google Ads as a conversion: the settings a merchant provides, the conversion event the storefront sends, how double counting is prevented, how consent and the active Google tag mode affect sending, and what the admin panel tells the merchant about the conversion setup.

## ADDED Requirements

### Requirement: Conversion settings
The Integrations tab SHALL offer, next to the existing Google Ads conversion ID (`AW-…`), a *conversion label (purchase)* text setting and a *send Ads conversions directly from the module (also with GTM)* on/off setting. A label SHALL be accepted only if it is 4–40 characters from letters, digits, `_` and `-`, SHALL be stored exactly as entered (case preserved), and SHALL be rejected when no Ads ID is configured.

#### Scenario: Valid label saved
- **WHEN** the merchant saves Ads ID `AW-123456789` and label `AbCdEfGh_1-23`
- **THEN** both values are stored, the label keeps its original casing, and a success message is shown

#### Scenario: Malformed label rejected
- **WHEN** the merchant saves a label containing a slash, a space or the `AW-` prefix
- **THEN** the settings are not saved and an error explains the expected format (the part after the slash in the Ads event snippet)

#### Scenario: Label without Ads ID rejected
- **WHEN** the merchant saves a label while the Ads ID field is empty
- **THEN** the settings are not saved and an error states that a conversion ID is required for a label

### Requirement: Purchase conversion event
When an Ads ID and a conversion label are configured and the resolved Ads conversion target is `gtag`, the storefront SHALL send a Google Ads `conversion` event on the order-confirmation page with `send_to` equal to `<Ads ID>/<label>`, `value` equal to the order total paid including tax, `currency` equal to the order currency ISO code and `transaction_id` equal to the order reference. The GA4 `purchase` event SHALL still be sent independently of the conversion event.

#### Scenario: Conversion sent in direct mode
- **WHEN** a visitor reaches the order-confirmation page for order `ABCDEFGHI` of 149.90 PLN, the module loaded `gtag.js` itself, and Ads ID `AW-123456789` with label `XyZ-1` are configured
- **THEN** the dataLayer receives a `gtag` command `event conversion` with `send_to: "AW-123456789/XyZ-1"`, `value: 149.9`, `currency: "PLN"`, `transaction_id: "ABCDEFGHI"`, in addition to the GA4 `purchase` event

#### Scenario: Container owns the conversion
- **WHEN** a GTM container is present and the direct-send setting is off
- **THEN** no `conversion` event is sent by the module; the `purchase` dataLayer event remains available as the trigger for an Ads conversion tag inside the container

#### Scenario: Label missing
- **WHEN** an Ads ID is configured without a conversion label and the Ads conversion target is `gtag`
- **THEN** no `conversion` event is sent, while the GA4 `purchase` event is still sent

### Requirement: Per-order de-duplication
The module SHALL send the purchase event and the conversion event at most once per order within a browser session, keyed by the order reference, so reloading the confirmation page does not report the order again.

#### Scenario: Confirmation page reloaded
- **WHEN** the visitor reloads the order-confirmation page of an order already reported in this session
- **THEN** neither the `purchase` event nor the `conversion` event is sent again

#### Scenario: Different order
- **WHEN** the visitor completes a second order in the same session
- **THEN** the purchase and conversion events are sent for the new order reference

### Requirement: Consent handling for conversions
The conversion event SHALL be submitted to the Google tag regardless of the visitor's marketing consent state; Google Consent Mode v2 signals already present on the page determine whether the tag stores cookies and sends a full hit or a cookieless modelled ping. The module SHALL NOT add its own gating, except that with Consent Mode disabled no Google tag is loaded and therefore no conversion is sent.

#### Scenario: Marketing consent denied
- **WHEN** the visitor rejected the marketing category and completes an order in direct mode
- **THEN** the `conversion` event is still submitted and the consent state on the page is `ad_storage: denied` so the Google tag sends it without advertising cookies

#### Scenario: Consent Mode disabled
- **WHEN** Consent Mode v2 is disabled in the module settings
- **THEN** no Google tag is loaded and no conversion event is sent

### Requirement: Conversion status in the admin panel
The Integrations status table SHALL show the Google Ads conversion state as one of: *sent by the module* (Ads ID and label set, and either no GTM ID or direct-send on), *expected from the GTM container* (Ads ID and GTM ID set, direct-send off), *conversion label missing* (Ads ID set, label empty, and the module would be the sender), or *not configured* (no Ads ID). The row SHALL display the configured ID and label.

#### Scenario: Module is the sender
- **WHEN** Ads ID and label are set and no GTM ID is configured
- **THEN** the status row shows *sent by the module* with the ID and label

#### Scenario: Container expected
- **WHEN** Ads ID and GTM ID are set and direct-send is off
- **THEN** the status row shows *expected from the GTM container* and points to the GTM how-to in the admin panel

#### Scenario: Label missing
- **WHEN** an Ads ID is set, the label is empty, and no GTM ID is configured
- **THEN** the status row shows a warning badge *conversion label missing*

### Requirement: Save-time conversion warnings
After the Integrations form is saved successfully, the module SHALL show a warning when an Ads ID is set without a label while the module would be the sender, a double-counting warning when direct-send is on together with a GTM ID, and an informational notice when direct-send is on without an Ads ID.

#### Scenario: Label missing warning
- **WHEN** the merchant saves an Ads ID, no label and no GTM ID
- **THEN** a warning states that conversions will not be recorded until a label is entered

#### Scenario: Double-counting warning
- **WHEN** the merchant saves a GTM ID with direct-send on
- **THEN** a warning states that the Ads conversion tag must not also exist in the GTM container

### Requirement: Upgrade seeds conversion settings
Upgrading an existing installation to the version introducing this capability SHALL create the conversion label (empty) and direct-send (off) settings without altering any other stored setting, so behaviour is unchanged until the merchant opts in.

#### Scenario: Existing store upgraded
- **WHEN** a store running the previous version is upgraded
- **THEN** the two new settings exist with their defaults, existing IDs are untouched, and the storefront dataLayer output is identical to the previous version
