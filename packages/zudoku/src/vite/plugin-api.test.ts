import { describe, expect, it } from "vitest";
import { schemaConfigurationChanged } from "./plugin-api.js";

describe("schemaConfigurationChanged", () => {
  const apis = {
    type: "file" as const,
    path: "reference",
    input: "./openapi.json",
  };

  it("refreshes schemas when only basePath changes", () => {
    expect(
      schemaConfigurationChanged(
        { apis, basePath: "/" },
        { apis, basePath: "/docs" },
      ),
    ).toBe(true);
  });

  it("does not refresh when schema inputs and basePath are unchanged", () => {
    expect(
      schemaConfigurationChanged(
        { apis, basePath: "/docs" },
        { apis: structuredClone(apis), basePath: "/docs" },
      ),
    ).toBe(false);
  });
});
