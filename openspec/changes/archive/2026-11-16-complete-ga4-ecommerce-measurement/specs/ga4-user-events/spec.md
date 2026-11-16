# Spec Delta

## Purpose

Defines the GA4 events the storefront emits about the visitor's account and site activity that are not ecommerce events (`login`, `sign_up`, `search`), how an outcome that happens on the server reaches the next page, and the guarantee that these events carry no personal data.

## ADDED Requirements

### Requirement: Delivery path for user events
`login`, `sign_up` and `search` SHALL be routed by the same resolved tag mode and pre-resolution queue as ecommerce events. In direct `gtag.js` mode they SHALL be `gtag` event commands. In GTM or no-tag mode they SHALL appear as `{ event: <name>, … }` dataLayer objects with parameters at the top level, without an `ecommerce` key and without a preceding `{ ecommerce: null }` push.

#### Scenario: Login in GTM mode
- **WHEN** the ecommerce target is `gtm` and a `login` event fires
- **THEN** the dataLayer receives `{ event: 'login', method: 'PrestaShop' }` and no `ecommerce` key is pushed for it

#### Scenario: Login in direct gtag.js mode
- **WHEN** the ecommerce target is `gtag` and a `login` event fires
- **THEN** the dataLayer receives a `gtag` command `event login` with `{ method: 'PrestaShop' }`

### Requirement: Login event
After a customer successfully logs in to the storefront, the next storefront page that customer loads SHALL emit `login` exactly once with `method: 'PrestaShop'`. A failed login attempt SHALL NOT emit it.

#### Scenario: Successful login
- **WHEN** a customer submits correct credentials and is redirected to "My account"
- **THEN** the "My account" page emits one `login` event

#### Scenario: Wrong password
- **WHEN** a visitor submits a wrong password
- **THEN** no `login` event is emitted

#### Scenario: Page reloaded after login
- **WHEN** the customer reloads the page that already emitted `login`
- **THEN** no second `login` event is emitted

### Requirement: Sign-up event
After a visitor creates a customer account (registration form, or a password set during checkout), the next storefront page SHALL emit `sign_up` exactly once with `method: 'PrestaShop'`. A guest checkout without a password SHALL NOT emit it. Account creation SHALL NOT also emit `login`.

#### Scenario: Registration form
- **WHEN** a visitor completes the registration form
- **THEN** the next page emits one `sign_up` event and no `login` event

#### Scenario: Guest checkout
- **WHEN** a visitor checks out as a guest without setting a password
- **THEN** no `sign_up` event is emitted

### Requirement: Pending events survive redirects
An account event SHALL remain pending across redirects and pages that do not render the storefront footer, and SHALL be emitted by the first page that renders it. A pending event SHALL be discarded once it is emitted.

#### Scenario: Redirect after login
- **WHEN** login redirects through an intermediate redirect response before showing the order page
- **THEN** the order page emits the `login` event

### Requirement: No personal data in user events
`login`, `sign_up` and `search` SHALL NOT carry a customer ID, e-mail address, name, phone number or any hashed form of these. The module SHALL NOT set a GA4 `user_id` or `user_data`.

#### Scenario: Payload inspected
- **WHEN** a `sign_up` event is emitted for customer `jan@example.com`
- **THEN** the event parameters contain only `method`, and the dataLayer contains no value derived from the e-mail address

### Requirement: Search event
On the search results page the storefront SHALL emit `search` once per page load with `search_term` equal to the visitor's query, trimmed and limited to 100 characters. An empty query SHALL NOT emit it.

#### Scenario: Search submitted
- **WHEN** a visitor searches for "  winter boots "
- **THEN** the results page emits `search` with `search_term: 'winter boots'`

#### Scenario: Empty query
- **WHEN** the search page is opened with an empty query
- **THEN** no `search` event is emitted

### Requirement: Search term is safely encoded
The search term SHALL be embedded in the page as data, never as markup or script, so a query containing HTML or script characters is reported verbatim and cannot execute.

#### Scenario: Script-like query
- **WHEN** a visitor searches for `</script><img src=x onerror=alert(1)>`
- **THEN** no script executes and `search_term` contains the query text verbatim, truncated to 100 characters
