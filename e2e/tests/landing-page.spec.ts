import { expect, test } from "../fixtures/base.js";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ navigateTo }) => {
    await navigateTo("/");
  });

  test("renders the hero section with title", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Ship anywhere");
    await expect(heading).toContainText("whole universe");
  });

  test("renders the cosmo mascot image", async ({ page }) => {
    const mascot = page.locator('img[src="/cosmo.webp"]');
    await expect(mascot).toBeVisible();
  });

  test("displays call-to-action buttons", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore Zudoku" }),
    ).toBeVisible();
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle("Cosmo Cargo Inc.");
  });

  test("renders the announcement banner", async ({ page }) => {
    const banner = page.locator("text=inter-galactic shipping");
    await expect(banner).toBeVisible();
  });

  test("banner can be dismissed", async ({ page }) => {
    const banner = page.locator("text=inter-galactic shipping");
    await expect(banner).toBeVisible();

    // Wait for React hydration to make the button interactive
    await page.waitForTimeout(500);

    // Click the dismiss button (the X icon button within the banner)
    const bannerContainer = page.locator(".bg-primary").first();
    const dismissButton = bannerContainer.locator("button").first();
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();

    await expect(banner).not.toBeVisible({ timeout: 5_000 });
  });

  test("has correct meta tags from custom head plugin", async ({ page }) => {
    const metaTag = page.locator(
      'meta[name="cosmo-cargo-head-test"][content="verified"]',
    );
    await expect(metaTag).toHaveCount(1);
  });

  test("custom window variable is injected", async ({ page }) => {
    const value = await page.evaluate(
      () => (window as Record<string, unknown>).__COSMO_HEAD_TEST,
    );
    expect(value).toBe(true);
  });
});
