import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Playwright Configuration for Clodo Framework Website
 * 
 * Testing Strategy:
 * - E2E tests for critical user journeys
 * - Integration tests for system components
 * - Visual regression testing for UI consistency
 * - Performance testing with Lighthouse integration
 * - Cross-browser testing (Chromium primary, Firefox/Safari optional)
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: join(rootDir, 'tests'),
  testMatch: ['**/*.spec.js', '**/integration/**/*.js'],
  
  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // Test run configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced from 2 to 1 retry in CI
  workers: process.env.CI ? 2 : undefined, // Run 2 workers in parallel in CI instead of 1
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['json', { outputFile: 'tests/playwright-report/results.json' }],
    ['list']
  ],
  
  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8000',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Emulate user preferences
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },
  
  // Test projects for different browsers/scenarios
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Mobile testing (skip in CI for faster builds)
    ...(process.env.CI ? [] : [{
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    }]),
    
    // Tablet testing (skip in CI for faster builds)
    ...(process.env.CI ? [] : [{
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    }]),
    
    // Optional: Firefox (uncomment when needed)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    
    // Optional: WebKit/Safari (uncomment when needed)
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // Web server configuration for build-time testing
  webServer: {
    // Use dev server locally, but use the built dist server in CI for stability
    command: process.env.CI ? 'npm run serve:dist' : `node ${join(rootDir, 'build', 'dev-server.js')}`,
    url: 'http://localhost:8000',
    reuseExistingServer: true,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
