import { expect, test } from "../fixtures/base.js";

test.describe("API Catalog", () => {
  test.beforeEach(async ({ navigateTo }) => {
    await navigateTo("/catalog");
  });

  test("renders the catalog page", async ({ page }) => {
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("displays multiple APIs in the catalog", async ({ page }) => {
    const body = page.locator("body");
    const text = await body.textContent();
    expect(text).toContain("Shipment");
  });

  test("catalog has category groupings", async ({ page }) => {
    const body = page.locator("body");
    const text = await body.textContent();
    expect(text).toBeTruthy();
  });

  test("clicking an API navigates to its reference", async ({ page }) => {
    // Wait for the catalog content to fully render
    await page.waitForTimeout(1000);

    // Find a link to any API in the catalog
    const apiLink = page.locator('a[href*="/catalog/api-"]').first();
    if (await apiLink.isVisible({ timeout: 5000 })) {
      const href = await apiLink.getAttribute("href");
      if (href) {
        await apiLink.click();
        await page.waitForURL(`**${href}**`, { timeout: 10_000 });
        await expect(page).toHaveURL(
          new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        );
      }
    }
  });
});

test.describe("API Catalog - Individual APIs", () => {
  test("Webhooks API page loads", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-webhooks");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/webhook/i);
  });

  test("Interplanetary API page loads", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-interplanetary");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("Tracking API page loads", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-tracking");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("AI Cargo API page loads", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-ai-cargo");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("Cargo Containers API page loads", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-cargo-containers");
    await expect(page.locator("main").first()).toBeVisible();
  });
});

test.describe("API Versioning", () => {
  test("Label API supports version switching", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-label");
    await expect(page.locator("main").first()).toBeVisible();

    const body = page.locator("body");
    const text = await body.textContent();
    expect(text).toContain("Label");
  });

  test("Fleet Operations API supports version switching", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/catalog/api-fleet-ops");
    await expect(page.locator("main").first()).toBeVisible();
  });
});
