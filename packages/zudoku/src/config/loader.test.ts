import type { OutputChunk, RollupOutput } from "rollup";
import { describe, expect, it } from "vitest";
import { findOutputPathOfServerConfig } from "./loader.js";

describe("findOutputPathOfServerConfig", () => {
  it("should find zudoku.config.js", () => {
    const output: RollupOutput = {
      output: [
        {
          type: "chunk",
          fileName: "some-other-file.js",
          isEntry: false,
        } as unknown as OutputChunk,
        {
          type: "chunk",
          fileName: "zudoku.config.js",
          isEntry: true,
        } as unknown as OutputChunk,
      ],
    };

    const result = findOutputPathOfServerConfig(output);
    expect(result).toBe("zudoku.config.js");
  });

  it("should find zudoku.config.mjs", () => {
    const output: RollupOutput = {
      output: [
        {
          type: "chunk",
          fileName: "some-other-file.js",
          isEntry: false,
        } as unknown as OutputChunk,
        {
          type: "chunk",
          fileName: "zudoku.config.mjs",
          isEntry: true,
        } as unknown as OutputChunk,
      ],
    };

    const result = findOutputPathOfServerConfig(output);
    expect(result).toBe("zudoku.config.mjs");
  });

  it("should throw error when config file is not found", () => {
    const output: RollupOutput = {
      output: [
        {
          type: "chunk",
          fileName: "some-other-file.js",
          isEntry: true,
        } as unknown as OutputChunk,
      ],
    };

    expect(() => findOutputPathOfServerConfig(output)).toThrow(
      "Could not find server config output file",
    );
  });

  it("should throw error when output is an array", () => {
    const output: RollupOutput[] = [];

    expect(() => findOutputPathOfServerConfig(output)).toThrow(
      "Expected a single output, but got an array",
    );
  });
});
