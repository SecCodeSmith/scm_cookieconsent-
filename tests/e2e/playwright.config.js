// @ts-check
const { defineConfig } = require('@playwright/test');

const port = process.env.SCM_E2E_PORT || '8088';

module.exports = defineConfig({
  testDir: './specs',
  // One shop, shared module settings (tag mode is switched per spec file) — run serially.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    // System Edge — no Playwright browser download needed. Override with SCM_E2E_CHANNEL.
    channel: process.env.SCM_E2E_CHANNEL || 'msedge',
    headless: true,
    locale: 'en-US',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
  },
});
