import { describe, expect, it } from "vitest";
import type {
  NavigationCategory,
  NavigationDoc,
  NavigationItem,
} from "../../../config/validators/NavigationSchema.js";
import type { UseAuthReturn } from "../../authentication/hook.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import {
  itemMatchesFilter,
  shouldShowItem,
  traverseNavigation,
  traverseNavigationItem,
} from "./utils.js";

describe("navigation utils", () => {
  describe("traverseNavigation", () => {
    it("finds item in flat navigation", () => {
      const navigation: NavigationItem[] = [
        { type: "doc", file: "doc1", label: "Doc 1", path: "/doc1" },
        { type: "doc", file: "doc2", label: "Doc 2", path: "/doc2" },
        { type: "doc", file: "doc3", label: "Doc 3", path: "/doc3" },
      ];

      const result = traverseNavigation(navigation, (item) => {
        if (item.type === "doc" && item.file === "doc2") {
          return item;
        }
      });

      expect(result).toEqual({
        type: "doc",
        file: "doc2",
        label: "Doc 2",
        path: "/doc2",
      });
    });

    it("finds item in nested navigation", () => {
      const navigation: NavigationItem[] = [
        {
          type: "category",
          label: "Category 1",
          items: [
            { type: "doc", file: "doc1", label: "Doc 1", path: "/doc1" },
            {
              type: "category",
              label: "Nested Category",
              items: [
                { type: "doc", file: "doc2", label: "Doc 2", path: "/doc2" },
              ],
            },
          ],
        },
      ];

      const result = traverseNavigation(navigation, (item) => {
        if (item.type === "doc" && item.file === "doc2") {
          return item;
        }
      });

      expect(result).toEqual({
        type: "doc",
        file: "doc2",
        label: "Doc 2",
        path: "/doc2",
      });
    });

    it("returns undefined when item not found", () => {
      const navigation: NavigationItem[] = [
        { type: "doc", file: "doc1", label: "Doc 1", path: "/doc1" },
      ];

      const result = traverseNavigation(navigation, (item) => {
        if (item.type === "doc" && item.file === "nonexistent") {
          return item;
        }
      });

      expect(result).toBeUndefined();
    });

    it("traverses all items", () => {
      const navigation: NavigationItem[] = [
        {
          type: "category",
          label: "Category",
          items: [
            { type: "doc", file: "doc1", label: "Doc 1", path: "/doc1" },
            { type: "doc", file: "doc2", label: "Doc 2", path: "/doc2" },
          ],
        },
      ];

      const visited: string[] = [];
      traverseNavigation(navigation, (item) => {
        visited.push(item.label);
      });

      expect(visited).toEqual(["Category", "Doc 1", "Doc 2"]);
    });

    it("provides parent categories in callback", () => {
      const navigation: NavigationItem[] = [
        {
          type: "category",
          label: "Parent",
          items: [
            {
              type: "category",
              label: "Child",
              items: [
                { type: "doc", file: "doc1", label: "Doc 1", path: "/doc1" },
              ],
            },
          ],
        },
      ];

      let parentCategories: NavigationItem[] = [];
      traverseNavigation(navigation, (item, parents) => {
        if (item.type === "doc") {
          parentCategories = parents;
        }
      });

      expect(parentCategories.map((p) => p.label)).toEqual(["Child", "Parent"]);
    });
  });

  describe("traverseNavigationItem", () => {
    it("traverses single item without children", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "doc1",
        label: "Doc 1",
        path: "/doc1",
      };

      const visited: string[] = [];
      traverseNavigationItem(item, (i) => {
        visited.push(i.label);
      });

      expect(visited).toEqual(["Doc 1"]);
    });

    it("traverses category with children", () => {
      const item: NavigationCategory = {
        type: "category",
        label: "Category",
        items: [
          { type: "doc", file: "doc1", label: "Doc 1", path: "/doc1" },
          { type: "doc", file: "doc2", label: "Doc 2", path: "/doc2" },
        ],
      };

      const visited: string[] = [];
      traverseNavigationItem(item, (i) => {
        visited.push(i.label);
      });

      expect(visited).toEqual(["Category", "Doc 1", "Doc 2"]);
    });

    it("stops traversing when callback returns value", () => {
      const item: NavigationCategory = {
        type: "category",
        label: "Category",
        items: [
          { type: "doc", file: "doc1", label: "Doc 1", path: "/doc1" },
          { type: "doc", file: "doc2", label: "Doc 2", path: "/doc2" },
          { type: "doc", file: "doc3", label: "Doc 3", path: "/doc3" },
        ],
      };

      const visited: string[] = [];
      const result = traverseNavigationItem(item, (i) => {
        visited.push(i.label);
        if (i.type === "doc" && i.file === "doc2") {
          return "found";
        }
      });

      expect(visited).toEqual(["Category", "Doc 1", "Doc 2"]);
      expect(result).toBe("found");
    });
  });

  describe("itemMatchesFilter", () => {
    it("matches item by label", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Getting Started",
        path: "/getting-started",
      };

      expect(itemMatchesFilter(item, "getting")).toBe(true);
      expect(itemMatchesFilter(item, "started")).toBe(true);
      expect(itemMatchesFilter(item, "GETTING")).toBe(true);
      expect(itemMatchesFilter(item, "nothing")).toBe(false);
    });

    it("always returns true for separator", () => {
      const item = { type: "separator" as const, label: "sep", display: "always" as const };
      expect(itemMatchesFilter(item, "any query")).toBe(true);
    });

    it("always returns true for section", () => {
      const item = { type: "section" as const, label: "Section", display: "always" as const };
      expect(itemMatchesFilter(item, "any query")).toBe(true);
    });

    it("always returns true for filter", () => {
      const item = { type: "filter" as const, label: "filter", display: "always" as const };
      expect(itemMatchesFilter(item, "any query")).toBe(true);
    });

    it("matches category if any child matches", () => {
      const item: NavigationCategory = {
        type: "category",
        label: "Guides",
        items: [
          { type: "doc", file: "intro", label: "Introduction", path: "/intro" },
          { type: "doc", file: "advanced", label: "Advanced Topics", path: "/advanced" },
        ],
      };

      expect(itemMatchesFilter(item, "introduction")).toBe(true);
      expect(itemMatchesFilter(item, "advanced")).toBe(true);
      expect(itemMatchesFilter(item, "nonexistent")).toBe(false);
    });

    it("matches category by its own label", () => {
      const item: NavigationCategory = {
        type: "category",
        label: "Getting Started",
        items: [
          { type: "doc", file: "test", label: "Test", path: "/test" },
        ],
      };

      expect(itemMatchesFilter(item, "getting")).toBe(true);
    });

    it("handles nested categories", () => {
      const item: NavigationCategory = {
        type: "category",
        label: "Guides",
        items: [
          {
            type: "category",
            label: "Advanced",
            items: [
              { type: "doc", file: "perf", label: "Performance", path: "/perf" },
            ],
          },
        ],
      };

      expect(itemMatchesFilter(item, "performance")).toBe(true);
    });

    it("handles case insensitive matching", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "API Reference",
        path: "/api",
      };

      expect(itemMatchesFilter(item, "api")).toBe(true);
      expect(itemMatchesFilter(item, "API")).toBe(true);
      expect(itemMatchesFilter(item, "Api")).toBe(true);
      expect(itemMatchesFilter(item, "reference")).toBe(true);
    });
  });

  describe("shouldShowItem", () => {
    const mockAuth: UseAuthReturn = {
      isAuthenticated: false,
      isAuthEnabled: true,
      profile: null,
      isPending: false,
    };

    const mockContext = {} as ZudokuContext;

    it("shows item with display: always", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Test",
        path: "/test",
        display: "always",
      };

      expect(shouldShowItem(mockAuth, mockContext)(item)).toBe(true);
    });

    it("hides item with display: hide", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Test",
        path: "/test",
        display: "hide",
      };

      expect(shouldShowItem(mockAuth, mockContext)(item)).toBe(false);
    });

    it("shows auth item only when authenticated", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Test",
        path: "/test",
        display: "auth",
      };

      expect(shouldShowItem(mockAuth, mockContext)(item)).toBe(false);
      expect(
        shouldShowItem({ ...mockAuth, isAuthenticated: true }, mockContext)(
          item,
        ),
      ).toBe(true);
    });

    it("shows anon item only when not authenticated", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Test",
        path: "/test",
        display: "anon",
      };

      expect(shouldShowItem(mockAuth, mockContext)(item)).toBe(true);
      expect(
        shouldShowItem({ ...mockAuth, isAuthenticated: true }, mockContext)(
          item,
        ),
      ).toBe(false);
    });

    it("hides item without label", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "",
        path: "/test",
      };

      expect(shouldShowItem(mockAuth, mockContext)(item)).toBe(false);
    });

    it("always shows filter item", () => {
      const item = {
        type: "filter" as const,
        label: "filter",
        display: "hide" as const,
      };

      expect(shouldShowItem(mockAuth, mockContext)(item)).toBe(true);
    });

    it("uses custom display function", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Test",
        path: "/test",
        display: ({ auth }) => auth.isAuthenticated && auth.profile?.email?.includes("@example.com"),
      };

      expect(shouldShowItem(mockAuth, mockContext)(item)).toBe(false);

      const authWithProfile: UseAuthReturn = {
        ...mockAuth,
        isAuthenticated: true,
        profile: { email: "user@example.com" },
      };
      expect(shouldShowItem(authWithProfile, mockContext)(item)).toBe(true);

      const authWithOtherEmail: UseAuthReturn = {
        ...mockAuth,
        isAuthenticated: true,
        profile: { email: "user@other.com" },
      };
      expect(shouldShowItem(authWithOtherEmail, mockContext)(item)).toBe(false);
    });

    it("filters by query when provided", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Getting Started",
        path: "/test",
      };

      expect(shouldShowItem(mockAuth, mockContext, "getting")(item)).toBe(true);
      expect(shouldShowItem(mockAuth, mockContext, "advanced")(item)).toBe(false);
    });

    it("shows item when query is empty or whitespace", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Test",
        path: "/test",
      };

      expect(shouldShowItem(mockAuth, mockContext, "")(item)).toBe(true);
      expect(shouldShowItem(mockAuth, mockContext, "   ")(item)).toBe(true);
    });

    it("combines display and filter checks", () => {
      const item: NavigationDoc = {
        type: "doc",
        file: "test",
        label: "Admin Panel",
        path: "/admin",
        display: "auth",
      };

      // Not authenticated, matches filter - should hide
      expect(shouldShowItem(mockAuth, mockContext, "admin")(item)).toBe(false);

      // Authenticated, doesn't match filter - should hide
      expect(
        shouldShowItem(
          { ...mockAuth, isAuthenticated: true },
          mockContext,
          "other",
        )(item),
      ).toBe(false);

      // Authenticated, matches filter - should show
      expect(
        shouldShowItem(
          { ...mockAuth, isAuthenticated: true },
          mockContext,
          "admin",
        )(item),
      ).toBe(true);
    });
  });
});