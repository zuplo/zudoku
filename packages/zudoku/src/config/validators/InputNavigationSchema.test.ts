import { describe, expect, it } from "vitest";
import {
  InputNavigationSchema,
  NavigationRulesSchema,
} from "./InputNavigationSchema.js";

describe("InputNavigationSchema", () => {
  it("parses all item types", () => {
    const input = [
      "docs/getting-started",
      { type: "doc", file: "docs/intro", label: "Intro", path: "/intro" },
      { type: "link", to: "https://example.com", label: "External" },
      { type: "custom-page", path: "/custom", element: null },
      { type: "separator" },
      { type: "section", label: "Section" },
      { type: "filter", placeholder: "Search..." },
    ];

    expect(InputNavigationSchema.parse(input)).toEqual(input);
  });

  it("parses recursively nested categories", () => {
    const input = [
      {
        type: "category",
        label: "Level 1",
        link: "docs/overview",
        items: [
          "docs/shorthand",
          {
            type: "category",
            label: "Level 2",
            link: { type: "doc", file: "docs/nested" },
            items: [
              {
                type: "category",
                label: "Level 3",
                items: [{ type: "link", to: "/deep", label: "Deep" }],
              },
            ],
          },
        ],
      },
    ];

    expect(InputNavigationSchema.parse(input)).toEqual(input);
  });

  it("strips unknown keys from items", () => {
    const result = InputNavigationSchema.parse([
      { type: "doc", file: "docs/intro", unknown: true },
    ]);

    expect(result).toEqual([{ type: "doc", file: "docs/intro" }]);
  });

  it("accepts a display function", () => {
    const display = () => true;
    const result = InputNavigationSchema.parse([
      { type: "separator", display },
    ]);

    expect(result).toEqual([{ type: "separator", display }]);
  });

  it("rejects items with an invalid type", () => {
    const result = InputNavigationSchema.safeParse([{ type: "lnk", to: "/" }]);

    expect(result.success).toBe(false);
  });

  it("rejects nested items missing required fields", () => {
    const result = InputNavigationSchema.safeParse([
      { type: "category", label: "Cat", items: [{ type: "doc" }] },
    ]);

    expect(result.success).toBe(false);
  });
});

describe("NavigationRulesSchema", () => {
  it("parses insert rules with nested navigation items", () => {
    const input = [
      {
        type: "insert",
        match: "docs/intro",
        position: "after",
        items: [
          "docs/shorthand",
          { type: "category", label: "Cat", items: ["docs/nested"] },
        ],
      },
      { type: "remove", match: "docs/old" },
      { type: "move", match: "docs/a", to: "docs/b", position: "before" },
      { type: "modify", match: "docs/c", set: { label: "New", stack: true } },
    ];

    expect(NavigationRulesSchema.parse(input)).toEqual(input);
  });

  it("accepts a sort rule comparator function", () => {
    const by = () => 0;
    const result = NavigationRulesSchema.parse([
      { type: "sort", match: "docs", by },
    ]);

    expect(result).toEqual([{ type: "sort", match: "docs", by }]);
  });
});
