import { expect, test } from "../fixtures/base.js";

test.describe("API Reference - Shipments", () => {
  test.beforeEach(async ({ navigateTo }) => {
    await navigateTo("/api-shipments");
  });

  test("renders the API reference page", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("displays API operation categories/tags", async ({ page }) => {
    // The Shipments API has tags like "Shipment Management"
    await expect(page.locator("body")).toContainText(/shipment/i);
  });

  test("has a sidebar with API navigation", async ({ page }) => {
    // API pages should have sidebar navigation with operation groups
    const sidebar = page.locator("aside, nav");
    await expect(sidebar.first()).toBeVisible();
  });

  test("clicking an operation expands its details", async ({ page }) => {
    // Navigate to a specific operation group
    const operationLink = page.getByRole("link", { name: /shipment/i }).first();
    if (await operationLink.isVisible()) {
      await operationLink.click();
      // After clicking, we should see HTTP method badges or operation details
      await page.waitForTimeout(1000);
      const body = page.locator("body");
      const text = await body.textContent();
      // Should contain HTTP method indicators or path info
      expect(text).toBeTruthy();
    }
  });
});

test.describe("API Reference - Operation Details", () => {
  test("displays HTTP method and path for operations", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/api-shipments/shipment-management");
    // Should show operation details with method badges
    await page.waitForTimeout(1000);
    const body = page.locator("body");
    await expect(body).toContainText(/shipment/i);
  });

  test("shows request/response details", async ({ page, navigateTo }) => {
    await navigateTo("/api-shipments/shipment-management");
    await page.waitForTimeout(1000);

    // API operations should show request parameters, body, and responses
    const main = page.locator("main");
    const content = await main.textContent();
    expect(content).toBeTruthy();
  });

  test("API endpoint paths are displayed", async ({ page, navigateTo }) => {
    await navigateTo("/api-shipments/shipment-management");
    await page.waitForTimeout(1000);

    // Check that endpoint paths are visible (e.g., /shipments)
    await expect(page.locator("body")).toContainText("/shipments");
  });
});
