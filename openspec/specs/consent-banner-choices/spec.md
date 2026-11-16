# consent-banner-choices Specification

## Purpose
Defines what the visitor sees and can do about consent: the two-screen banner (a short first screen and a settings screen), the way to change the choice later, and how long a choice is kept. Optional categories start switched off and closing the banner never counts as consent.

## Requirements

### Requirement: Optional categories start switched off
The banner SHALL show every optional category switched off until the visitor turns it on. Only the strictly necessary category SHALL be shown as always on.

#### Scenario: First visit
- **WHEN** a visitor with no stored choice opens any page
- **THEN** every optional toggle is off and the necessary category is shown as always active

### Requirement: Rejecting is as easy as accepting
The first screen SHALL show exactly three buttons, "Akceptuję wszystkie", "Ustawienia cookies" and "Odrzuć opcjonalne", and no category switches. "Odrzuć opcjonalne" and "Akceptuję wszystkie" SHALL have the same size, font and border; "Akceptuję wszystkie" MAY be the filled main action while the other two are outlined. All three buttons SHALL be visible without scrolling at 390 by 844 and at 1366 by 768. "Zapisz wybór" lives on the settings screen only.

#### Scenario: First screen on a phone
- **WHEN** the banner is shown at a viewport of 390 by 844
- **THEN** exactly three buttons are visible, stacked in the order Akceptuję wszystkie, Ustawienia cookies, Odrzuć opcjonalne, all inside the viewport, and accept and reject have the same width and height

#### Scenario: Rejecting
- **WHEN** a visitor clicks "Odrzuć opcjonalne" on the first screen
- **THEN** the choice is stored with every optional category off and no analytics or advertising request is made

### Requirement: The first-screen buttons follow the viewport
Under 768 px the first-screen buttons SHALL be stacked at full width as Akceptuję wszystkie, Ustawienia cookies, Odrzuć opcjonalne. From 768 px they SHALL stand in one right-aligned row as Ustawienia cookies, Odrzuć opcjonalne, Akceptuję wszystkie, in a card docked to the bottom centre. The Tab order SHALL equal the order on screen in both layouts.

#### Scenario: First screen on a desktop
- **WHEN** the banner is shown at 1366 by 768
- **THEN** the card is docked to the bottom centre, the three buttons stand in one row in the order Ustawienia cookies, Odrzuć opcjonalne, Akceptuję wszystkie, and accept and reject have the same width and height

#### Scenario: Tab order
- **WHEN** a visitor presses Tab through the first screen on a desktop
- **THEN** the buttons receive focus in the order Ustawienia cookies, Odrzuć opcjonalne, Akceptuję wszystkie

### Requirement: The settings screen shows one card per category
The banner SHALL have a second screen titled "Ustawienia ciasteczek" with a short introduction and one card per category, each with the category name, a switch and a chevron that expands the description (collapsed by default). The necessary category SHALL be on and disabled; optional switches SHALL start off on a first visit.

#### Scenario: Expand and collapse
- **WHEN** the visitor clicks a category name or its chevron
- **THEN** its description is shown and aria-expanded is true; a second click hides it

### Requirement: The settings screen has four buttons
The settings screen SHALL end with a pinned bar of four buttons in the order "Wróć", "Odrzuć opcjonalne", "Zapisz wybór", "Akceptuję wszystkie": stacked on a phone, in one row from 768 px. Only "Akceptuję wszystkie" is filled. "Odrzuć opcjonalne" has the label and action of the first screen and the size of "Akceptuję wszystkie". On a phone the bar takes at most 45% of the viewport height and each button is at least 44 px high. The Tab order equals the order on screen.

#### Scenario: Reject from the settings screen
- **WHEN** a visitor switches analytics on and then clicks "Odrzuć opcjonalne" on the settings screen
- **THEN** the choice is stored with every optional category off, the banner closes, and no analytics or advertising request is made

#### Scenario: Settings screen buttons
- **WHEN** the settings screen is shown at 390 by 844 and at 1366 by 768
- **THEN** the four buttons are in the order Wróć, Odrzuć opcjonalne, Zapisz wybór, Akceptuję wszystkie (stacked on the phone with the bar at most 45% of the height, in one row on the desktop), reject and accept have the same width and height, and the Tab order equals that order

### Requirement: Every entry point opens the first screen
The footer link, the reopen button and `SCM_Consent.reopen()` SHALL open the first screen (the three buttons), also when a choice is stored. The settings screen SHALL open from "Ustawienia cookies". "Wróć" SHALL always be shown on the settings screen and SHALL return to the first screen without storing anything and with the switches back at the saved state (all off when nothing is saved). The settings screen SHALL show the saved switch states when a choice is stored.

#### Scenario: Opened from the first screen
- **WHEN** a first-time visitor clicks "Ustawienia cookies"
- **THEN** the settings screen is shown, every optional switch is off, the necessary one is on and disabled, and "Wróć" is visible

#### Scenario: Wróć
- **WHEN** the visitor switches one category on and clicks "Wróć"
- **THEN** the first screen is shown again, the switch is back at its saved state, and no choice is stored

#### Scenario: Reopened with a stored choice
- **WHEN** a visitor with a stored choice clicks the footer link or the reopen button
- **THEN** the first screen with three buttons is shown, "Ustawienia cookies" leads to the settings screen with the saved switches and "Wróć" visible, and "Zapisz wybór" stores the new switches and closes the banner

#### Scenario: Keyboard and screen readers
- **WHEN** the banner opens or changes screen
- **THEN** focus moves to the screen's title once the screen is shown, the dialog has role dialog, aria-modal true and aria-labelledby pointing to the visible title, Tab stays inside the dialog, and Escape grants nothing: on the settings screen it goes back to the first screen, on the first screen with a stored choice it closes and keeps the choice, and on the first screen of a first visit it closes and stores a rejection of every optional category

### Requirement: Banner motion on opening and closing
The entrance and exit SHALL use only transform and opacity. Opening: on a phone the backdrop fades in and the sheet rises from below in about 320 ms with a slight opacity rise; on a desktop the card rises about 16 px and fades in. Closing, by any choice or the close button: the reverse in about 230 ms, and the banner is hidden only after it, while the choice is stored and sent to Consent Mode at once. The phase is exposed as `data-state` (closed, opening, open, closing).

#### Scenario: Opening slides in
- **WHEN** the banner is shown on a phone
- **THEN** its position moves from below to its resting place and its opacity rises while `data-state` is opening, and it is `open` after about 330 ms; on a desktop it moves about 16 px

#### Scenario: Closing slides out before hiding
- **WHEN** a visitor clicks "Akceptuję wszystkie", "Odrzuć opcjonalne" or the close button
- **THEN** the choice is stored on the click, the banner is still shown with `data-state` closing, and it is hidden within 400 ms

### Requirement: Banner motion on screen switch and cards
Switching between the first and the settings screen SHALL take about 300 ms: the sheet's height moves to the height of the other screen, the outgoing screen fades and slides about 16 px (forward to the left, back to the right) and the incoming one fades and slides in; both screens are never shown together and the content does not show a scrollbar while the height moves. Opening or closing a category card SHALL move its description height in about 220 ms and turn the chevron 180 degrees.

#### Scenario: Screen switch animates the height
- **WHEN** the visitor clicks "Ustawienia cookies" or "Wróć"
- **THEN** the sheet's height takes intermediate values between the two screens' heights over about 300 ms instead of jumping, both screens are never visible together, and focus is on the new screen's title afterwards

#### Scenario: Card expands
- **WHEN** the visitor opens a category card
- **THEN** its description height and the chevron rotation take intermediate values, ending at the full height and 180 degrees

### Requirement: Reduced motion is instant
With `prefers-reduced-motion: reduce` every motion duration SHALL be zero (opening, closing, switching and the cards are instant) and the behaviour, focus handling and stored choices SHALL be identical.

#### Scenario: Reduced motion is instant
- **WHEN** the visitor's system asks for reduced motion
- **THEN** the sheet's transition and animation durations are 0, the banner opens, switches screens and closes in one frame, and the stored choices are the same

### Requirement: The banner is styled from the module's colour settings
The banner SHALL take its filled-button, switch-on, icon and focus-ring colour from the module's primary colour setting and the necessary-category switch from the accent setting, and SHALL choose a text colour for the filled button with at least 4.5:1 contrast. Focus rings SHALL be visible on every control.

#### Scenario: Shop colour
- **WHEN** the primary colour is set to #004b87
- **THEN** the filled button and the switches that are on are that colour and the button text is white

### Requirement: The banner does not hide the purchase button after the first choice
After the visitor's first choice the banner SHALL be hidden and SHALL NOT cover the page's main purchase button (add to cart on a product page, order button at checkout). The reopen button, if enabled, SHALL NOT overlap it either.

#### Scenario: Product page after the choice
- **WHEN** a visitor clicks either first-layer button on a product page at 390 by 844
- **THEN** the "add to cart" button is not overlapped by any element of this module

### Requirement: The choice can be changed from the footer
When the footer link setting is on (default), every page SHALL carry a text link "Zmień ustawienia cookies" in its footer that opens the banner on its first screen, from which the settings screen shows the stored choice. The visitor SHALL be able to change or withdraw every optional category there.

#### Scenario: Link on every page
- **WHEN** a visitor opens the home, category, product, cart and order-confirmation pages
- **THEN** each page contains the link and a click on it shows the first screen; "Ustawienia cookies" there shows the saved toggles

#### Scenario: Setting off
- **WHEN** the footer link setting is off
- **THEN** no footer link is printed and the reopen button (if enabled) still opens the banner

### Requirement: The choice is kept at most 365 days
The module SHALL keep the visitor's choice for at most 365 days. The Settings tab SHALL NOT accept a longer lifetime, and a longer value stored before this change SHALL be reduced to 365 on upgrade. After the lifetime ends the banner SHALL be shown again.

#### Scenario: Value too long
- **WHEN** an administrator saves a lifetime of 400 days
- **THEN** the save is refused with a message that the maximum is 365 days

#### Scenario: Upgrade from a longer lifetime
- **WHEN** the module is upgraded on a shop whose lifetime was 730 days
- **THEN** the stored value becomes 365

#### Scenario: Returning visitor within a year
- **WHEN** a visitor who rejected optional cookies returns a week later on the same device
- **THEN** the banner is not shown and no optional request is made
