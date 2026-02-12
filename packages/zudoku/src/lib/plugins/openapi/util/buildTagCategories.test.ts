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
  it("returns tags sorted alphabetically when no tag groups exist", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Zebra", makeTag("Zebra")],
      ["Alpha", makeTag("Alpha")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [],
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.label).toBe("Alpha");
    expect(result[1]?.label).toBe("Zebra");
  });

  it("sorts groups and ungrouped tags alphabetically", () => {
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
    });

    expect(result).toHaveLength(3);
    expect(result[0]?.label).toBe("Billing");
    expect(result[1]?.label).toBe("Documentation");
    expect(result[2]?.label).toBe("Shipment");
  });

  it("preserves nested group structure", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Packages", makeTag("Packages")],
      ["Tracking", makeTag("Tracking")],
      ["Documentation", makeTag("Documentation")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Shipment", tags: ["Packages", "Tracking"] }],
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

  it("filters out empty groups", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Alpha", makeTag("Alpha")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "EmptyGroup", tags: ["NonExistent"] }],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe("Alpha");
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
