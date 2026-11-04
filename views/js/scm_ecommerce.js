/**
 * scm_cookieconsent — universal GA4 ecommerce dataLayer
 *
 * Replaces the dedicated GA4 dataLayer module (e.g. TagConcierge): pushes the
 * standard GA4 recommended events so the SAME GTM tags/triggers keep working.
 *
 *   view_item_list    — listing pages     (server-injected SCM_EC.list; AJAX: updateProductList)
 *   select_item       — click on a product miniature of that list
 *   view_item         — product page      (server-injected; combination switch: updatedProduct)
 *   add_to_cart       — prestashop updateCart (quantity delta > 0)
 *   remove_from_cart  — prestashop updateCart (quantity delta < 0 / line removed)
 *   view_cart         — cart page         (from prestashop.cart)
 *   begin_checkout    — checkout page     (from prestashop.cart + SCM_EC.coupon)
 *   add_shipping_info — first checkout page after the delivery step is complete (SCM_EC.shipping)
 *   add_payment_info  — payment option selected (input[name="payment-option"])
 *   purchase          — order confirmation (server-injected, see ecommerce_purchase.tpl)
 *   login / sign_up   — page after a successful login / account creation (SCM_EC.userEvent)
 *   search            — search results page (SCM_EC.search)
 *
 * Consent: pushes are made unconditionally. Whether GA4 actually SENDS the hit
 * is governed by Google Consent Mode v2 (the head bootstrap) inside the tag —
 * a dataLayer push is not itself a network beacon. No personal data is pushed.
 *
 * Routing: ecommerce events go through window.SCM_GCM.track(), non-ecommerce
 * events (login, sign_up, search) through window.SCM_GCM.event() — the head
 * bootstrap picks the GTM dataLayer shape or a direct gtag('event'). If the
 * bootstrap is missing, the GTM shape is pushed directly.
 *
 * ES5 / no dependencies / IIFE / no Element.closest, no Object.assign (IE 11).
 * Uses the standard PrestaShop 1.7+ `prestashop` JS object + event bus.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 */
(function () {
    'use strict';

    var EC = window.SCM_EC || {};

    function dl() { window.dataLayer = window.dataLayer || []; return window.dataLayer; }

    function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

    // Ecommerce event — GTM object pair or direct gtag (decided by the bootstrap).
    function pushEvent(name, ecommerce) {
        if (window.SCM_GCM && typeof window.SCM_GCM.track === 'function') {
            window.SCM_GCM.track(name, ecommerce);
            return;
        }
        var d = dl();
        d.push({ ecommerce: null });
        d.push({ event: name, ecommerce: ecommerce });
    }

    // Non-ecommerce event — flat keys in the dataLayer, no ecommerce wrapper.
    function pushUserEvent(name, params) {
        if (window.SCM_GCM && typeof window.SCM_GCM.event === 'function') {
            window.SCM_GCM.event(name, params);
            return;
        }
        var obj = { event: name };
        for (var k in params) { if (hasOwn(params, k)) { obj[k] = params[k]; } }
        dl().push(obj);
    }

    // sessionStorage "once" guard. Storage blocked → still emit (once per page).
    var onceMem = {};
    function once(key) {
        try {
            if (window.sessionStorage) {
                if (sessionStorage.getItem(key)) { return false; }
                sessionStorage.setItem(key, '1');
                return true;
            }
        } catch (e) {}
        if (onceMem[key]) { return false; }
        onceMem[key] = true;
        return true;
    }

    function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

    function currency() {
        try {
            if (window.prestashop && prestashop.currency && prestashop.currency.iso_code) {
                return prestashop.currency.iso_code;
            }
        } catch (e) {}
        return EC.currency || '';
    }

    function trim(x) { return String(x == null ? '' : x).replace(/^\s+|\s+$/g, ''); }

    // "Size: M, Color: Blue" — names/values trimmed (PrestaShop data can carry
    // stray spaces, e.g. "S "). Cart products: { Label: 'Value' }.
    // Presented products: { idGroup: { group: 'Label', name: 'Value' } }.
    function variantOf(p) {
        var parts = [];
        var a = p.attributes;
        if (a && typeof a === 'object') {
            for (var k in a) {
                if (!hasOwn(a, k)) { continue; }
                var v = a[k];
                if (v && typeof v === 'object') {
                    // Customer-facing group name wins (same rule as the PHP builder).
                    var g = trim(v.public_group || v.group), n = trim(v.name);
                    if (g && n) { parts.push(g + ': ' + n); }
                } else if (trim(v) !== '' && trim(k) !== '') {
                    parts.push(trim(k) + ': ' + trim(v));
                }
            }
        }
        if (!parts.length && p.attributes_small) { return trim(p.attributes_small); }
        return parts.join(', ');
    }

    function setIf(item, key, value) {
        if (value !== null && value !== undefined && value !== '') { item[key] = value; }
    }

    // Map a PrestaShop cart / presented product to the shared GA4 item shape:
    // item_id, item_name, quantity, price + non-empty brand/category/variant/discount.
    function mapItem(p, qty) {
        var price = p.price_amount != null ? p.price_amount
                  : (p.price_with_reduction != null ? p.price_with_reduction : p.price);
        var item = {
            item_id:   String(p.id_product != null ? p.id_product : (p.id != null ? p.id : '')),
            item_name: p.name || '',
            price:     round2(price),
            quantity:  qty != null ? qty : Number(p.cart_quantity || p.quantity || 1)
        };
        setIf(item, 'item_brand', p.manufacturer_name || '');
        setIf(item, 'item_category', p.category_name || '');
        setIf(item, 'item_variant', variantOf(p));
        if (p.regular_price_amount != null) {
            var disc = round2(Number(p.regular_price_amount) - item.price);
            if (disc > 0.005) { item.discount = disc; }
        }
        return item;
    }

    function itemsValue(items) {
        var v = 0;
        items.forEach(function (i) { v += (i.price || 0) * (i.quantity || 0); });
        return round2(v);
    }

    function keyOf(idProduct, idAttr) { return String(idProduct) + '_' + String(idAttr || 0); }

    function cartItems() {
        var cart = window.prestashop && prestashop.cart;
        if (!cart || !cart.products || !cart.products.length) { return []; }
        return cart.products.map(function (p) { return mapItem(p); });
    }

    // Shared payload for the checkout-funnel events.
    function cartPayload(extra) {
        var items = cartItems();
        var payload = { currency: currency(), value: itemsValue(items) };
        if (EC.coupon) { payload.coupon = EC.coupon; }
        for (var k in extra) { if (hasOwn(extra, k)) { payload[k] = extra[k]; } }
        payload.items = items;
        return payload;
    }

    /* ===== Product lists: view_item_list + select_item ===== */

    var list = null;      // { id, name }
    var listMap = {};     // keyOf(id, attr) → item

    function setList(id, name, items) {
        list = { id: id, name: name };
        listMap = {};
        items.forEach(function (it, i) {
            it.index = i + 1;
            it.item_list_id = id;
            it.item_list_name = name;
        });
        return items;
    }

    function emitList(items) {
        if (!items.length) { return; }
        pushEvent('view_item_list', { item_list_id: list.id, item_list_name: list.name, items: items });
    }

    function initList() {
        if (!EC.list || !EC.list.items || !EC.list.items.length) { return; }
        var items = setList(EC.list.id, EC.list.name, EC.list.items);
        // A listing shows each product once — the product id is the key.
        items.forEach(function (it) { listMap[keyOf(it.item_id, 0)] = it; });
        emitList(items);
    }

    function onUpdateProductList(data) {
        if (!list || !data || Object.prototype.toString.call(data.products) !== '[object Array]') { return; }
        var items = setList(list.id, list.name, data.products.map(function (p) { return mapItem(p, 1); }));
        items.forEach(function (it) { listMap[keyOf(it.item_id, 0)] = it; });
        emitList(items);
    }

    function miniatureOf(node) {
        while (node && typeof node.getAttribute === 'function') {
            if (node.getAttribute('data-id-product') !== null
                && String(node.className || '').indexOf('product-miniature') !== -1) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    function onClick(e) {
        if (!list) { return; }
        var m = miniatureOf(e && e.target);
        if (!m) { return; }
        var item = listMap[keyOf(m.getAttribute('data-id-product'), 0)];
        if (!item) { return; }
        pushEvent('select_item', { item_list_id: list.id, item_list_name: list.name, items: [item] });
    }

    /* ===== Product detail: combination switch → view_item ===== */

    var lastViewedAttr = null;

    function onUpdatedProduct() {
        try {
            var el = document.querySelector('#product-details');
            var raw = el && el.getAttribute('data-product');
            if (!raw) { return; }
            var p = JSON.parse(raw);
            var attr = String(p.id_product_attribute || 0);
            if (attr === lastViewedAttr) { return; }
            lastViewedAttr = attr;
            var item = mapItem(p, 1);
            pushEvent('view_item', { currency: currency(), value: item.price, items: [item] });
        } catch (e) {}
    }

    /* ===== Checkout: add_payment_info ===== */

    var lastPayment = null;

    function onChange(e) {
        var t = e && e.target;
        if (!t || t.name !== 'payment-option') { return; }
        var type = (typeof t.getAttribute === 'function' && t.getAttribute('data-module-name')) || '';
        if (!type || type === lastPayment) { return; }
        lastPayment = type;
        pushEvent('add_payment_info', cartPayload({ payment_type: type }));
    }

    /* ===== Page-load events ===== */

    function firePageEvents() {
        // Server-injected event with full product data (view_item)
        if (EC.pageEvent && EC.pageEvent.name && EC.pageEvent.ecommerce) {
            pushEvent(EC.pageEvent.name, EC.pageEvent.ecommerce);
            if (EC.pageEvent.name === 'view_item') {
                lastViewedAttr = String(EC.pageEvent.idProductAttribute || 0);
            }
        }

        try { initList(); } catch (e) {}

        // Cart-derived events use live client data so they survive AJAX cart edits.
        try {
            var page = window.prestashop && prestashop.page && prestashop.page.page_name;
            if (cartItems().length) {
                if (page === 'cart') {
                    var items = cartItems();
                    pushEvent('view_cart', { currency: currency(), value: itemsValue(items), items: items });
                } else if (page === 'checkout' || page === 'order') {
                    pushEvent('begin_checkout', cartPayload({}));
                }
            }
        } catch (e) {}

        try {
            if (EC.shipping && EC.shipping.key && once('scm_ship_' + EC.shipping.key)) {
                pushEvent('add_shipping_info', cartPayload({ shipping_tier: EC.shipping.tier || '' }));
            }
        } catch (e) {}

        try {
            if (EC.userEvent && EC.userEvent.name && once('scm_uevt_' + EC.userEvent.id)) {
                pushUserEvent(EC.userEvent.name, { method: EC.userEvent.method || 'PrestaShop' });
            }
        } catch (e) {}

        if (EC.search) {
            pushUserEvent('search', { search_term: String(EC.search) });
        }
    }

    /* ===== add_to_cart / remove_from_cart via prestashop 'updateCart' ===== */

    var prevQty = {};
    var prevItem = {};   // last full item per cart line — removed lines keep their data

    function lineKey(p) { return keyOf(p.id_product, p.id_product_attribute); }

    function snapshot(cart) {
        prevQty = {};
        prevItem = {};
        if (cart && cart.products) {
            cart.products.forEach(function (p) {
                var k = lineKey(p);
                prevQty[k] = Number(p.cart_quantity || p.quantity || 0);
                prevItem[k] = mapItem(p, 1);
            });
        }
    }

    function withQty(item, qty) {
        var copy = {};
        for (var k in item) { if (hasOwn(item, k)) { copy[k] = item[k]; } }
        copy.quantity = qty;
        return copy;
    }

    function onUpdateCart(e) {
        var cart = (e && e.resp && e.resp.cart) || (window.prestashop && prestashop.cart);
        if (!cart || !cart.products) { return; }
        var cur = currency();
        var present = {};

        cart.products.forEach(function (p) {
            var k = lineKey(p);
            present[k] = true;
            var now    = Number(p.cart_quantity || p.quantity || 0);
            var before = prevQty[k] || 0;
            var diff   = now - before;
            if (diff === 0) { return; }

            var qty  = Math.abs(diff);
            var item = mapItem(p, qty);
            pushEvent(diff > 0 ? 'add_to_cart' : 'remove_from_cart',
                { currency: cur, value: round2(item.price * qty), items: [item] });
        });

        // Lines removed entirely — report the full item last seen for them.
        Object.keys(prevQty).forEach(function (k) {
            if (!present[k] && prevQty[k] > 0) {
                var item = prevItem[k]
                    ? withQty(prevItem[k], prevQty[k])
                    : { item_id: k.split('_')[0], quantity: prevQty[k] };
                pushEvent('remove_from_cart', {
                    currency: cur, value: round2((item.price || 0) * prevQty[k]), items: [item]
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
        prestashop.on('updateProductList', onUpdateProductList);
        prestashop.on('updatedProduct', onUpdatedProduct);
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);

    document.addEventListener('DOMContentLoaded', function () {
        EC = window.SCM_EC || {};
        firePageEvents();
        subscribe();
    });
}());
