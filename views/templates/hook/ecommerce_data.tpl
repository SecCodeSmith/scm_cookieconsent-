{**
 * scm_cookieconsent — per-page ecommerce payload for scm_ecommerce.js
 *
 * Emits window.SCM_EC at the end of <body>. Carries the shop currency and,
 * on a product page, a server-built view_item event (full product data that
 * the client `prestashop` object does not expose). Cart/checkout events are
 * derived client-side from prestashop.cart.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 *}
<script data-scm-gcm="ecommerce-data">
window.SCM_EC = {$scm_ec nofilter};
</script>
