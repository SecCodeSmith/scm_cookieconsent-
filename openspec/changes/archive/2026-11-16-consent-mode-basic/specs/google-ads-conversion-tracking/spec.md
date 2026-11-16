## MODIFIED Requirements

### Requirement: Consent handling for conversions
The conversion event SHALL be submitted only after the visitor has granted the advertising (marketing) category, and only to a tag the module loaded after that grant. Without that grant no conversion SHALL be submitted and no request SHALL go to an advertising host; cookieless pings are not used. With Consent Mode disabled no Google tag is loaded, so no conversion is sent.

#### Scenario: Marketing consent denied
- **WHEN** the visitor rejected the marketing category and completes an order in direct mode
- **THEN** no `conversion` event is submitted and no request goes to `googleadservices.com` or `doubleclick.net`

#### Scenario: Marketing consent granted
- **WHEN** the visitor granted the marketing category and completes an order in direct mode
- **THEN** the `conversion` event is submitted once, after the Ads tag was requested and the consent update applied

#### Scenario: Consent Mode disabled
- **WHEN** Consent Mode v2 is disabled in the module settings
- **THEN** no Google tag is loaded and no conversion event is sent
