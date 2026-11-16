# Graph Report - scm_cookieconsent-  (2026-11-16)

## Corpus Check
- 56 files · ~91,484 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 5, .tpl 5, .css 2)

## Summary
- 897 nodes · 1363 edges · 54 communities (41 shown, 13 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 189 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40bde39d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Scm_Cookieconsent
- 06-consent-basic.spec.js
- scm_cookieconsent.js
- openspec-apply-change skill
- scm_cookieconsent.min.js
- scm_ecommerce.js
- terser minification build step
- ADDED Requirements
- Polish cookie consent modal screenshot (banner-modal-pl.png)
- Project logo (glowing hammer over Matrix-style binary rain)
- cookie-bite.svg
- gcm_bootstrap.src.js
- login
- Requirements
- ADDED Requirements
- package.json
- ADDED Requirements
- stack.sh
- .getDefaultTexts
- .getAllConfig
- helpers.js
- scm_cookieconsent PrestaShop module
- Requirements
- Requirements
- renderBannerAndEcommerce
- Requirements
- graphify knowledge graph workflow
- 04-account.spec.js
- sql
- scm_cookieconsent - end-to-end tests (Playwright)
- ADDED Requirements
- Requirements
- ADDED Requirements
- .buildEcommercePageData
- ADDED Requirements
- Tasks
- Decisions
- Requirements
- .renderBannerAndEcommerce
- Requirement: Tag mode resolution
- .install
- Proposal
- Proposal
- Proposal
- Design
- Requirement: Consent handling for conversions
- Requirement: Sign-up event
- OpenSpec config (spec-driven schema)

## God Nodes (most connected - your core abstractions)
1. `Scm_Cookieconsent` - 59 edges
2. `login()` - 33 edges
3. `currency()` - 16 edges
4. `config()` - 15 edges
5. `ADDED Requirements` - 15 edges
6. `Requirements` - 15 edges
7. `sql()` - 14 edges
8. `mapItem()` - 14 edges
9. `ADDED Requirements` - 14 edges
10. `ADDED Requirements` - 14 edges

## Surprising Connections (you probably didn't know these)
- `D7 — Verification without a test suite` --references--> `config()`  [INFERRED]
  openspec/changes/archive/2026-11-16-add-google-ads-conversion-tracking/design.md → tests/e2e/specs/01-upgrade.spec.js
- `Scenario: Direct Ads tag with own GTM` --references--> `config()`  [INFERRED]
  openspec/changes/archive/2026-11-16-add-google-ads-conversion-tracking/specs/google-tag-integration/spec.md → tests/e2e/specs/01-upgrade.spec.js
- `Scenario: Direct gtag.js fallback` --references--> `config()`  [INFERRED]
  openspec/changes/archive/2026-11-16-add-google-ads-conversion-tracking/specs/google-tag-integration/spec.md → tests/e2e/specs/01-upgrade.spec.js
- `Scenario: Direct Ads tag with own GTM` --references--> `config()`  [INFERRED]
  openspec/specs/google-tag-integration/spec.md → tests/e2e/specs/01-upgrade.spec.js
- `Scenario: Direct gtag.js fallback` --references--> `config()`  [INFERRED]
  openspec/specs/google-tag-integration/spec.md → tests/e2e/specs/01-upgrade.spec.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Banner rendering on three fallback hooks** — readme_theme_independence, readme_renderbannerandecommerce, readme_banner_reparenting [EXTRACTED 0.95]
- **Cookie consent categories in modal** — docs_banner_modal_pl_necessary_cookies, docs_banner_modal_pl_analytics_cookies, docs_banner_modal_pl_marketing_cookies [EXTRACTED 1.00]
- **Shared store selection and project check preamble** — _claude_skills_openspec_apply_change_skill_store_selection, _claude_skills_openspec_apply_change_skill_project_check, _claude_skills_openspec_apply_change_skill_openspec_cli [INFERRED 0.85]
- **OpenSpec change lifecycle workflow** — _claude_skills_openspec_explore_skill, _claude_skills_openspec_propose_skill, _claude_skills_openspec_update_change_skill, _claude_skills_openspec_apply_change_skill, _claude_skills_openspec_sync_specs_skill, _claude_skills_openspec_archive_change_skill [INFERRED 0.95]

## Communities (54 total, 13 thin omitted)

### Community 1 - "06-consent-basic.spec.js"
Cohesion: 0.09
Nodes (12): bannerVisible(), categoryOf(), choose(), DESKTOP, FIRST_DESKTOP, FIRST_PHONE, MODES, PHONE (+4 more)

### Community 2 - "scm_cookieconsent.js"
Cohesion: 0.10
Nodes (41): Context, D8. Retention, acceptAll(), afterMotion(), applyToggleState(), collapseAll(), deleteCookie(), dismissBanner() (+33 more)

### Community 3 - "openspec-apply-change skill"
Cohesion: 0.16
Nodes (20): openspec-apply-change skill, openspec CLI, Project check (root null handling), Store selection (--store flag), Task implementation loop, openspec-archive-change skill, Archive move to dated directory, Artifact and task completion checks (+12 more)

### Community 4 - "scm_cookieconsent.min.js"
Cohesion: 0.11
Nodes (28): minify(), norm(), boot(), makeStorage(), a(), b(), C(), d() (+20 more)

### Community 5 - "scm_ecommerce.js"
Cohesion: 0.16
Nodes (35): 2. Loading, queue and update order (bootstrap), cartId(), cartItems(), cartPayload(), currency(), dl(), emitList(), firePageEvents() (+27 more)

### Community 7 - "ADDED Requirements"
Cohesion: 0.05
Nodes (41): ADDED Requirements, Purpose, Requirement: Cart and checkout start, Requirement: Cart change events, Requirement: Consistent item variant, Requirement: Event value and currency, Requirement: Existing ecommerce contract preserved, Requirement: Item payload shape (+33 more)

### Community 8 - "Polish cookie consent modal screenshot (banner-modal-pl.png)"
Cohesion: 0.38
Nodes (6): Polish cookie consent modal screenshot (banner-modal-pl.png), Consent action buttons (Reject optional, Save choice, Accept all), Analytics cookies toggle (Google Analytics 4 / Universal Analytics), Personalization and remarketing cookies toggle, Necessary cookies toggle (always active), Privacy policy link

### Community 9 - "Project logo (glowing hammer over Matrix-style binary rain)"
Cohesion: 1.00
Nodes (3): Project logo (glowing hammer over Matrix-style binary rain), Hammer motif (smith/forge branding), Green binary code rain (hacker/security aesthetic)

### Community 11 - "gcm_bootstrap.src.js"
Cohesion: 0.09
Nodes (36): 1. Head bootstrap — tag mode, event routing, Ads conversion (`views/js/src/gcm_bootstrap.src.js`), 2. Ecommerce callers use the entry point with a safe fallback, 4. Version bump and upgrade path, 5. Integration verification, Tasks, Workflow follow-up, D1. Tag loading moves from "every page" to "on a grant", in one function, D2. Order after a grant: tag, update, then events (+28 more)

### Community 13 - "login"
Cohesion: 0.23
Nodes (15): Requirement: Delivery path for user events, Requirement: Login event, Scenario: Login in direct gtag.js mode, Scenario: Login in GTM mode, Scenario: Page reloaded after login, Scenario: Successful login, Scenario: Wrong password, Requirement: Delivery path for user events (+7 more)

### Community 15 - "Requirements"
Cohesion: 0.05
Nodes (41): ga4-ecommerce-events Specification, Purpose, Requirement: Cart and checkout start, Requirement: Cart change events, Requirement: Consistent item variant, Requirement: Event value and currency, Requirement: Existing ecommerce contract preserved, Requirement: Item payload shape (+33 more)

### Community 16 - "ADDED Requirements"
Cohesion: 0.05
Nodes (40): ADDED Requirements, Purpose, Requirement: Banner motion on opening and closing, Requirement: Banner motion on screen switch and cards, Requirement: Every entry point opens the first screen, Requirement: Optional categories start switched off, Requirement: Reduced motion is instant, Requirement: Rejecting is as easy as accepting (+32 more)

### Community 17 - "package.json"
Cohesion: 0.15
Nodes (11): @playwright/test, terser, description, devDependencies, @playwright/test, terser, name, private (+3 more)

### Community 18 - "ADDED Requirements"
Cohesion: 0.05
Nodes (40): ADDED Requirements, Purpose, Requirement: A grant loads the tag, then updates consent, then delivers queued events, Requirement: Ads conversion only after advertising consent, Requirement: Checkout events are sent once per order, Requirement: Consent Mode default does not trigger a request, Requirement: Each category loads only the tag it allows in direct mode, Requirement: GTM container mode (+32 more)

### Community 19 - "stack.sh"
Cohesion: 0.54
Nodes (7): cache_clear(), console(), stack.sh script, shop_exec(), sql(), sync_module(), wait_shop()

### Community 21 - ".getAllConfig"
Cohesion: 0.41
Nodes (6): Context, D5 — Settings and payload plumbing, Impact, 3. Settings, validation and admin UI (`scm_cookieconsent.php`, `views/templates/admin/configure.tpl`), D10. Release, 3. Banner and footer link

### Community 22 - "helpers.js"
Cohesion: 0.18
Nodes (18): 1. Request log and failing tests first, Helpers (`specs/helpers.js`), { test, expect, setMode, sql, go, createVoucher, addToCart, fillGuest, fillAddress, chooseCarrier }, journey(), addToCart(), chooseCarrier(), createVoucher(), dismissBanner() (+10 more)

### Community 23 - "scm_cookieconsent PrestaShop module"
Cohesion: 0.12
Nodes (11): Build GitHub Actions workflow, Package module job (build.ps1), php-lint job (PHP 7.4 and 8.3), README.md (scm_cookieconsent), SCM_COOKIE_* Configuration keys, Cookie categories (DB tables), Coexistence with external marketing modules (GTM/TagConcierge), Google Consent Mode v2 (+3 more)

### Community 24 - "Requirements"
Cohesion: 0.05
Nodes (41): consent-banner-choices Specification, Purpose, Requirement: Banner motion on opening and closing, Requirement: Banner motion on screen switch and cards, Requirement: Every entry point opens the first screen, Requirement: Optional categories start switched off, Requirement: Reduced motion is instant, Requirement: Rejecting is as easy as accepting (+33 more)

### Community 25 - "Requirements"
Cohesion: 0.05
Nodes (40): consent-gated-tag-loading Specification, Purpose, Requirement: A grant loads the tag, then updates consent, then delivers queued events, Requirement: Ads conversion only after advertising consent, Requirement: Checkout events are sent once per order, Requirement: Consent Mode default does not trigger a request, Requirement: Each category loads only the tag it allows in direct mode, Requirement: GTM container mode (+32 more)

### Community 27 - "Requirements"
Cohesion: 0.06
Nodes (30): google-tag-integration Specification, Purpose, Requirement: Ads-only direct tag alongside a container, Requirement: Container precedence, Requirement: Ecommerce event routing by mode, Requirement: Google tags load only when Consent Mode is enabled, Requirement: Pre-resolution event queue, Requirement: Routing fallback without the bootstrap (+22 more)

### Community 30 - "04-account.spec.js"
Cohesion: 0.16
Nodes (7): { test, expect, setMode, go }, crypto, expectNoPersonalData(), { test, expect, setMode, sql, go }, { test, expect, sql }, RECORDER(), test

### Community 31 - "sql"
Cohesion: 0.31
Nodes (9): 7. Automated staging: Docker e2e suite, hooks(), NEW_HOOKS, { test, expect, stack, sql }, version(), setMode(), sql(), stack() (+1 more)

### Community 32 - "scm_cookieconsent - end-to-end tests (Playwright)"
Cohesion: 0.33
Nodes (5): Notes, Prerequisites, Running, scm_cookieconsent - end-to-end tests (Playwright), What each spec covers

### Community 33 - "ADDED Requirements"
Cohesion: 0.07
Nodes (29): ADDED Requirements, Purpose, Requirement: Ads-only direct tag alongside a container, Requirement: Container precedence, Requirement: Ecommerce event routing by mode, Requirement: Google tags load only when Consent Mode is enabled, Requirement: Pre-resolution event queue, Requirement: Routing fallback without the bootstrap (+21 more)

### Community 34 - "Requirements"
Cohesion: 0.07
Nodes (27): google-ads-conversion-tracking Specification, Purpose, Requirement: Consent handling for conversions, Requirement: Conversion settings, Requirement: Conversion status in the admin panel, Requirement: Per-order de-duplication, Requirement: Purchase conversion event, Requirement: Save-time conversion warnings (+19 more)

### Community 35 - "ADDED Requirements"
Cohesion: 0.07
Nodes (26): ADDED Requirements, Purpose, Requirement: Consent handling for conversions, Requirement: Conversion settings, Requirement: Conversion status in the admin panel, Requirement: Per-order de-duplication, Requirement: Purchase conversion event, Requirement: Save-time conversion warnings (+18 more)

### Community 36 - ".buildEcommercePageData"
Cohesion: 0.16
Nodes (7): D1 — `SCM_GCM.event(name, params)` for non-ecommerce events, D2 — Item builders: `buildGa4Item()` in PHP, `mapItem()` in JS, same output, D3 — Lists: server payload on load, `updateProductList` on AJAX, delegated click for `select_item`, D4 — `view_item` on combination change, D5 — Checkout: server-detected shipping, client-detected payment, D8 — Version and upgrade, Decisions

### Community 37 - "ADDED Requirements"
Cohesion: 0.12
Nodes (15): ADDED Requirements, Purpose, Requirement: No personal data in user events, Requirement: Pending events survive redirects, Requirement: Search event, Requirement: Search term is safely encoded, Requirement: Sign-up event, Scenario: Empty query (+7 more)

### Community 38 - "Tasks"
Cohesion: 0.18
Nodes (8): D7 — Search event and safe JSON, 1. Harness and bootstrap entry point for non-ecommerce events, 2. Shared item shape and safe payload encoding, 3. Product lists and product detail, 4. Checkout funnel and purchase, 6. Version, upgrade and integration checks, Tasks, Workflow follow-up

### Community 39 - "Decisions"
Cohesion: 0.15
Nodes (12): D1 — Mode-aware dispatch lives in the head bootstrap, resolved at `DOMContentLoaded`, with a queue, D2 — Ads conversions are sent as the native `conversion` event with `send_to`, not via GA4 import, D3 — With a GTM container the module stays hands-off by default; `ADS_FORCE_DIRECT` opts in, D4 — The purchase template stays the de-dup owner and becomes a thin caller, D6 — Versioning and upgrade, D7 — Verification without a test suite, Decisions, Design (+4 more)

### Community 40 - "Requirements"
Cohesion: 0.15
Nodes (12): ga4-user-events Specification, Purpose, Requirement: No personal data in user events, Requirement: Pending events survive redirects, Requirement: Search event, Requirement: Search term is safely encoded, Requirements, Scenario: Empty query (+4 more)

### Community 41 - ".renderBannerAndEcommerce"
Cohesion: 0.15
Nodes (6): Context, Design, Goals / Non-Goals, Migration Plan, Risks / Trade-offs, D7. Banner: equal buttons and a footer link

### Community 42 - "Requirement: Tag mode resolution"
Cohesion: 0.18
Nodes (10): MODIFIED Requirements, Requirement: Pre-resolution event queue, Requirement: Tag mode resolution, Scenario: Container present, no direct Ads tag, Scenario: Container present with direct Ads tag, Scenario: Inline purchase before DOMContentLoaded, Scenario: Inline purchase without a grant, Scenario: No Google tag (+2 more)

### Community 43 - ".install"
Cohesion: 0.27
Nodes (3): D6 — Account events via the Context cookie, 5. Account and search events, Stack control

### Community 44 - "Proposal"
Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal, What Changes, Why

### Community 45 - "Proposal"
Cohesion: 0.29
Nodes (6): Capabilities, Modified Capabilities, New Capabilities, Proposal, What Changes, Why

### Community 46 - "Proposal"
Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal, What Changes, Why

### Community 47 - "Design"
Cohesion: 0.29
Nodes (6): Design, Goals / Non-Goals, Migration Plan, Open Questions, Reconciliation with the in-flight changes, Risks / Trade-offs

### Community 48 - "Requirement: Consent handling for conversions"
Cohesion: 0.33
Nodes (5): MODIFIED Requirements, Requirement: Consent handling for conversions, Scenario: Consent Mode disabled, Scenario: Marketing consent denied, Scenario: Marketing consent granted

### Community 50 - "Requirement: Sign-up event"
Cohesion: 0.67
Nodes (3): Requirement: Sign-up event, Scenario: Guest checkout, Scenario: Registration form

## Knowledge Gaps
- **17 isolated node(s):** `terser`, `SecCodeSmith Commercial License v1.1 header comment`, `Task implementation loop`, `Archive move to dated directory`, `Artifact and task completion checks` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 394 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `currency()` connect `scm_ecommerce.js` to `Requirements`, `ADDED Requirements`, `ADDED Requirements`, `Proposal`, `Requirements`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `login()` (e.g. with `Context` and `New Capabilities`) actually correct?**
  _`login()` has 31 INFERRED edges - model-reasoned connections that need verification._
- **What connects `terser`, `SecCodeSmith Commercial License v1.1 header comment`, `Task implementation loop` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `06-consent-basic.spec.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08923076923076922 - nodes in this community are weakly interconnected._
- **Why does `config()` connect `gcm_bootstrap.src.js` to `ADDED Requirements`, `scm_ecommerce.js`, `Decisions`, `.getAllConfig`, `Requirements`, `sql`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `currency()` (e.g. with `What Changes` and `Requirement: Purchase conversion event`) actually correct?**
  _`currency()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `scm_cookieconsent.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10175763182238667 - nodes in this community are weakly interconnected._