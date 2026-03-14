import { expect, test } from "../fixtures/base.js";

test.describe("Footer", () => {
  test.beforeEach(async ({ navigateTo }) => {
    await navigateTo("/");
  });

  test("renders footer with column headings", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Product");
    await expect(footer).toContainText("Company");
    await expect(footer).toContainText("Resources");
    await expect(footer).toContainText("Legal");
  });

  test("displays copyright notice", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toContainText("Zuplo, Inc. All rights reserved");
  });

  test("has social media links", async ({ page }) => {
    const footer = page.locator("footer");
    // Should have GitHub, X/Twitter, and Discord links
    const socialLinks = footer.locator('a[target="_blank"]');
    const count = await socialLinks.count();
    // At least 3 social links (github, x, discord) plus footer column links
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("has Zudoku branding", async ({ page }) => {
    const footer = page.locator("footer");
    const zudokuLogo = footer.locator('img[alt="Zudoku by Zuplo"]').first();
    await expect(zudokuLogo).toBeVisible();
  });

  test("footer links have correct external link indicators", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    // External links should have the external-link icon SVG
    const externalIcons = footer.locator(".lucide-external-link");
    const count = await externalIcons.count();
    expect(count).toBeGreaterThan(0);
  });
});
