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
 * Also exposes window.SCM_GCM.track(name, params) and .purchase(payload):
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
!function(){"use strict";var e=window.SCM_GCM_DATA.config,n=window.SCM_GCM_DATA.categories,a=window.SCM_GCM_DATA.tags;function t(){window.dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],"function"!=typeof window.gtag&&(window.gtag=t);var o=null,d=document.cookie.match(/(?:^|;)\s*scm_consent=([^;]*)/);if(d)try{o=JSON.parse(decodeURIComponent(d[1]))}catch(e){}if(!o)try{o=JSON.parse(window.localStorage.getItem("scm_consent"))}catch(e){}function c(a){var t={};return e.signals.forEach(function(e){t[e]="denied"}),n.forEach(function(e){e.signals.length&&((e.required||!(!a||!a[e.id]))&&e.signals.forEach(function(e){t[e]="granted"}))}),e.securityGranted&&(t.security_storage="granted"),t}var r=c(o);if(window.SCM_GCM={config:e,categories:n,tags:a,stored:o,mode:{ecommerce:"none",ads:"none"},ready:!1},e.enabled){var s={};if(e.signals.forEach(function(e){s[e]=r[e]}),e.waitMs&&e.waitMs>0&&(s.wait_for_update=e.waitMs),e.region&&e.region.length){t("consent","default",Object.assign({},s,{region:e.region}));var i={};e.signals.forEach(function(e){i[e]="granted"}),t("consent","default",i)}else t("consent","default",s);e.adsRedaction&&t("set","ads_data_redaction",!0),e.urlPassthrough&&t("set","url_passthrough",!0),o&&t("consent","update",r)}var g=!1;function w(e){var n,t,o,d,c,r;a.metaPixelId&&("granted"===e.ad_storage?g&&window.fbq?window.fbq("consent","grant"):!g&&a.metaPixelId&&(g=!0,n=window,t=document,o="script",n.fbq||(d=n.fbq=function(){d.callMethod?d.callMethod.apply(d,arguments):d.queue.push(arguments)},n._fbq||(n._fbq=d),d.push=d,d.loaded=!0,d.version="2.0",d.queue=[],(c=t.createElement(o)).async=!0,c.src="https://connect.facebook.net/en_US/fbevents.js",(r=t.getElementsByTagName(o)[0]).parentNode.insertBefore(c,r)),window.fbq("consent","grant"),window.fbq("init",a.metaPixelId),window.fbq("track","PageView")):g&&window.fbq&&window.fbq("consent","revoke"))}window.SCM_GCM.update=function(n){var a=c(n);e.enabled&&t("consent","update",a),w(a),window.dataLayer.push({event:"scm_consent_update",scm_consent:a})};var u=[];function m(e,n){"gtag"===window.SCM_GCM.mode.ecommerce?t("event",e,n):(window.dataLayer.push({ecommerce:null}),window.dataLayer.push({event:e,ecommerce:n}))}function f(e){m("purchase",e),"gtag"===window.SCM_GCM.mode.ads&&a.adsId&&a.adsConversionLabel&&t("event","conversion",{send_to:a.adsId+"/"+a.adsConversionLabel,value:e.value,currency:e.currency,transaction_id:e.transaction_id})}function l(e){window.SCM_GCM.mode=e,window.SCM_GCM.ready=!0;var n=u;u=[],n.forEach(function(e){"purchase"===e[0]?f(e[1]):m(e[1],e[2])})}function p(e){var n=document.createElement("script");n.async=!0,n.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(e);var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a),t("js",new Date)}function _(){var n={ecommerce:"none",ads:"none"};if(e.enabled){var o=!!window.google_tag_manager||!!document.querySelector('script[src*="googletagmanager.com/gtm.js?"]'),d=!!document.querySelector('script[src*="googletagmanager.com/gtag/js?"]'),c=!1;a.gtmId&&!o&&(!function(e,n,a,t,o){e[t]=e[t]||[],e[t].push({"gtm.start":(new Date).getTime(),event:"gtm.js"});var d=n.getElementsByTagName(a)[0],c=n.createElement(a);c.async=!0,c.src="https://www.googletagmanager.com/gtm.js?id="+encodeURIComponent(o),d.parentNode.insertBefore(c,d)}(window,document,"script","dataLayer",a.gtmId),o=!0),o?(n.ecommerce="gtm",n.ads="container"):!a.ga4Id&&!a.adsId||a.gtmId||d||(p(a.ga4Id||a.adsId),a.ga4Id&&t("config",a.ga4Id),a.adsId&&t("config",a.adsId),c=!0,n.ecommerce="gtag",n.ads=a.adsId?"gtag":"none"),!c&&a.adsForceDirect&&a.adsId&&(p(a.adsId),t("config",a.adsId),n.ads="gtag"),l(n)}else l(n)}window.SCM_GCM.track=function(e,n){window.SCM_GCM.ready?m(e,n):u.push(["track",e,n])},window.SCM_GCM.purchase=function(e){window.SCM_GCM.ready?f(e):u.push(["purchase",e])},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",_):_(),w(r)}();
{/literal}
</script>
