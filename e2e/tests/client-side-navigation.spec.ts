import { expect, test } from "../fixtures/base.js";

test.describe("Client-side Navigation", () => {
  test("navigating between pages does not trigger full page reload", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/");

    // Wait for React hydration to complete so links use client-side routing
    await page.waitForTimeout(1000);

    // Set a marker on the window to detect full page reloads
    await page.evaluate(() => {
      (window as Record<string, unknown>).__NAV_TEST_MARKER = true;
    });

    // Navigate using client-side link in the header
    await page
      .locator("header")
      .getByRole("link", { name: "Documentation" })
      .click();
    await page.waitForURL("**/documentation");

    // Marker should still exist if navigation was client-side
    const markerExists = await page.evaluate(
      () => (window as Record<string, unknown>).__NAV_TEST_MARKER === true,
    );
    expect(markerExists).toBe(true);
  });

  test("browser back button works after client-side navigation", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/");
    await expect(page).toHaveURL("/");

    // Navigate to documentation via header
    await page
      .locator("header")
      .getByRole("link", { name: "Documentation" })
      .click();
    await page.waitForURL("**/documentation");

    // Navigate to shipments
    await page
      .locator("header")
      .getByRole("link", { name: "Shipments" })
      .click();
    await page.waitForURL("**/api-shipments");

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/documentation/);

    // Go back again
    await page.goBack();
    await expect(page).toHaveURL("/");
  });

  test("browser forward button works after going back", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/");

    // Navigate forward via header
    await page
      .locator("header")
      .getByRole("link", { name: "Documentation" })
      .click();
    await page.waitForURL("**/documentation");

    // Go back
    await page.goBack();
    await expect(page).toHaveURL("/");

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/\/documentation/);
  });

  test("direct URL navigation works for deep links", async ({
    page,
    navigateTo,
  }) => {
    // Navigate directly to a deep page
    await navigateTo("/api-shipments");
    await expect(page).toHaveURL(/\/api-shipments/);

    // Content should be loaded
    const main = page.locator("main");
    await expect(main).toBeVisible();
    await expect(page.locator("body")).toContainText(/shipment/i);
  });
});
