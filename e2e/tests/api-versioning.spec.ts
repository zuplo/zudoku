import { expect, test } from "../fixtures/base.js";

test.describe("API Version Switching - Label API", () => {
  test("Label API page loads with version selector", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/catalog/api-label");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Label");
  });

  test("version selector is visible for multi-version APIs", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/catalog/api-label");
    // The version selector is a Select trigger
    const versionSelect = page.getByRole("combobox").first();
    await expect(versionSelect).toBeVisible();
  });

  test("can navigate to Label API v1", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-label/1.0.0/labels");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Label");
  });

  test("can navigate to Label API v2", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-label/2.0.0/labels");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Label");
  });

  test("can navigate to Label API latest version", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/catalog/api-label/latest/labels");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Label");
  });
});

test.describe("API Version Switching - Fleet Ops API", () => {
  test("Fleet Ops API page loads", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-fleet-ops");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("can navigate to Fleet Ops v1 (Sublight)", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/catalog/api-fleet-ops/v1");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("can navigate to Fleet Ops v2 (Warp)", async ({ page, navigateTo }) => {
    await navigateTo("/catalog/api-fleet-ops/v2");
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("can navigate to Fleet Ops v3 (Quantum)", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/catalog/api-fleet-ops/v3");
    await expect(page.locator("main").first()).toBeVisible();
  });
});
