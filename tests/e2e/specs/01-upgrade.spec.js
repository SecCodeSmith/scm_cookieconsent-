// Task 6.1 / consent-mode-basic 4.1 - install the 1.7.0 module (pinned commit), upgrade to the working
// tree (1.9.0) and check the hooks added in 1.8.0, the 365-day lifetime clamp and the footer-link key.
const { test, expect, stack, sql } = require('./helpers');

test.describe.configure({ mode: 'serial' });
test.setTimeout(300_000);

// Last commit whose module version is 1.7.0 (HEAD itself already carries 1.8.0 or later).
const PREVIOUS_REF = 'b7ce1d8';
const NEW_HOOKS = ['actionAuthentication', 'actionCustomerAccountAdd'];

function version() {
  const rows = sql("SELECT version FROM ps_module WHERE name='scm_cookieconsent'");
  return rows.length ? rows[0][0] : null;
}

function config(name) {
  const rows = sql(`SELECT value FROM ps_configuration WHERE name='${name}' LIMIT 1`);
  return rows.length ? rows[0][0] : null;
}

function hooks() {
  return sql(
    "SELECT h.name FROM ps_hook_module hm JOIN ps_module m ON m.id_module=hm.id_module " +
    "JOIN ps_hook h ON h.id_hook=hm.id_hook WHERE m.name='scm_cookieconsent'"
  ).map((r) => r[0]);
}

test.afterAll(() => {
  // leave the module installed at the working-tree version for the other specs
  stack('reset');
});

test('fresh install of 1.7.0 has no 1.8.0 hooks and no footer-link key', () => {
  stack('uninstall');
  expect(version()).toBeNull();
  stack('sync', PREVIOUS_REF);
  stack('install');
  expect(version()).toBe('1.7.0');
  const h = hooks();
  expect(h.length).toBeGreaterThan(0);
  NEW_HOOKS.forEach((name) => expect(h).not.toContain(name));
  expect(config('SCM_COOKIE_SHOW_FOOTER_LINK')).toBeNull();
});

test('upgrade to 1.9.0 registers the 1.8.0 hooks, clamps a 730-day lifetime to 365 and seeds the footer link', () => {
  stack('sql', "UPDATE ps_configuration SET value='730' WHERE name='SCM_COOKIE_EXPIRY_DAYS'");
  expect(config('SCM_COOKIE_EXPIRY_DAYS')).toBe('730');
  stack('sync');
  stack('upgrade');
  expect(version()).toBe('1.9.0');
  const h = hooks();
  NEW_HOOKS.forEach((name) => expect(h).toContain(name));
  // previously registered hooks are kept
  expect(h).toContain('displayFooter');
  expect(config('SCM_COOKIE_EXPIRY_DAYS')).toBe('365');
  expect(config('SCM_COOKIE_SHOW_FOOTER_LINK')).toBe('1');
});

test('upgrade keeps a valid lifetime (300) and an existing footer-link choice (0)', () => {
  stack('config', 'EXPIRY_DAYS', '300');
  stack('config', 'SHOW_FOOTER_LINK', '0');
  stack('sql', "UPDATE ps_module SET version='1.8.0' WHERE name='scm_cookieconsent'");
  stack('upgrade');
  expect(version()).toBe('1.9.0');
  expect(config('SCM_COOKIE_EXPIRY_DAYS')).toBe('300');
  expect(config('SCM_COOKIE_SHOW_FOOTER_LINK')).toBe('0');
});
