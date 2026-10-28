import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',fullyParallel:false,retries:0,timeout:30000,
  use:{baseURL:'http://127.0.0.1:4173',...devices['Desktop Chrome'],trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'npm run preview -- --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:45000},
  reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report'}]]
});
