// Tasks 1.2 / 2.5 / 3.x - Consent Mode "basic" (OpenSpec change consent-mode-basic, design D9).
// Proves with a request log (fixture `requests`), not only with the dataLayer, that no analytics or
// advertising host is contacted before a grant, and that the events survive a late grant.
//
// Groups: 1 no choice, 2 reject, 3 late grant (+ full journey, both tag modes), 4 analytics only,
// 5 withdrawal, 6 purchase guard + checkout funnel defects, 7 geometry / footer link / retention.
const { test, expect, stack, sql, setMode, fillGuest, fillAddress, chooseCarrier } = require('./helpers');


const PRODUCT = '/index.php?id_product=1&controller=product';
const TRACKING_COOKIE = /^(_ga|_gid|_gcl|_fbp|_fbc)/;
const GA4 = 'G-E2ETEST123';
const ADS = 'AW-123456789';
const GTM = 'GTM-E2ETEST';
const MODES = ['gtag', 'gtm'];

test.beforeAll(() => {
  // Ads settings on for the whole file: every direct-mode case then also proves what the Ads tag does.
  stack('config', 'ADS_ID', ADS);
  stack('config', 'ADS_CONVERSION_LABEL', 'E2ELABEL');
});
test.afterAll(() => {
  stack('config', 'ADS_ID', '');
  stack('config', 'ADS_CONVERSION_LABEL', '');
  stack('config', 'GTM_ID', '');
  stack('config', 'GA4_ID', '');
});

/* ---------- helpers ---------- */

const bannerVisible = (page) => page.locator('#scm-cookie-banner').waitFor({ state: 'visible' });
const trackingCookies = async (context) => (await context.cookies()).filter((c) => TRACKING_COOKIE.test(c.name));
const tagUrl = (mode) => (mode === 'gtm' ? new RegExp(`googletagmanager\\.com/gtm\\.js\\?id=${GTM}`) : new RegExp(`googletagmanager\\.com/gtag/js\\?id=${GA4}`));
const waitReady = (page) => page.waitForFunction(() => window.SCM_GCM && window.SCM_GCM.ready === true);

/** The category id that controls a Consent Mode signal (read from the page itself). */
const categoryOf = (page, signal) => page.evaluate((s) => {
  const c = window.SCM_GCM.categories.find((x) => x.signals.indexOf(s) !== -1 && !x.required);
  return c ? c.id : null;
}, signal);

/** Make a choice in the open banner: 'all', 'reject' or { analytics, marketing } toggles then "Zapisz". */
async function choose(page, what) {
  await bannerVisible(page);
  if (what === 'all') { await page.locator('#scm-btn-accept-all').click(); }
  else if (what === 'reject') { await page.locator('#scm-btn-reject-all').click(); }
  else {
    for (const [name, signal] of [['analytics', 'analytics_storage'], ['marketing', 'ad_storage']]) {
      const id = await categoryOf(page, signal);
      const tg = page.locator(`.scm-toggle[data-category-id="${id}"]`);
      const on = (await tg.getAttribute('aria-checked')) === 'true';
      if (!!what[name] !== on) { await tg.click(); }
    }
    await page.locator('#scm-btn-save').click();
  }
  await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
}

/** Reopen the banner on the current page (round widget, wider than 600px). */
async function reopen(page) {
  await page.locator('#scm-reopen-widget').click();
  await bannerVisible(page);
}

const isEvent = (name) => (e) => (e && e.event === name) || (e && e.gtag && e.gtag[0] === 'event' && e.gtag[1] === name);
const isUpdate = (e) => e && e.gtag && e.gtag[0] === 'consent' && e.gtag[1] === 'update';
const isConfig = (id) => (e) => e && e.gtag && e.gtag[0] === 'config' && e.gtag[1] === id;

/**
 * Walk the guest journey: product -> add to cart -> cart -> checkout -> guest -> address -> carrier ->
 * payment (-> purchase). `choice` is made on the product page; a choice is always needed to click
 * through the checkout because the first-visit banner is a modal.
 */
async function journey(page, { choice = 'all', toPayment = false, pick = true } = {}) {
  const email = `basic-${Date.now()}@example.com`;
  await page.goto(PRODUCT);
  await choose(page, choice);
  await expect(page.locator('button[data-button-action="add-to-cart"]')).toBeEnabled();
  await page.locator('button[data-button-action="add-to-cart"]').click();
  await page.locator('#blockcart-modal').waitFor({ state: 'visible' });
  await page.goto('/cart?action=show');
  await page.locator('.cart-detailed-actions a.btn-primary, .checkout a.btn-primary').first().click();
  await page.waitForURL(/order/);
  await fillGuest(page, email);
  await page.locator('#delivery-address').waitFor({ state: 'visible' });
  await fillAddress(page);
  await page.locator('#checkout-delivery-step.-current').waitFor();
  await chooseCarrier(page, 'My carrier');
  await page.locator('input[name="payment-option"]').first().waitFor();
  if (toPayment) { return null; }
  if (pick) {
    await page.locator('input[name="payment-option"][data-module-name="ps_wirepayment"]').check();
  }
  await page.locator('input[id="conditions_to_approve[terms-and-conditions]"]').check();
  await page.locator('#payment-confirmation button[type="submit"]:not([disabled])').click();
  await page.waitForURL(/order-confirmation/);
  return page.url();
}

/* ---------- 1 + 2 + 3 (per tag mode) ---------- */

for (const mode of MODES) {
  test.describe(`mode ${mode}`, () => {
    test.beforeAll(() => { setMode(mode); });

    test(`1. no choice: home, product and cart request no analytics or advertising host [${mode}]`, async ({ page, requests, context, ga }) => {
      for (const url of ['/', PRODUCT, '/cart?action=show']) {
        await page.goto(url);
        await bannerVisible(page);
        await page.waitForTimeout(1200);
      }
      expect(requests.toHosts(), `tracking requests: ${requests.tracking().join(' ')}`).toEqual([]);
      expect(await trackingCookies(context)).toEqual([]);
      expect(ga.events('view_item')).toHaveLength(0);
      // Consent Mode default is recorded with every signal denied, and it caused no request.
      const def = ga.entries().find((e) => e.gtag && e.gtag[0] === 'consent' && e.gtag[1] === 'default');
      expect(def, 'a consent default is pushed').toBeTruthy();
      expect(def.gtag[2].analytics_storage).toBe('denied');
      expect(def.gtag[2].ad_storage).toBe('denied');
    });

    test(`1b. banner closed without a choice stores a rejection and requests nothing [${mode}]`, async ({ page, requests }) => {
      const closers = [
        () => page.locator('#scm-btn-close').click(),
        () => page.keyboard.press('Escape'),
        () => page.locator('#scm-overlay').click({ position: { x: 5, y: 5 } }),
      ];
      for (const close of closers) {
        await page.context().clearCookies();
        await page.goto(PRODUCT);
        await page.evaluate(() => { try { localStorage.removeItem('scm_consent'); } catch (e) {} });
        await page.reload();
        await bannerVisible(page);
        await close();
        await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
        const res = await page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('scm_consent'));
          return window.SCM_GCM.categories.filter((c) => !c.required).map((c) => s[c.id]);
        });
        expect(res.length).toBeGreaterThan(0);
        expect(res.every((v) => v === false)).toBe(true);
        await page.waitForTimeout(500);
      }
      expect(requests.toHosts(), `tracking requests: ${requests.tracking().join(' ')}`).toEqual([]);
    });

    test(`2. reject, then three more pages: no analytics or advertising host [${mode}]`, async ({ page, requests, context, ga }) => {
      await page.goto(PRODUCT);
      await choose(page, 'reject');
      for (const url of ['/', '/3-clothes', '/cart?action=show']) {
        await page.goto(url);
        await page.waitForTimeout(1000);
      }
      expect(requests.toHosts(), `tracking requests: ${requests.tracking().join(' ')}`).toEqual([]);
      expect(await trackingCookies(context)).toEqual([]);
      expect(ga.events('view_item')).toHaveLength(0);
      expect(ga.events('view_item_list')).toHaveLength(0);
    });

    test(`3. late grant on a product page: tag after the click, order update -> scm_consent_update -> view_item [${mode}]`, async ({ page, requests, ga }) => {
      await page.goto(PRODUCT);
      await bannerVisible(page);
      await page.waitForTimeout(1000);
      expect(requests.toHosts(), 'nothing requested before the click').toEqual([]);
      expect(ga.events('view_item')).toHaveLength(0);

      const mark = requests.mark();
      await page.locator('#scm-btn-accept-all').click();
      await waitReady(page);
      await expect.poll(() => requests.tracking(mark).filter((u) => tagUrl(mode).test(u)).length, { message: 'tag requested after the click' }).toBe(1);
      await ga.waitFor('view_item');

      const entries = ga.entries();
      const iUpdate = entries.findIndex(isUpdate);
      const iScm = entries.findIndex((e) => e && e.event === 'scm_consent_update');
      const iView = entries.findIndex(isEvent('view_item'));
      expect(iUpdate, 'consent update present').toBeGreaterThan(-1);
      expect(iScm).toBeGreaterThan(iUpdate);
      expect(iView).toBeGreaterThan(iScm);
      expect(ga.events('view_item')).toHaveLength(1);

      // The same choice saved again on the same page: nothing is delivered or requested twice.
      const markAgain = requests.mark();
      await reopen(page);
      await page.locator('#scm-btn-save').click();
      await page.waitForTimeout(800);
      expect(ga.events('view_item')).toHaveLength(1);
      expect(requests.tracking(markAgain).filter((u) => tagUrl(mode).test(u))).toHaveLength(0);
    });

    test(`3b. full journey after a grant on the product page delivers the six events [${mode}]`, async ({ page, ga, requests }) => {
      test.setTimeout(240000);
      await journey(page, { choice: 'all' });
      await ga.waitFor('purchase');
      const names = ['view_item', 'add_to_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase'];
      for (const n of names) {
        const count = ga.events(n).length;
        // begin_checkout is repeated by the 1.8.0 reloads; its exact count is asserted in group 6.
        if (n === 'begin_checkout') { expect(count, n).toBeGreaterThanOrEqual(1); } else { expect(count, n).toBe(1); }
      }
      const entries = ga.entries();
      const first = names.map((n) => entries.findIndex(isEvent(n)));
      expect([...first].sort((a, b) => a - b), `funnel order ${first}`).toEqual(first);
      expect(requests.tracking().some((u) => tagUrl(mode).test(u))).toBe(true);
      if (mode === 'gtag') {
        // everything granted in direct mode: the Ads conversion is sent once, next to the GA4 purchase
        const conv = ga.events('conversion');
        expect(conv).toHaveLength(1);
        expect(conv[0].raw.gtag[2].send_to).toBe(`${ADS}/E2ELABEL`);
        expect(ga.entries().some(isConfig(ADS))).toBe(true);
      }
      const p = ga.events('purchase')[0].params;
      expect(p).toHaveProperty('transaction_id');
      expect(p).toHaveProperty('items');
    });
  });
}

/* ---------- 4. analytics only (direct mode, Ads id set) ---------- */

test.describe('4. analytics only', () => {
  test.beforeAll(() => { setMode('gtag'); });

  test('analytics only loads GA4 only, GA4 purchase goes out, no Ads config or conversion; marketing later adds Ads', async ({ page, ga, requests }) => {
    test.setTimeout(240000);
    const confirmation = await journey(page, { choice: { analytics: true, marketing: false } });
    await ga.waitFor('purchase');
    expect(ga.events('purchase')).toHaveLength(1);
    expect(ga.events('conversion')).toHaveLength(0);
    expect(ga.entries().some(isConfig(ADS)), 'no Ads config').toBe(false);
    expect(ga.entries().some(isConfig(GA4)), 'GA4 config present').toBe(true);
    expect(requests.tracking().filter((u) => /doubleclick|googleadservices|googlesyndication|facebook/.test(u))).toEqual([]);
    expect(requests.tracking().some((u) => u.indexOf(`id=${ADS}`) !== -1), 'no gtag.js request for the Ads id').toBe(false);
    expect(await page.evaluate(() => !!window.fbq), 'Meta Pixel not loaded').toBe(false);
    const mode = await page.evaluate(() => window.SCM_GCM.mode);
    expect(mode.ads).toBe('none');
    expect(page.url()).toBe(confirmation);

    // Marketing granted later on the same page: the Ads config is added, gtag.js is not requested again.
    const mark = requests.mark();
    ga.clear();
    await reopen(page);
    const id = await categoryOf(page, 'ad_storage');
    await page.locator(`.scm-toggle[data-category-id="${id}"]`).click();
    await page.locator('#scm-btn-save').click();
    await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
    await expect.poll(() => ga.entries().some(isConfig(ADS))).toBe(true);
    expect(requests.tracking(mark).filter((u) => /gtag\/js/.test(u))).toHaveLength(0);
    expect(await page.evaluate(() => window.SCM_GCM.mode.ads)).toBe('gtag');
    // the delivered purchase is not repeated
    expect(ga.events('purchase')).toHaveLength(0);
  });
});

/* ---------- 5. withdrawal ---------- */

test.describe('5. withdrawal', () => {
  test.beforeAll(() => { setMode('gtag'); });

  test('analytics switched off: update denied, _ga cookie removed, next page requests nothing', async ({ page, context, ga, requests }) => {
    await page.goto('/');
    await choose(page, 'all');
    await waitReady(page);
    await expect.poll(() => requests.tracking().length).toBeGreaterThan(0);
    // the stub gtag.js sets no cookie of its own: plant what the real one would leave behind
    await context.addCookies([{ name: '_ga', value: 'GA1.1.111.222', domain: 'localhost', path: '/' }]);
    expect((await trackingCookies(context)).map((c) => c.name)).toContain('_ga');

    ga.clear();
    await reopen(page);
    await choose(page, { analytics: false, marketing: false });
    await expect.poll(() => ga.entries().some(isUpdate)).toBe(true);
    const upd = ga.entries().find(isUpdate).gtag[2];
    expect(upd.analytics_storage).toBe('denied');
    expect((await trackingCookies(context)).map((c) => c.name)).not.toContain('_ga');

    const mark = requests.mark();
    await page.goto(PRODUCT);
    await page.waitForTimeout(1200);
    expect(requests.toHosts(mark), `tracking requests: ${requests.tracking(mark).join(' ')}`).toEqual([]);
    expect(ga.events('view_item')).toHaveLength(0);
  });
});

/* ---------- 6. guards and funnel defects ---------- */

test.describe('6. purchase guard and checkout funnel', () => {
  test.beforeAll(() => { setMode('gtag'); });

  test('begin_checkout once across the step reloads; purchase survives a reload before the choice and is not repeated', async ({ page, ga, context }) => {
    test.setTimeout(240000);
    const confirmation = await journey(page, { choice: 'all' });
    await ga.waitFor('purchase');
    expect(ga.events('begin_checkout'), 'begin_checkout once per cart').toHaveLength(1);
    expect(ga.events('purchase')).toHaveLength(1);

    // Footer link on the order-confirmation page (the other page types are in group 7).
    await expect(page.locator('.scm-footer-link a.scm-reopen-link')).toHaveCount(1);

    // Reload after delivery: no second purchase.
    ga.clear();
    await page.reload();
    await page.waitForTimeout(1500);
    expect(ga.events('purchase'), 'no purchase after delivery + reload').toHaveLength(0);

    // Forget the choice and the delivery guard: the visitor reloads the confirmation before choosing.
    await context.clearCookies({ name: 'scm_consent' });
    await page.evaluate(() => { localStorage.removeItem('scm_consent'); sessionStorage.clear(); });
    ga.clear();
    await page.goto(confirmation);
    await bannerVisible(page);
    await page.reload();
    await bannerVisible(page);
    await page.waitForTimeout(1000);
    expect(ga.events('purchase'), 'purchase held while no choice exists').toHaveLength(0);

    await page.locator('#scm-btn-accept-all').click();
    await waitReady(page);
    await ga.waitFor('purchase');
    expect(ga.events('purchase')).toHaveLength(1);

    ga.clear();
    await page.reload();
    await page.waitForTimeout(1500);
    expect(ga.events('purchase'), 'guard recorded at delivery').toHaveLength(0);
  });

  test('a single, preselected payment option sends add_payment_info once without a click', async ({ page, ga }) => {
    test.setTimeout(240000);
    // Leave only the wire payment option: unhook the other two payment modules for this test.
    const hooked = sql(
      "SELECT hm.id_module, hm.id_shop, hm.id_hook, hm.position FROM ps_hook_module hm " +
      "JOIN ps_hook h ON h.id_hook=hm.id_hook JOIN ps_module m ON m.id_module=hm.id_module " +
      "WHERE h.name='paymentOptions' AND m.name IN ('ps_checkpayment','ps_cashondelivery')"
    );
    expect(hooked.length).toBeGreaterThan(0);
    hooked.forEach(([m, sh, h]) => sql(`DELETE FROM ps_hook_module WHERE id_module=${m} AND id_shop=${sh} AND id_hook=${h}`));
    try {
      await journey(page, { choice: 'all', toPayment: true });
      expect(await page.locator('input[name="payment-option"]').count(), 'one payment option left').toBe(1);
      await expect(page.locator('input[name="payment-option"]')).toBeChecked();
      const [pi] = await ga.waitFor('add_payment_info');
      expect(pi.params.payment_type).toBe('ps_wirepayment');
      await page.waitForTimeout(800);
      expect(ga.events('add_payment_info')).toHaveLength(1);
    } finally {
      hooked.forEach(([m, sh, h, pos]) => sql(`INSERT INTO ps_hook_module (id_module, id_shop, id_hook, position) VALUES (${m}, ${sh}, ${h}, ${pos})`));
    }
  });
});

/* ---------- 7. geometry, footer link, retention ---------- */

const STYLE_PROPS = ['backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'fontSize', 'fontWeight', 'boxShadow', 'color'];

async function bannerMetrics(page) {
  return page.evaluate((props) => {
    const out = {};
    for (const [k, id] of [['reject', 'scm-btn-reject-all'], ['accept', 'scm-btn-accept-all'], ['save', 'scm-btn-save']]) {
      const el = document.getElementById(id);
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out[k] = { style: props.map((p) => cs[p]), w: Math.round(r.width), h: Math.round(r.height), top: r.top, bottom: r.bottom };
    }
    const b = document.getElementById('scm-cookie-banner');
    const inner = b.querySelector('.scm-banner-inner');
    const br = b.getBoundingClientRect();
    out.box = { top: br.top, bottom: br.bottom };
    out.vh = window.innerHeight;
    return out;
  }, STYLE_PROPS);
}

for (const vp of [{ width: 390, height: 844 }, { width: 1366, height: 768 }]) {
  test(`7. reject / accept buttons are equal at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');
    await bannerVisible(page);
    const m = await bannerMetrics(page);
    expect(m.accept.style, 'same computed style, accept vs reject').toEqual(m.reject.style);
    expect(m.save.style, 'save is not more prominent').toEqual(m.reject.style);
    expect(m.accept.w).toBe(m.reject.w);
    expect(m.accept.h).toBe(m.reject.h);
    if (vp.width < 600) { expect(m.save.w).toBe(m.reject.w); expect(m.save.h).toBe(m.reject.h); }
    // all three buttons are in view without scrolling the banner or the page (the banner keeps them pinned)
    ['reject', 'accept', 'save'].forEach((k) => {
      expect(m[k].top, `${k} inside the banner`).toBeGreaterThanOrEqual(m.box.top);
      expect(m[k].bottom, `${k} inside the banner`).toBeLessThanOrEqual(m.box.bottom + 1);
      expect(m[k].top).toBeGreaterThanOrEqual(0);
      expect(m[k].bottom, `${k} inside the viewport`).toBeLessThanOrEqual(m.vh);
    });
  });
}

test.describe('7. footer link and retention', () => {
  test.beforeAll(() => { setMode('gtag'); stack('config', 'SHOW_FOOTER_LINK', '1'); });
  test.afterAll(() => { stack('config', 'SHOW_FOOTER_LINK', '1'); });

  test('footer link on home, category, product and cart; a click shows the banner with the saved toggles', async ({ page }) => {
    await page.goto('/');
    await choose(page, { analytics: true, marketing: false });
    for (const url of ['/', '/3-clothes', PRODUCT, '/cart?action=show']) {
      await page.goto(url);
      const link = page.locator('.scm-footer-link a.scm-reopen-link');
      await expect(link, url).toHaveCount(1);
      await link.scrollIntoViewIfNeeded();
      await expect(link).toHaveText(/Zmień ustawienia cookies|Change cookie settings/);
      await link.click();
      await bannerVisible(page);
      const aId = await categoryOf(page, 'analytics_storage');
      const mId = await categoryOf(page, 'ad_storage');
      await expect(page.locator(`.scm-toggle[data-category-id="${aId}"]`)).toHaveAttribute('aria-checked', 'true');
      await expect(page.locator(`.scm-toggle[data-category-id="${mId}"]`)).toHaveAttribute('aria-checked', 'false');
      await page.keyboard.press('Escape'); // existing choice: just dismiss
      await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
    }
  });

  test('setting off: no footer link, the reopen widget still opens the banner', async ({ page }) => {
    stack('config', 'SHOW_FOOTER_LINK', '0');
    try {
      await page.goto('/');
      await choose(page, 'reject');
      await page.reload();
      await expect(page.locator('.scm-footer-link')).toHaveCount(0);
      await expect(page.locator('a.scm-reopen-link')).toHaveCount(0);
      await reopen(page);
    } finally {
      stack('config', 'SHOW_FOOTER_LINK', '1');
    }
  });

  test('add-to-cart is not overlapped by a module element at 390x844 after the choice', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PRODUCT);
    await choose(page, 'all');
    const btn = page.locator('button[data-button-action="add-to-cart"]');
    await btn.scrollIntoViewIfNeeded();
    const hits = await page.evaluate(() => {
      const b = document.querySelector('button[data-button-action="add-to-cart"]').getBoundingClientRect();
      const over = [];
      document.querySelectorAll('.scm-reopen-widget, .scm-cookie-banner, .scm-overlay').forEach((el) => {
        const cs = getComputedStyle(el);
        if (el.hidden || cs.display === 'none' || cs.visibility === 'hidden') { return; }
        const r = el.getBoundingClientRect();
        if (r.width && r.height && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top) { over.push(el.className); }
      });
      return over;
    });
    expect(hits).toEqual([]);
  });

  test('the choice cookie lives 365 days', async ({ page, context }) => {
    await page.goto('/');
    await choose(page, 'all');
    const c = (await context.cookies()).find((x) => x.name === 'scm_consent');
    expect(c).toBeTruthy();
    const days = (c.expires - Date.now() / 1000) / 86400;
    expect(days).toBeGreaterThan(364);
    expect(days).toBeLessThanOrEqual(365.1);
  });

  test('a choice older than the lifetime shows the banner again', async ({ page }) => {
    await page.goto('/');
    await choose(page, 'all');
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('scm_consent'));
      s.__ts = new Date(Date.now() - 366 * 86400000).toISOString();
      localStorage.setItem('scm_consent', JSON.stringify(s));
      document.cookie = 'scm_consent=; Max-Age=0; path=/';
    });
    await page.reload();
    await bannerVisible(page);
  });
});
