import { describe, expect, it } from "vitest";
import type {
  NavigationItem,
  ResolvedNavigationRule,
} from "../../config/validators/NavigationSchema.js";
import { applyRules } from "./applyRules.js";

const createMockNavigation = (): NavigationItem[] => [
  {
    type: "category",
    label: "Shipments",
    items: [
      { type: "link", label: "Track a Shipment", to: "/track" },
      { type: "link", label: "Create Shipment", to: "/create" },
      { type: "link", label: "Delete Shipment", to: "/delete" },
    ],
  },
  { type: "link", label: "About", to: "/about" },
];

describe("applyRules", () => {
  describe("modify rules", () => {
    it("should modify label of matched item", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "modify", match: "Shipments", set: { label: "Shipping" } },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      expect(result[0]?.label).toBe("Shipping");
    });

    it("should modify collapsed state", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "modify", match: "Shipments", set: { collapsed: true } },
      ];

      const { result } = applyRules(nav, rules);

      expect(result[0]).toHaveProperty("collapsed", true);
    });

    it("should modify multiple properties", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "modify",
          match: "Shipments",
          set: { label: "Shipping", collapsible: false, collapsed: true },
        },
      ];

      const { result } = applyRules(nav, rules);

      expect(result[0]?.label).toBe("Shipping");
      expect(result[0]).toHaveProperty("collapsible", false);
      expect(result[0]).toHaveProperty("collapsed", true);
    });
  });

  describe("insert rules", () => {
    it("should insert before matched item", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "insert",
          match: "About",
          position: "before",
          items: [{ type: "link", label: "Contact", to: "/contact" }],
        },
      ];

      const { result } = applyRules(nav, rules);

      expect(result[1]?.label).toBe("Contact");
      expect(result[2]?.label).toBe("About");
    });

    it("should insert after matched item", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "insert",
          match: "Shipments",
          position: "after",
          items: [{ type: "link", label: "Orders", to: "/orders" }],
        },
      ];

      const { result } = applyRules(nav, rules);

      expect(result[0]?.label).toBe("Shipments");
      expect(result[1]?.label).toBe("Orders");
      expect(result[2]?.label).toBe("About");
    });

    it("should insert by index", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "insert",
          match: "Shipments/0",
          position: "before",
          items: [{ type: "link", label: "Intro", to: "/intro" }],
        },
      ];

      const { result } = applyRules(nav, rules);
      const shipments = result[0];

      if (shipments?.type === "category") {
        expect(shipments.items[0]?.label).toBe("Intro");
        expect(shipments.items[1]?.label).toBe("Track a Shipment");
      }
    });
  });

  describe("remove rules", () => {
    it("should remove matched item", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "remove", match: "About" },
      ];

      const { result } = applyRules(nav, rules);

      expect(result).toHaveLength(1);
      expect(result.find((item) => item.label === "About")).toBeUndefined();
    });

    it("should remove nested item", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "remove", match: "Shipments/Delete Shipment" },
      ];

      const { result } = applyRules(nav, rules);
      const shipments = result[0];

      if (shipments?.type === "category") {
        expect(shipments.items).toHaveLength(2);
        expect(
          shipments.items.find((item) => item.label === "Delete Shipment"),
        ).toBeUndefined();
      }
    });

    it("should remove by label", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "remove", match: "Shipments/Delete Shipment" },
      ];

      const { result } = applyRules(nav, rules);
      const shipments = result[0];

      if (shipments?.type === "category") {
        expect(
          shipments.items.find((item) => item.label === "Delete Shipment"),
        ).toBeUndefined();
      }
    });
  });

  describe("warnings", () => {
    it("should warn when target not found", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "modify", match: "NonExistent", set: { label: "Test" } },
      ];

      const { warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("NonExistent");
    });

    it("should continue processing other rules after warning", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "modify", match: "NonExistent", set: { label: "Test" } },
        { type: "modify", match: "About", set: { label: "About Us" } },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(1);
      expect(result[1]?.label).toBe("About Us");
    });
  });

  describe("multiple rules", () => {
    it("should apply rules in order", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "modify", match: "Shipments", set: { collapsed: true } },
        {
          type: "insert",
          match: "Shipments/0",
          position: "before",
          items: [{ type: "link", label: "Overview", to: "/overview" }],
        },
        { type: "remove", match: "Shipments/Delete Shipment" },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      const shipments = result[0];
      expect(shipments).toHaveProperty("collapsed", true);
      if (shipments?.type === "category") {
        expect(shipments.items[0]?.label).toBe("Overview");
        expect(
          shipments.items.find((item) => item.label === "Delete Shipment"),
        ).toBeUndefined();
      }
    });
  });

  describe("immutability", () => {
    it("should not modify original navigation", () => {
      const nav = createMockNavigation();
      const originalLabel = nav[0]?.label;
      const rules: ResolvedNavigationRule[] = [
        { type: "modify", match: "Shipments", set: { label: "Modified" } },
      ];

      applyRules(nav, rules);

      expect(nav[0]?.label).toBe(originalLabel);
    });
  });

  describe("sort rules", () => {
    it("should sort category children alphabetically", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "sort",
          match: "Shipments",
          by: (a, b) => a.label.localeCompare(b.label),
        },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      const shipments = result[0];
      if (shipments?.type === "category") {
        expect(shipments.items.map((i) => i.label)).toEqual([
          "Create Shipment",
          "Delete Shipment",
          "Track a Shipment",
        ]);
      }
    });

    it("should sort with custom comparator (reverse)", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "sort",
          match: "Shipments",
          by: (a, b) => b.label?.localeCompare(a.label),
        },
      ];

      const { result } = applyRules(nav, rules);

      const shipments = result[0];
      if (shipments?.type === "category") {
        expect(shipments.items.map((i) => i.label)).toEqual([
          "Track a Shipment",
          "Delete Shipment",
          "Create Shipment",
        ]);
      }
    });

    it("should warn when sort target is not a category", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "sort",
          match: "About",
          by: (a, b) => a.label.localeCompare(b.label),
        },
      ];

      const { warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("not a category");
    });

    it("should sort a nested sub-category", () => {
      const nav: NavigationItem[] = [
        {
          type: "category",
          label: "Shipments",
          items: [
            {
              type: "category",
              label: "Domestic",
              items: [
                { type: "link", label: "Ground", to: "/ground" },
                { type: "link", label: "Air", to: "/air" },
                { type: "link", label: "Express", to: "/express" },
              ],
            },
            { type: "link", label: "International", to: "/intl" },
          ],
        },
      ];
      const rules: ResolvedNavigationRule[] = [
        {
          type: "sort",
          match: "Shipments/Domestic",
          by: (a, b) => a.label.localeCompare(b.label),
        },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      const shipments = result[0];
      if (shipments?.type === "category") {
        const domestic = shipments.items[0];
        if (domestic?.type === "category") {
          expect(domestic.items.map((i) => i.label)).toEqual([
            "Air",
            "Express",
            "Ground",
          ]);
        }
      }
    });

    it("should sort combined with other rules", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "insert",
          match: "Shipments/0",
          position: "before",
          items: [{ type: "link", label: "AAA First", to: "/first" }],
        },
        {
          type: "sort",
          match: "Shipments",
          by: (a, b) => a.label.localeCompare(b.label),
        },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      const shipments = result[0];
      if (shipments?.type === "category") {
        expect(shipments.items[0]?.label).toBe("AAA First");
      }
    });
  });

  describe("move rules", () => {
    it("should move item before target", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        { type: "move", match: "About", to: "Shipments/0", position: "before" },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      expect(result).toHaveLength(1);
      const shipments = result[0];
      if (shipments?.type === "category") {
        expect(shipments.items[0]?.label).toBe("About");
        expect(shipments.items[1]?.label).toBe("Track a Shipment");
      }
    });

    it("should move item after target", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "move",
          match: "Shipments/Track a Shipment",
          to: "About",
          position: "after",
        },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      expect(result[1]?.label).toBe("About");
      expect(result[2]?.label).toBe("Track a Shipment");
    });

    it("should warn when move target not found", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "move",
          match: "About",
          to: "NonExistent",
          position: "before",
        },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("NonExistent");
      // Item should remain in original position
      expect(result[1]?.label).toBe("About");
    });

    it("should move nested item to root level", () => {
      const nav = createMockNavigation();
      const rules: ResolvedNavigationRule[] = [
        {
          type: "move",
          match: "Shipments/Create Shipment",
          to: "About",
          position: "before",
        },
      ];

      const { result, warnings } = applyRules(nav, rules);

      expect(warnings).toHaveLength(0);
      expect(result[1]?.label).toBe("Create Shipment");
      expect(result[2]?.label).toBe("About");
      const shipments = result[0];
      if (shipments?.type === "category") {
        expect(shipments.items).toHaveLength(2);
      }
    });
  });

  describe("scoped rules with topNavLabel", () => {
    const topNavLabel = "Shipments";

    it("should apply rule when label prefix matches", () => {
      const sidebarNav: NavigationItem[] = [
        { type: "link", label: "Track a Shipment", to: "/track" },
        { type: "link", label: "Create Shipment", to: "/create" },
      ];
      const rules: ResolvedNavigationRule[] = [
        {
          type: "insert",
          match: "Shipments/0",
          position: "before",
          items: [{ type: "link", label: "Getting Started", to: "/start" }],
        },
      ];

      const { result, warnings } = applyRules(sidebarNav, rules, topNavLabel);

      expect(warnings).toHaveLength(0);
      expect(result[0]?.label).toBe("Getting Started");
      expect(result[1]?.label).toBe("Track a Shipment");
    });

    it("should skip rule when prefix does not match", () => {
      const sidebarNav: NavigationItem[] = [
        { type: "link", label: "Track a Shipment", to: "/track" },
      ];
      const rules: ResolvedNavigationRule[] = [
        {
          type: "insert",
          match: "Documentation/0",
          position: "before",
          items: [{ type: "link", label: "Intro", to: "/intro" }],
        },
      ];

      const { result, warnings } = applyRules(sidebarNav, rules, topNavLabel);

      expect(warnings).toHaveLength(0);
      expect(result).toHaveLength(1);
    });

    it("should skip multi-segment numeric paths", () => {
      const sidebarNav: NavigationItem[] = [
        {
          type: "category",
          label: "Cat",
          items: [{ type: "link", label: "Child", to: "/child" }],
        },
      ];
      const rules: ResolvedNavigationRule[] = [
        {
          type: "modify",
          match: "0/0",
          set: { label: "Wrong" },
        },
      ];

      const { result, warnings } = applyRules(sidebarNav, rules, topNavLabel);

      expect(warnings).toHaveLength(0);
      expect(result).toHaveLength(1);
      expect(result[0]?.label).toBe("Cat");
    });

    it("should apply rule without prefix when no topNav", () => {
      const nav: NavigationItem[] = [{ type: "link", label: "Home", to: "/" }];
      const rules: ResolvedNavigationRule[] = [
        {
          type: "insert",
          match: "0",
          position: "after",
          items: [{ type: "link", label: "About", to: "/about" }],
        },
      ];

      const { result } = applyRules(nav, rules);

      expect(result[0]?.label).toBe("Home");
      expect(result[1]?.label).toBe("About");
    });

    it("should sort root level items when match equals topNavLabel", () => {
      const sidebarNav: NavigationItem[] = [
        {
          type: "category",
          label: "Billing & International",
          items: [],
        },
        {
          type: "category",
          label: "Shipment",
          items: [],
        },
        {
          type: "category",
          label: "Administration",
          items: [],
        },
      ];
      const topNavLabel = "API Reference";
      const rules: ResolvedNavigationRule[] = [
        {
          type: "sort",
          match: "API Reference",
          by: (a, b) => a.label.localeCompare(b.label),
        },
      ];

      const { result, warnings } = applyRules(sidebarNav, rules, topNavLabel);

      expect(warnings).toHaveLength(0);
      expect(result[0]?.label).toBe("Administration");
      expect(result[1]?.label).toBe("Billing & International");
      expect(result[2]?.label).toBe("Shipment");
    });
  });
});
