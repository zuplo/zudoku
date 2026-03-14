import { expect, test } from "../fixtures/base.js";

test.describe("Performance", () => {
  test("landing page loads within acceptable time", async ({ navigateTo }) => {
    const start = Date.now();
    await navigateTo("/");
    const loadTime = Date.now() - start;

    // Page should load within 5 seconds (generous for CI)
    expect(loadTime).toBeLessThan(5000);
  });

  test("no console errors on landing page", async ({ page, navigateTo }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await navigateTo("/");
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (auth, external resources)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("clerk") &&
        !e.includes("Clerk") &&
        !e.includes("favicon") &&
        !e.includes("ERR_NAME_NOT_RESOLVED") &&
        !e.includes("net::ERR_") &&
        !e.includes("Failed to load resource"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("no console errors on documentation page", async ({
    page,
    navigateTo,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await navigateTo("/documentation");
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("clerk") &&
        !e.includes("Clerk") &&
        !e.includes("favicon") &&
        !e.includes("ERR_NAME_NOT_RESOLVED") &&
        !e.includes("net::ERR_") &&
        !e.includes("Failed to load resource"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("no console errors on API reference page", async ({
    page,
    navigateTo,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await navigateTo("/api-shipments");
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("clerk") &&
        !e.includes("Clerk") &&
        !e.includes("favicon") &&
        !e.includes("ERR_NAME_NOT_RESOLVED") &&
        !e.includes("net::ERR_") &&
        !e.includes("Failed to load resource"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("no JavaScript errors (uncaught exceptions)", async ({
    page,
    navigateTo,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await navigateTo("/");
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("clerk") &&
        !e.includes("Clerk") &&
        !e.includes("ERR_NAME_NOT_RESOLVED") &&
        !e.includes("net::ERR_") &&
        !e.includes("Failed to load resource") &&
        !e.includes("Failed to fetch"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("local CSS and JS assets load successfully", async ({
    page,
    navigateTo,
  }) => {
    const failedRequests: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      // Only check local assets
      if (
        url.startsWith("http://localhost") &&
        (url.includes(".js") || url.includes(".css")) &&
        response.status() >= 400
      ) {
        failedRequests.push(`${response.status()} ${url}`);
      }
    });

    await navigateTo("/");
    expect(failedRequests).toHaveLength(0);
  });
});
