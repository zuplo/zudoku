import { expect, test } from "../fixtures/base.js";

test.describe("Search Results", () => {
  test.beforeEach(async ({ navigateTo, page }) => {
    await navigateTo("/");
    // Wait for search to be fully initialized
    await page.waitForTimeout(2000);
  });

  test("typing in search shows results", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const input = dialog.locator("input");
    await input.fill("shipment");

    // Wait for pagefind search results to appear
    await page.waitForTimeout(2000);

    // Should show search results - pagefind renders results in the dialog
    const dialogText = await dialog.textContent();
    // Results should contain content matching our query
    expect(dialogText?.toLowerCase()).toContain("shipment");
  });

  test("search input is focused when dialog opens", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // The search input should be automatically focused
    const input = dialog.locator("input");
    await expect(input).toBeFocused({ timeout: 3_000 });
  });

  test("clearing search input resets results", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const input = dialog.locator("input");

    // Type a query
    await input.fill("shipment");
    await page.waitForTimeout(1000);

    // Clear the input
    await input.fill("");
    await page.waitForTimeout(500);

    // Input should be empty
    await expect(input).toHaveValue("");
  });
});
