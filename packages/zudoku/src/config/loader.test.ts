import type { RollupOutput } from "rollup";
import { describe, expect, it } from "vitest";
import { findOutputPathOfServerConfig } from "./loader.js";

const makeOutput = (
  entries: Array<{ fileName: string; isEntry: boolean }>,
): RollupOutput =>
  ({
    output: entries.map((e) => ({
      ...e,
      type: "chunk" as const,
      code: "",
      dynamicImports: [],
      exports: [],
      facadeModuleId: null,
      implicitlyLoadedBefore: [],
      importedBindings: {},
      imports: [],
      isDynamicEntry: false,
      map: null,
      moduleIds: [],
      modules: {},
      name: e.fileName,
      referencedFiles: [],
      sourcemapFileName: null,
      preliminaryFileName: e.fileName,
    })),
  }) as unknown as RollupOutput;

describe("findOutputPathOfServerConfig", () => {
  it("finds zudoku.config.js", () => {
    const output = makeOutput([
      { fileName: "entry.server.js", isEntry: true },
      { fileName: "zudoku.config.js", isEntry: true },
    ]);
    expect(findOutputPathOfServerConfig(output)).toBe("zudoku.config.js");
  });

  it("finds zudoku.config.mjs", () => {
    const output = makeOutput([
      { fileName: "entry.server.mjs", isEntry: true },
      { fileName: "zudoku.config.mjs", isEntry: true },
    ]);
    expect(findOutputPathOfServerConfig(output)).toBe("zudoku.config.mjs");
  });

  it("throws when config entry is missing", () => {
    const output = makeOutput([{ fileName: "entry.server.js", isEntry: true }]);
    expect(() => findOutputPathOfServerConfig(output)).toThrow(
      "Could not find server config output file",
    );
  });

  it("throws when passed an array", () => {
    expect(() =>
      findOutputPathOfServerConfig([] as unknown as RollupOutput),
    ).toThrow("Expected a single output, but got an array");
  });

  it("ignores non-entry chunks", () => {
    const output = makeOutput([
      { fileName: "zudoku.config.js", isEntry: false },
    ]);
    expect(() => findOutputPathOfServerConfig(output)).toThrow(
      "Could not find server config output file",
    );
  });
});
