import { describe, expect, it } from "vitest";
import type { NavigationPlugin } from "../../core/plugins.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { apiCatalogPlugin, type ApiCatalogItem } from "./index.js";

const mockItems: ApiCatalogItem[] = [
  {
    path: "/api/users",
    label: "Users API",
    description: "Manage users",
    categories: [{ label: "Core", tags: ["Users"] }],
  },
  {
    path: "/api/posts",
    label: "Posts API",
    description: "Manage posts",
    categories: [{ label: "Core", tags: ["Content"] }],
  },
  {
    path: "/api/auth",
    label: "Auth API",
    description: "Authentication",
    categories: [{ label: "Security", tags: ["Auth"] }],
  },
];

const mockContext = {} as ZudokuContext;

describe("apiCatalogPlugin", () => {
  describe("with empty categories", () => {
    it("creates a route for the base path", async () => {
      const plugin = apiCatalogPlugin({
        path: "/catalog",
        label: "API Catalog",
        categories: [],
        items: mockItems,
      }) as NavigationPlugin;

      const routes = plugin.getRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/catalog");
    });

    it("returns navigation with overview link when on catalog path", async () => {
      const plugin = apiCatalogPlugin({
        path: "/catalog",
        label: "API Catalog",
        categories: [],
        items: mockItems,
      }) as NavigationPlugin;

      const navigation = await plugin.getNavigation?.("/catalog", mockContext);
      expect(navigation).toHaveLength(1);
      expect(navigation?.[0]).toMatchObject({
        type: "link",
        to: "/catalog",
        label: "Overview",
        badge: { label: "3", color: "outline" },
      });
    });

    it("returns empty navigation when not on catalog path", async () => {
      const plugin = apiCatalogPlugin({
        path: "/catalog",
        label: "API Catalog",
        categories: [],
        items: mockItems,
      }) as NavigationPlugin;

      const navigation = await plugin.getNavigation?.(
        "/other-path",
        mockContext,
      );
      expect(navigation).toEqual([]);
    });
  });

  describe("with categories", () => {
    it("creates routes for overview and each tag", async () => {
      const plugin = apiCatalogPlugin({
        path: "/catalog",
        label: "API Catalog",
        categories: [
          { label: "Core", tags: ["Users", "Content"] },
          { label: "Security", tags: ["Auth"] },
        ],
        items: mockItems,
      }) as NavigationPlugin;

      const routes = plugin.getRoutes();
      // Overview + 2 Core tags + 1 Security tag = 4 routes
      expect(routes.length).toBeGreaterThanOrEqual(3);
      expect(routes.some((r) => r.path === "/catalog")).toBe(true);
    });

    it("returns navigation with categories when on catalog path", async () => {
      const plugin = apiCatalogPlugin({
        path: "/catalog",
        label: "API Catalog",
        categories: [
          { label: "Core", tags: ["Users", "Content"] },
          { label: "Security", tags: ["Auth"] },
        ],
        items: mockItems,
      }) as NavigationPlugin;

      const navigation = await plugin.getNavigation?.("/catalog", mockContext);
      expect(navigation).toBeDefined();
      expect(navigation?.length).toBeGreaterThan(1);
      // Should have overview link first
      expect(navigation?.[0]).toMatchObject({
        type: "link",
        label: "Overview",
      });
    });
  });

  describe("with tags containing spaces", () => {
    it("creates routes with slugified tag names", async () => {
      const plugin = apiCatalogPlugin({
        path: "/catalog",
        label: "API Catalog",
        categories: [{ label: "Core", tags: ["My API", "Another Tag"] }],
        items: mockItems,
      }) as NavigationPlugin;

      const routes = plugin.getRoutes();
      // Should have slugified paths
      expect(routes.some((r) => r.path?.includes("core-my-api"))).toBe(true);
      expect(routes.some((r) => r.path?.includes("core-another-tag"))).toBe(
        true,
      );
    });
  });
});
