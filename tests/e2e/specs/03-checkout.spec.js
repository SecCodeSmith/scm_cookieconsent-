// Tasks 4.2 / 6.4 (checkout part) - cart, checkout funnel and purchase events on a real storefront.
const { test, expect, setMode, sql, go, createVoucher, addToCart, fillGuest, fillAddress, chooseCarrier } = require('./helpers');

test.describe.configure({ mode: 'default' });
test.setTimeout(Number(process.env.SCM_E2E_TEST_TIMEOUT || 240_000));

test.beforeAll(() => {
  setMode('gtag');
  createVoucher('E2E10', 10);
});

const approx = (a, b) => Math.abs(a - b) < 0.011;
// Whitespace-insensitive comparison for the funnel events (see the strict test below).

// Spec "Consistent item variant" / "Same combination across events": view_item and add_to_cart
// must carry the SAME item_variant. Strict on purpose - do not normalise here.
test('add_to_cart item_variant is identical to the view_item item_variant', async ({ page, ga }) => {
  await go(page, '/index.php?id_product=1&controller=product');
  const [vi] = await ga.waitFor('view_item');
  await page.locator('button[data-button-action="add-to-cart"]').click();
  await page.locator('#blockcart-modal').waitFor({ state: 'visible' });
  const [atc] = await ga.waitFor('add_to_cart');
  expect(atc.params.items[0].item_variant).toBe(vi.params.items[0].item_variant);
});

test('full guest journey: add_to_cart, view_cart, begin_checkout, add_shipping_info, add_payment_info, purchase', async ({ page, ga }) => {
  const email = `guest-${Date.now()}@example.com`;
  let variant;

  await test.step('view_item then add_to_cart carry the same variant', async () => {
    await go(page, '/index.php?id_product=1&controller=product');
    const [vi] = await ga.waitFor('view_item');
    variant = vi.params.items[0].item_variant;
    expect(variant).toMatch(/^Size: .+, Color: .+$/);

    await page.locator('button[data-button-action="add-to-cart"]').click();
    await page.locator('#blockcart-modal').waitFor({ state: 'visible' });
    const [atc] = await ga.waitFor('add_to_cart');
    expect(ga.events('add_to_cart')).toHaveLength(1);
    const item = atc.params.items[0];
    expect(item.item_id).toBe('1');
    expect(item.item_variant).toBe(variant);
    expect(item.quantity).toBe(1);
    expect(atc.params.currency).toBe('EUR');
    expect(atc.params.value).toBe(item.price);
  });

  await test.step('cart page emits view_cart; voucher is applied', async () => {
    await go(page, '/cart?action=show');
    const [vc] = await ga.waitFor('view_cart');
    expect(vc.params.items).toHaveLength(1);
    expect(vc.params.items[0].item_variant).toBe(variant);
    expect(vc.params.currency).toBe('EUR');

    await page.locator('a[href="#promo-code"]').click();
    await page.locator('input[name="discount_name"]').fill('E2E10');
    await page.locator('form:has(input[name="discount_name"]) button[type="submit"]').click();
    await expect(page.locator('.cart-voucher, .js-discount, .promo-name').first()).toContainText(/E2E voucher/);
  });

  await test.step('begin_checkout carries the coupon', async () => {
    ga.clear();
    await page.locator('.cart-detailed-actions a.btn-primary, .checkout a.btn-primary').first().click();
    await page.waitForURL(/order/);
    const [bc] = await ga.waitFor('begin_checkout');
    expect(ga.events('begin_checkout')).toHaveLength(1);
    expect(bc.params.coupon).toBe('E2E10');
    expect(bc.params.items[0].item_variant).toBe(variant);
    expect(bc.params.currency).toBe('EUR');
  });

  await test.step('guest personal info + address', async () => {
    await fillGuest(page, email);
    await page.locator('#delivery-address').waitFor({ state: 'visible' });
    await fillAddress(page);
    await page.locator('#checkout-delivery-step.-current').waitFor();
    // delivery step is not complete yet - no add_shipping_info so far
    expect(ga.events('add_shipping_info')).toHaveLength(0);
  });

  await test.step('delivery -> add_shipping_info with carrier and coupon', async () => {
    await chooseCarrier(page, 'My carrier');
    await page.locator('input[name="payment-option"]').first().waitFor();
    const [si] = await ga.waitFor('add_shipping_info');
    expect(ga.events('add_shipping_info')).toHaveLength(1);
    expect(si.params.shipping_tier).toBe('My carrier');
    expect(si.params.coupon).toBe('E2E10');
    expect(si.params.currency).toBe('EUR');
    expect(si.params.items).toHaveLength(1);
    expect(si.params.value).toBeGreaterThan(0);

    // Task 4.2: PrestaShop persisted the step state the module relies on
    const idCart = await page.evaluate(() => (window.prestashop && prestashop.cart && (prestashop.cart.id || prestashop.cart.id_cart)) || 0);
    const rows = idCart
      ? sql(`SELECT checkout_session_data FROM ps_cart WHERE id_cart=${Number(idCart)}`)
      : sql('SELECT checkout_session_data FROM ps_cart ORDER BY id_cart DESC LIMIT 1');
    const data = JSON.parse(rows[0][0]);
    const key = Object.keys(data).find((k) => k.includes('delivery'));
    expect(key, `keys: ${Object.keys(data)}`).toBeTruthy();
    expect(data[key].step_is_complete).toBe(true);
  });

  await test.step('payment selection -> add_payment_info once', async () => {
    const wire = page.locator('input[name="payment-option"][data-module-name="ps_wirepayment"]');
    await wire.check();
    const [pi] = await ga.waitFor('add_payment_info');
    expect(pi.params.payment_type).toBe('ps_wirepayment');
    expect(pi.params.currency).toBe('EUR');
    expect(pi.params.items).toHaveLength(1);
    expect(pi.params.coupon).toBe('E2E10');
    // click the already selected option again -> still one
    await wire.click({ force: true });
    await page.locator('label[for="' + (await wire.getAttribute('id')) + '"]').click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
    expect(ga.events('add_payment_info')).toHaveLength(1);
  });

  let confirmationUrl;
  await test.step('terms + place order -> purchase', async () => {
    await page.locator('input[id="conditions_to_approve[terms-and-conditions]"]').check();
    await page.locator('#payment-confirmation button[type="submit"]:not([disabled])').click();
    await page.waitForURL(/order-confirmation/);
    confirmationUrl = page.url();
    const [pu] = await ga.waitFor('purchase');
    expect(ga.events('purchase')).toHaveLength(1);
    const p = pu.params;

    const [order] = sql('SELECT reference, total_paid_tax_incl, total_shipping_tax_incl FROM ps_orders ORDER BY id_order DESC LIMIT 1');
    expect(p.transaction_id).toBe(order[0]);
    expect(p.coupon).toBe('E2E10');
    expect(p.currency).toBe('EUR');
    expect(approx(p.value, Number(order[1]))).toBe(true);
    expect(p).toHaveProperty('tax');
    expect(p).toHaveProperty('shipping');
    expect(p.items).toHaveLength(1);
    const item = p.items[0];
    expect(item.item_id).toBe('1');
    expect(item.item_name).toBe('Hummingbird printed t-shirt');   // base name, no " - Size : S" suffix
    expect(item.item_name).not.toMatch(/ - /);
    expect(item.item_variant).toBe(variant); // purchase items are built server-side: must match view_item exactly
    expect(item.quantity).toBe(1);
  });

  await test.step('guest checkout without a password emits no sign_up / login (whole journey)', async () => {
    expect(ga.events('sign_up')).toHaveLength(0);
    expect(ga.events('login')).toHaveLength(0);
  });

  await test.step('reloading the confirmation page does not send a second purchase', async () => {
    ga.clear();
    await page.goto(confirmationUrl);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    expect(ga.events('purchase')).toHaveLength(0);
  });

});

test('deleting a cart line emits remove_from_cart with the full line data', async ({ page, ga }) => {
  await go(page, '/index.php?id_product=1&controller=product');
  await page.locator('#quantity_wanted').fill('3');
  await page.locator('button[data-button-action="add-to-cart"]').click();
  await page.locator('#blockcart-modal').waitFor({ state: 'visible' });
  const [atc] = await ga.waitFor('add_to_cart');
  expect(atc.params.items[0].quantity).toBe(3);

  await go(page, '/cart?action=show');
  await ga.waitFor('view_cart');
  const line = await page.evaluate(() => {
    const p = prestashop.cart.products[0];
    return { name: p.name, price: p.price_amount, qty: p.cart_quantity };
  });
  expect(line.qty).toBe(3);

  await page.locator('.remove-from-cart').first().click();
  const [rm] = await ga.waitFor('remove_from_cart');
  expect(ga.events('remove_from_cart')).toHaveLength(1);
  const item = rm.params.items[0];
  expect(item.item_name).toBe(line.name);
  expect(item.price).toBe(Math.round(line.price * 100) / 100);
  expect(item.quantity).toBe(3);
  expect(item.item_variant).toBeTruthy();
  expect(approx(rm.params.value, item.price * 3)).toBe(true);
  expect(rm.params.currency).toBe('EUR');
});
