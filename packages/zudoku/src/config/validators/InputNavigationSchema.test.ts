import { describe, expect, it } from "vitest";
import {
  DisplaySchema,
  InputNavigationSchema,
} from "./InputNavigationSchema.js";

describe("InputNavigationSchema", () => {
  describe("doc shorthand", () => {
    it("accepts string as doc shorthand", () => {
      const result = InputNavigationSchema.safeParse([
        "docs/getting-started",
        "docs/installation",
      ]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([
          "docs/getting-started",
          "docs/installation",
        ]);
      }
    });

    it("accepts full doc object", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "doc",
          file: "docs/getting-started",
          label: "Getting Started",
          icon: "book",
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts doc with custom path", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "doc",
          file: "docs/getting-started",
          path: "/custom-path",
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts doc with badge", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "doc",
          file: "docs/new-feature",
          badge: {
            label: "New",
            color: "green",
          },
        },
      ]);

      expect(result.success).toBe(true);
    });
  });

  describe("link navigation item", () => {
    it("accepts valid link", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "link",
          to: "/api",
          label: "API Reference",
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts link with external URL", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "link",
          to: "https://example.com",
          label: "External Link",
          target: "_blank",
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts link with icon and badge", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "link",
          to: "/api",
          label: "API",
          icon: "code",
          badge: {
            label: "v2.0",
            color: "blue",
          },
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects link without label", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "link",
          to: "/api",
        },
      ]);

      expect(result.success).toBe(false);
    });

    it("rejects link without to", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "link",
          label: "API",
        },
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe("category navigation item", () => {
    it("accepts valid category", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Documentation",
          items: ["docs/intro", "docs/quickstart"],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts nested categories", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Guides",
          items: [
            {
              type: "category",
              label: "Getting Started",
              items: ["intro", "installation"],
            },
          ],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts category with link", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Documentation",
          link: "docs/overview",
          items: [],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts category with link object", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Documentation",
          link: {
            type: "doc",
            file: "docs/overview",
            label: "Overview",
          },
          items: [],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts category with collapsible options", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Advanced",
          collapsible: true,
          collapsed: true,
          items: [],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts mixed item types in category", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Resources",
          items: [
            "docs/guide",
            { type: "link", to: "/api", label: "API" },
            {
              type: "category",
              label: "Advanced",
              items: [],
            },
          ],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects category without label", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          items: [],
        },
      ]);

      expect(result.success).toBe(false);
    });

    it("rejects category without items", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Test",
        },
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe("custom-page navigation item", () => {
    it("accepts valid custom page", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "custom-page",
          path: "/landing",
          element: { type: "div" },
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts custom page with label", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "custom-page",
          path: "/landing",
          label: "Landing Page",
          element: { type: "div" },
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts custom page with layout option", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "custom-page",
          path: "/landing",
          element: { type: "div" },
          layout: "none",
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects custom page without path", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "custom-page",
          element: { type: "div" },
        },
      ]);

      expect(result.success).toBe(false);
    });

    it("rejects custom page without element", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "custom-page",
          path: "/landing",
        },
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe("separator navigation item", () => {
    it("accepts separator", () => {
      const result = InputNavigationSchema.safeParse([
        { type: "separator" },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts separator with display", () => {
      const result = InputNavigationSchema.safeParse([
        { type: "separator", display: "always" },
      ]);

      expect(result.success).toBe(true);
    });
  });

  describe("section navigation item", () => {
    it("accepts section with label", () => {
      const result = InputNavigationSchema.safeParse([
        { type: "section", label: "Getting Started" },
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects section without label", () => {
      const result = InputNavigationSchema.safeParse([
        { type: "section" },
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe("filter navigation item", () => {
    it("accepts filter without placeholder", () => {
      const result = InputNavigationSchema.safeParse([
        { type: "filter" },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts filter with placeholder", () => {
      const result = InputNavigationSchema.safeParse([
        { type: "filter", placeholder: "Search documentation" },
      ]);

      expect(result.success).toBe(true);
    });
  });

  describe("DisplaySchema", () => {
    it("accepts 'always' string", () => {
      const result = DisplaySchema.safeParse("always");
      expect(result.success).toBe(true);
    });

    it("accepts 'auth' string", () => {
      const result = DisplaySchema.safeParse("auth");
      expect(result.success).toBe(true);
    });

    it("accepts 'anon' string", () => {
      const result = DisplaySchema.safeParse("anon");
      expect(result.success).toBe(true);
    });

    it("accepts 'hide' string", () => {
      const result = DisplaySchema.safeParse("hide");
      expect(result.success).toBe(true);
    });

    it("accepts function", () => {
      const result = DisplaySchema.safeParse(() => true);
      expect(result.success).toBe(true);
    });

    it("defaults to 'always' when undefined", () => {
      const result = DisplaySchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("always");
      }
    });

    it("rejects invalid string", () => {
      const result = DisplaySchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("rejects non-function non-string values", () => {
      const result = DisplaySchema.safeParse(123);
      expect(result.success).toBe(false);
    });
  });

  describe("badge schema", () => {
    it("accepts badge with valid colors", () => {
      const colors = [
        "green",
        "blue",
        "yellow",
        "red",
        "purple",
        "indigo",
        "gray",
        "outline",
      ];

      colors.forEach((color) => {
        const result = InputNavigationSchema.safeParse([
          {
            type: "doc",
            file: "test",
            badge: { label: "Test", color },
          },
        ]);
        expect(result.success).toBe(true);
      });
    });

    it("accepts badge with invert option", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "doc",
          file: "test",
          badge: { label: "Test", color: "blue", invert: true },
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects badge with invalid color", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "doc",
          file: "test",
          badge: { label: "Test", color: "invalid" },
        },
      ]);

      expect(result.success).toBe(false);
    });

    it("rejects badge without label", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "doc",
          file: "test",
          badge: { color: "blue" },
        },
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe("icon validation", () => {
    it("accepts valid lucide icon names", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Test",
          icon: "book",
          items: [],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("rejects invalid icon names", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Test",
          icon: "not-a-valid-icon-name-123",
          items: [],
        },
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe("complex navigation structures", () => {
    it("accepts deeply nested navigation", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "category",
          label: "Level 1",
          items: [
            {
              type: "category",
              label: "Level 2",
              items: [
                {
                  type: "category",
                  label: "Level 3",
                  items: ["docs/deep"],
                },
              ],
            },
          ],
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("accepts mixed navigation with all types", () => {
      const result = InputNavigationSchema.safeParse([
        { type: "filter", placeholder: "Search" },
        "docs/intro",
        { type: "section", label: "Main Content" },
        {
          type: "category",
          label: "Documentation",
          items: [
            "docs/guide",
            { type: "link", to: "/api", label: "API" },
          ],
        },
        { type: "separator" },
        {
          type: "custom-page",
          path: "/about",
          element: { type: "div" },
        },
      ]);

      expect(result.success).toBe(true);
    });

    it("handles empty navigation array", () => {
      const result = InputNavigationSchema.safeParse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("edge cases", () => {
    it("rejects invalid navigation type", () => {
      const result = InputNavigationSchema.safeParse([
        {
          type: "invalid",
          label: "Test",
        },
      ]);

      expect(result.success).toBe(false);
    });

    it("rejects null in navigation array", () => {
      const result = InputNavigationSchema.safeParse([null]);
      expect(result.success).toBe(false);
    });

    it("rejects undefined in navigation array", () => {
      const result = InputNavigationSchema.safeParse([undefined]);
      expect(result.success).toBe(false);
    });

    it("rejects number in navigation array", () => {
      const result = InputNavigationSchema.safeParse([123]);
      expect(result.success).toBe(false);
    });
  });
});