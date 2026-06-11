import { describe, expect, it } from "vitest";
import type { ZudokuConfig } from "../../config/validators/ZudokuConfig.js";
import type { ZudokuPlugin } from "./plugins.js";
import { resolveExtends } from "./transform-config.js";

const plugin = (name: string): ZudokuPlugin => ({
  getRoutes: () => [{ path: `/${name}` }],
});

describe("resolveExtends", () => {
  it("returns the config unchanged when there is no extends", () => {
    const config: ZudokuConfig = { basePath: "/docs" };

    expect(resolveExtends(config)).toBe(config);
  });

  it("strips the extends key from the result", () => {
    const config: ZudokuConfig = { extends: [{ basePath: "/docs" }] };

    expect(resolveExtends(config)).not.toHaveProperty("extends");
  });

  it("merges a layer under the config with the config winning on scalars", () => {
    const layer: ZudokuConfig = {
      basePath: "/layer",
      metadata: { title: "Layer", description: "From layer" },
    };
    const config: ZudokuConfig = {
      extends: [layer],
      metadata: { title: "Override" },
    };

    expect(resolveExtends(config)).toEqual({
      basePath: "/layer",
      metadata: { title: "Override", description: "From layer" },
    });
  });

  it("folds multiple layers left to right", () => {
    const config: ZudokuConfig = {
      extends: [
        { metadata: { title: "First", description: "First" } },
        { metadata: { title: "Second" } },
      ],
    };

    expect(resolveExtends(config).metadata).toEqual({
      title: "Second",
      description: "First",
    });
  });

  it("concatenates plugins in layer order with own plugins last", () => {
    const [a, b, c] = [plugin("a"), plugin("b"), plugin("c")];
    const config: ZudokuConfig = {
      extends: [{ plugins: [a] }, { plugins: [b] }],
      plugins: [c],
    };

    expect(resolveExtends(config).plugins).toEqual([a, b, c]);
  });

  it("keeps layer plugins when the config has none", () => {
    const a = plugin("a");
    const config: ZudokuConfig = { extends: [{ plugins: [a] }] };

    expect(resolveExtends(config).plugins).toEqual([a]);
  });

  it("replaces arrays other than plugins", () => {
    const config: ZudokuConfig = {
      extends: [{ redirects: [{ from: "/a", to: "/b" }] }],
      redirects: [{ from: "/c", to: "/d" }],
    };

    expect(resolveExtends(config).redirects).toEqual([
      { from: "/c", to: "/d" },
    ]);
  });

  it("resolves nested extends depth-first", () => {
    const a = plugin("a");
    const b = plugin("b");
    const base: ZudokuConfig = {
      basePath: "/base",
      metadata: { title: "Base" },
      plugins: [a],
    };
    const middle: ZudokuConfig = {
      extends: [base],
      metadata: { title: "Middle" },
      plugins: [b],
    };
    const config: ZudokuConfig = {
      extends: [middle],
      metadata: { description: "Top" },
    };

    expect(resolveExtends(config)).toEqual({
      basePath: "/base",
      metadata: { title: "Middle", description: "Top" },
      plugins: [a, b],
    });
  });

  it("does not mutate the input config or its layers", () => {
    const layer: ZudokuConfig = { metadata: { title: "Layer" } };
    const config: ZudokuConfig = {
      extends: [layer],
      metadata: { description: "Own" },
    };

    resolveExtends(config);

    expect(layer).toEqual({ metadata: { title: "Layer" } });
    expect(config.extends).toEqual([layer]);
    expect(config.metadata).toEqual({ description: "Own" });
  });

  it("passes through non-object configs untouched", () => {
    expect(resolveExtends(null as unknown as ZudokuConfig)).toBeNull();
  });
});
