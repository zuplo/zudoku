import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateBaseConfig } from "./generate.js";

describe("generateBaseConfig", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-generate-"));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("compiles spec.json into a base config file", async () => {
    await fs.writeFile(
      path.join(dir, "spec.json"),
      JSON.stringify({ site: { title: "My Portal" } }),
    );

    const result = await generateBaseConfig({ dir });

    expect(result.written).toBe(true);
    expect(result.outputPath).toBe(path.join(dir, "zudoku.base.ts"));

    const output = await fs.readFile(result.outputPath, "utf-8");
    expect(output).toContain(`"title": "My Portal"`);
    expect(output).toContain("satisfies ZudokuConfig");
  });

  it("does not rewrite an unchanged output", async () => {
    await fs.writeFile(path.join(dir, "spec.json"), JSON.stringify({}));

    const first = await generateBaseConfig({ dir });
    const second = await generateBaseConfig({ dir });

    expect(first.written).toBe(true);
    expect(second.written).toBe(false);
  });

  it("generates an empty base config when there is no spec file", async () => {
    const result = await generateBaseConfig({ dir });

    expect(result.specPath).toBeUndefined();
    const output = await fs.readFile(result.outputPath, "utf-8");
    expect(output).toContain("const config = {\n} satisfies ZudokuConfig;");
  });

  it("throws for an explicitly given spec file that does not exist", async () => {
    await expect(
      generateBaseConfig({ dir, specPath: "missing.json" }),
    ).rejects.toThrow("Spec file not found");
  });

  it("throws for an invalid spec", async () => {
    await fs.writeFile(
      path.join(dir, "spec.json"),
      JSON.stringify({ site: { title: 42 } }),
    );

    await expect(generateBaseConfig({ dir })).rejects.toThrow(
      "Invalid Zudoku spec",
    );
  });
});
