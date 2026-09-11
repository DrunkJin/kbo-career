import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 30000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4175/kbo-career/', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175/kbo-career/', reuseExistingServer: false },
});
