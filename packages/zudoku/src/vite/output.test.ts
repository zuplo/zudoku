import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LoadedConfig } from "../config/config.js";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import { cleanVercelOutput, generateOutput, writeOutput } from "./output.js";

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

describe("Vercel Build Output", () => {
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
        methods: ["GET", "HEAD"],
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

  it("deduplicates identical redirects", () => {
    const output = generateOutput({
      config: createConfig(),
      redirects: [
        { from: "/old", to: "/new" },
        { from: "/old", to: "/new" },
      ],
    });

    expect(output.routes).toEqual([
      {
        src: "/old",
        dest: "/new",
        status: 301,
        headers: { Location: "/new" },
      },
    ]);
  });

  it("canonicalizes clean URLs before applying user redirects", () => {
    const output = generateOutput({
      config: createConfig(),
      redirects: [{ from: "/legacy.html", to: "/guide" }],
      staticHtmlFiles: ["index.html", "legacy.html"],
    });

    expect(
      output.routes?.map((route) =>
        "status" in route ? route.status : undefined,
      ),
    ).toEqual([308, 308, 301]);
  });

  it("rejects HTML files that resolve to the same clean URL", () => {
    expect(() =>
      generateOutput({
        config: createConfig(),
        redirects: [],
        staticHtmlFiles: ["guide.html", "guide/index.html"],
      }),
    ).toThrowError(
      'Cannot generate the Vercel clean URL "guide" for both "guide.html" and "guide/index.html"',
    );
  });

  it("emits self-contained clean URL routes and overrides", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-output-test-"),
    );
    tempDirs.push(rootDir);
    vi.stubEnv("VERCEL", "1");

    const staticDir = path.join(rootDir, ".vercel/output/static");
    await mkdir(path.join(staticDir, "guides"), { recursive: true });
    await Promise.all([
      writeFile(path.join(staticDir, "index.html"), "home"),
      writeFile(path.join(staticDir, "tracking.html"), "tracking"),
      writeFile(path.join(staticDir, "guides/index.html"), "guides"),
      writeFile(path.join(staticDir, "404.html"), "missing"),
    ]);

    await writeOutput(rootDir, {
      config: createConfig(),
      redirects: [],
    });

    const output = JSON.parse(
      await readFile(path.join(rootDir, ".vercel/output/config.json"), "utf-8"),
    );
    expect(output.routes).toEqual([
      {
        src: "^/(?:(.+)/)?index(?:\\.html)?/?$",
        headers: { Location: "/$1" },
        status: 308,
      },
      {
        src: "^/(.*)\\.html/?$",
        headers: { Location: "/$1" },
        status: 308,
      },
    ]);
    expect(output.overrides).toEqual({
      "404.html": { path: "404" },
      "guides/index.html": { path: "guides" },
      "index.html": { path: "" },
      "tracking.html": { path: "tracking" },
    });
  });

  it("clears stale Vercel output before a build", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-output-test-"),
    );
    tempDirs.push(rootDir);
    vi.stubEnv("VERCEL", "1");

    const staleFile = path.join(
      rootDir,
      ".vercel/output/functions/stale.func/index.js",
    );
    await mkdir(path.dirname(staleFile), { recursive: true });
    await writeFile(staleFile, "stale");

    await cleanVercelOutput(rootDir);

    await expect(readFile(staleFile, "utf-8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("preserves portable output when Vercel is not active", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-output-test-"),
    );
    tempDirs.push(rootDir);
    vi.stubEnv("VERCEL", "");

    const existingFile = path.join(rootDir, ".vercel/output/config.json");
    await mkdir(path.dirname(existingFile), { recursive: true });
    await writeFile(existingFile, "existing");

    await cleanVercelOutput(rootDir);

    await expect(readFile(existingFile, "utf-8")).resolves.toBe("existing");
  });

  it("writes a valid Edge function into Vercel Build Output", async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-output-test-"),
    );
    tempDirs.push(rootDir);
    vi.stubEnv("VERCEL", "1");

    const extensionlessAsset = path.join(
      rootDir,
      ".vercel/output/static/docs/health",
    );
    await mkdir(path.dirname(extensionlessAsset), { recursive: true });
    await Promise.all([
      writeFile(extensionlessAsset, "ok"),
      writeFile(
        path.join(path.dirname(extensionlessAsset), "source.md"),
        "# Source",
      ),
    ]);

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
    expect(source).toContain(
      'const PASSTHROUGH_PATHS = new Set(["/docs/health","/docs/source.md"]);',
    );
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
