import { createElement } from "react";
import { describe, expect, it } from "vitest";
import type { ZudokuConfig } from "../../config/validators/ZudokuConfig.js";
import { mergeConfigExtends } from "./config-extends.js";

describe("mergeConfigExtends", () => {
  it("returns the config unchanged when there are no base configs", () => {
    const config: ZudokuConfig = { basePath: "/docs" };
    expect(mergeConfigExtends([], config)).toEqual({ basePath: "/docs" });
  });

  it("lets the config win over base configs for scalar values", () => {
    const result = mergeConfigExtends([{ basePath: "/base", port: 4000 }], {
      basePath: "/docs",
    });
    expect(result).toEqual({ basePath: "/docs", port: 4000 });
  });

  it("deep merges plain objects with the config taking precedence", () => {
    const result = mergeConfigExtends(
      [{ site: { title: "Base", showPoweredBy: false } }],
      { site: { title: "Mine" } },
    );
    expect(result.site).toEqual({ title: "Mine", showPoweredBy: false });
  });

  it("concatenates arrays with the config's items first", () => {
    const result = mergeConfigExtends(
      [{ navigation: [{ type: "link", to: "/api", label: "API" }] }],
      { navigation: [{ type: "link", to: "/docs", label: "Docs" }] },
    );
    expect(result.navigation).toEqual([
      { type: "link", to: "/docs", label: "Docs" },
      { type: "link", to: "/api", label: "API" },
    ]);
  });

  it("gives later base configs precedence over earlier ones", () => {
    const result = mergeConfigExtends(
      [{ basePath: "/first", port: 4000 }, { basePath: "/second" }],
      {},
    );
    expect(result).toEqual({ basePath: "/second", port: 4000 });
  });

  it("strips the `extends` key from the result", () => {
    const result = mergeConfigExtends([{ basePath: "/base" }], {
      extends: ["./zudoku-zuplo.config.ts"],
    });
    expect(result).toEqual({ basePath: "/base" });
    expect("extends" in result).toBe(false);
  });

  it("replaces React elements instead of merging them", () => {
    const baseElement = createElement("div", null, "base");
    const overlayElement = createElement("span", null, "mine");

    const result = mergeConfigExtends(
      [{ site: { notFoundPage: baseElement } }],
      { site: { notFoundPage: overlayElement } },
    );

    expect(result.site?.notFoundPage).toBe(overlayElement);
  });

  it("keeps base values when the config sets a key to undefined", () => {
    const result = mergeConfigExtends([{ basePath: "/base" }], {
      basePath: undefined,
    });
    expect(result.basePath).toBe("/base");
  });

  it("replaces mismatched types with the config value", () => {
    const result = mergeConfigExtends(
      [{ apis: { type: "file", input: "a.json", path: "/api" } }],
      { apis: [{ type: "url", input: "https://example.com/openapi.json" }] },
    );
    expect(result.apis).toEqual([
      { type: "url", input: "https://example.com/openapi.json" },
    ]);
  });
});
