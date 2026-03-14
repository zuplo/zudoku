import { test as base, expect, type Page } from "@playwright/test";

/**
 * Block external network requests that would hang in CI/offline environments.
 * This is necessary because the app loads Clerk auth scripts and external CDN
 * resources that would block page loading when external DNS is unavailable.
 */
async function blockExternalRequests(page: Page) {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("http://localhost") || url.startsWith("data:")) {
      return route.continue();
    }
    return route.abort();
  });
}

/**
 * Wait for the Zudoku app to be fully hydrated and interactive.
 */
async function waitForAppReady(page: Page) {
  await page.waitForSelector("#root", { timeout: 15_000 });
  await page.waitForSelector("header, main, footer", { timeout: 15_000 });
  // Wait for React hydration to complete - the theme toggle button becomes
  // interactive after hydration, which is a good proxy
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[aria-label="Toggle theme"]');
      return btn !== null;
    },
    { timeout: 15_000 },
  );
}

export const test = base.extend<{
  /** Navigate to a path and wait for the Zudoku app to be fully interactive */
  navigateTo: (path: string) => Promise<void>;
}>({
  navigateTo: async ({ page }, use) => {
    // Block external requests before any navigation
    await blockExternalRequests(page);

    await use(async (path: string) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await waitForAppReady(page);
    });
  },
});

export { expect };
