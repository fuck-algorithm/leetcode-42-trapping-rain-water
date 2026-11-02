import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:48046', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: { command: 'npm start', url: 'http://127.0.0.1:48046', reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
