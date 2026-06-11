import { describe, expect, it } from "vitest";
import type { ZudokuConfig } from "zudoku";
import { withZuploPlugin, zuploPlugin } from "./index.js";

describe("withZuploPlugin", () => {
  it("adds the Zuplo plugin when none is configured", () => {
    const config: ZudokuConfig = { plugins: [{ getRoutes: () => [] }] };

    const result = withZuploPlugin(config);

    expect(result.plugins).toHaveLength(2);
  });

  it("adds the Zuplo plugin to a config without plugins", () => {
    const result = withZuploPlugin({} as ZudokuConfig);

    expect(result.plugins).toHaveLength(1);
  });

  it("leaves configs with an explicitly configured Zuplo plugin untouched", () => {
    const config = { plugins: [zuploPlugin({ graphql: false })] };

    const result = withZuploPlugin(config);

    expect(result).toBe(config);
    expect(result.plugins).toHaveLength(1);
  });
});
