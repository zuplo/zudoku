import { describe, expect, it } from "vitest";
import { resolveConfigExtends } from "./extends.js";
import type { ZudokuConfig } from "./validators/ZudokuConfig.js";

describe("resolveConfigExtends", () => {
  it("returns the config unchanged without extends", () => {
    const config = { basePath: "/docs" };
    expect(resolveConfigExtends(config)).toEqual({ basePath: "/docs" });
  });

  it("lets the extending config win on conflicts", () => {
    const base: ZudokuConfig = { basePath: "/base", canonicalUrlOrigin: "x" };
    const config: ZudokuConfig = { extends: [base], basePath: "/docs" };

    expect(resolveConfigExtends(config)).toEqual({
      basePath: "/docs",
      canonicalUrlOrigin: "x",
    });
  });

  it("merges nested plain objects instead of replacing them", () => {
    const base: ZudokuConfig = { site: { title: "Base", showPoweredBy: true } };
    const config: ZudokuConfig = { extends: [base], site: { title: "Mine" } };

    expect(resolveConfigExtends(config)).toEqual({
      site: { title: "Mine", showPoweredBy: true },
    });
  });

  it("concatenates plugins and apis with base layers first", () => {
    const basePlugin = { name: "base" } as never;
    const userPlugin = { name: "user" } as never;
    const base: ZudokuConfig = {
      plugins: [basePlugin],
      apis: { type: "url", input: "https://base.example.com" },
    };
    const config: ZudokuConfig = {
      extends: [base],
      plugins: [userPlugin],
      apis: [{ type: "url", input: "https://user.example.com" }],
    };

    expect(resolveConfigExtends(config)).toEqual({
      plugins: [basePlugin, userPlugin],
      apis: [
        { type: "url", input: "https://base.example.com" },
        { type: "url", input: "https://user.example.com" },
      ],
    });
  });

  it("replaces arrays other than plugins and apis", () => {
    const base: ZudokuConfig = { redirects: [{ from: "/a", to: "/b" }] };
    const config: ZudokuConfig = {
      extends: [base],
      redirects: [{ from: "/c", to: "/d" }],
    };

    expect(resolveConfigExtends(config)).toEqual({
      redirects: [{ from: "/c", to: "/d" }],
    });
  });

  it("resolves nested extends in order", () => {
    const grandBase: ZudokuConfig = {
      basePath: "/grand",
      site: { title: "G" },
    };
    const base: ZudokuConfig = { extends: [grandBase], basePath: "/base" };
    const config: ZudokuConfig = { extends: [base] };

    expect(resolveConfigExtends(config)).toEqual({
      basePath: "/base",
      site: { title: "G" },
    });
  });
});
