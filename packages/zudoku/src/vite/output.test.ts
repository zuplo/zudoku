import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LoadedConfig } from "../config/config.js";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import { generateOutput, writeOutput } from "./output.js";

const createConfig = (basePath = "/docs"): LoadedConfig => ({
  ...validateConfig({ basePath }),
  __meta: {
    rootDir: "/project",
    moduleDir: "/project",
    configPath: "/project/zudoku.config.ts",
    mode: "module",
    dependencies: [],
  },
});

const markdownNegotiation = {
  knownCanonicalRoutePaths: ["/", "/guide"],
  markdownCanonicalRoutePaths: ["/", "/guide"],
  markdownNotFoundBody: "# Page not found\n",
};

describe("Vercel Markdown negotiation output", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    vi.unstubAllEnvs();
    await Promise.all(
      tempDirs
        .splice(0)
        .map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("places routing middleware before filesystem rewrites", () => {
    const output = generateOutput({
      config: createConfig(),
      redirects: [{ from: "/old", to: "/new" }],
      rewrites: [{ source: "/guide/(.+)", destination: "/guide.html" }],
      markdownNegotiation,
    });

    expect(output.routes).toEqual([
      expect.objectContaining({ src: "/old", status: 301 }),
      {
        src: "/docs(?:/(.*))?",
        middlewarePath: "zudoku-markdown",
        continue: true,
      },
      { handle: "filesystem" },
      expect.objectContaining({
        src: "/docs/guide/(.+)",
        dest: "/docs/guide.html",
      }),
    ]);
  });

  it("writes a valid Edge function into Vercel Build Output", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-output-test-"),
    );
    tempDirs.push(rootDir);
    vi.stubEnv("VERCEL", "1");

    await writeOutput(rootDir, {
      config: createConfig(),
      redirects: [],
      markdownNegotiation,
    });

    const outputDir = path.join(rootDir, ".vercel/output");
    const output = JSON.parse(
      await readFile(path.join(outputDir, "config.json"), "utf-8"),
    );
    const functionDir = path.join(outputDir, "functions/zudoku-markdown.func");
    const functionConfig = JSON.parse(
      await readFile(path.join(functionDir, ".vc-config.json"), "utf-8"),
    );
    const source = await readFile(path.join(functionDir, "index.js"), "utf-8");

    expect(output.routes).toContainEqual(
      expect.objectContaining({ middlewarePath: "zudoku-markdown" }),
    );
    expect(functionConfig).toEqual({
      runtime: "edge",
      entrypoint: "index.js",
    });
    expect(source).toContain("export default function middleware(request)");
    expect(source).toContain('const BASE_PATH = "/docs"');
  });

  it("does not reference a Vercel function in portable static output", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-output-test-"),
    );
    tempDirs.push(rootDir);
    vi.stubEnv("VERCEL", "");

    await writeOutput(rootDir, {
      config: createConfig(),
      redirects: [],
      markdownNegotiation,
    });

    const output = JSON.parse(
      await readFile(path.join(rootDir, "dist/.output/config.json"), "utf-8"),
    );
    expect(output.routes).not.toContainEqual(
      expect.objectContaining({ middlewarePath: "zudoku-markdown" }),
    );
  });
});
