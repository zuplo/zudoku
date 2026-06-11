import { describe, expect, it } from "vitest";
import type { ZudokuConfig } from "zudoku";
import { applyZuploContext } from "./index.js";

describe("applyZuploContext", () => {
  it("appends detected apis and graphql plugins to the config", () => {
    const config = {
      apis: {
        type: "url" as const,
        input: "https://example.com/spec.json",
        path: "/api",
      },
      plugins: [],
    };

    const result = applyZuploContext(config, {
      apis: [
        { type: "file", input: "../config/routes.oas.json", path: "/api-2" },
      ],
      graphql: [
        {
          type: "url",
          input: "https://my-gateway.example.com/graphql",
          path: "/graphql",
        },
      ],
    });

    expect(result.apis).toEqual([
      { type: "url", input: "https://example.com/spec.json", path: "/api" },
      { type: "file", input: "../config/routes.oas.json", path: "/api-2" },
    ]);
    expect(result.plugins).toHaveLength(1);
  });

  it("leaves the config untouched when nothing was detected", () => {
    const config: ZudokuConfig = { plugins: [] };

    const result = applyZuploContext(config, { apis: [], graphql: [] });

    expect(result.apis).toBeUndefined();
    expect(result.plugins).toEqual([]);
  });

  it("does not re-apply to an already enriched config", () => {
    const config = {
      __zuplo: { apis: [], graphql: [] },
      plugins: [],
    };

    const result = applyZuploContext(config, {
      apis: [
        { type: "file", input: "../config/routes.oas.json", path: "/api" },
      ],
      graphql: [],
    });

    expect(result).toBe(config);
  });
});
