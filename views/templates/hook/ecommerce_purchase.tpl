{**
 * scm_cookieconsent — GA4 purchase event (order confirmation)
 *
 * Rendered server-side by hookDisplayOrderConfirmation with real order data,
 * which is the only reliable source for transaction_id / value / items.
 * sessionStorage guard prevents a double-count if the buyer refreshes the
 * confirmation page (GA4 also de-dupes on transaction_id as a second line).
 * Delivery goes through window.SCM_GCM.purchase() (head bootstrap: GTM object
 * pair, or direct gtag purchase + Google Ads conversion); falls back to the
 * dataLayer object pair when the bootstrap is absent.
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
    if (window.SCM_GCM && typeof window.SCM_GCM.purchase === 'function') {
        // Head bootstrap routes it (GTM object pair or direct gtag + Ads conversion)
        window.SCM_GCM.purchase(p);
    } else {
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({ event: 'purchase', ecommerce: p });
    }
})();
{/literal}
</script>
