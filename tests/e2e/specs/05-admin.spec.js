// Task 3.5 - the back-office module configuration renders without Smarty/PHP errors
// and shows the updated GA4 documentation (Integrations list, GTM how-to, GDPR help tab).
const { test, expect } = require('./helpers');

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
