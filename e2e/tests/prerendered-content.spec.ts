import { expect, test } from "../fixtures/base.js";

test.describe("Prerendered Content (SSR)", () => {
  test("landing page has prerendered HTML content", async ({ page }) => {
    // Block ALL requests except localhost, including JS, to test SSR output
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith("http://localhost")) {
        // Block JS files to prevent hydration - test pure SSR
        if (url.endsWith(".js")) {
          return route.abort();
        }
        return route.continue();
      }
      return route.abort();
    });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15_000 });

    // The prerendered HTML should have the hero text
    const body = page.locator("body");
    await expect(body).toContainText("Ship anywhere");
    await expect(body).toContainText("whole universe");
  });

  test("documentation page has prerendered content", async ({ page }) => {
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith("http://localhost")) {
        if (url.endsWith(".js")) return route.abort();
        return route.continue();
      }
      return route.abort();
    });

    await page.goto("/documentation", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    const body = page.locator("body");
    await expect(body).toContainText("Cosmo Cargo");
  });

  test("footer is prerendered", async ({ page }) => {
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith("http://localhost")) {
        if (url.endsWith(".js")) return route.abort();
        return route.continue();
      }
      return route.abort();
    });

    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    const footer = page.locator("footer");
    await expect(footer).toContainText("Product");
    await expect(footer).toContainText("Company");
  });

  test("navigation header is prerendered", async ({ page }) => {
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith("http://localhost")) {
        if (url.endsWith(".js")) return route.abort();
        return route.continue();
      }
      return route.abort();
    });

    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test("meta tags are present in prerendered HTML", async ({ page }) => {
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith("http://localhost")) {
        if (url.endsWith(".js")) return route.abort();
        return route.continue();
      }
      return route.abort();
    });

    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    await expect(page).toHaveTitle("Cosmo Cargo Inc.");
  });

  test("prerendered pages have hydration data", async ({ page }) => {
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith("http://localhost")) {
        if (url.endsWith(".js")) return route.abort();
        return route.continue();
      }
      return route.abort();
    });

    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    // Check that hydration data script is present in the raw HTML
    const html = await page.content();
    expect(html).toContain("__staticRouterHydrationData");
  });
});
