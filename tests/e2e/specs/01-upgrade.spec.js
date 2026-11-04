// Task 6.1 - install the 1.7.0 module (git HEAD), upgrade to the working tree (1.8.0)
// and check the two new hooks are registered by the upgrade script.
const { test, expect, stack, sql } = require('./helpers');

test.describe.configure({ mode: 'serial' });
test.setTimeout(300_000);

const NEW_HOOKS = ['actionAuthentication', 'actionCustomerAccountAdd'];

function version() {
  const rows = sql("SELECT version FROM ps_module WHERE name='scm_cookieconsent'");
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

test('fresh install of 1.7.0 has no 1.8.0 hooks', () => {
  stack('uninstall');
  expect(version()).toBeNull();
  stack('sync', 'HEAD');
  stack('install');
  expect(version()).toBe('1.7.0');
  const h = hooks();
  expect(h.length).toBeGreaterThan(0);
  NEW_HOOKS.forEach((name) => expect(h).not.toContain(name));
});

test('upgrade to 1.8.0 registers actionAuthentication and actionCustomerAccountAdd', () => {
  stack('sync');
  stack('upgrade');
  expect(version()).toBe('1.8.0');
  const h = hooks();
  NEW_HOOKS.forEach((name) => expect(h).toContain(name));
  // previously registered hooks are kept
  expect(h).toContain('displayFooter');
});
