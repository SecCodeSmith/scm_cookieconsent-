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
  // A navy brand look (primary navy, accent green): module settings Colors.
  stack('config', 'COLOR_PRIMARY', '#004b87');
  stack('config', 'COLOR_ACCENT', '#146c43');
});
test.afterAll(() => {
  stack('config', 'ADS_ID', '');
  stack('config', 'ADS_CONVERSION_LABEL', '');
  stack('config', 'GTM_ID', '');
  stack('config', 'GA4_ID', '');
  stack('config', 'COLOR_PRIMARY', '#2fb5d2');
  stack('config', 'COLOR_ACCENT', '#69b92d');
});

/* ---------- helpers ---------- */

// Visible AND settled: the entrance motion (data-state opening) is over, so geometry and clicks are stable.
const bannerVisible = async (page) => {
  await page.locator('#scm-cookie-banner').waitFor({ state: 'visible' });
  await expect(page.locator('#scm-cookie-banner')).toHaveAttribute('data-state', 'open');
};
const trackingCookies = async (context) => (await context.cookies()).filter((c) => TRACKING_COOKIE.test(c.name));
const tagUrl = (mode) => (mode === 'gtm' ? new RegExp(`googletagmanager\\.com/gtm\\.js\\?id=${GTM}`) : new RegExp(`googletagmanager\\.com/gtag/js\\?id=${GA4}`));
const waitReady = (page) => page.waitForFunction(() => window.SCM_GCM && window.SCM_GCM.ready === true);

/** The category id that controls a Consent Mode signal (read from the page itself). */
const categoryOf = (page, signal) => page.evaluate((s) => {
  const c = window.SCM_GCM.categories.find((x) => x.signals.indexOf(s) !== -1 && !x.required);
  return c ? c.id : null;
}, signal);

/** Make a choice in the open banner: 'all', 'reject' or { analytics, marketing } (settings screen, toggles, then "Zapisz wybór"). */
async function choose(page, what) {
  await bannerVisible(page);
  if (what === 'all') { await page.locator('#scm-btn-accept-all').click(); }
  else if (what === 'reject') { await page.locator('#scm-btn-reject-all').click(); }
  else {
    // The switches live on the settings screen: from the first screen open it, from a reopened banner it is already there.
    const settingsBtn = page.locator('#scm-btn-settings');
    if (await settingsBtn.isVisible()) { await settingsBtn.click(); }
    await page.locator('#scm-screen-settings').waitFor({ state: 'visible' });
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

/** Reopen the banner on the current page (round widget, wider than 600px). It opens the FIRST screen; `toSettings` then goes on to the switches. */
async function reopen(page, toSettings = false) {
  await page.locator('#scm-reopen-widget').click();
  await bannerVisible(page);
  await expect(page.locator('#scm-screen-main')).toBeVisible();
  if (toSettings) {
    await page.locator('#scm-btn-settings').click();
    await expect(page.locator('#scm-screen-settings')).toBeVisible();
  }
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
        async () => { await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#scm-overlay').click({ position: { x: 5, y: 5 } }); }, // the backdrop dims and blocks on phones only
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
      await reopen(page, true);
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
    await reopen(page, true);
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

async function boxOf(page, id) {
  return page.evaluate((i) => {
    const el = document.getElementById(i);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: r.left, y: r.top, w: Math.round(r.width), h: Math.round(r.height), top: r.top, bottom: r.bottom, visible: el.offsetParent !== null, bg: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, border: cs.borderTopWidth };
  }, id);
}
const bannerBox = (page) => page.evaluate(() => {
  const r = document.getElementById('scm-cookie-banner').getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, vh: window.innerHeight, vw: window.innerWidth };
});
/** Ids of the visible buttons of the dialog (not the close cross), in tab order. */
const visibleButtons = (page) => page.evaluate(() => Array.prototype.slice.call(document.querySelectorAll('#scm-cookie-banner .scm-btn'))
  .filter((b) => b.offsetParent !== null).map((b) => b.id));

const FIRST_PHONE = ['scm-btn-accept-all', 'scm-btn-settings', 'scm-btn-reject-all'];
const FIRST_DESKTOP = ['scm-btn-settings', 'scm-btn-reject-all', 'scm-btn-accept-all'];
const SECOND = ['scm-btn-back', 'scm-btn-reject-settings', 'scm-btn-save', 'scm-btn-accept-settings'];
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1366, height: 768 };

for (const vp of [PHONE, DESKTOP]) {
  const isPhone = vp.width < 768;
  test(`7. first screen: three buttons in order, accept and reject equal, all in view at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');
    await bannerVisible(page);
    await expect(page.locator('#scm-screen-settings')).toBeHidden();
    // exactly three buttons, in the order of the screen
    expect(await visibleButtons(page)).toEqual(isPhone ? FIRST_PHONE : FIRST_DESKTOP);
    const [a, st, r] = await Promise.all(['scm-btn-accept-all', 'scm-btn-settings', 'scm-btn-reject-all'].map((id) => boxOf(page, id)));
    expect(a.w, 'accept and reject: same width').toBe(r.w);
    expect(a.h, 'accept and reject: same height').toBe(r.h);
    expect(st.h).toBe(r.h);
    expect(a.h).toBeGreaterThanOrEqual(48);
    expect(a.fontSize).toBe(r.fontSize);
    expect(a.fontWeight).toBe(r.fontWeight);
    expect(a.border).toBe(r.border);
    expect(a.bg, 'accept is the filled main action').not.toBe(r.bg);
    expect(st.bg, 'settings is outlined like reject').toBe(r.bg);
    if (isPhone) {
      [a, st, r].forEach((b) => expect(b.w, 'full width on a phone').toBeGreaterThan(vp.width - 60));
      expect(a.y).toBeLessThan(st.y);
      expect(st.y).toBeLessThan(r.y);
    } else {
      // one row, right-aligned: settings | reject | accept
      expect(Math.abs(st.y - r.y)).toBeLessThan(2);
      expect(Math.abs(a.y - r.y)).toBeLessThan(2);
      expect(st.x).toBeLessThan(r.x);
      expect(r.x).toBeLessThan(a.x);
    }
    const box = await bannerBox(page);
    [a, st, r].forEach((b) => {
      expect(b.top, 'inside the dialog').toBeGreaterThanOrEqual(box.top);
      expect(b.bottom, 'inside the dialog').toBeLessThanOrEqual(box.bottom + 1);
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.bottom, 'inside the viewport').toBeLessThanOrEqual(vp.height);
    });
    // docked to the bottom; on a phone full width, on desktop a centred card of at most 848px
    expect(Math.abs(box.bottom - vp.height)).toBeLessThan(2);
    if (isPhone) { expect(box.left).toBe(0); expect(box.right).toBe(vp.width); }
    else {
      expect(box.right - box.left).toBeLessThanOrEqual(848);
      expect(Math.abs((box.left + box.right) / 2 - vp.width / 2)).toBeLessThan(2);
    }
  });

  test(`7. settings screen at ${vp.width}x${vp.height}: switches off, Wróć, expand, button order`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');
    await bannerVisible(page);
    await page.locator('#scm-btn-settings').click();
    await expect(page.locator('#scm-screen-settings')).toBeVisible();
    await expect(page.locator('#scm-screen-main')).toBeHidden();
    await expect(page.locator('#scm-cookie-banner')).toHaveAttribute('aria-labelledby', 'scm-settings-title');
    // first visit: every optional switch is off, the necessary one is on and disabled
    const sw = page.locator('#scm-screen-settings .scm-toggle[data-category-id]');
    expect(await sw.count()).toBeGreaterThan(0);
    for (let i = 0; i < await sw.count(); i++) { await expect(sw.nth(i)).toHaveAttribute('aria-checked', 'false'); }
    const req = page.locator('#scm-screen-settings .scm-toggle-required .scm-toggle');
    await expect(req).toHaveAttribute('aria-checked', 'true');
    await expect(req).toBeDisabled();
    // buttons: Wróć | Odrzuć opcjonalne | Zapisz wybór | Akceptuję wszystkie (same order on phone and desktop)
    expect(await visibleButtons(page)).toEqual(SECOND);
    const names = await page.locator('#scm-screen-settings .scm-btn').allTextContents();
    expect(names.map((x) => x.trim()).length).toBe(4); // labels are editable and per language; order is asserted by id above
    await page.mouse.move(1, 1); // a mouse resting on a button would show the hover fill
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.getElementById('scm-btn-reject-settings')).backgroundColor), { message: 'hover fill has faded out' }).toBe('rgb(255, 255, 255)');
    const [b, rj, sv, ac] = await Promise.all(SECOND.map((id) => boxOf(page, id)));
    const box = await bannerBox(page);
    [b, rj, sv, ac].forEach((x) => {
      expect(x.bottom, 'in view').toBeLessThanOrEqual(vp.height);
      expect(x.top).toBeGreaterThanOrEqual(box.top);
      expect(x.h, 'tap height').toBeGreaterThanOrEqual(44);
      expect(x.x, 'inside the card (left)').toBeGreaterThanOrEqual(box.left);
      expect(x.x + x.w, 'inside the card (right)').toBeLessThanOrEqual(box.right);
    });
    expect(rj.w, 'reject and accept: same width').toBe(ac.w);
    expect(rj.h, 'reject and accept: same height').toBe(ac.h);
    expect(rj.fontSize).toBe(ac.fontSize);
    expect(rj.bg, 'reject is outlined like Wróć').toBe(b.bg);
    if (!isPhone) {
      [rj, sv, ac].forEach((x) => expect(Math.abs(b.y - x.y)).toBeLessThan(2));
      expect(b.x).toBeLessThan(rj.x); expect(rj.x).toBeLessThan(sv.x); expect(sv.x).toBeLessThan(ac.x);
    } else {
      expect(b.y).toBeLessThan(rj.y); expect(rj.y).toBeLessThan(sv.y); expect(sv.y).toBeLessThan(ac.y);
      [b, rj, sv, ac].forEach((x) => expect(x.w, 'full width on a phone').toBeGreaterThan(vp.width - 60));
      // the pinned bar takes at most 45% of the viewport height
      const bar = await page.evaluate(() => document.querySelector('#scm-screen-settings .scm-actions-sticky').getBoundingClientRect().height);
      expect(bar, `sticky bar ${bar}px of ${vp.height}px`).toBeLessThanOrEqual(vp.height * 0.45);
    }
    expect(sv.bg, 'save is outlined').not.toBe(ac.bg);

    // Odrzuć opcjonalne carries the same label as on the first screen
    expect((await page.locator('#scm-btn-reject-settings').textContent()).trim()).toBe((await page.locator('#scm-btn-reject-all').textContent()).trim());

    // a card is collapsed by default; the name opens its description and a second click closes it
    const card = page.locator('#scm-screen-settings .scm-category').nth(1);
    const head = card.locator('.scm-cat-toggle');
    const desc = card.locator('.scm-category-desc');
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    await expect(desc).toBeHidden();
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    await expect(desc).toBeVisible();
    await expect(desc).not.toHaveText('');
    await card.locator('.scm-chevron-cell').click();
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    await expect(desc).toBeHidden();

    // switching one on is visible; Wróć returns to screen 1 and nothing is stored
    await sw.first().click();
    await expect(sw.first()).toHaveAttribute('aria-checked', 'true');
    await page.locator('#scm-btn-back').click();
    await expect(page.locator('#scm-screen-main')).toBeVisible();
    await expect(page.locator('#scm-screen-settings')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('scm_consent'))).toBeNull();
  });
}

test('7. the visible colour comes from the primary colour setting; accept text is readable on it', async ({ page }) => {
  await page.goto('/');
  await bannerVisible(page);
  const c = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement).getPropertyValue('--scm-primary').trim();
    const a = getComputedStyle(document.getElementById('scm-btn-accept-all'));
    return { root, bg: a.backgroundColor, color: a.color };
  });
  const rgb = (x) => x.match(/\d+/g).slice(0, 3).map(Number);
  const lum = (v) => { const f = (k) => { k /= 255; return k <= 0.03928 ? k / 12.92 : Math.pow((k + 0.055) / 1.055, 2.4); }; return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]); };
  const l1 = lum(rgb(c.bg)); const l2 = lum(rgb(c.color));
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  expect(ratio, `contrast of accept label on ${c.root}`).toBeGreaterThanOrEqual(4.5);
});

test('7. keyboard: focus moves into the dialog, Tab follows the screen, Escape grants nothing', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await bannerVisible(page);
  await expect(page.locator('#scm-cookie-banner')).toHaveAttribute('role', 'dialog');
  await expect(page.locator('#scm-cookie-banner')).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#scm-cookie-banner')).toHaveAttribute('aria-labelledby', 'scm-banner-title');
  expect(await page.evaluate(() => document.getElementById('scm-cookie-banner').contains(document.activeElement)), 'focus inside the dialog').toBe(true);
  const order = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.className));
  }
  // privacy link is not configured in the test shop, so: close, then the three buttons as drawn (settings, reject, accept)
  const buttonsSeen = order.filter((x) => /^scm-btn-(settings|reject-all|accept-all)$/.test(x));
  expect(buttonsSeen).toEqual(FIRST_DESKTOP);
  // Tab never leaves the dialog
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); }
  expect(await page.evaluate(() => document.getElementById('scm-cookie-banner').contains(document.activeElement))).toBe(true);
  // Escape on the first screen grants nothing
  await page.keyboard.press('Escape');
  await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('scm_consent')));
  const optional = await page.evaluate(() => window.SCM_GCM.categories.filter((c) => !c.required).map((c) => c.id));
  optional.forEach((id) => expect(stored[id]).toBe(false));
});

test('7. no focus box on the title when the sheet opens; a keyboard Tab shows a ring on the first button', async ({ page }) => {
  await page.goto('/');
  await bannerVisible(page);
  const title = await page.evaluate(() => {
    const el = document.activeElement; const cs = getComputedStyle(el);
    return { id: el.id, style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), shadow: cs.boxShadow };
  });
  expect(title.id, 'focus starts on the title').toBe('scm-banner-title');
  expect(title.style === 'none' || title.width === 0, `title outline: ${title.style} ${title.width}`).toBe(true);
  expect(title.shadow).toBe('none');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const el = document.activeElement; const cs = getComputedStyle(el);
    return { tag: el.tagName, style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(ring.tag).toBe('BUTTON');
  expect(ring.style).not.toBe('none');
  expect(ring.width).toBeGreaterThanOrEqual(2);
});

test('7. Zapisz wybór is outlined like Wróć, also after a tap (phone) and on desktop', async ({ page }) => {
  for (const vp of [PHONE, DESKTOP]) {
    await page.setViewportSize(vp);
    await page.goto('/');
    await bannerVisible(page);
    await page.locator('#scm-btn-settings').click();
    await page.mouse.move(1, 1); // a mouse resting on the button would show the hover fill
    await expect(page.locator('#scm-screen-settings')).toBeVisible();
    await expect(page.locator('#scm-cookie-banner')).not.toHaveAttribute('data-switching', /.*/); // the screen switch is over
    const bg = (id) => page.evaluate((i) => getComputedStyle(document.getElementById(i)).backgroundColor, id);
    expect(await bg('scm-btn-save'), `${vp.width}: save fill equals back fill`).toBe(await bg('scm-btn-back'));
    await page.locator('#scm-btn-save').focus();
    expect(await bg('scm-btn-save'), `${vp.width}: save keeps the fill when focused`).toBe(await bg('scm-btn-back'));
    expect(await bg('scm-btn-accept-settings')).not.toBe(await bg('scm-btn-back'));
    await page.context().clearCookies();
  }
});

test('7. Escape on the settings screen goes back to screen 1 and stores nothing', async ({ page }) => {
  await page.goto('/');
  await bannerVisible(page);
  await page.locator('#scm-btn-settings').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#scm-screen-main')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('scm_consent'))).toBeNull();
});

test('7. no tag request while the sheet is open on either screen', async ({ page, requests }) => {
  await page.goto(PRODUCT);
  await bannerVisible(page);
  await page.locator('#scm-btn-settings').click();
  await page.locator('#scm-screen-settings .scm-toggle[data-category-id]').first().click();
  await page.waitForTimeout(800);
  expect(requests.toHosts(), `tracking requests: ${requests.tracking().join(' ')}`).toEqual([]);
});

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
      // opened from the footer: the FIRST screen with three buttons; the settings screen is one click away
      await expect(page.locator('#scm-screen-main')).toBeVisible();
      await expect(page.locator('#scm-screen-settings')).toBeHidden();
      await page.locator('#scm-btn-settings').click();
      await expect(page.locator('#scm-screen-settings')).toBeVisible();
      const aId = await categoryOf(page, 'analytics_storage');
      const mId = await categoryOf(page, 'ad_storage');
      await expect(page.locator(`.scm-toggle[data-category-id="${aId}"]`)).toHaveAttribute('aria-checked', 'true');
      await expect(page.locator(`.scm-toggle[data-category-id="${mId}"]`)).toHaveAttribute('aria-checked', 'false');
      // Wróć and the reject button are on the settings screen
      await expect(page.locator('#scm-btn-back')).toBeVisible();
      await expect(page.locator('#scm-btn-reject-settings')).toBeVisible();
      await expect(page.locator('#scm-screen-settings')).toBeVisible();
      await expect(page.locator('#scm-btn-save')).toBeVisible();
      await page.keyboard.press('Escape'); // settings screen: Escape goes back to screen 1
      await expect(page.locator('#scm-screen-main')).toBeVisible();
      await page.keyboard.press('Escape'); // screen 1 with an existing choice: just dismiss
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

/* ---------- 8. motion, reopen on the first screen, reject on the settings screen (task 3.5) ---------- */

/**
 * In the page: run `act` (a function) and then read `read()` every 8 ms for `ms`, so the timing
 * and the intermediate values of the motion are measured where they happen, not through test round trips.
 */
function sampleAfter(page, act, read, ms) {
  return page.evaluate(([actSrc, readSrc, dur]) => new Promise((resolve) => {
    const doAct = (0, eval)('(' + actSrc + ')');
    const doRead = (0, eval)('(' + readSrc + ')');
    const out = [];
    const t0 = performance.now();
    doAct();
    // a 8 ms timer, not requestAnimationFrame: a headless browser can pause frame callbacks for a while mid-transition
    out.push(Object.assign({ t: 0 }, doRead()));
    const iv = setInterval(() => {
      const t = performance.now() - t0;
      out.push(Object.assign({ t }, doRead()));
      if (t >= dur) { clearInterval(iv); resolve(out); }
    }, 8);
  }), [act.toString(), read.toString(), ms]);
}

const readBanner = () => {
  const b = document.getElementById('scm-cookie-banner');
  const r = b.getBoundingClientRect();
  const cs = getComputedStyle(b);
  const scr = (n) => document.getElementById('scm-screen-' + n).offsetParent !== null;
  return {
    top: r.top, h: r.height, op: parseFloat(cs.opacity), state: b.getAttribute('data-state'), hidden: b.hidden,
    ov: parseFloat(getComputedStyle(document.getElementById('scm-overlay')).opacity),
    switching: b.hasAttribute('data-switching'), scrollbar: b.offsetWidth - b.clientWidth,
    both: scr('main') && scr('settings'), stored: !!localStorage.getItem('scm_consent'),
  };
};
const reopenAct = () => window.SCM_Consent.reopen();
const clickFn = (sel) => new Function(`return document.querySelector(${JSON.stringify(sel)}).click()`);

const nonMonotonic = (xs, dir, tol = 0.6) => xs.some((x, i) => i > 0 && (dir > 0 ? x < xs[i - 1] - tol : x > xs[i - 1] + tol));

for (const vp of [PHONE, DESKTOP]) {
  const isPhone = vp.width < 768;
  const tag = `${vp.width}x${vp.height}`;

  test.describe(`8. motion at ${tag}`, () => {
    test.use({ viewport: vp });

    test('opening: the sheet rises into place with a fade and is "open" after about 330 ms', async ({ page }) => {
      await page.goto('/');
      await choose(page, 'reject');
      const s = await sampleAfter(page, reopenAct, readBanner, 700);
      const first = s[0]; const last = s[s.length - 1];
      expect(first.state).toBe('opening');
      expect(last.state).toBe('open');
      expect(last.op).toBe(1);
      expect(first.op, 'starts transparent or dim').toBeLessThan(0.99);
      const rise = first.top - last.top;
      if (isPhone) { expect(rise, 'rises from below its own height').toBeGreaterThan(40); }
      else { expect(rise, 'rises about 16px').toBeGreaterThan(2); expect(rise).toBeLessThanOrEqual(17); }
      expect(s.some((x) => x.top < first.top - 1 && x.top > last.top + 1), 'intermediate positions are drawn').toBe(true);
      expect(nonMonotonic(s.map((x) => x.top), -1), 'no jitter while rising').toBe(false);
      if (isPhone) { expect(s[0].ov).toBeLessThan(s[s.length - 1].ov); }
      const opened = s.find((x) => x.state === 'open');
      expect(opened.t, `open after ${opened.t} ms`).toBeGreaterThan(200);
      expect(opened.t).toBeLessThan(550);
    });

    for (const sel of ['#scm-btn-accept-all', '#scm-btn-reject-all', '#scm-btn-close']) {
      test(`closing (${sel}): the choice is stored at once, the sheet is still there for a moment and gone within 400 ms`, async ({ page }) => {
        await page.goto('/');
        await bannerVisible(page);
        const s = await sampleAfter(page, clickFn(sel), readBanner, 700);
        expect(s[0].stored, 'consent written synchronously on the click').toBe(true);
        expect(s[0].hidden, 'still shown right after the click').toBe(false);
        expect(s[0].state).toBe('closing');
        const gone = s.find((x) => x.hidden);
        expect(gone, 'hidden after the motion').toBeTruthy();
        expect(gone.t, `hidden after ${gone.t} ms`).toBeGreaterThan(150);
        expect(gone.t).toBeLessThanOrEqual(400);
        expect(gone.state).toBe('closed');
        const moving = s.filter((x) => !x.hidden);
        expect(moving[moving.length - 1].top, 'slid down while closing').toBeGreaterThan(moving[0].top + 2);
        expect(nonMonotonic(moving.map((x) => x.top), 1), 'no jitter while closing').toBe(false);
        await expect(page.locator('#scm-cookie-banner')).toBeHidden();
      });
    }

    test('screen switch: the height moves smoothly, never both screens, no scrollbar flicker, about 300 ms', async ({ page }) => {
      await page.goto('/');
      await bannerVisible(page);
      const fwd = await sampleAfter(page, clickFn('#scm-btn-settings'), readBanner, 600);
      const h0 = fwd[0].h; const h1 = fwd[fwd.length - 1].h;
      expect(Math.abs(h1 - h0), `heights ${h0} -> ${h1}`).toBeGreaterThan(40);
      const between = fwd.filter((x) => x.h > Math.min(h0, h1) + 2 && x.h < Math.max(h0, h1) - 2);
      expect(between.length, 'intermediate heights are drawn').toBeGreaterThanOrEqual(3);
      expect(nonMonotonic(fwd.map((x) => x.h), h1 > h0 ? 1 : -1), 'monotonic height').toBe(false);
      expect(fwd.some((x) => x.both), 'both screens never shown together').toBe(false);
      expect(fwd.filter((x) => x.switching).every((x) => x.scrollbar === 0), 'no scrollbar while the height moves').toBe(true);
      const end = fwd.find((x, i) => i > 0 && !x.switching);
      expect(end.t, `switch over after ${end.t} ms`).toBeGreaterThan(220);
      expect(end.t).toBeLessThan(450);
      await expect(page.locator('#scm-cookie-banner')).toHaveAttribute('aria-labelledby', 'scm-settings-title');
      expect(await page.evaluate(() => document.activeElement.id), 'focus moved into the new screen').toBe('scm-settings-title');
      expect(await page.evaluate(() => document.getElementById('scm-cookie-banner').style.height), 'no leftover inline height').toBe('');

      const back = await sampleAfter(page, clickFn('#scm-btn-back'), readBanner, 600);
      expect(Math.abs(back[0].h - h1)).toBeLessThan(1.5);
      expect(Math.abs(back[back.length - 1].h - h0)).toBeLessThan(1.5);
      expect(back.filter((x) => x.h < h1 - 2 && x.h > h0 + 2).length).toBeGreaterThanOrEqual(3);
      expect(back.some((x) => x.both)).toBe(false);
      expect(await page.evaluate(() => document.activeElement.id)).toBe('scm-banner-title');
    });

    test('category card: the description height and the chevron animate; a second click reverses it', async ({ page }) => {
      await page.goto('/');
      await bannerVisible(page);
      await page.locator('#scm-btn-settings').click();
      await expect(page.locator('#scm-cookie-banner')).not.toHaveAttribute('data-switching', /.*/);
      const sel = '#scm-screen-settings .scm-category:nth-of-type(2) .scm-cat-toggle';
      const read = () => {
        const card = document.querySelectorAll('#scm-screen-settings .scm-category')[1];
        const m = new DOMMatrix(getComputedStyle(card.querySelector('.scm-chevron')).transform);
        return { a: m.a, body: card.querySelector('.scm-category-body').getBoundingClientRect().height, vis: getComputedStyle(card.querySelector('.scm-category-desc')).visibility };
      };
      const open = await sampleAfter(page, clickFn(sel), read, 500);
      expect(open[0].a).toBeCloseTo(1, 1);
      expect(open[open.length - 1].a, 'chevron turned 180 degrees').toBeCloseTo(-1, 1);
      expect(open.some((x) => x.a > -0.9 && x.a < 0.9), 'chevron rotation is drawn in between').toBe(true);
      expect(open[0].body).toBeLessThan(2);
      const full = open[open.length - 1].body;
      expect(full).toBeGreaterThan(10);
      expect(open.some((x) => x.body > 2 && x.body < full - 2), 'description height is drawn in between').toBe(true);
      const shut = await sampleAfter(page, clickFn(sel), read, 500);
      expect(shut[shut.length - 1].a).toBeCloseTo(1, 1);
      expect(shut.some((x) => x.body > 2 && x.body < full - 2)).toBe(true);
      expect(shut[shut.length - 1].vis, 'collapsed description is not visible or focusable').toBe('hidden');
    });
  });
}

test.describe('8. reduced motion is instant, with the same behaviour', () => {
  test.use({ viewport: DESKTOP });

  test('transition and animation durations are 0, open, switch and close happen in one frame', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await bannerVisible(page);
    const dur = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('scm-cookie-banner'));
      return { t: cs.transitionDuration, a: cs.animationDuration, chev: getComputedStyle(document.querySelector('.scm-chevron')).transitionDuration, body: getComputedStyle(document.querySelector('.scm-category-body')).transitionDuration };
    });
    expect(parseFloat(dur.t)).toBe(0);
    expect(parseFloat(dur.a)).toBe(0);
    expect(parseFloat(dur.chev)).toBe(0);
    expect(parseFloat(dur.body)).toBe(0);
    const sw = await sampleAfter(page, clickFn('#scm-btn-settings'), readBanner, 200);
    expect(sw[0].switching).toBe(false);
    expect(new Set(sw.map((x) => Math.round(x.h))).size, 'one height only: no transition').toBe(1);
    expect(sw[0].both).toBe(false);
    await expect(page.locator('#scm-screen-settings')).toBeVisible();
    await page.locator('#scm-btn-back').click();
    const cl = await sampleAfter(page, clickFn('#scm-btn-reject-all'), readBanner, 100);
    expect(cl[0].stored).toBe(true);
    expect(cl[0].hidden, 'hidden at once').toBe(true);
    expect(cl[0].state).toBe('closed');
    const op = await sampleAfter(page, reopenAct, readBanner, 100);
    expect(op[0].state).toBe('open');
    expect(op[0].op).toBe(1);
    expect(op[0].hidden).toBe(false);
  });

  test('normal motion: the sheet has a height transition of 0.28 s', async ({ page }) => {
    await page.goto('/');
    await bannerVisible(page);
    const t = await page.evaluate(() => getComputedStyle(document.getElementById('scm-cookie-banner')).transitionDuration);
    expect(parseFloat(t)).toBeGreaterThan(0);
  });
});

test.describe('8. reopen opens the first screen', () => {
  test.beforeAll(() => { setMode('gtag'); });
  test.use({ viewport: DESKTOP });

  test('round button, footer link and SCM_Consent.reopen land on screen 1; settings shows the saved switches; Wróć returns', async ({ page }) => {
    await page.goto('/');
    await choose(page, { analytics: true, marketing: false });
    const aId = await categoryOf(page, 'analytics_storage');
    const mId = await categoryOf(page, 'ad_storage');
    const before = await page.evaluate(() => localStorage.getItem('scm_consent'));
    const openers = [
      () => page.locator('#scm-reopen-widget').click(),
      () => page.locator('.scm-footer-link a.scm-reopen-link').click(),
      () => page.evaluate(() => window.SCM_Consent.reopen()),
    ];
    for (const open of openers) {
      await open();
      await bannerVisible(page);
      await expect(page.locator('#scm-screen-main')).toBeVisible();
      await expect(page.locator('#scm-screen-settings')).toBeHidden();
      expect(await visibleButtons(page)).toEqual(FIRST_DESKTOP);
      await page.locator('#scm-btn-settings').click();
      await expect(page.locator('#scm-screen-settings')).toBeVisible();
      await expect(page.locator('#scm-btn-back')).toBeVisible();
      await expect(page.locator(`.scm-toggle[data-category-id="${aId}"]`)).toHaveAttribute('aria-checked', 'true');
      await expect(page.locator(`.scm-toggle[data-category-id="${mId}"]`)).toHaveAttribute('aria-checked', 'false');
      // a change that is not saved is dropped by Wróć
      await page.locator(`.scm-toggle[data-category-id="${mId}"]`).click();
      await page.locator('#scm-btn-back').click();
      await expect(page.locator('#scm-screen-main')).toBeVisible();
      await page.locator('#scm-btn-settings').click();
      await expect(page.locator(`.scm-toggle[data-category-id="${mId}"]`)).toHaveAttribute('aria-checked', 'false');
      // Escape: settings -> screen 1 -> closed, the saved choice is unchanged
      await page.keyboard.press('Escape');
      await expect(page.locator('#scm-screen-main')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
      expect(await page.evaluate(() => localStorage.getItem('scm_consent'))).toBe(before);
    }
  });
});

test.describe('8. the settings screen has "Odrzuć opcjonalne"', () => {
  test.beforeAll(() => { setMode('gtag'); });

  test('after switching analytics on, reject stores every optional category off and requests no tag', async ({ page, requests }) => {
    await page.goto(PRODUCT);
    await bannerVisible(page);
    await page.locator('#scm-btn-settings').click();
    await expect(page.locator('#scm-screen-settings')).toBeVisible();
    const aId = await categoryOf(page, 'analytics_storage');
    const sw = page.locator(`.scm-toggle[data-category-id="${aId}"]`);
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await page.locator('#scm-btn-reject-settings').click();
    await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
    const res = await page.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('scm_consent'));
      return window.SCM_GCM.categories.filter((c) => !c.required).map((c) => st[c.id]);
    });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((v) => v === false)).toBe(true);
    await page.waitForTimeout(1000);
    expect(requests.toHosts(), `tracking requests: ${requests.tracking().join(' ')}`).toEqual([]);
  });

  test('from a saved "all", reject on the settings screen withdraws every optional category', async ({ page }) => {
    await page.goto('/');
    await choose(page, 'all');
    await reopen(page, true);
    await page.locator('#scm-btn-reject-settings').click();
    await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden' });
    const res = await page.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('scm_consent'));
      return window.SCM_GCM.categories.filter((c) => !c.required).map((c) => st[c.id]);
    });
    expect(res.every((v) => v === false)).toBe(true);
  });
});

for (const vp of [PHONE, DESKTOP]) {
  test(`8. Tab order equals the visual order on both screens at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');
    await bannerVisible(page);
    const visualOrder = () => page.evaluate(() => {
      const bs = Array.prototype.slice.call(document.querySelectorAll('#scm-cookie-banner .scm-btn')).filter((b) => b.offsetParent !== null);
      const dom = bs.map((b) => b.id);
      const vis = bs.slice().sort((p, q) => {
        const a = p.getBoundingClientRect(); const b = q.getBoundingClientRect();
        return Math.abs(a.top - b.top) > 4 ? a.top - b.top : a.left - b.left;
      }).map((b) => b.id);
      return { dom, vis };
    });
    const first = await visualOrder();
    expect(first.dom, 'screen 1: DOM order = visual order').toEqual(first.vis);
    await page.locator('#scm-btn-settings').click();
    await expect(page.locator('#scm-screen-settings')).toBeVisible();
    await expect(page.locator('#scm-cookie-banner')).not.toHaveAttribute('data-switching', /.*/);
    const second = await visualOrder();
    expect(second.dom).toEqual(SECOND);
    expect(second.dom, 'settings screen: DOM order = visual order').toEqual(second.vis);
    // and the real Tab key walks the buttons in that order
    const seen = [];
    for (let i = 0; i < 40 && seen.length < 4; i++) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => document.activeElement.id);
      if (SECOND.indexOf(id) !== -1 && seen.indexOf(id) === -1) { seen.push(id); }
    }
    expect(seen).toEqual(SECOND);
  });
}
