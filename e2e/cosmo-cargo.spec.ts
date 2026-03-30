import { expect, test } from "@playwright/test";

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      !msg.text().startsWith("Failed to load resource")
    ) {
      consoleErrors.push(`${msg.text()} (${page.url()})`);
    }
  });
});

test.afterEach(() => {
  expect(consoleErrors).toEqual([]);
});

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText("Cosmo Cargo");
  expect(new URL(page.url()).pathname).toBe("/");
});

test("navigate to /documentation", async ({ page }) => {
  await page.goto("/documentation");
  await expect(page.locator("main")).toBeVisible();
  // Sidebar navigation should render
  await expect(page.locator("nav").first()).toBeVisible();
});

test("navigate to /api-shipments and see operations", async ({ page }) => {
  await page.goto("/api-shipments");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("click into an operation from API reference", async ({ page }) => {
  await page.goto("/api-shipments");
  const operationLink = page.locator('a[href*="/api-shipments/"]').first();
  await operationLink.waitFor({ state: "visible" });
  await operationLink.click();
  await expect(page.locator("main")).toBeVisible();
});

test("redirect resolves correctly", async ({ page }) => {
  await page.goto("/api-shipments/create-shipment");
  await page.waitForURL("**/api-shipments/shipment-management*");
  expect(page.url()).toContain("/api-shipments/shipment-management");
});

test("/catalog lists APIs", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.locator("main")).toBeVisible();
  const links = page.locator("main a");
  await expect(links.first()).toBeVisible();
  const count = await links.count();
  expect(count).toBeGreaterThan(1);
});

test("search returns results", async ({ page }) => {
  await page.goto("/documentation", { waitUntil: "networkidle" });
  const button = page.getByRole("button", { name: /Search/ }).first();
  await button.click();
  const searchInput = page.getByPlaceholder("Search...");
  await searchInput.waitFor({ state: "visible" });
  await searchInput.fill("shipment");
  await expect(page.locator("[cmdk-item]").first()).toBeVisible();
});

test("plugin head injection works (SSR)", async ({ page }) => {
  await page.goto("/");
  // Check prerendered HTML for head injection
  const html = await page.content();
  expect(html).toContain('name="cosmo-cargo-head-test"');
  expect(html).toContain("__COSMO_HEAD_TEST");
});

test("client-side navigation between sections", async ({ page }) => {
  await page.goto("/documentation", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toBeVisible();

  // Click a header nav link to API reference (SPA transition, no full reload)
  const apiLink = page.locator('a[href*="/api-shipments"]').first();
  await apiLink.click();
  await page.waitForURL("**/api-shipments**");
  await expect(page.getByRole("heading").first()).toBeVisible();

  // Navigate to catalog via header
  const catalogLink = page.locator('a[href="/catalog"]').first();
  await catalogLink.click();
  await page.waitForURL("**/catalog");
  await expect(page.locator("main a").first()).toBeVisible();
});

test("operation detail shows method, path, and parameters", async ({
  page,
}) => {
  await page.goto("/api-shipments/shipment-management", {
    waitUntil: "networkidle",
  });

  // Operations render with summary as heading (from OperationListItem)
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

  // Should show HTTP method badges (GET, POST, etc.)
  const methodBadge = page
    .locator("text=/^(GET|POST|PUT|PATCH|DELETE)$/")
    .first();
  await expect(methodBadge).toBeVisible();

  // Should show the operation path
  await expect(page.locator("text=/\\/shipments/").first()).toBeVisible();
});

test("playground dialog opens from operation", async ({ page }) => {
  await page.goto("/api-shipments/shipment-management", {
    waitUntil: "networkidle",
  });

  // Playground trigger is a DialogTrigger with a play icon
  const playButton = page.locator('[data-slot="dialog-trigger"]').first();
  await playButton.waitFor({ state: "visible" });
  await playButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Skip the login prompt if it appears (cosmo-cargo has auth configured)
  const skipButton = page.getByRole("button", { name: "Skip" });
  if (await skipButton.isVisible()) {
    await skipButton.click();
  }

  // Playground should render with a Send button
  await expect(page.getByRole("button", { name: /Send/ })).toBeVisible();
});

test("404 page renders for unknown routes", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
});

test("API version switching works", async ({ page }) => {
  await page.goto("/catalog/api-label/latest", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toBeVisible();

  await page.goto("/catalog/api-label/1.0.0", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toBeVisible();

  await page.goto("/catalog/api-label/2.0.0", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toBeVisible();
});

test("sidebar navigation updates content", async ({ page }) => {
  await page.goto("/api-shipments", { waitUntil: "networkidle" });

  // Click a sidebar navigation link
  const sidebarLink = page.locator('nav a[href*="/api-shipments/"]').first();
  await sidebarLink.waitFor({ state: "visible" });
  const linkHref = await sidebarLink.getAttribute("href");
  await sidebarLink.click();

  // URL should change to the clicked link
  if (linkHref) {
    await page.waitForURL(`**${linkHref}*`);
  }
  await expect(page.locator("main")).toBeVisible();
});

test("dark mode toggle works", async ({ page }) => {
  await page.goto("/documentation", { waitUntil: "networkidle" });

  // Should start in light mode
  const themeToggle = page.getByLabel(/Switch to dark mode/);
  await themeToggle.waitFor({ state: "visible" });

  // Toggle to dark mode
  await themeToggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByLabel(/Switch to light mode/)).toBeVisible();

  // Toggle back to light mode
  await page.getByLabel(/Switch to light mode/).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
