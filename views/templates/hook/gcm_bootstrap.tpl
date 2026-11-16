{**
 * scm_cookieconsent — head bootstrap (minified payload)
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 *
 * READABLE SOURCE: views/js/src/gcm_bootstrap.src.js — edit THERE, then
 * re-minify (npx terser src.js -c -m) and paste the output below.
 *
 * Injected into <head> via hookDisplayHeader. Consent Mode "basic": nothing optional is
 * requested before a grant. Order is critical:
 *   1. gtag() shim + Consent Mode v2 default  (before any Google tag; a dataLayer command,
 *      not a request)
 *   2. A grant (stored choice at DOMContentLoaded, or SCM_GCM.update() after a click) loads
 *      what the granted category allows, in this order: the script is requested, the consent
 *      `update` is pushed, then the tag's start commands (gtm.start / js + config), then
 *      `scm_consent_update`, then the events queued on the page:
 *        - GTM container   on any of analytics_storage / ad_storage / ad_user_data /
 *                          ad_personalization (runtime dedup: skipped when another module
 *                          already loaded a container)
 *        - gtag.js direct  fallback only (no GTM at all): analytics -> GA4 config,
 *                          advertising -> Ads config (+ conversion)
 *        - Ads-only gtag   opt-in adsForceDirect, after the advertising grant only
 *        - Meta Pixel      loaded ONLY after marketing consent
 *   3. Without a grant nothing is requested and events wait in page memory (never pushed to
 *      the dataLayer); a reject or leaving the page discards them.
 *
 * Also exposes window.SCM_GCM.track(name, params[, guardKey]), .purchase(payload[, guardKey])
 * and .event(name, params[, guardKey]) (non-ecommerce GA4 events: flat dataLayer keys in GTM
 * mode). The optional guard key is a sessionStorage once-guard recorded at DELIVERY.
 * SCM_GCM.ready is true once a grant has started its tag; SCM_GCM.mode (gtm / gtag / none)
 * is resolved by that grant.
 *}
<script data-scm-gcm="bootstrap">
window.SCM_GCM_DATA = {ldelim}
    config:     {$scm_gcm_config nofilter},
    categories: {$scm_gcm_categories nofilter},
    tags:       {$scm_tags_config nofilter}
{rdelim};
{literal}
/**
 * scm_cookieconsent — Consent Mode v2 head bootstrap (readable source)
 * Minified output is pasted into views/templates/hook/gcm_bootstrap.tpl.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 */
!function(){"use strict";var e=window.SCM_GCM_DATA.config,n=window.SCM_GCM_DATA.categories,t=window.SCM_GCM_DATA.tags;function a(){window.dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],"function"!=typeof window.gtag&&(window.gtag=a);var o=null,r=document.cookie.match(/(?:^|;)\s*scm_consent=([^;]*)/);if(r)try{o=JSON.parse(decodeURIComponent(r[1]))}catch(e){}if(!o)try{o=JSON.parse(window.localStorage.getItem("scm_consent"))}catch(e){}function d(t){var a={};return e.signals.forEach(function(e){a[e]="denied"}),n.forEach(function(e){e.signals.length&&((e.required||!(!t||!t[e.id]))&&e.signals.forEach(function(e){a[e]="granted"}))}),e.securityGranted&&(a.security_storage="granted"),a}var s=d(o);if(window.SCM_GCM={config:e,categories:n,tags:t,stored:o,mode:{ecommerce:"none",ads:"none"},ready:!1},e.enabled){var c={};if(e.signals.forEach(function(e){c[e]=s[e]}),e.waitMs&&e.waitMs>0&&(c.wait_for_update=e.waitMs),e.region&&e.region.length){a("consent","default",Object.assign({},c,{region:e.region}));var i={};e.signals.forEach(function(e){i[e]="granted"}),a("consent","default",i)}else a("consent","default",c);e.adsRedaction&&a("set","ads_data_redaction",!0),e.urlPassthrough&&a("set","url_passthrough",!0),o&&a("consent","update",s)}var g=!1;function u(e){var n,a,o,r,d,s;t.metaPixelId&&("granted"===e.ad_storage?g&&window.fbq?window.fbq("consent","grant"):!g&&t.metaPixelId&&(g=!0,n=window,a=document,o="script",n.fbq||(r=n.fbq=function(){r.callMethod?r.callMethod.apply(r,arguments):r.queue.push(arguments)},n._fbq||(n._fbq=r),r.push=r,r.loaded=!0,r.version="2.0",r.queue=[],(d=a.createElement(o)).async=!0,d.src="https://connect.facebook.net/en_US/fbevents.js",(s=a.getElementsByTagName(o)[0]).parentNode.insertBefore(d,s)),window.fbq("consent","grant"),window.fbq("init",t.metaPixelId),window.fbq("track","PageView")):g&&window.fbq&&window.fbq("consent","revoke"))}var w=["analytics_storage","ad_storage","ad_user_data","ad_personalization"],f=[],m={},l={gtm:!1,gtagjs:!1,ga4:!1,ads:!1};function _(e,n){return"granted"===e[n]}function p(e){for(var n=0;n<w.length;n++)if(_(e,w[n]))return!0;return!1}function h(e,n){"gtag"===window.SCM_GCM.mode.ecommerce?a("event",e,n):(window.dataLayer.push({ecommerce:null}),window.dataLayer.push({event:e,ecommerce:n}))}function v(e){var n;(function(e){if(!e)return!0;try{if(window.sessionStorage)return!window.sessionStorage.getItem(e)&&(window.sessionStorage.setItem(e,"1"),!0)}catch(e){}return!m[e]&&(m[e]=!0,!0)})(e[3])&&("purchase"===e[0]?(h("purchase",n=e[1]),"gtag"===window.SCM_GCM.mode.ads&&t.adsId&&t.adsConversionLabel&&a("event","conversion",{send_to:t.adsId+"/"+t.adsConversionLabel,value:n.value,currency:n.currency,transaction_id:n.transaction_id})):"event"===e[0]?function(e,n){if("gtag"!==window.SCM_GCM.mode.ecommerce){var t={event:e};for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(t[o]=n[o]);window.dataLayer.push(t)}else a("event",e,n)}(e[1],e[2]):h(e[1],e[2]))}function C(e){window.SCM_GCM.ready?v(e):(f.push(e),f.length>100&&f.shift())}function M(){window.SCM_GCM.ready=!0;var e=f;f=[],e.forEach(v)}function y(e){var n=document.createElement("script");n.async=!0,n.src=e;var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(n,t)}function S(n,o){var r=[],d=window.SCM_GCM.mode;if(e.enabled&&p(n)){var s=_(n,"analytics_storage"),c=_(n,"ad_storage"),i=l.gtm||!!window.google_tag_manager||!!document.querySelector('script[src*="googletagmanager.com/gtm.js?"]');t.gtmId&&!i&&(l.gtm=!0,i=!0,y("https://www.googletagmanager.com/gtm.js?id="+encodeURIComponent(t.gtmId)),r.push(function(){window.dataLayer.push({"gtm.start":(new Date).getTime(),event:"gtm.js"})}));var g=function(e){l.gtagjs||(l.gtagjs=!0,y("https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(e)),r.push(function(){a("js",new Date)})),r.push(function(){a("config",e)})};i?(d.ecommerce="gtm",d.ads="container"):!t.ga4Id&&!t.adsId||t.gtmId||!l.gtagjs&&document.querySelector('script[src*="googletagmanager.com/gtag/js?"]')||(s&&t.ga4Id&&!l.ga4&&(l.ga4=!0,g(t.ga4Id)),c&&t.adsId&&!l.ads&&(l.ads=!0,g(t.adsId)),(l.ga4||l.ads)&&(d.ecommerce="gtag"),l.ads&&(d.ads="gtag")),c&&!l.ads&&t.adsForceDirect&&t.adsId&&(l.ads=!0,g(t.adsId),d.ads="gtag")}o&&o(),r.forEach(function(e){e()})}function I(){p(s)&&(S(s),M())}window.SCM_GCM.event=function(e,n,t){C(["event",e,n||{},t])},window.SCM_GCM.track=function(e,n,t){C(["track",e,n,t])},window.SCM_GCM.purchase=function(e,n){C(["purchase",e,null,n])},window.SCM_GCM.update=function(n){var t=d(n),o=p(t),r=function(){e.enabled&&a("consent","update",t)};o?S(t,r):r(),u(t),window.dataLayer.push({event:"scm_consent_update",scm_consent:t}),o?M():(window.SCM_GCM.ready=!1,f=[])},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",I):I(),u(s)}();
{/literal}
</script>
