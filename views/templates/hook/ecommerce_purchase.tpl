{**
 * scm_cookieconsent — GA4 purchase event (order confirmation)
 *
 * Rendered server-side by hookDisplayOrderConfirmation with real order data,
 * which is the only reliable source for transaction_id / value / items.
 * The once-per-order guard (sessionStorage key scm_purchase_<id>) is passed to
 * window.SCM_GCM.purchase() and recorded when the event is DELIVERED, not when
 * it is queued: a buyer who reloads this page before choosing still gets the
 * purchase after a late grant, and a reload after delivery sends nothing
 * (GA4 also de-dupes on transaction_id as a second line).
 * Delivery goes through the head bootstrap (GTM object pair, or direct gtag
 * purchase + Google Ads conversion, which needs ad_storage); nothing is pushed
 * before a grant. Falls back to the dataLayer object pair when the bootstrap is
 * absent (then there is no tag loader either).
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 *}
<script data-scm-gcm="purchase">
{literal}
(function () {
    window.dataLayer = window.dataLayer || [];
    var p = {/literal}{$scm_purchase nofilter}{literal};
    var k = 'scm_purchase_' + p.transaction_id;
    if (window.SCM_GCM && typeof window.SCM_GCM.purchase === 'function') {
        // Head bootstrap queues it until a grant, routes it (GTM object pair or direct
        // gtag + Ads conversion) and records the guard key at delivery.
        window.SCM_GCM.purchase(p, k);
    } else {
        try {
            if (window.sessionStorage) {
                if (sessionStorage.getItem(k)) { return; }
                sessionStorage.setItem(k, '1');
            }
        } catch (e) {}
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({ event: 'purchase', ecommerce: p });
    }
})();
{/literal}
</script>
