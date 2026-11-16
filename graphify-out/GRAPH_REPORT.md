# Graph Report - scm_cookieconsent-  (2026-11-16)

## Corpus Check
- 48 files · ~73,351 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 5, .tpl 5, .css 2)

## Summary
- 548 nodes · 968 edges · 21 communities (17 shown, 4 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 140 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `faba7e17`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Scm_Cookieconsent
- helpers.js
- scm_cookieconsent.js
- openspec-apply-change skill
- scm_cookieconsent.min.js
- scm_ecommerce.js
- gcm_bootstrap.src.js head bootstrap (SCM_GCM)
- ADDED Requirements
- Polish cookie consent modal screenshot (banner-modal-pl.png)
- Project logo (glowing hammer over Matrix-style binary rain)
- cookie-bite.svg
- gcm_bootstrap.src.js
- login
- ADDED Requirements
- ADDED Requirements
- package.json
- Proposal
- stack.sh

## God Nodes (most connected - your core abstractions)
1. `Scm_Cookieconsent` - 58 edges
2. `login()` - 21 edges
3. `Proposal: Google Ads conversion tracking` - 19 edges
4. `Tasks: implementation checklist` - 19 edges
5. `ADDED Requirements` - 15 edges
6. `sql()` - 14 edges
7. `mapItem()` - 14 edges
8. `ADDED Requirements` - 14 edges
9. `Design: Ads conversion and mode-aware routing (D1-D7)` - 14 edges
10. `pushEvent()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Reconciliation with the in-flight changes` --references--> `login()`  [INFERRED]
  openspec/changes/consent-mode-basic/design.md → tests/e2e/specs/04-account.spec.js
- `Impact` --references--> `go()`  [INFERRED]
  openspec/changes/consent-mode-basic/proposal.md → tests/e2e/specs/helpers.js
- `1. Request log and failing tests first` --references--> `go()`  [INFERRED]
  openspec/changes/consent-mode-basic/tasks.md → tests/e2e/specs/helpers.js
- `D8. Retention` --references--> `readConsentStore()`  [INFERRED]
  openspec/changes/consent-mode-basic/design.md → views/js/scm_cookieconsent.js
- `2. Loading, queue and update order (bootstrap)` --references--> `config()`  [INFERRED]
  openspec/changes/consent-mode-basic/tasks.md → tests/e2e/specs/01-upgrade.spec.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ads purchase conversion flow** — openspec_changes_add_google_ads_conversion_tracking_design_purchase_template, openspec_changes_add_google_ads_conversion_tracking_design_gcm_bootstrap, openspec_changes_add_google_ads_conversion_tracking_specs_google_ads_conversion_tracking_spec_purchase_conversion, openspec_changes_add_google_ads_conversion_tracking_specs_google_ads_conversion_tracking_spec_per_order_dedup [EXTRACTED 0.95]
- **Banner rendering on three fallback hooks** — readme_theme_independence, readme_renderbannerandecommerce, readme_banner_reparenting [EXTRACTED 0.95]
- **Cookie consent categories in modal** — docs_banner_modal_pl_necessary_cookies, docs_banner_modal_pl_analytics_cookies, docs_banner_modal_pl_marketing_cookies [EXTRACTED 1.00]
- **Mode-aware Google tag event routing flow** — openspec_changes_add_google_ads_conversion_tracking_design_gcm_bootstrap, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_tag_mode_resolution, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_event_routing, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_pending_queue [EXTRACTED 1.00]
- **Shared store selection and project check preamble** — _claude_skills_openspec_apply_change_skill_store_selection, _claude_skills_openspec_apply_change_skill_project_check, _claude_skills_openspec_apply_change_skill_openspec_cli [INFERRED 0.85]
- **OpenSpec change lifecycle workflow** — _claude_skills_openspec_explore_skill, _claude_skills_openspec_propose_skill, _claude_skills_openspec_update_change_skill, _claude_skills_openspec_apply_change_skill, _claude_skills_openspec_sync_specs_skill, _claude_skills_openspec_archive_change_skill [INFERRED 0.95]

## Communities (21 total, 4 thin omitted)

### Community 0 - "Scm_Cookieconsent"
Cohesion: 0.05
Nodes (22): CLAUDE.md (graphify rules), graphify knowledge graph workflow, Design: Ads conversion and mode-aware routing (D1-D7), add-google-ads-conversion-tracking change metadata, Proposal: Google Ads conversion tracking, Tasks: implementation checklist, D4 — `view_item` on combination change, D6 — Account events via the Context cookie (+14 more)

### Community 1 - "helpers.js"
Cohesion: 0.07
Nodes (41): 7. Automated staging: Docker e2e suite, Helpers (`specs/helpers.js`), Notes, hooks(), NEW_HOOKS, { test, expect, stack, sql }, version(), { test, expect, setMode, go } (+33 more)

### Community 2 - "scm_cookieconsent.js"
Cohesion: 0.15
Nodes (22): applyToggleState(), deleteCookie(), dismissBanner(), finalizeConsent(), getStatus(), getToggleState(), hideBanner(), isStoreComplete() (+14 more)

### Community 3 - "openspec-apply-change skill"
Cohesion: 0.16
Nodes (20): openspec-apply-change skill, openspec CLI, Project check (root null handling), Store selection (--store flag), Task implementation loop, openspec-archive-change skill, Archive move to dated directory, Artifact and task completion checks (+12 more)

### Community 4 - "scm_cookieconsent.min.js"
Cohesion: 0.12
Nodes (20): minify(), norm(), boot(), makeStorage(), a(), b(), c(), d() (+12 more)

### Community 5 - "scm_ecommerce.js"
Cohesion: 0.13
Nodes (39): D1 — `SCM_GCM.event(name, params)` for non-ecommerce events, D2 — Item builders: `buildGa4Item()` in PHP, `mapItem()` in JS, same output, D3 — Lists: server payload on load, `updateProductList` on AJAX, delegated click for `select_item`, D7 — Search event and safe JSON, D8 — Version and upgrade, Decisions, Context, cartId() (+31 more)

### Community 6 - "gcm_bootstrap.src.js head bootstrap (SCM_GCM)"
Cohesion: 0.06
Nodes (31): Build GitHub Actions workflow, Package module job (build.ps1), php-lint job (PHP 7.4 and 8.3), New config keys ADS_CONVERSION_LABEL / ADS_FORCE_DIRECT (D5), gcm_bootstrap.src.js head bootstrap (SCM_GCM), Node bootstrap test harness (D7), ecommerce_purchase.tpl de-dup owner (D4), scm_ecommerce.js ecommerce event pushes (+23 more)

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
Cohesion: 0.07
Nodes (40): D5 — Checkout: server-detected shipping, client-detected payment, D1. Tag loading moves from "every page" to "on a grant", in one function, D2. Order after a grant: tag, update, then events, D3. The queue stays in memory; the dataLayer sees nothing before a grant, D4. Once-guards at delivery, D5. Ads conversion needs `ad_storage`, D6. GTM mode: what the module can and cannot promise, D7. Banner: equal buttons and a footer link (+32 more)

### Community 13 - "login"
Cohesion: 0.06
Nodes (39): Context, Design, Goals / Non-Goals, Migration Plan, Risks / Trade-offs, Capabilities, Impact, Modified Capabilities (+31 more)

### Community 15 - "ADDED Requirements"
Cohesion: 0.05
Nodes (40): ADDED Requirements, Purpose, Requirement: A grant loads the tag, then updates consent, then delivers queued events, Requirement: Ads conversion only after advertising consent, Requirement: Checkout events are sent once per order, Requirement: Consent Mode default does not trigger a request, Requirement: Each category loads only the tag it allows in direct mode, Requirement: GTM container mode (+32 more)

### Community 16 - "ADDED Requirements"
Cohesion: 0.11
Nodes (17): ADDED Requirements, Purpose, Requirement: Optional categories start switched off, Requirement: Rejecting is as easy as accepting, Requirement: The banner does not hide the purchase button after the first choice, Requirement: The choice can be changed from the footer, Requirement: The choice is kept at most 365 days, Scenario: Banner on a desktop (+9 more)

### Community 17 - "package.json"
Cohesion: 0.15
Nodes (11): @playwright/test, terser, description, devDependencies, @playwright/test, terser, name, private (+3 more)

### Community 18 - "Proposal"
Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal, What Changes, Why

### Community 19 - "stack.sh"
Cohesion: 0.54
Nodes (7): cache_clear(), console(), stack.sh script, shop_exec(), sql(), sync_module(), wait_shop()

## Knowledge Gaps
- **17 isolated node(s):** `terser`, `SecCodeSmith Commercial License v1.1 header comment`, `Task implementation loop`, `Archive move to dated directory`, `Artifact and task completion checks` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 180 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `login()` connect `login` to `Scm_Cookieconsent`, `helpers.js`, `gcm_bootstrap.src.js`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `login()` (e.g. with `Context` and `New Capabilities`) actually correct?**
  _`login()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **What connects `terser`, `SecCodeSmith Commercial License v1.1 header comment`, `Task implementation loop` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scm_Cookieconsent` be split into smaller, more focused modules?**
  _Cohesion score 0.050686641697877656 - nodes in this community are weakly interconnected._
- **Why does `Context` connect `login` to `Scm_Cookieconsent`, `scm_ecommerce.js`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Proposal: Google Ads conversion tracking` (e.g. with `add-google-ads-conversion-tracking change metadata` and `OpenSpec config (spec-driven schema)`) actually correct?**
  _`Proposal: Google Ads conversion tracking` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `helpers.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06779661016949153 - nodes in this community are weakly interconnected._