import { expect, test } from "../fixtures/base.js";

test.describe("Accessibility", () => {
  test("page has proper heading hierarchy", async ({ page, navigateTo }) => {
    await navigateTo("/documentation");

    // Should have at least one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("images have alt attributes", async ({ page, navigateTo }) => {
    await navigateTo("/");

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");

      // Images should have alt text or be aria-hidden
      if (ariaHidden !== "true") {
        expect(alt, `Image ${i} missing alt attribute`).toBeTruthy();
      }
    }
  });

  test("interactive elements are keyboard accessible", async ({
    page,
    navigateTo,
  }) => {
    await navigateTo("/");

    // Tab through the page and check that focus is visible
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should have an active/focused element
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });
    expect(focused).toBeTruthy();
    expect(focused).not.toBe("BODY");
  });

  test("links have accessible text content", async ({ page, navigateTo }) => {
    await navigateTo("/");

    // Check that all links in the header have text or aria-label
    const headerLinks = page.locator("header a[href]");
    const count = await headerLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = headerLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");
      const img = await link.locator("img").count();
      const hasContent =
        (text && text.trim().length > 0) || ariaLabel || img > 0;
      expect(
        hasContent,
        `Header link ${i} has no text, aria-label, or image`,
      ).toBeTruthy();
    }
  });

  test("navigation landmark exists", async ({ page, navigateTo }) => {
    await navigateTo("/");

    // Should have navigation landmark
    const nav = page.locator("nav, [role=navigation]");
    const count = await nav.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("main content landmark exists", async ({ page, navigateTo }) => {
    await navigateTo("/");

    const main = page.locator("main, [role=main]");
    await expect(main.first()).toBeVisible();
  });
});
