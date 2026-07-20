{**
 * scm_cookieconsent — GA4 purchase event (order confirmation)
 *
 * Rendered server-side by hookDisplayOrderConfirmation with real order data,
 * which is the only reliable source for transaction_id / value / items.
 * sessionStorage guard prevents a double-count if the buyer refreshes the
 * confirmation page (GA4 also de-dupes on transaction_id as a second line).
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 *}
<script data-scm-gcm="purchase">
{literal}
(function () {
    window.dataLayer = window.dataLayer || [];
    var p = {/literal}{$scm_purchase nofilter}{literal};
    try {
        var k = 'scm_purchase_' + p.transaction_id;
        if (window.sessionStorage && sessionStorage.getItem(k)) { return; }
        if (window.sessionStorage) { sessionStorage.setItem(k, '1'); }
    } catch (e) {}
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event: 'purchase', ecommerce: p });
})();
{/literal}
</script>
