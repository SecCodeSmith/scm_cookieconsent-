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
 *   4. Meta Pixel loader                      (loaded ONLY after marketing consent)
 *}
<script data-scm-gcm="bootstrap">
window.SCM_GCM_DATA = {ldelim}
    config:     {$scm_gcm_config nofilter},
    categories: {$scm_gcm_categories nofilter},
    tags:       {$scm_tags_config nofilter}
{rdelim};
{literal}
!function(){"use strict";var e=window.SCM_GCM_DATA.config,t=window.SCM_GCM_DATA.categories,n=window.SCM_GCM_DATA.tags;function a(){window.dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],"function"!=typeof window.gtag&&(window.gtag=a);var o=null,d=document.cookie.match(/(?:^|;)\s*scm_consent=([^;]*)/);if(d)try{o=JSON.parse(decodeURIComponent(d[1]))}catch(e){}if(!o)try{o=JSON.parse(window.localStorage.getItem("scm_consent"))}catch(e){}function s(n){var a={};return e.signals.forEach(function(e){a[e]="denied"}),t.forEach(function(e){e.signals.length&&((e.required||!(!n||!n[e.id]))&&e.signals.forEach(function(e){a[e]="granted"}))}),e.securityGranted&&(a.security_storage="granted"),a}var c=s(o);if(window.SCM_GCM={config:e,categories:t,tags:n,stored:o},e.enabled){var r={};if(e.signals.forEach(function(e){r[e]=c[e]}),e.waitMs&&e.waitMs>0&&(r.wait_for_update=e.waitMs),e.region&&e.region.length){a("consent","default",Object.assign({},r,{region:e.region}));var i={};e.signals.forEach(function(e){i[e]="granted"}),a("consent","default",i)}else a("consent","default",r);e.adsRedaction&&a("set","ads_data_redaction",!0),e.urlPassthrough&&a("set","url_passthrough",!0),o&&a("consent","update",c)}var g=!1;function w(e){var t,a,o,d,s,c;n.metaPixelId&&("granted"===e.ad_storage?g&&window.fbq?window.fbq("consent","grant"):!g&&n.metaPixelId&&(g=!0,t=window,a=document,o="script",t.fbq||(d=t.fbq=function(){d.callMethod?d.callMethod.apply(d,arguments):d.queue.push(arguments)},t._fbq||(t._fbq=d),d.push=d,d.loaded=!0,d.version="2.0",d.queue=[],(s=a.createElement(o)).async=!0,s.src="https://connect.facebook.net/en_US/fbevents.js",(c=a.getElementsByTagName(o)[0]).parentNode.insertBefore(s,c)),window.fbq("consent","grant"),window.fbq("init",n.metaPixelId),window.fbq("track","PageView")):g&&window.fbq&&window.fbq("consent","revoke"))}function u(){if(e.enabled){var t=!!window.google_tag_manager||!!document.querySelector('script[src*="googletagmanager.com/gtm.js?"]');if(!n.gtmId||t){if((n.ga4Id||n.adsId)&&!n.gtmId&&!t&&!document.querySelector('script[src*="googletagmanager.com/gtag/js?"]')){var o=document.createElement("script");o.async=!0,o.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(n.ga4Id||n.adsId);var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(o,d),a("js",new Date),n.ga4Id&&a("config",n.ga4Id),n.adsId&&a("config",n.adsId)}}else!function(e,t,n,a,o){e[a]=e[a]||[],e[a].push({"gtm.start":(new Date).getTime(),event:"gtm.js"});var d=t.getElementsByTagName(n)[0],s=t.createElement(n);s.async=!0,s.src="https://www.googletagmanager.com/gtm.js?id="+encodeURIComponent(o),d.parentNode.insertBefore(s,d)}(window,document,"script","dataLayer",n.gtmId)}}window.SCM_GCM.update=function(t){var n=s(t);e.enabled&&a("consent","update",n),w(n),window.dataLayer.push({event:"scm_consent_update",scm_consent:n})},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",u):u(),w(c)}();
{/literal}
</script>
