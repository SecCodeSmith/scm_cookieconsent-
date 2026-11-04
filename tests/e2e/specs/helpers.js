// Shared helpers for the scm_cookieconsent GA4 e2e specs.
const { test: base, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');

const E2E_DIR = path.resolve(__dirname, '..');

/** Windows path → WSL /mnt path (the stack runs in WSL). */
function wslPath(p) {
  return p.replace(/^([A-Za-z]):\\/, (_, d) => `/mnt/${d.toLowerCase()}/`).replace(/\\/g, '/');
}

/** Run ./stack.sh <args...> inside WSL and return stdout. */
function stack(...args) {
  const quoted = args.map((a) => `'${String(a).replace(/'/g, `'\\''`)}'`).join(' ');
  const distro = process.env.SCM_E2E_WSL_DISTRO || 'Debian';
  const cmd = `cd '${wslPath(E2E_DIR)}' && ./stack.sh ${quoted}`;
  return execFileSync('wsl', ['-d', distro, '-e', 'bash', '-lc', cmd], { encoding: 'utf8' }).replace(/\0/g, '');
}

/** Run SQL in the shop DB; returns rows as arrays of strings. */
function sql(query) {
  return stack('sql', query).trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
}

/** Tag modes used by the specs. Ads settings stay empty (out of scope here). */
function setMode(mode) {
  if (mode === 'gtm') {
    stack('config', 'GTM_ID', 'GTM-E2ETEST');
    stack('config', 'GA4_ID', '');
  } else if (mode === 'gtag') {
    stack('config', 'GTM_ID', '');
    stack('config', 'GA4_ID', 'G-E2ETEST123');
  } else {
    throw new Error(`unknown mode ${mode}`);
  }
}

/**
 * Normalise one dataLayer entry: gtag() pushes an Arguments object → { gtag: [...] };
 * plain objects stay as they are.
 */
const RECORDER = () => {
  const dl = (window.dataLayer = window.dataLayer || []);
  const orig = dl.push;
  dl.push = function () {
    for (let i = 0; i < arguments.length; i++) {
      const e = arguments[i];
      let norm;
      try {
        norm = Object.prototype.toString.call(e) === '[object Arguments]'
          ? { gtag: JSON.parse(JSON.stringify(Array.prototype.slice.call(e))) }
          : JSON.parse(JSON.stringify(e));
      } catch (err) { norm = { unserialisable: String(e) }; }
      try { window.__scmRecord({ url: location.href, entry: norm }); } catch (err) {}
    }
    return orig.apply(this, arguments);
  };
};

/**
 * Fixture `ga`: every dataLayer push of every page in this test, in order, survives
 * navigations. External Google/Meta requests are blocked so no real hits are sent.
 */
const test = base.extend({
  ga: async ({ page }, use) => {
    const log = [];
    await page.exposeFunction('__scmRecord', (rec) => { log.push(rec); });
    await page.addInitScript(RECORDER);
    await page.route(/googletagmanager\.com|google-analytics\.com|doubleclick\.net|facebook\.net|connect\.facebook/, (r) => r.abort());
    page.on('dialog', (d) => { log.push({ url: page.url(), entry: { dialog: d.message() } }); d.dismiss(); });

    const api = {
      log,
      entries: () => log.map((r) => r.entry),
      /** Events by name, in either shape: GTM object ({event}) or gtag command ({gtag:['event', name, params]}). */
      events(name) {
        return log.filter((r) => {
          const e = r.entry;
          return (e && e.event === name) || (e && e.gtag && e.gtag[0] === 'event' && e.gtag[1] === name);
        }).map((r) => ({ url: r.url, raw: r.entry, params: r.entry.gtag ? r.entry.gtag[2] : (r.entry.ecommerce || r.entry) }));
      },
      async waitFor(name, count = 1) {
        await expect.poll(() => api.events(name).length, { message: `waiting for ${count}× ${name}` }).toBeGreaterThanOrEqual(count);
        return api.events(name);
      },
      clear() { log.length = 0; },
    };
    await use(api);
  },
});

/** Open a URL and dismiss the cookie banner when it shows (so it never blocks clicks). */
async function go(page, url) {
  await page.goto(url);
  await dismissBanner(page);
}

async function dismissBanner(page) {
  const btn = page.locator('#scm-btn-accept-all');
  try {
    await btn.waitFor({ state: 'visible', timeout: 3000 });
    await btn.click();
    await page.locator('#scm-cookie-banner').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  } catch (e) { /* banner not shown (consent already stored) */ }
}

/** Shop currency-independent SQL string escape. */
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "''");


/** Create (or reset) a 10% voucher with the given code, valid now, quantity 100. */
function createVoucher(code, percent = 10) {
  const c = esc(code);
  sql(`DELETE l FROM ps_cart_rule_lang l JOIN ps_cart_rule r ON r.id_cart_rule=l.id_cart_rule WHERE r.code='${c}'`);
  sql(`DELETE FROM ps_cart_rule WHERE code='${c}'`);
  sql(
    "INSERT INTO ps_cart_rule (id_customer,date_from,date_to,description,quantity,quantity_per_user,priority,partial_use,code," +
    "minimum_amount,minimum_amount_tax,minimum_amount_currency,minimum_amount_shipping,country_restriction,carrier_restriction," +
    "group_restriction,cart_rule_restriction,product_restriction,shop_restriction,free_shipping,reduction_percent,reduction_amount," +
    "reduction_tax,reduction_currency,reduction_product,reduction_exclude_special,gift_product,gift_product_attribute,highlight,active,date_add,date_upd) " +
    `VALUES (0,NOW()-INTERVAL 1 DAY,NOW()+INTERVAL 30 DAY,'e2e',100,100,1,0,'${c}',0,0,0,0,0,0,0,0,0,0,0,${percent},0,0,0,0,0,0,0,0,1,NOW(),NOW())`
  );
  sql("UPDATE ps_configuration SET value='1' WHERE name='PS_CART_RULE_FEATURE_ACTIVE'"); // vouchers UI is hidden otherwise
  sql(`INSERT INTO ps_cart_rule_lang (id_cart_rule,id_lang,name) SELECT id_cart_rule,1,'E2E voucher' FROM ps_cart_rule WHERE code='${c}'`);
}

/** Add a product to the cart from its product page (optionally picking a size). Returns after the cart modal shows. */
async function addToCart(page, productId = 1, { size } = {}) {
  await go(page, `/index.php?id_product=${productId}&controller=product`);
  if (size) { await page.selectOption('#group_1', { label: size }); }
  const btn = page.locator('button[data-button-action="add-to-cart"]');
  await expect(btn).toBeEnabled();
  await btn.click();
  await page.locator('#blockcart-modal').waitFor({ state: 'visible' });
}

/** Fill the guest personal-information form (no password) and continue. */
async function fillGuest(page, email) {
  const f = page.locator('#customer-form');
  await f.locator('input[name="id_gender"]').first().check();
  await f.locator('input[name="firstname"]').fill('Jan');
  await f.locator('input[name="lastname"]').fill('Testowy');
  await f.locator('input[name="email"]').fill(email);
  await f.locator('input[name="customer_privacy"]').check();
  if (await f.locator('input[name="psgdpr"]').count()) { await f.locator('input[name="psgdpr"]').check(); }
  await f.locator('button[name="continue"]').click();
}

/** Fill the address step (Poland) and continue. */
async function fillAddress(page) {
  const f = page.locator('.js-address-form');
  // The form defaults to another country; switching it re-renders the form via AJAX (Poland has no states).
  await f.locator('select[name="id_country"]').selectOption({ label: 'Poland' });
  await expect(f.locator('select[name="id_state"]')).toHaveCount(0);
  await f.locator('input[name="address1"]').fill('Testowa 1');
  await f.locator('input[name="postcode"]').fill('00-001');
  await f.locator('input[name="city"]').fill('Warszawa');
  await page.locator('button[name="confirm-addresses"]').click();
}

/** Choose a carrier by its visible name and continue to payment. */
async function chooseCarrier(page, name) {
  const row = page.locator('.delivery-option', { hasText: name }).first();
  await row.locator('input[name^="delivery_option"]').check();
  await page.locator('button[name="confirmDeliveryOption"]').click();
}

module.exports = { test, expect, stack, sql, setMode, go, dismissBanner, esc, createVoucher, addToCart, fillGuest, fillAddress, chooseCarrier };
