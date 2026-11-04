// Tasks 5.1 / 5.2 - sign_up and login events across real redirects, no personal data.
const crypto = require('crypto');
const { test, expect, setMode, sql, go } = require('./helpers');

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

const EMAIL = `acct-${Date.now()}@example.com`;
const PASSWORD = 'e2e-Passw0rd-Strong!42';

test.beforeAll(() => { setMode('gtag'); });
test.afterAll(() => { setMode('gtag'); });

async function login(page, email, password) {
  await go(page, '/login?back=my-account');
  await page.locator('#login-form input[name="email"]').fill(email);
  await page.locator('#login-form input[name="password"]').fill(password);
  await page.locator('#submit-login').click();
}

async function logout(page) {
  await page.locator('a.logout').first().click();
  await page.waitForLoadState('load');
}

/** Assert no event of the log carries personal data derived from the account. */
function expectNoPersonalData(ga, email) {
  const [[id]] = sql(`SELECT id_customer FROM ps_customer WHERE email='${email}'`);
  const json = JSON.stringify(ga.entries()).toLowerCase();
  expect(json).not.toContain(email.toLowerCase());
  expect(json).not.toContain(encodeURIComponent(email).toLowerCase());
  for (const alg of ['sha256', 'sha1', 'md5']) {
    expect(json).not.toContain(crypto.createHash(alg).update(email.toLowerCase()).digest('hex'));
  }
  expect(json).not.toMatch(/"(user_id|user_data|customer_id|id_customer|email)"/);
  ['login', 'sign_up'].forEach((name) => {
    ga.events(name).forEach((e) => { const { event, ...rest } = e.params; expect(rest).toEqual({ method: 'PrestaShop' }); });
  });
  // the numeric customer id must not appear as a value of a login/sign_up event
  ['login', 'sign_up'].forEach((name) => {
    ga.events(name).forEach((e) => expect(JSON.stringify(e.raw)).not.toMatch(new RegExp(`[:,\\[]"?${id}"?[,\\]}]`)));
  });
}

test('registration emits exactly one sign_up on the next page and no login', async ({ page, ga }) => {
  await go(page, '/registration');
  const f = page.locator('#customer-form');
  await f.locator('input[name="id_gender"]').first().check();
  await f.locator('input[name="firstname"]').fill('Anna');
  await f.locator('input[name="lastname"]').fill('Konto');
  await f.locator('input[name="email"]').fill(EMAIL);
  await f.locator('input[name="password"]').fill(PASSWORD);
  await f.locator('input[name="customer_privacy"]').check();
  if (await f.locator('input[name="psgdpr"]').count()) { await f.locator('input[name="psgdpr"]').check(); }
  await f.locator('footer button[type="submit"]').click();
  await page.waitForURL((u) => !/registration|create_account/.test(u.href));

  const [s] = await ga.waitFor('sign_up');
  await page.waitForTimeout(1000);
  expect(ga.events('sign_up')).toHaveLength(1);
  expect(ga.events('login')).toHaveLength(0);
  expect(s.params).toEqual({ method: 'PrestaShop' });
  expect(s.raw.gtag[0]).toBe('event');
  expectNoPersonalData(ga, EMAIL);

  // reload: pending event was discarded
  ga.clear();
  await page.reload();
  await page.waitForTimeout(1500);
  expect(ga.events('sign_up')).toHaveLength(0);
  expect(ga.events('login')).toHaveLength(0);
});

test('logout then login emits exactly one login; reload emits none', async ({ page, ga }) => {
  await login(page, EMAIL, PASSWORD);
  await page.waitForURL(/my-account/);
  const [l] = await ga.waitFor('login');
  await page.waitForTimeout(1000);
  expect(ga.events('login')).toHaveLength(1);
  expect(ga.events('sign_up')).toHaveLength(0);
  expect(l.params).toEqual({ method: 'PrestaShop' });
  expect(l.url).toContain('my-account');
  expectNoPersonalData(ga, EMAIL);

  ga.clear();
  await page.reload();
  await page.waitForTimeout(1500);
  expect(ga.events('login')).toHaveLength(0);

  // logout + login again in the same browser session -> a new login event
  await logout(page);
  ga.clear();
  await login(page, EMAIL, PASSWORD);
  await page.waitForURL(/my-account/);
  await ga.waitFor('login');
  await page.waitForTimeout(500);
  expect(ga.events('login')).toHaveLength(1);
});

test('wrong password emits no login', async ({ page, ga }) => {
  await login(page, EMAIL, 'definitely-wrong-password');
  await expect(page.locator('.alert-danger, .help-block li').first()).toBeVisible();
  await page.waitForTimeout(1000);
  expect(ga.events('login')).toHaveLength(0);
  // navigating on does not surface a stale pending login either
  await go(page, '/');
  await page.waitForTimeout(1000);
  expect(ga.events('login')).toHaveLength(0);
});

test.describe('GTM mode', () => {
  test.beforeAll(() => { setMode('gtm'); });

  test('login is a flat object without ecommerce and without a preceding ecommerce:null', async ({ page, ga }) => {
    await login(page, EMAIL, PASSWORD);
    await page.waitForURL(/my-account/);
    await ga.waitFor('login');
    const mode = await page.evaluate(() => window.SCM_GCM && window.SCM_GCM.mode);
    expect(mode.ecommerce).toBe('gtm');
    const entries = ga.entries();
    const i = entries.findIndex((e) => e.event === 'login');
    expect(entries[i]).toEqual({ event: 'login', method: 'PrestaShop' });
    expect(entries[i]).not.toHaveProperty('ecommerce');
    expect(entries[i - 1]).not.toEqual({ ecommerce: null });
    expect(ga.events('login')).toHaveLength(1);
    expectNoPersonalData(ga, EMAIL);
  });
});
