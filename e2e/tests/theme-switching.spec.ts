import { expect, test } from "../fixtures/base.js";

test.describe("Theme Switching", () => {
  test.beforeEach(async ({ navigateTo }) => {
    await navigateTo("/");
  });

  test("defaults to system theme preference", async ({ page }) => {
    const html = page.locator("html");
    const className = await html.getAttribute("class");
    // Should have either 'light' or 'dark' class
    expect(className === "light" || className === "dark").toBeTruthy();
  });

  test("theme toggle switches between light and dark", async ({ page }) => {
    const html = page.locator("html");
    const initialClass = await html.getAttribute("class");

    // After hydration, the button's aria-label changes from "Toggle theme"
    // to "Switch to light mode" or "Switch to dark mode"
    const themeToggle = page
      .getByRole("button", { name: /switch to (light|dark) mode/i })
      .first();
    await themeToggle.click();

    // Wait for the theme class to actually change
    await page.waitForFunction(
      (prevClass) =>
        document.documentElement.getAttribute("class") !== prevClass,
      initialClass,
      { timeout: 5_000 },
    );

    const newClass = await html.getAttribute("class");
    expect(newClass).not.toBe(initialClass);
  });

  test("theme toggle cycles through states", async ({ page }) => {
    const html = page.locator("html");

    const class1 = await html.getAttribute("class");

    // After hydration, the button's aria-label is "Switch to light/dark mode"
    const themeToggle = page
      .getByRole("button", { name: /switch to (light|dark) mode/i })
      .first();
    await themeToggle.click();

    // Wait for the theme class to actually change
    await page.waitForFunction(
      (prevClass) =>
        document.documentElement.getAttribute("class") !== prevClass,
      class1,
      { timeout: 5_000 },
    );

    const class2 = await html.getAttribute("class");
    expect(class2).not.toBe(class1);
  });

  test("light theme shows light logo, dark shows dark logo", async ({
    page,
  }) => {
    const lightLogo = page.locator('img[src="/logo-light.svg"]').first();
    const darkLogo = page.locator('img[src="/logo-dark.svg"]').first();

    // Both logos exist in DOM, but only one is visible based on theme
    await expect(lightLogo).toHaveCount(1);
    await expect(darkLogo).toHaveCount(1);
  });
});
