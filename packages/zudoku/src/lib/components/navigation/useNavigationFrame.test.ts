import { describe, expect, it, vi } from "vitest";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
import {
  findStackCategory,
  resolveNavigationFrame,
  resolveStackOwner,
} from "./useNavigationFrame.js";
import { cleanPath } from "./utils.js";

const stackCategory: NavigationItem = {
  type: "category",
  label: "Handbook",
  stack: true,
  items: [
    { type: "link", label: "Hazardous", to: "/handbook/hazardous" },
    { type: "link", label: "Cryo", to: "/handbook/cryo" },
  ],
};

const plainCategory: NavigationItem = {
  type: "category",
  label: "Guides",
  items: [{ type: "link", label: "Intro", to: "/guides/intro" }],
};

const section: NavigationItem = {
  type: "category",
  label: "Our APIs",
  link: { type: "link", to: "/apis" },
  items: [{ type: "link", label: "Dev API", to: "/graphql/dev", stack: true }],
};

describe("cleanPath", () => {
  it("strips query and hash and normalizes", () => {
    expect(cleanPath("/foo?ref=1")).toBe("/foo");
    expect(cleanPath("/foo#section")).toBe("/foo");
    expect(cleanPath("/foo/?a=1#b")).toBe("/foo");
  });
});

describe("findStackCategory", () => {
  it("returns a stack category that owns the path", () => {
    expect(findStackCategory([stackCategory], "/handbook/cryo")).toBe(
      stackCategory,
    );
  });

  it("matches paths nested deep in the sub-tree", () => {
    const nested: NavigationItem = {
      type: "category",
      label: "Outer",
      stack: true,
      items: [
        {
          type: "category",
          label: "Inner",
          items: [{ type: "link", label: "Leaf", to: "/outer/inner/leaf" }],
        },
      ],
    };
    expect(findStackCategory([nested], "/outer/inner/leaf")).toBe(nested);
  });

  it("ignores non-stack categories", () => {
    expect(findStackCategory([plainCategory], "/guides/intro")).toBeUndefined();
  });

  it("returns undefined when no stack category owns the path", () => {
    expect(findStackCategory([stackCategory], "/elsewhere")).toBeUndefined();
  });
});

describe("resolveStackOwner", () => {
  it("resolves the owning section's landing for an exact match", () => {
    expect(resolveStackOwner([section], "/graphql/dev")).toEqual({
      to: "/apis",
      label: "Our APIs",
    });
  });

  it("resolves for a child path", () => {
    expect(resolveStackOwner([section], "/graphql/dev/queries")).toEqual({
      to: "/apis",
      label: "Our APIs",
    });
  });

  it("does not match a sibling whose path is a string prefix", () => {
    // `/graphql/dev` must not match `/graphql/development`.
    expect(
      resolveStackOwner([section], "/graphql/development"),
    ).toBeUndefined();
  });

  it("returns undefined when no stack link owns the path", () => {
    expect(resolveStackOwner([section], "/unrelated")).toBeUndefined();
  });
});

describe("resolveNavigationFrame", () => {
  const topNavItem: NavigationItem = {
    type: "category",
    label: "Docs",
    link: { type: "link", to: "/handbook" },
    items: [stackCategory],
  };

  it("prefers an intra-section stack frame and derives back from the section", () => {
    const frame = resolveNavigationFrame(
      [stackCategory],
      [topNavItem],
      "/handbook/cryo",
      topNavItem,
    );
    expect(frame.id).toBe("stack:/handbook/hazardous");
    expect(frame.items).toBe(stackCategory.items);
    expect(frame.back).toEqual({ to: "/handbook", label: "Docs" });
  });

  it("falls back to a root frame with no back link", () => {
    const frame = resolveNavigationFrame(
      [plainCategory],
      [plainCategory],
      "/guides/intro",
      undefined,
    );
    expect(frame.id).toBe("root");
    expect(frame.back).toBeUndefined();
  });

  it("resolves a cross-section stack frame from the site navigation", () => {
    const frame = resolveNavigationFrame(
      [{ type: "link", label: "Dev API", to: "/graphql/dev" }],
      [section],
      "/graphql/dev",
      undefined,
    );
    expect(frame.id).toBe("ref:/apis");
    expect(frame.back).toEqual({ to: "/apis", label: "Our APIs" });
  });

  it("warns and falls back to / when a section landing cannot resolve", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const emptySection: NavigationItem = {
      type: "category",
      label: "Empty",
      items: [],
    };
    const frame = resolveNavigationFrame(
      [stackCategory],
      [emptySection],
      "/handbook/cryo",
      emptySection,
    );
    expect(frame.back?.to).toBe("/");
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
