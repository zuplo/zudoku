import { describe, expect, it } from "vitest";
import { validateBuildConfig } from "./BuildSchema.js";

describe("validateBuildConfig", () => {
  it("supports disabling critical CSS for strict CSP deployments", () => {
    expect(
      validateBuildConfig({
        prerender: { workers: 2, criticalCss: false },
      }),
    ).toEqual({
      prerender: { workers: 2, criticalCss: false },
    });
  });
});
