import { describe, expect, it } from "vitest";
import type {
  NavigationCategory,
  NavigationItem,
} from "../../../config/validators/NavigationSchema.js";
import {
  getFirstMatchingPath,
  getItemPath,
  sectionLanding,
  stackCategoryTarget,
} from "./utils.js";

const doc = (path: string, label: string) =>
  ({ type: "doc", file: `${path}.md`, path, label }) satisfies NavigationItem;

// A top-nav tab for an API: `link` is the API base path that identifies which
// URLs the tab owns, `landing` is the static doc the tab should open.
const apiTab: NavigationCategory = {
  type: "category",
  label: "Commerce APIs",
  link: { type: "link", to: "/commerce-apis" },
  landing: {
    type: "doc",
    file: "commerce-apis/overview.md",
    path: "commerce-apis/overview",
    label: "Overview",
  },
  items: [
    { type: "section", label: "Getting Started" },
    doc("commerce-apis/overview", "Overview"),
    doc("commerce-apis/oauth", "OAuth"),
  ],
};

const linkOnlyTab: NavigationCategory = {
  type: "category",
  label: "Commerce APIs",
  link: { type: "link", to: "/commerce-apis" },
  items: [doc("commerce-apis/overview", "Overview")],
};

const bareCategory: NavigationCategory = {
  type: "category",
  label: "Guides",
  items: [doc("guides/intro", "Intro")],
};

describe("getFirstMatchingPath", () => {
  it("prefers `landing` over `link`", () => {
    expect(getFirstMatchingPath(apiTab)).toBe("/commerce-apis/overview");
  });

  it("falls back to `link` when there is no `landing`", () => {
    expect(getFirstMatchingPath(linkOnlyTab)).toBe("/commerce-apis");
  });

  it("falls back to the first navigable descendant without link or landing", () => {
    expect(getFirstMatchingPath(bareCategory)).toBe("/guides/intro");
  });

  it("resolves a `landing` doc through its path", () => {
    const item: NavigationItem = {
      ...bareCategory,
      landing: {
        type: "doc",
        file: "guides/start.md",
        path: "guides/start",
        label: "Start",
      },
    };

    expect(getFirstMatchingPath(item)).toBe("/guides/start");
  });
});

describe("getItemPath", () => {
  it("keeps returning `link` so `landing` does not change the tab's identity", () => {
    // This is what associates plugin-generated pages with the owning tab, so it
    // must stay on the API base path even when `landing` points elsewhere.
    expect(getItemPath(apiTab)).toBe("/commerce-apis");
  });

  it("is undefined for a category with neither link nor landing", () => {
    expect(getItemPath(bareCategory)).toBeUndefined();
  });
});

describe("sectionLanding / stackCategoryTarget", () => {
  it("honour `landing`", () => {
    expect(sectionLanding(apiTab)).toBe("/commerce-apis/overview");
    expect(stackCategoryTarget(apiTab)).toBe("/commerce-apis/overview");
  });

  it("are unchanged for categories without `landing`", () => {
    expect(sectionLanding(linkOnlyTab)).toBe("/commerce-apis");
    expect(stackCategoryTarget(linkOnlyTab)).toBe("/commerce-apis");
    expect(stackCategoryTarget(bareCategory)).toBe("/guides/intro");
  });
});
