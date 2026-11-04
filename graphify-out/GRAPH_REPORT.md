# Graph Report - scm_cookieconsent  (2026-11-04)

## Corpus Check
- 29 files · ~54,627 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .tpl 5, (none) 4, .css 2)

## Summary
- 340 nodes · 624 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b7ce1d87`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Scm_Cookieconsent
- .buildEcommercePageData
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
- ADDED Requirements

## God Nodes (most connected - your core abstractions)
1. `Scm_Cookieconsent` - 58 edges
2. `Tasks: implementation checklist` - 20 edges
3. `Proposal: Google Ads conversion tracking` - 19 edges
4. `ADDED Requirements` - 15 edges
5. `Design: Ads conversion and mode-aware routing (D1-D7)` - 15 edges
6. `mapItem()` - 14 edges
7. `gcm_bootstrap.src.js head bootstrap (SCM_GCM)` - 11 edges
8. `pushEvent()` - 10 edges
9. `dismissBanner()` - 9 edges
10. `w()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `D1 — `SCM_GCM.event(name, params)` for non-ecommerce events` --references--> `pushUserEvent()`  [INFERRED]
  openspec/changes/complete-ga4-ecommerce-measurement/design.md → views/js/scm_ecommerce.js
- `Requirement: Event value and currency` --references--> `currency()`  [INFERRED]
  openspec/changes/complete-ga4-ecommerce-measurement/specs/ga4-ecommerce-events/spec.md → views/js/scm_ecommerce.js
- `Requirement: Payment information event` --references--> `currency()`  [INFERRED]
  openspec/changes/complete-ga4-ecommerce-measurement/specs/ga4-ecommerce-events/spec.md → views/js/scm_ecommerce.js
- `Requirement: Purchase payload completeness` --references--> `currency()`  [INFERRED]
  openspec/changes/complete-ga4-ecommerce-measurement/specs/ga4-ecommerce-events/spec.md → views/js/scm_ecommerce.js
- `Requirement: Shipping information event` --references--> `currency()`  [INFERRED]
  openspec/changes/complete-ga4-ecommerce-measurement/specs/ga4-ecommerce-events/spec.md → views/js/scm_ecommerce.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ads purchase conversion flow** — openspec_changes_add_google_ads_conversion_tracking_design_purchase_template, openspec_changes_add_google_ads_conversion_tracking_design_gcm_bootstrap, openspec_changes_add_google_ads_conversion_tracking_specs_google_ads_conversion_tracking_spec_purchase_conversion, openspec_changes_add_google_ads_conversion_tracking_specs_google_ads_conversion_tracking_spec_per_order_dedup [EXTRACTED 0.95]
- **Banner rendering on three fallback hooks** — readme_theme_independence, readme_renderbannerandecommerce, readme_banner_reparenting [EXTRACTED 0.95]
- **Cookie consent categories in modal** — docs_banner_modal_pl_necessary_cookies, docs_banner_modal_pl_analytics_cookies, docs_banner_modal_pl_marketing_cookies [EXTRACTED 1.00]
- **Mode-aware Google tag event routing flow** — openspec_changes_add_google_ads_conversion_tracking_design_gcm_bootstrap, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_tag_mode_resolution, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_event_routing, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_pending_queue [EXTRACTED 1.00]
- **Shared store selection and project check preamble** — _claude_skills_openspec_apply_change_skill_store_selection, _claude_skills_openspec_apply_change_skill_project_check, _claude_skills_openspec_apply_change_skill_openspec_cli [INFERRED 0.85]
- **OpenSpec change lifecycle workflow** — _claude_skills_openspec_explore_skill, _claude_skills_openspec_propose_skill, _claude_skills_openspec_update_change_skill, _claude_skills_openspec_apply_change_skill, _claude_skills_openspec_sync_specs_skill, _claude_skills_openspec_archive_change_skill [INFERRED 0.95]

## Communities (15 total, 3 thin omitted)

### Community 0 - "Scm_Cookieconsent"
Cohesion: 0.07
Nodes (12): CLAUDE.md (graphify rules), graphify knowledge graph workflow, Design: Ads conversion and mode-aware routing (D1-D7), upgrade-1.7.0.php seeding (D6), add-google-ads-conversion-tracking change metadata, Proposal: Google Ads conversion tracking, Tasks: implementation checklist, D6 — Account events via the Context cookie (+4 more)

### Community 1 - ".buildEcommercePageData"
Cohesion: 0.06
Nodes (27): Context, D1 — `SCM_GCM.event(name, params)` for non-ecommerce events, D2 — Item builders: `buildGa4Item()` in PHP, `mapItem()` in JS, same output, D3 — Lists: server payload on load, `updateProductList` on AJAX, delegated click for `select_item`, D4 — `view_item` on combination change, D5 — Checkout: server-detected shipping, client-detected payment, D7 — Search event and safe JSON, D8 — Version and upgrade (+19 more)

### Community 2 - "scm_cookieconsent.js"
Cohesion: 0.15
Nodes (22): applyToggleState(), deleteCookie(), dismissBanner(), finalizeConsent(), getStatus(), getToggleState(), hideBanner(), isStoreComplete() (+14 more)

### Community 3 - "openspec-apply-change skill"
Cohesion: 0.16
Nodes (20): openspec-apply-change skill, openspec CLI, Project check (root null handling), Store selection (--store flag), Task implementation loop, openspec-archive-change skill, Archive move to dated directory, Artifact and task completion checks (+12 more)

### Community 4 - "scm_cookieconsent.min.js"
Cohesion: 0.25
Nodes (16): a(), b(), c(), d(), f(), g(), h(), l() (+8 more)

### Community 5 - "scm_ecommerce.js"
Cohesion: 0.20
Nodes (28): cartItems(), cartPayload(), currency(), dl(), emitList(), firePageEvents(), hasOwn(), initList() (+20 more)

### Community 6 - "gcm_bootstrap.src.js head bootstrap (SCM_GCM)"
Cohesion: 0.06
Nodes (30): Build GitHub Actions workflow, Package module job (build.ps1), php-lint job (PHP 7.4 and 8.3), New config keys ADS_CONVERSION_LABEL / ADS_FORCE_DIRECT (D5), gcm_bootstrap.src.js head bootstrap (SCM_GCM), Node bootstrap test harness (D7), ecommerce_purchase.tpl de-dup owner (D4), scm_ecommerce.js ecommerce event pushes (+22 more)

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
Cohesion: 0.40
Nodes (9): applyMetaConsent(), dispatchFlat(), dispatchPurchase(), dispatchTrack(), finish(), gtag(), injectGoogleTags(), loadGtagJs() (+1 more)

### Community 13 - "ADDED Requirements"
Cohesion: 0.09
Nodes (22): ADDED Requirements, Purpose, Requirement: Delivery path for user events, Requirement: Login event, Requirement: No personal data in user events, Requirement: Pending events survive redirects, Requirement: Search event, Requirement: Search term is safely encoded (+14 more)

## Knowledge Gaps
- **16 isolated node(s):** `SecCodeSmith Commercial License v1.1 header comment`, `Task implementation loop`, `Archive move to dated directory`, `Artifact and task completion checks`, `Capture insights into change artifacts` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 95 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `currency()` connect `scm_ecommerce.js` to `ADDED Requirements`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Proposal: Google Ads conversion tracking` (e.g. with `add-google-ads-conversion-tracking change metadata` and `OpenSpec config (spec-driven schema)`) actually correct?**
  _`Proposal: Google Ads conversion tracking` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SecCodeSmith Commercial License v1.1 header comment`, `Task implementation loop`, `Archive move to dated directory` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scm_Cookieconsent` be split into smaller, more focused modules?**
  _Cohesion score 0.07093253968253968 - nodes in this community are weakly interconnected._
- **Why does `README.md (scm_cookieconsent)` connect `Scm_Cookieconsent` to `scm_cookieconsent.js`, `gcm_bootstrap.src.js`, `scm_ecommerce.js`, `gcm_bootstrap.src.js head bootstrap (SCM_GCM)`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Should `.buildEcommercePageData` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Why does `Scm_Cookieconsent` connect `Scm_Cookieconsent` to `.buildEcommercePageData`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._