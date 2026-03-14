import { expect, test } from "../fixtures/base.js";

test.describe("Search", () => {
  test.beforeEach(async ({ navigateTo, page }) => {
    await navigateTo("/");
    // Wait for JS to fully initialize (Clerk init may delay interactivity)
    await page.waitForTimeout(3000);
  });

  test("search button is visible in the header", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /search/i });
    await expect(searchButton).toBeVisible();
  });

  test("clicking search button opens search dialog", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    // The search opens a dialog with role=dialog
    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Should contain a search input
    const input = dialog.locator("input");
    await expect(input).toBeVisible({ timeout: 3_000 });
  });

  test("keyboard shortcut opens search", async ({ page }) => {
    await page.keyboard.press("Control+k");

    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test("search can be closed with Escape", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});
