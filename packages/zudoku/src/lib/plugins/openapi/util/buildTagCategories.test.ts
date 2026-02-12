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

  it("merges a tag and tagGroup with the same name", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Contacts", makeTag("Contacts")],
      ["Notes", makeTag("Notes")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Contacts", tags: ["Contacts", "Notes"] }],
    });

    expect(result).toHaveLength(1);

    const contacts = result[0];
    expect(contacts?.label).toBe("Contacts");
    expect(contacts?.type).toBe("category");

    if (contacts?.type === "category") {
      // Operations from the "Contacts" tag come first, then "Notes" as a child
      expect(contacts.items).toHaveLength(2);
      expect(contacts.items[0]?.label).toBe("Contacts op");
      expect(contacts.items[1]?.label).toBe("Notes");
    }
  });

  it("excludes self-reference when tagGroup includes its own name in tags", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Contacts", makeTag("Contacts")],
      ["Notes", makeTag("Notes")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Contacts", tags: ["Contacts", "Notes"] }],
    });

    const contacts = result[0];
    if (contacts?.type === "category") {
      // "Contacts" tag should NOT appear as a nested child of itself
      const childLabels = contacts.items.map((i) => i.label);
      expect(childLabels).not.toContain("Contacts");
    }
  });

  it("excludes merged tag from ungrouped results", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Contacts", makeTag("Contacts")],
      ["Notes", makeTag("Notes")],
      ["Standalone", makeTag("Standalone")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Contacts", tags: ["Contacts", "Notes"] }],
    });

    // "Contacts" (merged) + "Standalone" (ungrouped) = 2 top-level entries
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.label)).toEqual(["Contacts", "Standalone"]);
  });

  it("merges tag with tagGroup that has no additional child tags", () => {
    const tagCategories = new Map<string, NavigationItem>([
      ["Contacts", makeTag("Contacts")],
    ]);

    const result = buildTagCategories({
      tagCategories,
      tagGroups: [{ name: "Contacts", tags: ["Contacts"] }],
    });

    expect(result).toHaveLength(1);

    const contacts = result[0];
    expect(contacts?.label).toBe("Contacts");
    if (contacts?.type === "category") {
      // Only the original operations, no nested tags
      expect(contacts.items).toHaveLength(1);
      expect(contacts.items[0]?.label).toBe("Contacts op");
    }
  });
});
