import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'steps/api.steps.ts',
});

export default defineConfig({
  testDir,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://serverest.dev',
    trace: 'on',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});