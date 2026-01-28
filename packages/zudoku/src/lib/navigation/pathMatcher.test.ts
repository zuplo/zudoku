import { describe, expect, it } from "vitest";
import type { NavigationItem } from "../../config/validators/NavigationSchema.js";
import { findByPath } from "./pathMatcher.js";

const mockNavigation: NavigationItem[] = [
  {
    type: "category",
    label: "Shipments",
    items: [
      { type: "link", label: "Track a Shipment", to: "/track" },
      { type: "link", label: "Create Shipment", to: "/create" },
      {
        type: "category",
        label: "Nested Category",
        items: [
          { type: "link", label: "First Nested", to: "/nested/first" },
          { type: "link", label: "Second Nested", to: "/nested/second" },
        ],
      },
    ],
  },
  { type: "link", label: "About", to: "/about" },
];

describe("pathMatcher", () => {
  describe("findByPath", () => {
    it("should find item by label", () => {
      const result = findByPath(mockNavigation, "Shipments");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Shipments");
      expect(result.index).toBe(0);
    });

    it("should find nested item by label path", () => {
      const result = findByPath(mockNavigation, "Shipments/Track a Shipment");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Track a Shipment");
      expect(result.index).toBe(0);
    });

    it("should find item by index", () => {
      const result = findByPath(mockNavigation, "Shipments/0");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Track a Shipment");
      expect(result.index).toBe(0);
    });

    it("should find nested item by mixed path (label + index)", () => {
      const result = findByPath(mockNavigation, "Shipments/2/0");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("First Nested");
      expect(result.index).toBe(0);
    });

    it("should be case-insensitive for label matching", () => {
      const result = findByPath(mockNavigation, "shipments/track a shipment");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Track a Shipment");
    });

    it("should find deeply nested items", () => {
      const result = findByPath(
        mockNavigation,
        "Shipments/Nested Category/Second Nested",
      );
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Second Nested");
      expect(result.index).toBe(1);
    });

    it("should return found=false for non-existent path", () => {
      const result = findByPath(mockNavigation, "Nonexistent/Path");
      expect(result.found).toBe(false);
      expect(result.item).toBeUndefined();
    });

    it("should return found=false for invalid index", () => {
      const result = findByPath(mockNavigation, "Shipments/999");
      expect(result.found).toBe(false);
    });

    it("should handle root-level items", () => {
      const result = findByPath(mockNavigation, "About");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("About");
      expect(result.index).toBe(1);
    });

    it("should provide parentItems for inserting siblings", () => {
      const result = findByPath(mockNavigation, "Shipments/0");
      expect(result.parentItems).toBeDefined();
      expect(result.parentItems?.length).toBe(3); // 2 links + 1 category
    });

    it("should handle empty path", () => {
      const result = findByPath(mockNavigation, "");
      expect(result.found).toBe(false);
    });

    it("should support negative indices (-1 for last item)", () => {
      const result = findByPath(mockNavigation, "Shipments/-1");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Nested Category");
    });

    it("should support negative indices (-2 for second-to-last)", () => {
      const result = findByPath(mockNavigation, "Shipments/-2");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Create Shipment");
    });

    it("should support negative indices in nested paths", () => {
      const result = findByPath(mockNavigation, "Shipments/-1/-1");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Second Nested");
    });

    it("should handle paths with trailing slashes", () => {
      const result = findByPath(mockNavigation, "Shipments/0/");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Track a Shipment");
    });

    it("should handle paths with double slashes", () => {
      const result = findByPath(mockNavigation, "Shipments//0");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Track a Shipment");
    });

    it("should handle paths with leading slashes", () => {
      const result = findByPath(mockNavigation, "/Shipments/0");
      expect(result.found).toBe(true);
      expect(result.item?.label).toBe("Track a Shipment");
    });
  });
});
