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
 * Injected into <head> via hookDisplayHeader. Order is critical:
 *   1. gtag() shim + Consent Mode v2 default  (before any Google tag)
 *   2. GTM injection at DOMContentLoaded      (runtime dedup — skipped when
 *      another module already loaded a container)
 *   3. gtag.js direct                         (fallback only — no GTM at all)
 *   4. Ads-only gtag tag                      (opt-in adsForceDirect: loads
 *      gtag.js for the AW id + config, next to a container or external gtag.js)
 *   5. Meta Pixel loader                      (loaded ONLY after marketing consent)
 *
 * Also exposes window.SCM_GCM.track(name, params), .purchase(payload) and
 * .event(name, params) (non-ecommerce GA4 events — flat dataLayer keys in GTM mode):
 * calls made before DOMContentLoaded are queued, then dispatched in order once
 * the tag mode (gtm / gtag / none) is resolved (SCM_GCM.mode, SCM_GCM.ready).
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
!function(){"use strict";var e=window.SCM_GCM_DATA.config,n=window.SCM_GCM_DATA.categories,t=window.SCM_GCM_DATA.tags;function a(){window.dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],"function"!=typeof window.gtag&&(window.gtag=a);var o=null,d=document.cookie.match(/(?:^|;)\s*scm_consent=([^;]*)/);if(d)try{o=JSON.parse(decodeURIComponent(d[1]))}catch(e){}if(!o)try{o=JSON.parse(window.localStorage.getItem("scm_consent"))}catch(e){}function c(t){var a={};return e.signals.forEach(function(e){a[e]="denied"}),n.forEach(function(e){e.signals.length&&((e.required||!(!t||!t[e.id]))&&e.signals.forEach(function(e){a[e]="granted"}))}),e.securityGranted&&(a.security_storage="granted"),a}var r=c(o);if(window.SCM_GCM={config:e,categories:n,tags:t,stored:o,mode:{ecommerce:"none",ads:"none"},ready:!1},e.enabled){var s={};if(e.signals.forEach(function(e){s[e]=r[e]}),e.waitMs&&e.waitMs>0&&(s.wait_for_update=e.waitMs),e.region&&e.region.length){a("consent","default",Object.assign({},s,{region:e.region}));var i={};e.signals.forEach(function(e){i[e]="granted"}),a("consent","default",i)}else a("consent","default",s);e.adsRedaction&&a("set","ads_data_redaction",!0),e.urlPassthrough&&a("set","url_passthrough",!0),o&&a("consent","update",r)}var g=!1;function w(e){var n,a,o,d,c,r;t.metaPixelId&&("granted"===e.ad_storage?g&&window.fbq?window.fbq("consent","grant"):!g&&t.metaPixelId&&(g=!0,n=window,a=document,o="script",n.fbq||(d=n.fbq=function(){d.callMethod?d.callMethod.apply(d,arguments):d.queue.push(arguments)},n._fbq||(n._fbq=d),d.push=d,d.loaded=!0,d.version="2.0",d.queue=[],(c=a.createElement(o)).async=!0,c.src="https://connect.facebook.net/en_US/fbevents.js",(r=a.getElementsByTagName(o)[0]).parentNode.insertBefore(c,r)),window.fbq("consent","grant"),window.fbq("init",t.metaPixelId),window.fbq("track","PageView")):g&&window.fbq&&window.fbq("consent","revoke"))}window.SCM_GCM.update=function(n){var t=c(n);e.enabled&&a("consent","update",t),w(t),window.dataLayer.push({event:"scm_consent_update",scm_consent:t})};var u=[];function m(e,n){"gtag"===window.SCM_GCM.mode.ecommerce?a("event",e,n):(window.dataLayer.push({ecommerce:null}),window.dataLayer.push({event:e,ecommerce:n}))}function f(e){m("purchase",e),"gtag"===window.SCM_GCM.mode.ads&&t.adsId&&t.adsConversionLabel&&a("event","conversion",{send_to:t.adsId+"/"+t.adsConversionLabel,value:e.value,currency:e.currency,transaction_id:e.transaction_id})}function l(e,n){if("gtag"!==window.SCM_GCM.mode.ecommerce){var t={event:e};for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(t[o]=n[o]);window.dataLayer.push(t)}else a("event",e,n)}function p(e){window.SCM_GCM.mode=e,window.SCM_GCM.ready=!0;var n=u;u=[],n.forEach(function(e){"purchase"===e[0]?f(e[1]):"event"===e[0]?l(e[1],e[2]):m(e[1],e[2])})}function _(e){var n=document.createElement("script");n.async=!0,n.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(e);var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(n,t),a("js",new Date)}function C(){var n={ecommerce:"none",ads:"none"};if(e.enabled){var o=!!window.google_tag_manager||!!document.querySelector('script[src*="googletagmanager.com/gtm.js?"]'),d=!!document.querySelector('script[src*="googletagmanager.com/gtag/js?"]'),c=!1;t.gtmId&&!o&&(!function(e,n,t,a,o){e[a]=e[a]||[],e[a].push({"gtm.start":(new Date).getTime(),event:"gtm.js"});var d=n.getElementsByTagName(t)[0],c=n.createElement(t);c.async=!0,c.src="https://www.googletagmanager.com/gtm.js?id="+encodeURIComponent(o),d.parentNode.insertBefore(c,d)}(window,document,"script","dataLayer",t.gtmId),o=!0),o?(n.ecommerce="gtm",n.ads="container"):!t.ga4Id&&!t.adsId||t.gtmId||d||(_(t.ga4Id||t.adsId),t.ga4Id&&a("config",t.ga4Id),t.adsId&&a("config",t.adsId),c=!0,n.ecommerce="gtag",n.ads=t.adsId?"gtag":"none"),!c&&t.adsForceDirect&&t.adsId&&(_(t.adsId),a("config",t.adsId),n.ads="gtag"),p(n)}else p(n)}window.SCM_GCM.event=function(e,n){n=n||{},window.SCM_GCM.ready?l(e,n):u.push(["event",e,n])},window.SCM_GCM.track=function(e,n){window.SCM_GCM.ready?m(e,n):u.push(["track",e,n])},window.SCM_GCM.purchase=function(e){window.SCM_GCM.ready?f(e):u.push(["purchase",e])},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",C):C(),w(r)}();
{/literal}
</script>
