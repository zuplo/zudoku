import { describe, expect, it, vi } from "vitest";
import type { AtPosition } from "../../config/validators/InputNavigationSchema.js";
import type { NavigationItem } from "../../config/validators/NavigationSchema.js";
import { repositionItems } from "./positionItems.js";

type NavigationItemWithAt = NavigationItem & { at?: AtPosition };

describe("positionItems", () => {
  it("should return navigation unchanged if no items have `at` property", () => {
    const navigation: NavigationItem[] = [
      { type: "link", label: "Home", to: "/" },
      { type: "link", label: "About", to: "/about" },
    ];

    const result = repositionItems(navigation);
    expect(result).toEqual(navigation);
  });

  it("should position item with 'before' relative to target", () => {
    const navigation: NavigationItemWithAt[] = [
      {
        type: "category",
        label: "Docs",
        items: [
          { type: "link", label: "First", to: "/first" },
          { type: "link", label: "Second", to: "/second" },
        ],
      },
      {
        type: "link",
        label: "Inserted",
        to: "/inserted",
        at: { path: "Docs/Second", position: "before" },
      },
    ];

    const result = repositionItems(navigation);
    const docsCategory = result[0];

    expect(docsCategory).toBeDefined();
    expect(docsCategory?.type).toBe("category");
    if (docsCategory?.type === "category") {
      expect(docsCategory.items[0]?.label).toBe("First");
      expect(docsCategory.items[1]?.label).toBe("Inserted");
      expect(docsCategory.items[2]?.label).toBe("Second");
    }
  });

  it("should position item with 'after' relative to target", () => {
    const navigation: NavigationItemWithAt[] = [
      {
        type: "category",
        label: "Docs",
        items: [
          { type: "link", label: "First", to: "/first" },
          { type: "link", label: "Second", to: "/second" },
        ],
      },
      {
        type: "link",
        label: "Inserted",
        to: "/inserted",
        at: { path: "Docs/First", position: "after" },
      },
    ];

    const result = repositionItems(navigation);
    const docsCategory = result[0];

    expect(docsCategory).toBeDefined();
    expect(docsCategory?.type).toBe("category");
    if (docsCategory?.type === "category") {
      expect(docsCategory.items[0]?.label).toBe("First");
      expect(docsCategory.items[1]?.label).toBe("Inserted");
      expect(docsCategory.items[2]?.label).toBe("Second");
    }
  });

  it("should handle multiple items with `at` property", () => {
    const navigation: NavigationItemWithAt[] = [
      {
        type: "category",
        label: "API",
        items: [{ type: "link", label: "Original", to: "/original" }],
      },
      {
        type: "link",
        label: "First",
        to: "/first",
        at: { path: "API/Original", position: "before" },
      },
      {
        type: "link",
        label: "Last",
        to: "/last",
        at: { path: "API/Original", position: "after" },
      },
    ];

    const result = repositionItems(navigation);
    const apiCategory = result[0];

    expect(apiCategory?.type).toBe("category");
    if (apiCategory?.type === "category") {
      expect(apiCategory?.items[0]?.label).toBe("First");
      expect(apiCategory?.items[1]?.label).toBe("Original");
      expect(apiCategory?.items[2]?.label).toBe("Last");
    }
  });

  it("should handle nested items with `at` property", () => {
    const navigation: NavigationItemWithAt[] = [
      {
        type: "category",
        label: "Outer",
        items: [{ type: "link", label: "Item", to: "/item" }],
      },
      {
        type: "category",
        label: "Inner Category",
        at: { path: "Outer/Item", position: "after" },
        items: [
          {
            type: "link",
            label: "Nested",
            to: "/nested",
            at: { path: "Outer/Item", position: "after" },
          },
        ],
      },
    ];

    const result = repositionItems(navigation);
    const outerCategory = result[0];

    expect(outerCategory).toBeDefined();
    expect(outerCategory?.type).toBe("category");
    if (outerCategory?.type === "category") {
      // Both items positioned after Item
      expect(outerCategory?.items.length).toBe(3);
      expect(outerCategory?.items[0]?.label).toBe("Item");
      expect(outerCategory?.items[1]?.label).toBe("Nested");
      expect(outerCategory?.items[2]?.label).toBe("Inner Category");
    }
  });

  it("should keep item at root if target path not found", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const navigation: NavigationItemWithAt[] = [
      { type: "link", label: "Home", to: "/" },
      {
        type: "link",
        label: "Orphan",
        to: "/orphan",
        at: { path: "Nonexistent/Path", position: "before" },
      },
    ];

    const result = repositionItems(navigation);

    expect(result.length).toBe(2);
    expect(result[1]?.label).toBe("Orphan");
    expect("at" in (result[1] ?? {})).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('target path "Nonexistent/Path" not found'),
    );

    consoleWarnSpy.mockRestore();
  });

  it("should remove `at` property from positioned items", () => {
    const navigation: NavigationItemWithAt[] = [
      { type: "link", label: "Target", to: "/target" },
      {
        type: "link",
        label: "Item",
        to: "/item",
        at: { path: "Target", position: "before" },
      },
    ];

    const result = repositionItems(navigation);

    result.forEach((item) => {
      expect("at" in item).toBe(false);
    });
  });

  it("should handle positioning by index", () => {
    const navigation: NavigationItemWithAt[] = [
      {
        type: "category",
        label: "Shipments",
        items: [
          { type: "link", label: "Op1", to: "/op1" },
          { type: "link", label: "Op2", to: "/op2" },
        ],
      },
      {
        type: "doc",
        file: "overview",
        label: "Overview",
        path: "/overview",
        at: { path: "Shipments/0", position: "before" },
      },
    ];

    const result = repositionItems(navigation);
    const shipmentsCategory = result[0];

    expect(shipmentsCategory).toBeDefined();
    expect(shipmentsCategory?.type).toBe("category");
    if (shipmentsCategory?.type === "category") {
      expect(shipmentsCategory.items[0]?.label).toBe("Overview");
      expect(shipmentsCategory?.items[1]?.label).toBe("Op1");
      expect(shipmentsCategory?.items[2]?.label).toBe("Op2");
    }
  });

  it("should not share nested array references between failed and successful insertions", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const navigation: NavigationItemWithAt[] = [
      {
        type: "category",
        label: "Cat1",
        items: [{ type: "link", label: "Original", to: "/original" }],
      },
      {
        type: "link",
        label: "BadTarget",
        to: "/bad",
        at: { path: "Nonexistent/Path", position: "before" },
      },
      {
        type: "link",
        label: "GoodTarget",
        to: "/good",
        at: { path: "Cat1/Original", position: "before" },
      },
    ];

    const result = repositionItems(navigation);

    // Verify BadTarget is at root level (failed positioning)
    expect(result.length).toBe(2);
    expect(result[1]?.label).toBe("BadTarget");

    // Verify GoodTarget was inserted correctly into Cat1
    const cat1 = result[0];
    expect(cat1?.type).toBe("category");
    if (cat1?.type === "category") {
      expect(cat1.items.length).toBe(2);
      expect(cat1.items[0]?.label).toBe("GoodTarget");
      expect(cat1.items[1]?.label).toBe("Original");
    }

    consoleWarnSpy.mockRestore();
  });
});
