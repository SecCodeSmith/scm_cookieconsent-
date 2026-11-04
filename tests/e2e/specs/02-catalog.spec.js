// Tasks 3.1 / 5.3 - product lists, select_item, view_item, search on a real storefront.
const { test, expect, setMode, go } = require('./helpers');

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => { setMode('gtag'); });

const PRODUCT_URL = '/index.php?id_product=1&controller=product';

test('SCM_GCM runs in gtag mode', async ({ page }) => {
  await go(page, '/');
  const mode = await page.evaluate(() => window.SCM_GCM && window.SCM_GCM.mode);
  expect(mode.ecommerce).toBe('gtag');
});

test('category page emits one view_item_list matching the displayed products', async ({ page, ga }) => {
  await go(page, '/3-clothes');
  const shown = await page.locator('.js-product-miniature').count();
  expect(shown).toBeGreaterThan(0);

  const [ev] = await ga.waitFor('view_item_list');
  expect(ga.events('view_item_list')).toHaveLength(1);
  const p = ev.params;
  expect(p.item_list_id).toBe('category_3');
  expect(p.item_list_name).toBe('Clothes');
  expect(p.items).toHaveLength(shown);
  p.items.forEach((it, i) => {
    expect(it.index).toBe(i + 1);
    expect(it.item_list_id).toBe('category_3');
    expect(it.item_list_name).toBe('Clothes');
    expect(typeof it.item_id).toBe('string');
    expect(it.item_name).toBeTruthy();
  });
  // list events carry no value
  expect(p).not.toHaveProperty('value');
  // gtag command shape (no GTM object)
  expect(ev.raw.gtag[0]).toBe('event');
  expect(ga.entries().filter((e) => e.event === 'view_item_list')).toHaveLength(0);
});

test('facet filter re-emits view_item_list with the products then displayed', async ({ page, ga }) => {
  await go(page, '/3-clothes');
  await ga.waitFor('view_item_list', 1);
  const before = ga.events('view_item_list')[0].params.items.length;

  await page.locator('#search_filters a.search-link', { hasText: 'White' }).first().click();
  await ga.waitFor('view_item_list', 2);
  await expect.poll(() => page.locator('.js-product-miniature').count()).toBeLessThan(before);

  const second = ga.events('view_item_list')[1].params;
  const shownIds = await page.locator('.js-product-miniature').evaluateAll((els) => els.map((e) => e.getAttribute('data-id-product')));
  expect(second.item_list_id).toBe('category_3');
  expect(second.items.map((i) => i.item_id)).toEqual(shownIds);
  second.items.forEach((it, i) => {
    expect(it.index).toBe(i + 1);
    expect(it.item_list_id).toBe('category_3');
  });
  expect(ga.events('view_item_list')).toHaveLength(2);
});

test('clicking a miniature emits select_item with list and index before navigating', async ({ page, ga }) => {
  await go(page, '/3-clothes');
  await ga.waitFor('view_item_list', 1);
  const miniatures = page.locator('.js-product-miniature');
  expect(await miniatures.count()).toBeGreaterThanOrEqual(2);
  const second = miniatures.nth(1);
  const id = await second.getAttribute('data-id-product');

  await second.locator('.product-title a').click();
  await page.waitForURL(/\.html/);
  const sel = ga.events('select_item');
  expect(sel).toHaveLength(1);
  expect(sel[0].url).toContain('/3-clothes'); // recorded on the list page, before navigation
  expect(sel[0].params.item_list_id).toBe('category_3');
  expect(sel[0].params.item_list_name).toBe('Clothes');
  expect(sel[0].params.items).toHaveLength(1);
  expect(sel[0].params.items[0].index).toBe(2);
  expect(sel[0].params.items[0].item_id).toBe(id);
});

test('product page emits view_item with a combination label (not the reference) and discount', async ({ page, ga }) => {
  await go(page, PRODUCT_URL);
  const [ev] = await ga.waitFor('view_item');
  const item = ev.params.items[0];
  expect(ga.events('view_item')).toHaveLength(1);
  expect(item.item_id).toBe('1');
  expect(item.item_variant).toMatch(/^Size: [A-Z]+, Color: \w+$/);
  expect(item.item_variant).not.toMatch(/demo_/);
  expect(item.discount).toBeGreaterThan(0);
  expect(ev.params.currency).toBe('EUR');
  expect(ev.params.value).toBe(item.price);
  expect(item.quantity).toBe(1);
});

test('switching size emits a second view_item with the new variant', async ({ page, ga }) => {
  await go(page, PRODUCT_URL);
  await ga.waitFor('view_item', 1);
  const first = ga.events('view_item')[0].params.items[0].item_variant;
  const current = (await page.locator('#group_1 option:checked').textContent()).trim();
  const target = current === 'M' ? 'L' : 'M';

  await page.selectOption('#group_1', { label: target });
  await ga.waitFor('view_item', 2);
  const second = ga.events('view_item')[1].params.items[0];
  expect(second.item_variant).toContain(`Size: ${target}`);
  expect(second.item_variant).not.toBe(first);
  expect(second.price).toBeGreaterThan(0);
  expect(ga.events('view_item')).toHaveLength(2);
});

test('search emits trimmed search term and a search view_item_list', async ({ page, ga }) => {
  await go(page, '/search?controller=search&s=%20%20hummingbird%20');
  const [s] = await ga.waitFor('search');
  expect(ga.events('search')).toHaveLength(1);
  expect(s.params).toEqual({ search_term: 'hummingbird' });
  const [l] = await ga.waitFor('view_item_list');
  expect(l.params.item_list_id).toBe('search');
  expect(l.params.items.length).toBeGreaterThan(0);
  l.params.items.forEach((it) => expect(it.item_list_id).toBe('search'));
});

test('empty search query emits no search event', async ({ page, ga }) => {
  await go(page, '/search?controller=search&s=');
  await page.waitForTimeout(1000);
  expect(ga.events('search')).toHaveLength(0);
});

test('script-like search term is reported verbatim and never executes', async ({ page, ga }) => {
  const q = '</script><img src=x onerror=alert(1)>';
  await go(page, '/search?controller=search&s=' + encodeURIComponent(q));
  const [s] = await ga.waitFor('search');
  expect(s.params.search_term).toBe(q);
  await page.waitForTimeout(1000);
  expect(ga.entries().filter((e) => e.dialog !== undefined)).toEqual([]);
});

test.describe('GTM mode', () => {
  test.beforeAll(() => { setMode('gtm'); });
  test.afterAll(() => { setMode('gtag'); });

  test('search is a flat object without ecommerce and without a preceding ecommerce:null', async ({ page, ga }) => {
    await go(page, '/search?controller=search&s=hummingbird');
    await ga.waitFor('search');
    const mode = await page.evaluate(() => window.SCM_GCM && window.SCM_GCM.mode);
    expect(mode.ecommerce).toBe('gtm');
    const entries = ga.entries();
    const i = entries.findIndex((e) => e.event === 'search');
    expect(entries[i]).toEqual({ event: 'search', search_term: 'hummingbird' });
    expect(entries[i]).not.toHaveProperty('ecommerce');
    expect(entries[i - 1]).not.toEqual({ ecommerce: null });
    // ecommerce events keep the object pair
    const j = entries.findIndex((e) => e.event === 'view_item_list');
    expect(entries[j].ecommerce.item_list_id).toBe('search');
    expect(entries[j - 1]).toEqual({ ecommerce: null });
  });
});
