# Spec Delta

## Purpose

Defines what the visitor sees and can do about consent: the first layer of the banner, the way to change the choice later, and how long a choice is kept. Optional categories start switched off and closing the banner never counts as consent.

## ADDED Requirements

### Requirement: Optional categories start switched off
The banner SHALL show every optional category switched off until the visitor turns it on. Only the strictly necessary category SHALL be shown as always on.

#### Scenario: First visit
- **WHEN** a visitor with no stored choice opens any page
- **THEN** every optional toggle is off and the necessary category is shown as always active

### Requirement: Rejecting is as easy as accepting
The first layer of the banner SHALL offer "Odrzuć opcjonalne" and "Akceptuję wszystkie" as buttons of equal size and equal visual weight (same fill style, border, font size, weight and shadow), and neither SHALL be styled as the main action. A third button that saves the toggles ("Zapisz wybór") SHALL NOT be more prominent than either.

#### Scenario: Banner on a phone
- **WHEN** the banner is shown at a viewport of 390 by 844
- **THEN** both buttons are visible without scrolling inside the banner, have the same width and height, and have the same computed background, border, font size, weight and shadow

#### Scenario: Banner on a desktop
- **WHEN** the banner is shown at 1366 by 768
- **THEN** the same equality holds

### Requirement: The banner does not hide the purchase button after the first choice
After the visitor's first choice the banner SHALL be hidden and SHALL NOT cover the page's main purchase button (add to cart on a product page, order button at checkout). The reopen button, if enabled, SHALL NOT overlap it either.

#### Scenario: Product page after the choice
- **WHEN** a visitor clicks either first-layer button on a product page at 390 by 844
- **THEN** the "add to cart" button is not overlapped by any element of this module

### Requirement: The choice can be changed from the footer
When the footer link setting is on (default), every page SHALL carry a text link "Zmień ustawienia cookies" in its footer that opens the banner with the stored choice shown. The visitor SHALL be able to change or withdraw every optional category there.

#### Scenario: Link on every page
- **WHEN** a visitor opens the home, category, product, cart and order-confirmation pages
- **THEN** each page contains the link and a click on it shows the banner with the saved toggles

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
