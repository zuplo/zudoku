import { assertType, describe, it } from "vitest";
import type { z } from "zod";
import type { presetPlugins } from "zudoku/codegen";
import type { GraphQLConfig } from "./interfaces.js";

// The options schema for `zudoku generate` lives in zudoku's preset registry
// (the CLI can't import this package at runtime). This guard fails the
// typecheck when the registry schema drifts from the plugin's options type.
type SpecOptions = z.input<(typeof presetPlugins)["graphql"]["optionsSchema"]>;

describe("graphql preset descriptor", () => {
  it("matches the plugin's options type in both directions", () => {
    assertType<GraphQLConfig>({} as SpecOptions);
    assertType<SpecOptions>({} as GraphQLConfig);
  });
});
