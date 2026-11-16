// Task 3.5 - the back-office module configuration renders without Smarty/PHP errors
// and shows the updated GA4 documentation (Integrations list, GTM how-to, GDPR help tab).
const { test, expect, sql } = require('./helpers');

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

const ADMIN = '/admin-e2e/';
const ERROR_RE = /(Smarty|Fatal error|Parse error|Uncaught|Warning:|Notice:|Deprecated:|Undefined (variable|index|array key)|SmartyException|Syntax error|Whoops|500 Internal)/i;

let page;
let configureUrl;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ baseURL: 'http://localhost:' + (process.env.SCM_E2E_PORT || '8088'), viewport: { width: 1500, height: 1000 } });
  await page.goto(ADMIN);
  await page.locator('#email').fill('e2e@example.com');
  await page.locator('#passwd').fill('e2e-Passw0rd');
  await page.locator('#submit_login').click();
  await page.waitForURL(/token=|_token=|dashboard|\/improve\/|\/sell\//);
  // Module Manager link carries the security token
  const href = await page.locator('a[href*="/improve/modules/manage"]').first().getAttribute('href');
  await page.goto(href);
  const cfg = page.locator('[data-tech-name="scm_cookieconsent"] a[href*="configure"], a[href*="configure/scm_cookieconsent"], a[href*="configure=scm_cookieconsent"]').first();
  await cfg.waitFor({ state: 'attached', timeout: 30_000 });
  await page.goto(await cfg.getAttribute('href'));
  await page.locator('.scm-form, .scm-tabs, a[href*="scm_tab="]').first().waitFor();
  configureUrl = page.url();
});

test.afterAll(async () => { await page.close(); });

async function openTab(tab) {
  const link = page.locator(`a[href*="scm_tab=${tab}"]`).first();
  await link.click();
  await page.waitForLoadState('load');
  expect(page.url()).toContain(`scm_tab=${tab}`);
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(ERROR_RE);
  return text;
}

test('module configuration page opens without errors', async () => {
  expect(configureUrl).toContain('scm_cookieconsent');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(ERROR_RE);
});

test('Integrations tab: "Jak to dziala" lists the GA4 events incl. add_shipping_info', async () => {
  const text = await openTab('integrations');
  expect(text).toMatch(/jak to działa/i);
  const items = await page.locator('li', { hasText: 'add_shipping_info' }).allInnerTexts();
  expect(items.length).toBeGreaterThan(0);
  ['view_item_list', 'select_item', 'add_payment_info'].forEach((n) => expect(items.join(' ')).toContain(n));
});

test('Consent Mode tab: GTM how-to contains Krok 4 with the new triggers', async () => {
  const text = await openTab('gcm');
  expect(text).toMatch(/krok 4/i);
  const how = await page.locator('h4', { hasText: 'Krok 4' }).first().evaluate((h) => h.nextElementSibling.innerText);
  ['view_item_list', 'select_item', 'add_shipping_info', 'add_payment_info', 'login', 'sign_up', 'search'].forEach((n) => expect(how).toContain(n));
});

test('GDPR help tab renders without errors', async () => {
  const text = await openTab('rodo');
  expect(text.length).toBeGreaterThan(500);
});

// Tasks 3.3 / 4.1 (consent-mode-basic): basic-mode notice and checklist, 365-day limit.
test('Integrations tab: basic-mode notice about scripts printed by other modules and the GTM checklist', async () => {
  const text = await openTab('integrations');
  expect(text).toMatch(/Tryb podstawowy Consent Mode/);
  expect(text).toMatch(/inny moduł/);
  expect(text).toMatch(/nie jest przez niego blokowany przed zgodą/);
  expect(text).toMatch(/Lista kontrolna dla kontenera GTM/);
  expect(text).toMatch(/Require additional consent/);
});

test('Settings tab: a lifetime of 400 days is refused, 365 is accepted; footer link switch is present', async () => {
  await openTab('settings');
  const input = page.locator('input[name="SCM_COOKIE_EXPIRY_DAYS"]');
  expect(await input.getAttribute('max')).toBe('365');
  await expect(page.locator('input[name="SCM_COOKIE_SHOW_FOOTER_LINK"]').first()).toHaveCount(1);

  const before = sql("SELECT value FROM ps_configuration WHERE name='SCM_COOKIE_EXPIRY_DAYS'")[0][0];
  await input.evaluate((el) => el.removeAttribute('max')); // bypass the browser check: the server must refuse
  const privacy = page.locator('input[name="SCM_COOKIE_PRIVACY_URL"]');
  if (!(await privacy.inputValue())) { await privacy.fill('/privacy-policy'); } // required field of the form
  await input.fill('400');
  await page.locator('button[name="submitScmSettings"]').click();
  await page.waitForLoadState('load');
  await expect(page.locator('.alert-danger').first()).toContainText(/365/);
  expect(sql("SELECT value FROM ps_configuration WHERE name='SCM_COOKIE_EXPIRY_DAYS'")[0][0]).toBe(before);

  const again = page.locator('input[name="SCM_COOKIE_EXPIRY_DAYS"]');
  const privacy2 = page.locator('input[name="SCM_COOKIE_PRIVACY_URL"]');
  if (!(await privacy2.inputValue())) { await privacy2.fill('/privacy-policy'); } // the failed save did not keep it
  await again.fill('365');
  await page.locator('button[name="submitScmSettings"]').click();
  await page.waitForLoadState('load');
  await expect(page.locator('.alert-success').first()).toBeVisible();
  expect(sql("SELECT value FROM ps_configuration WHERE name='SCM_COOKIE_EXPIRY_DAYS'")[0][0]).toBe('365');
  sql("UPDATE ps_configuration SET value='' WHERE name='SCM_COOKIE_PRIVACY_URL'"); // leave the shop as found
});
