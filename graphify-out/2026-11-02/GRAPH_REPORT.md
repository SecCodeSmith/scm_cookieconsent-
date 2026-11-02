# Graph Report - scm_cookieconsent  (2026-11-01)

## Corpus Check
- Corpus is ~43,800 words - fits in a single context window. You may not need a graph.

## Summary
- 201 nodes · 391 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 380,352 input · 0 output

## Community Hubs (Navigation)
- PrestaShop Module Core (PHP)
- Ads Conversion Change & Tag Bootstrap
- Banner UI & Consent Storage (JS)
- OpenSpec Workflow Skills
- Minified Banner Build
- GA4 Ecommerce DataLayer
- Docs: Consent Mode, Config & CI
- Tag Routing & Conversion Design
- Banner Screenshot (PL Modal)
- Project Logo
- Cookie Icon Asset

## God Nodes (most connected - your core abstractions)
1. `Scm_Cookieconsent` - 43 edges
2. `Tasks: implementation checklist` - 20 edges
3. `Proposal: Google Ads conversion tracking` - 19 edges
4. `Design: Ads conversion and mode-aware routing (D1-D7)` - 15 edges
5. `gcm_bootstrap.src.js head bootstrap (SCM_GCM)` - 11 edges
6. `dismissBanner()` - 9 edges
7. `w()` - 9 edges
8. `openspec-apply-change skill` - 9 edges
9. `openspec-archive-change skill` - 9 edges
10. `onUpdateCart()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Design: Ads conversion and mode-aware routing (D1-D7)` --references--> `pushEvent()`  [EXTRACTED]
  openspec/changes/add-google-ads-conversion-tracking/design.md → views/js/scm_ecommerce.js
- `Tasks: implementation checklist` --references--> `pushEvent()`  [EXTRACTED]
  openspec/changes/add-google-ads-conversion-tracking/tasks.md → views/js/scm_ecommerce.js
- `Container precedence and runtime de-duplication` --semantically_similar_to--> `Coexistence with external marketing modules (GTM/TagConcierge)`  [INFERRED] [semantically similar]
  openspec/changes/add-google-ads-conversion-tracking/specs/google-tag-integration/spec.md → README.md
- `Container precedence and runtime de-duplication` --semantically_similar_to--> `GTM preferred over direct gtag.js`  [INFERRED] [semantically similar]
  openspec/changes/add-google-ads-conversion-tracking/specs/google-tag-integration/spec.md → README.md
- `Design: Ads conversion and mode-aware routing (D1-D7)` --references--> `injectGoogleTags()`  [EXTRACTED]
  openspec/changes/add-google-ads-conversion-tracking/design.md → views/js/src/gcm_bootstrap.src.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Mode-aware Google tag event routing flow** — openspec_changes_add_google_ads_conversion_tracking_design_gcm_bootstrap, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_tag_mode_resolution, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_event_routing, openspec_changes_add_google_ads_conversion_tracking_specs_google_tag_integration_spec_pending_queue [EXTRACTED 1.00]
- **Ads purchase conversion flow** — openspec_changes_add_google_ads_conversion_tracking_design_purchase_template, openspec_changes_add_google_ads_conversion_tracking_design_gcm_bootstrap, openspec_changes_add_google_ads_conversion_tracking_specs_google_ads_conversion_tracking_spec_purchase_conversion, openspec_changes_add_google_ads_conversion_tracking_specs_google_ads_conversion_tracking_spec_per_order_dedup [EXTRACTED 0.95]
- **Banner rendering on three fallback hooks** — readme_theme_independence, readme_renderbannerandecommerce, readme_banner_reparenting [EXTRACTED 0.95]
- **OpenSpec change lifecycle workflow** — _claude_skills_openspec_explore_skill, _claude_skills_openspec_propose_skill, _claude_skills_openspec_update_change_skill, _claude_skills_openspec_apply_change_skill, _claude_skills_openspec_sync_specs_skill, _claude_skills_openspec_archive_change_skill [INFERRED 0.95]
- **Shared store selection and project check preamble** — _claude_skills_openspec_apply_change_skill_store_selection, _claude_skills_openspec_apply_change_skill_project_check, _claude_skills_openspec_apply_change_skill_openspec_cli [INFERRED 0.85]
- **Cookie consent categories in modal** — docs_banner_modal_pl_necessary_cookies, docs_banner_modal_pl_analytics_cookies, docs_banner_modal_pl_marketing_cookies [EXTRACTED 1.00]

## Communities (11 total, 2 thin omitted)

### Community 1 - "Ads Conversion Change & Tag Bootstrap"
Cohesion: 0.11
Nodes (16): CLAUDE.md (graphify rules), graphify knowledge graph workflow, Design: Ads conversion and mode-aware routing (D1-D7), upgrade-1.7.0.php seeding (D6), add-google-ads-conversion-tracking change metadata, Proposal: Google Ads conversion tracking, Spec: google-ads-conversion-tracking, Conversion settings, admin status and save-time warnings (+8 more)

### Community 2 - "Banner UI & Consent Storage (JS)"
Cohesion: 0.15
Nodes (22): applyToggleState(), deleteCookie(), dismissBanner(), finalizeConsent(), getStatus(), getToggleState(), hideBanner(), isStoreComplete() (+14 more)

### Community 3 - "OpenSpec Workflow Skills"
Cohesion: 0.16
Nodes (20): openspec-apply-change skill, openspec CLI, Project check (root null handling), Store selection (--store flag), Task implementation loop, openspec-archive-change skill, Archive move to dated directory, Artifact and task completion checks (+12 more)

### Community 4 - "Minified Banner Build"
Cohesion: 0.25
Nodes (16): a(), b(), c(), d(), f(), g(), h(), l() (+8 more)

### Community 5 - "GA4 Ecommerce DataLayer"
Cohesion: 0.24
Nodes (14): scm_ecommerce.js ecommerce event pushes, displayOrderConfirmation GA4 purchase hook, renderBannerAndEcommerce(), currency(), dl(), firePageEvents(), itemsValue(), keyOf() (+6 more)

### Community 6 - "Docs: Consent Mode, Config & CI"
Cohesion: 0.15
Nodes (13): Build GitHub Actions workflow, Package module job (build.ps1), php-lint job (PHP 7.4 and 8.3), New config keys ADS_CONVERSION_LABEL / ADS_FORCE_DIRECT (D5), Consent handling for conversions requirement, Container precedence and runtime de-duplication, SCM_COOKIE_* Configuration keys, Cookie categories (DB tables) (+5 more)

### Community 7 - "Tag Routing & Conversion Design"
Cohesion: 0.14
Nodes (11): gcm_bootstrap.src.js head bootstrap (SCM_GCM), Node bootstrap test harness (D7), ecommerce_purchase.tpl de-dup owner (D4), Per-order de-duplication requirement, Purchase conversion event requirement, Spec: google-tag-integration, Ecommerce event routing by mode, Pre-resolution event queue (+3 more)

### Community 8 - "Banner Screenshot (PL Modal)"
Cohesion: 0.38
Nodes (6): Polish cookie consent modal screenshot (banner-modal-pl.png), Consent action buttons (Reject optional, Save choice, Accept all), Analytics cookies toggle (Google Analytics 4 / Universal Analytics), Personalization and remarketing cookies toggle, Necessary cookies toggle (always active), Privacy policy link

### Community 9 - "Project Logo"
Cohesion: 1.00
Nodes (3): Project logo (glowing hammer over Matrix-style binary rain), Hammer motif (smith/forge branding), Green binary code rain (hacker/security aesthetic)

## Knowledge Gaps
- **16 isolated node(s):** `scm_consent_update dataLayer event`, `Cookie categories (DB tables)`, `terser minification build step`, `CLAUDE.md (graphify rules)`, `OpenSpec config (spec-driven schema)` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 36 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `README.md (scm_cookieconsent)` connect `Ads Conversion Change & Tag Bootstrap` to `PrestaShop Module Core (PHP)`, `Banner UI & Consent Storage (JS)`, `GA4 Ecommerce DataLayer`, `Docs: Consent Mode, Config & CI`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Proposal: Google Ads conversion tracking` (e.g. with `add-google-ads-conversion-tracking change metadata` and `OpenSpec config (spec-driven schema)`) actually correct?**
  _`Proposal: Google Ads conversion tracking` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `scm_consent_update dataLayer event`, `Cookie categories (DB tables)`, `terser minification build step` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PrestaShop Module Core (PHP)` be split into smaller, more focused modules?**
  _Cohesion score 0.10960960960960961 - nodes in this community are weakly interconnected._
- **Why does `Scm_Cookieconsent` connect `PrestaShop Module Core (PHP)` to `Ads Conversion Change & Tag Bootstrap`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `gcm_bootstrap.src.js head bootstrap (SCM_GCM)` (e.g. with `Google Consent Mode v2` and `Ecommerce event routing by mode`) actually correct?**
  _`gcm_bootstrap.src.js head bootstrap (SCM_GCM)` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Ads Conversion Change & Tag Bootstrap` be split into smaller, more focused modules?**
  _Cohesion score 0.11363636363636363 - nodes in this community are weakly interconnected._