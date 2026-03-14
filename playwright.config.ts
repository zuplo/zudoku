import { defineConfig, devices } from "@playwright/test";

const PORT = 9800;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Optional: Set PLAYWRIGHT_CHROMIUM_PATH to use a custom Chromium binary.
 * In CI, browsers are installed via `npx playwright install`.
 * Locally, you can point to an existing browser to skip downloading.
 */
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "on-failure" }]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: chromiumPath },
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        launchOptions: { executablePath: chromiumPath },
      },
    },
  ],
  webServer: {
    command: `CI=true pnpm nx run cosmo-cargo:preview --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
