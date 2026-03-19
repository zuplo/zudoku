import { expect, test } from "../fixtures/base.js";

test.describe("Dropdown Menus", () => {
  test.beforeEach(async ({ navigateTo }) => {
    await navigateTo("/");
  });

  test("Solutions and Products triggers are visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Solutions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Products" })).toBeVisible();
  });

  test("dropdown triggers have chevron icons", async ({ page }) => {
    const solutionsButton = page.getByRole("button", { name: "Solutions" });
    const chevron = solutionsButton.locator("svg");
    await expect(chevron).toBeVisible();

    const productsButton = page.getByRole("button", { name: "Products" });
    const chevron2 = productsButton.locator("svg");
    await expect(chevron2).toBeVisible();
  });

  test("dropdown triggers are interactive buttons", async ({ page }) => {
    // Verify triggers are real buttons with expected Radix attributes
    const solutionsButton = page.getByRole("button", { name: "Solutions" });
    await expect(solutionsButton).toHaveAttribute("data-state");

    const productsButton = page.getByRole("button", { name: "Products" });
    await expect(productsButton).toHaveAttribute("data-state");
  });
});
