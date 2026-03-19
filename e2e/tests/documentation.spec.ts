import { expect, test } from "../fixtures/base.js";

test.describe("Documentation Pages", () => {
  test("renders the main documentation page", async ({ page, navigateTo }) => {
    await navigateTo("/documentation");
    const main = page.locator("main").first();
    await expect(main).toBeVisible();
    await expect(page.locator("body")).toContainText("Cosmo Cargo");
  });

  test("has a sidebar with navigation items", async ({ page, navigateTo }) => {
    await navigateTo("/documentation");
    const sidebar = page.locator("aside, nav").first();
    await expect(sidebar).toBeVisible();
  });

  test("documentation page has correct title", async ({ page, navigateTo }) => {
    await navigateTo("/documentation");
    await expect(page).toHaveTitle(/Cosmo Cargo/);
  });

  test("renders global shipping guide", async ({ page, navigateTo }) => {
    await navigateTo("/global");
    await expect(page.locator("body")).toContainText("Global Shipping");
  });

  test("renders shipping process page", async ({ page, navigateTo }) => {
    await navigateTo("/shipping-process");
    const body = page.locator("body");
    await expect(body).toContainText("shipping");
  });

  test("renders tracking page", async ({ page, navigateTo }) => {
    await navigateTo("/tracking");
    const body = page.locator("body");
    await expect(body).toContainText("Tracking");
  });

  test("renders member benefits page", async ({ page, navigateTo }) => {
    await navigateTo("/member-benefits");
    const body = page.locator("body");
    await expect(body).toContainText("Benefits");
  });

  test("sidebar navigation links work", async ({ page, navigateTo }) => {
    await navigateTo("/documentation");

    const globalLink = page.getByRole("link", { name: /global/i }).first();
    if (await globalLink.isVisible()) {
      await globalLink.click();
      await page.waitForURL("**/global");
      await expect(page).toHaveURL(/\/global/);
    }
  });

  test("markdown content renders as HTML", async ({ page, navigateTo }) => {
    await navigateTo("/documentation");
    // Check that MDX content renders properly
    const main = page.locator("main").first();
    await expect(main).toBeVisible();

    // Should have rendered prose content with paragraphs
    const paragraphs = main.locator("p");
    const pCount = await paragraphs.count();
    expect(pCount).toBeGreaterThan(0);
  });
});
