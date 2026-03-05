import { describe, expect, it } from "vitest";
import type { NavigationItem } from "../../config/validators/NavigationSchema.js";
import { findByPath, type PathMatchResult } from "./pathMatcher.js";

type ItemMatch = Exclude<PathMatchResult, undefined | { isRoot: true }>;

const expectItemMatch = (value: PathMatchResult): ItemMatch => {
  if (!value || value.isRoot) {
    throw new Error("Expected item match, got root or undefined");
  }
  return value;
};

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
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Shipments");
      expect(match.index).toBe(0);
    });

    it("should find nested item by label path", () => {
      const result = findByPath(mockNavigation, "Shipments/Track a Shipment");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Track a Shipment");
      expect(match.index).toBe(0);
    });

    it("should find item by index", () => {
      const result = findByPath(mockNavigation, "Shipments/0");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Track a Shipment");
      expect(match.index).toBe(0);
    });

    it("should find nested item by mixed path (label + index)", () => {
      const result = findByPath(mockNavigation, "Shipments/2/0");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("First Nested");
      expect(match.index).toBe(0);
    });

    it("should be case-insensitive for label matching", () => {
      const result = findByPath(mockNavigation, "shipments/track a shipment");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Track a Shipment");
    });

    it("should find deeply nested items", () => {
      const result = findByPath(
        mockNavigation,
        "Shipments/Nested Category/Second Nested",
      );
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Second Nested");
      expect(match.index).toBe(1);
    });

    it("should return undefined for non-existent path", () => {
      const result = findByPath(mockNavigation, "Nonexistent/Path");
      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid index", () => {
      const result = findByPath(mockNavigation, "Shipments/999");
      expect(result).toBeUndefined();
    });

    it("should handle root-level items", () => {
      const result = findByPath(mockNavigation, "About");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("About");
      expect(match.index).toBe(1);
    });

    it("should provide parentItems for inserting siblings", () => {
      const result = findByPath(mockNavigation, "Shipments/0");
      const match = expectItemMatch(result);
      expect(match.parentItems?.length).toBe(3); // 2 links + 1 category
    });

    it("should handle empty path", () => {
      const result = findByPath(mockNavigation, "");
      expect(result).toBeUndefined();
    });

    it("should support negative indices (-1 for last item)", () => {
      const result = findByPath(mockNavigation, "Shipments/-1");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Nested Category");
    });

    it("should support negative indices (-2 for second-to-last)", () => {
      const result = findByPath(mockNavigation, "Shipments/-2");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Create Shipment");
    });

    it("should support negative indices in nested paths", () => {
      const result = findByPath(mockNavigation, "Shipments/-1/-1");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Second Nested");
    });

    it("should handle paths with trailing slashes", () => {
      const result = findByPath(mockNavigation, "Shipments/0/");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Track a Shipment");
    });

    it("should handle paths with double slashes", () => {
      const result = findByPath(mockNavigation, "Shipments//0");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Track a Shipment");
    });

    it("should handle paths with leading slashes", () => {
      const result = findByPath(mockNavigation, "/Shipments/0");
      const match = expectItemMatch(result);
      expect(match.item.label).toBe("Track a Shipment");
    });
  });
});
