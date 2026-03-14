import { expect, test } from "../fixtures/base.js";

test.describe("Header Navigation", () => {
  test.beforeEach(async ({ navigateTo }) => {
    await navigateTo("/");
  });

  test("displays the site logo", async ({ page }) => {
    const logo = page.locator('img[alt="Cosmo Cargo Inc."]').first();
    await expect(logo).toBeVisible();
  });

  test("has main navigation links", async ({ page }) => {
    // Use exact match to avoid ambiguity with body content links
    await expect(
      page.getByRole("link", { name: "Documentation", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Shipments", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "API Catalog", exact: true }).first(),
    ).toBeVisible();
  });

  test("has Solutions dropdown trigger", async ({ page }) => {
    const solutionsButton = page.getByRole("button", { name: "Solutions" });
    await expect(solutionsButton).toBeVisible();
  });

  test("has Products dropdown trigger", async ({ page }) => {
    const productsButton = page.getByRole("button", { name: "Products" });
    await expect(productsButton).toBeVisible();
  });

  test("has search button", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /search/i });
    await expect(searchButton).toBeVisible();
  });

  test("has theme toggle button", async ({ page }) => {
    const themeToggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(themeToggle).toBeVisible();
  });

  test("navigating to Documentation works", async ({ page }) => {
    // Click the nav link (first one), not the body content link
    await page
      .locator("header")
      .getByRole("link", { name: "Documentation" })
      .click();
    await page.waitForURL("**/documentation");
    await expect(page).toHaveURL(/\/documentation/);
  });

  test("navigating to Shipments works", async ({ page }) => {
    await page
      .locator("header")
      .getByRole("link", { name: "Shipments" })
      .click();
    await page.waitForURL("**/api-shipments");
    await expect(page).toHaveURL(/\/api-shipments/);
  });

  test("navigating to API Catalog works", async ({ page }) => {
    await page
      .locator("header")
      .getByRole("link", { name: "API Catalog" })
      .click();
    await page.waitForURL("**/catalog");
    await expect(page).toHaveURL(/\/catalog/);
  });

  test("logo links to homepage", async ({ page }) => {
    // Navigate away first
    await page
      .locator("header")
      .getByRole("link", { name: "Documentation" })
      .click();
    await page.waitForURL("**/documentation");

    // Click logo to go back home
    const logoLink = page.locator("header a[href='/']").first();
    await logoLink.click();
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
