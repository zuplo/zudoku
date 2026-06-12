import { assertType, describe, it } from "vitest";
import type { z } from "zod";
import type { presetPlugins } from "zudoku/codegen";
import type { MonetizationConfig } from "./MonetizationContext.js";

// The options schema for `zudoku generate` lives in zudoku's preset registry
// (the CLI can't import this package at runtime). This guard fails the
// typecheck when the registry schema drifts from the plugin's options type.
type SpecOptions = z.input<
  (typeof presetPlugins)["monetization"]["optionsSchema"]
>;

describe("monetization preset descriptor", () => {
  it("matches the plugin's options type in both directions", () => {
    assertType<MonetizationConfig | undefined>({} as SpecOptions);
    assertType<SpecOptions>({} as MonetizationConfig | undefined);
  });
});
