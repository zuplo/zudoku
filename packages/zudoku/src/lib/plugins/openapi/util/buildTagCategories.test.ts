import { describe, expect, it } from "vitest";
import type { NavigationItem } from "../../../../config/validators/NavigationSchema.js";
import { buildTagCategories } from "./buildTagCategories.js";

const makeTag = (label: string): NavigationItem => ({
  type: "category",
  label,
  items: [
    { type: "link", label: `${label} op`, to: `/${label.toLowerCase()}` },
  ],
  collapsible: true,
  collapsed: true,
});

describe("buildTagCategories", () => {
  it("returns tags in insertion order when no tag groups exist", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Zebra", makeTag("Zebra")],
      ["Alpha", makeTag("Alpha")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [],
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.label).toBe("Zebra");
    expect(result[1]?.label).toBe("Alpha");
  });

  it("places groups first, then ungrouped when interleaving is disabled", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Packages", makeTag("Packages")],
      ["Tracking", makeTag("Tracking")],
      ["Documentation", makeTag("Documentation")],
      ["Invoices", makeTag("Invoices")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [
        { name: "Shipment", tags: ["Packages", "Tracking"] },
        { name: "Billing", tags: ["Invoices"] },
      ],
      interleaveTagGroups: false,
    });

    expect(result).toHaveLength(3);
    expect(result[0]?.label).toBe("Shipment");
    expect(result[1]?.label).toBe("Billing");
    expect(result[2]?.label).toBe("Documentation");
  });

  it("sorts groups and ungrouped tags alphabetically when interleaving is enabled", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Packages", makeTag("Packages")],
      ["Tracking", makeTag("Tracking")],
      ["Documentation", makeTag("Documentation")],
      ["Invoices", makeTag("Invoices")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [
        { name: "Shipment", tags: ["Packages", "Tracking"] },
        { name: "Billing", tags: ["Invoices"] },
      ],
      interleaveTagGroups: true,
    });

    expect(result).toHaveLength(3);
    expect(result[0]?.label).toBe("Billing");
    expect(result[1]?.label).toBe("Documentation");
    expect(result[2]?.label).toBe("Shipment");
  });

  it("preserves nested group structure when interleaving", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Packages", makeTag("Packages")],
      ["Tracking", makeTag("Tracking")],
      ["Documentation", makeTag("Documentation")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Shipment", tags: ["Packages", "Tracking"] }],
      interleaveTagGroups: true,
    });

    const shipment = result.find((item) => item.label === "Shipment");
    expect(shipment).toBeDefined();
    expect(shipment?.type).toBe("category");
    if (shipment?.type === "category") {
      expect(shipment.items).toHaveLength(2);
      expect(shipment.items[0]?.label).toBe("Packages");
      expect(shipment.items[1]?.label).toBe("Tracking");
    }
  });

  it("filters out empty groups in both modes", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Alpha", makeTag("Alpha")],
    ]);

    const resultWithout = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "EmptyGroup", tags: ["NonExistent"] }],
      interleaveTagGroups: false,
    });

    expect(resultWithout).toHaveLength(1);
    expect(resultWithout[0]?.label).toBe("Alpha");

    const resultWith = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "EmptyGroup", tags: ["NonExistent"] }],
      interleaveTagGroups: true,
    });

    expect(resultWith).toHaveLength(1);
    expect(resultWith[0]?.label).toBe("Alpha");
  });

  it("sets collapsed based on expandAllTags", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Packages", makeTag("Packages")],
    ]);

    const collapsedResult = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Shipment", tags: ["Packages"] }],
      expandAllTags: false,
    });

    const shipmentCollapsed = collapsedResult[0];
    if (shipmentCollapsed?.type === "category") {
      expect(shipmentCollapsed.collapsed).toBe(true);
    }

    const expandedResult = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Shipment", tags: ["Packages"] }],
      expandAllTags: true,
    });

    const shipmentExpanded = expandedResult[0];
    if (shipmentExpanded?.type === "category") {
      expect(shipmentExpanded.collapsed).toBe(false);
    }
  });

  it("returns empty array when tagCategories is empty", () => {
    const result = buildTagCategories({
      tagCategories: new Map(),
      tagGroups: [],
    });

    expect(result).toEqual([]);
  });
});
