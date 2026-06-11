import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ConfigWithMeta } from "../config/loader.js";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import { isNavigationPlugin } from "../lib/core/plugins.js";
import {
  type MarkdownPluginOptions,
  markdownPlugin,
} from "../lib/plugins/markdown/index.js";
import {
  globMarkdownFiles,
  resolveCustomNavigationPaths,
} from "./plugin-docs.js";
import { routesToPaths } from "./prerender/utils.js";

describe("resolveCustomNavigationPaths", () => {
  let tempDir: string;
  let originalCwd: string;
  let __meta: ConfigWithMeta["__meta"];

  const writeDoc = async (relativePath: string) => {
    const absolute = path.join(tempDir, relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, "# Page\n");
  };

  beforeEach(async () => {
    originalCwd = process.cwd();
    // glob resolves relative patterns against cwd, so the file lookups in
    // NavigationResolver and globMarkdownFiles need cwd to be the fixture dir.
    tempDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-docs-test-")),
    );
    process.chdir(tempDir);
    __meta = {
      rootDir: tempDir,
      moduleDir: path.join(tempDir, "node_modules"),
      mode: "module",
      dependencies: [],
      configPath: path.join(tempDir, "zudoku.config.ts"),
      extendedConfigPaths: [],
    };
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const resolve = async (navigation: ConfigWithMeta["navigation"]) => {
    const config: ConfigWithMeta = {
      ...validateConfig({ docs: { files: "pages/**/*.{md,mdx}" } }),
      __meta,
      navigation,
    };
    return resolveCustomNavigationPaths(
      config,
      await globMarkdownFiles(config),
    );
  };

  it("keeps the route when the navigation file includes a .md extension", async () => {
    await writeDoc("pages/resources/page_1.md");

    const mapping = await resolve([
      { type: "doc", file: "/resources/page_1.md", label: "Page One" },
    ]);

    expect(mapping["/resources/page_1"]).toBe("pages/resources/page_1.md");
  });

  it("keeps the route when the navigation file omits the extension", async () => {
    await writeDoc("pages/dev_guide/page_1.md");

    const mapping = await resolve([
      { type: "doc", file: "/dev_guide/page_1", label: "First Page" },
    ]);

    expect(mapping["/dev_guide/page_1"]).toBe("pages/dev_guide/page_1.md");
  });

  it("still remaps when a genuine custom path is set", async () => {
    await writeDoc("pages/resources/page_1.md");

    const mapping = await resolve([
      { type: "doc", file: "/resources/page_1", path: "/custom/path" },
    ]);

    expect(mapping["/custom/path"]).toBe("pages/resources/page_1.md");
    expect(mapping["/resources/page_1"]).toBeUndefined();
  });

  it("keeps the route for a category link doc with a .md extension", async () => {
    await writeDoc("pages/resources/overview.md");

    const mapping = await resolve([
      {
        type: "category",
        label: "Resources",
        items: [],
        link: { type: "doc", file: "/resources/overview.md" },
      },
    ]);

    expect(mapping["/resources/overview"]).toBe("pages/resources/overview.md");
  });

  it("collects the route as a prerender path for an extension-suffixed nav file", async () => {
    await writeDoc("pages/resources/page_1.md");

    const mapping = await resolve([
      { type: "doc", file: "/resources/page_1.md", label: "Page One" },
    ]);

    const fileImports: MarkdownPluginOptions["fileImports"] =
      Object.fromEntries(
        Object.keys(mapping).map((routePath) => [
          routePath,
          () => Promise.resolve({} as never),
        ]),
      );

    const plugin = markdownPlugin({
      basePath: "",
      fileImports,
      publishMarkdown: false,
    });
    const routes = isNavigationPlugin(plugin) ? plugin.getRoutes() : [];

    expect(routesToPaths(routes)).toContain("/resources/page_1");
  });
});
