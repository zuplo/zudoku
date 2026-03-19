import { expect, test } from "../fixtures/base.js";

test.describe("Documentation Content Pages", () => {
  test("quantum express page renders", async ({ page, navigateTo }) => {
    await navigateTo("/quantum-express");
    await expect(page.locator("body")).toContainText(/quantum|express|FTL/i);
  });

  test("interstellar shipping guide renders", async ({ page, navigateTo }) => {
    await navigateTo("/interstellar");
    await expect(page.locator("body")).toContainText(/interstellar/i);
  });

  test("intergalactic shipping guide renders", async ({ page, navigateTo }) => {
    await navigateTo("/intergalactic");
    await expect(page.locator("body")).toContainText(/intergalactic/i);
  });

  test("premium fleet page renders", async ({ page, navigateTo }) => {
    await navigateTo("/premium-fleet-services");
    await expect(page.locator("body")).toContainText(/premium|fleet/i);
  });

  test("documentation pages have sidebar navigation", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/documentation");
    // Sidebar should have multiple navigation links
    const sidebarLinks = page.locator("aside a, nav a");
    const count = await sidebarLinks.count();
    expect(count).toBeGreaterThan(3);
  });

  test("documentation page renders MDX content with headings", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/documentation");
    const main = page.locator("main").first();
    // Should have rendered headings from MDX
    const headings = main.locator("h1, h2, h3");
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
