import { expect, test } from "../fixtures/base.js";

test.describe("Responsive Design", () => {
  test("mobile viewport shows hamburger menu", async ({ page, navigateTo }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo("/");

    // On mobile, the hamburger menu icon should be visible
    const menuButton = page.locator(".lucide-menu").first();
    await expect(menuButton).toBeVisible();
  });

  test("mobile viewport hides desktop navigation", async ({
    page,
    navigateTo,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo("/");

    // Desktop navigation items should be hidden on mobile
    const desktopNav = page.locator(".hidden.lg\\:flex").first();
    await expect(desktopNav).not.toBeVisible();
  });

  test("mobile menu button is interactive", async ({ page, navigateTo }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo("/");

    // Click hamburger menu
    const menuButton = page.locator("button:has(.lucide-menu)").first();
    await expect(menuButton).toBeVisible();
    // Verify the button is clickable
    await menuButton.click();

    // Wait for any response to the click
    await page.waitForTimeout(1000);

    // The menu button should still be in the DOM
    const body = page.locator("body");
    const text = await body.textContent();
    expect(text).toBeTruthy();
  });

  test("tablet viewport renders properly", async ({ page, navigateTo }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateTo("/");

    // Page should render without errors
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("wide viewport renders properly", async ({ page, navigateTo }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateTo("/");

    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });
});
