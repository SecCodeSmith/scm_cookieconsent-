/**
 * scm_cookieconsent — universal GA4 ecommerce dataLayer
 *
 * Replaces the dedicated GA4 dataLayer module (e.g. TagConcierge): pushes the
 * standard GA4 ecommerce events so the SAME GTM tags/triggers keep working.
 *
 *   view_item        — product page          (server-injected via window.SCM_EC)
 *   view_cart        — cart page             (from prestashop.cart)
 *   begin_checkout   — checkout page         (from prestashop.cart)
 *   add_to_cart      — prestashop updateCart (quantity delta > 0)
 *   remove_from_cart — prestashop updateCart (quantity delta < 0)
 *   purchase         — order confirmation    (server-injected, see ecommerce_purchase.tpl)
 *
 * Consent: pushes are made unconditionally. Whether GA4 actually SENDS the hit
 * is governed by Google Consent Mode v2 (the head bootstrap) inside the tag —
 * a dataLayer push is not itself a network beacon.
 *
 * Every ecommerce event is preceded by dataLayer.push({ ecommerce: null }) so
 * GA4 never merges items from a previous event (Google's documented rule).
 *
 * ES5 / no dependencies / IIFE. Uses the standard PrestaShop 1.7+ `prestashop`
 * JS object + event bus, so it is theme-agnostic.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 */
(function () {
    'use strict';

    function dl() { window.dataLayer = window.dataLayer || []; return window.dataLayer; }

    // Clear the previous ecommerce object FIRST, then push — GA4 best practice.
    function pushEvent(name, ecommerce) {
        var d = dl();
        d.push({ ecommerce: null });
        d.push({ event: name, ecommerce: ecommerce });
    }

    function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

    function currency() {
        try {
            if (window.prestashop && prestashop.currency && prestashop.currency.iso_code) {
                return prestashop.currency.iso_code;
            }
        } catch (e) {}
        return (window.SCM_EC && window.SCM_EC.currency) || '';
    }

    // Map a PrestaShop cart product to a GA4 item.
    function mapItem(p, qty) {
        var price = p.price_amount != null ? p.price_amount
                  : (p.price_with_reduction != null ? p.price_with_reduction : p.price);
        return {
            item_id:       String(p.id_product != null ? p.id_product : (p.id != null ? p.id : '')),
            item_name:     p.name || '',
            price:         round2(price),
            item_brand:    p.manufacturer_name || '',
            item_category: p.category || '',
            item_variant:  p.attributes_small || '',
            quantity:      qty != null ? qty : Number(p.cart_quantity || p.quantity || 1)
        };
    }

    function itemsValue(items) {
        var v = 0;
        items.forEach(function (i) { v += (i.price || 0) * (i.quantity || 0); });
        return round2(v);
    }

    /* ===== Page-load events: view_item (server) + view_cart/begin_checkout (client) ===== */

    function firePageEvents() {
        var ec = window.SCM_EC || {};

        // Server-injected event with full product data (view_item / purchase fallbacks)
        if (ec.pageEvent && ec.pageEvent.name && ec.pageEvent.ecommerce) {
            pushEvent(ec.pageEvent.name, ec.pageEvent.ecommerce);
        }

        // Cart-derived events use live client data so they survive AJAX cart edits.
        try {
            var page = window.prestashop && prestashop.page && prestashop.page.page_name;
            var cart = window.prestashop && prestashop.cart;
            if (cart && cart.products && cart.products.length) {
                var items = cart.products.map(function (p) { return mapItem(p); });
                var payload = { currency: currency(), value: itemsValue(items), items: items };
                if (page === 'cart') {
                    pushEvent('view_cart', payload);
                } else if (page === 'checkout' || page === 'order') {
                    pushEvent('begin_checkout', payload);
                }
            }
        } catch (e) {}
    }

    /* ===== add_to_cart / remove_from_cart via prestashop 'updateCart' ===== */

    var prevQty = {};

    function keyOf(p) { return String(p.id_product) + '_' + String(p.id_product_attribute || 0); }

    function snapshot(cart) {
        prevQty = {};
        if (cart && cart.products) {
            cart.products.forEach(function (p) { prevQty[keyOf(p)] = Number(p.cart_quantity || p.quantity || 0); });
        }
    }

    function onUpdateCart(e) {
        var cart = (e && e.resp && e.resp.cart) || (window.prestashop && prestashop.cart);
        if (!cart || !cart.products) { return; }
        var cur = currency();
        var present = {};

        cart.products.forEach(function (p) {
            var k = keyOf(p);
            present[k] = true;
            var now    = Number(p.cart_quantity || p.quantity || 0);
            var before = prevQty[k] || 0;
            var diff   = now - before;
            if (diff === 0) { return; }

            var qty  = Math.abs(diff);
            var item = mapItem(p, qty);
            var payload = { currency: cur, value: round2(item.price * qty), items: [item] };
            pushEvent(diff > 0 ? 'add_to_cart' : 'remove_from_cart', payload);
        });

        // Lines removed entirely (no longer in the cart) — emit a minimal item.
        Object.keys(prevQty).forEach(function (k) {
            if (!present[k] && prevQty[k] > 0) {
                pushEvent('remove_from_cart', {
                    currency: cur,
                    items: [{ item_id: k.split('_')[0], quantity: prevQty[k] }]
                });
            }
        });

        snapshot(cart);
    }

    function subscribe() {
        if (!window.prestashop || typeof prestashop.on !== 'function') {
            setTimeout(subscribe, 400); // core JS loads at end of <body>; wait for it
            return;
        }
        snapshot(prestashop.cart);
        prestashop.on('updateCart', onUpdateCart);
    }

    document.addEventListener('DOMContentLoaded', function () {
        firePageEvents();
        subscribe();
    });
}());
