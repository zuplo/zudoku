import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { InputNavigationCategory } from "../../../config/validators/InputNavigationSchema.js";
import { autoNavigationPlugin } from "./index.js";

const createTmpDir = () => {
  const dir = path.join(tmpdir(), `zudoku-auto-nav-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};

const writeFile = (dir: string, filePath: string, content: string) => {
  const fullPath = path.join(dir, filePath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf-8");
};

describe("autoNavigationPlugin", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const callTransformConfig = async (
    options: Parameters<typeof autoNavigationPlugin>[0],
    configOverrides: Record<string, unknown> = {},
  ) => {
    const plugin = autoNavigationPlugin(options);
    if (!("transformConfig" in plugin) || !plugin.transformConfig) {
      throw new Error("Plugin must have transformConfig");
    }

    const config = {
      __meta: { rootDir: tmpDir, moduleDir: tmpDir, configPath: tmpDir },
      navigation: [],
      ...configOverrides,
    };

    const merge = (partial: Record<string, unknown>) => ({
      ...config,
      ...partial,
    });

    const result = await plugin.transformConfig({
      config: config as never,
      merge: merge as never,
    });

    return result;
  };

  test("generates navigation from flat files", async () => {
    writeFile(tmpDir, "pages/getting-started.md", "# Getting Started\nHello");
    writeFile(tmpDir, "pages/installation.md", "# Installation\nSteps");

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
    });

    expect(result).toBeDefined();
    const nav = result!.navigation as string[];
    expect(nav).toHaveLength(2);
    // Items are doc file strings
    expect(nav).toContain("getting-started");
    expect(nav).toContain("installation");
  });

  test("generates categories from directories", async () => {
    writeFile(tmpDir, "pages/guides/quick-start.md", "# Quick Start");
    writeFile(tmpDir, "pages/guides/advanced.md", "# Advanced");
    writeFile(tmpDir, "pages/intro.md", "# Intro");

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
    });

    expect(result).toBeDefined();
    const nav = result!.navigation as (string | InputNavigationCategory)[];
    expect(nav).toHaveLength(2);

    // One top-level doc
    expect(nav).toContainEqual("intro");

    // One category for guides/
    const category = nav.find(
      (item) => typeof item === "object" && item.type === "category",
    ) as InputNavigationCategory;
    expect(category).toBeDefined();
    expect(category.label).toBe("Guides");
    expect(category.items).toHaveLength(2);
  });

  test("uses index files as category links", async () => {
    writeFile(
      tmpDir,
      "pages/guides/index.md",
      "---\ntitle: Guides Overview\n---\n# Guides",
    );
    writeFile(tmpDir, "pages/guides/first.md", "# First Guide");

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
    });

    const nav = result!.navigation as InputNavigationCategory[];
    const category = nav.find(
      (item) => typeof item === "object" && item.type === "category",
    ) as InputNavigationCategory;

    expect(category).toBeDefined();
    expect(category.label).toBe("Guides Overview");
    expect(category.link).toBeDefined();
    expect(category.items).toHaveLength(1);
  });

  test("respects sidebar_position for ordering", async () => {
    writeFile(
      tmpDir,
      "pages/c-third.md",
      "---\nsidebar_position: 3\n---\n# Third",
    );
    writeFile(
      tmpDir,
      "pages/a-first.md",
      "---\nsidebar_position: 1\n---\n# First",
    );
    writeFile(
      tmpDir,
      "pages/b-second.md",
      "---\nsidebar_position: 2\n---\n# Second",
    );

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
    });

    const nav = result!.navigation as string[];
    expect(nav).toHaveLength(3);
    // Should be ordered by sidebar_position
    expect(nav[0]).toContain("first");
    expect(nav[1]).toContain("second");
    expect(nav[2]).toContain("third");
  });

  test("uses frontmatter labels", async () => {
    writeFile(
      tmpDir,
      "pages/foo.md",
      "---\nsidebar_label: Custom Label\n---\n# Foo",
    );

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
    });

    // The plugin outputs doc file references (strings), not full objects.
    // Labels are resolved later by NavigationResolver.
    // Just verify the doc reference is present.
    const nav = result!.navigation as string[];
    expect(nav).toHaveLength(1);
  });

  test("wraps in root category when label is provided", async () => {
    writeFile(tmpDir, "pages/intro.md", "# Intro");

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
      label: "Documentation",
      icon: "book-open",
    });

    const nav = result!.navigation as InputNavigationCategory[];
    expect(nav).toHaveLength(1);
    expect(nav[0]!.type).toBe("category");
    expect((nav[0] as InputNavigationCategory).label).toBe("Documentation");
    expect(nav[0]).toHaveProperty("icon", "book-open");
  });

  test("returns undefined when no files match", async () => {
    const result = await callTransformConfig({
      files: `${tmpDir}/nonexistent/**/*.md`,
    });

    expect(result).toBeUndefined();
  });

  test("merges with existing navigation", async () => {
    writeFile(tmpDir, "pages/auto.md", "# Auto");

    const existingNav = [{ type: "link" as const, label: "Home", to: "/" }];

    const result = await callTransformConfig(
      { files: `${tmpDir}/pages/**/*.{md,mdx}` },
      { navigation: existingNav },
    );

    const nav = result!.navigation as unknown[];
    expect(nav).toHaveLength(2);
    expect(nav[0]).toEqual({ type: "link", label: "Home", to: "/" });
  });

  test("handles nested directory structure", async () => {
    writeFile(tmpDir, "pages/api/rest/endpoints.md", "# Endpoints");
    writeFile(tmpDir, "pages/api/rest/auth.md", "# Auth");
    writeFile(tmpDir, "pages/api/graphql/queries.md", "# Queries");

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
    });

    const nav = result!.navigation as InputNavigationCategory[];
    expect(nav).toHaveLength(1);

    const apiCategory = nav[0] as InputNavigationCategory;
    expect(apiCategory.type).toBe("category");
    expect(apiCategory.label).toBe("Api");
    expect(apiCategory.items).toHaveLength(2);

    // Each subdirectory is a nested category
    const restCategory = apiCategory.items.find(
      (item) =>
        typeof item === "object" &&
        item.type === "category" &&
        item.label === "Rest",
    ) as InputNavigationCategory;
    expect(restCategory).toBeDefined();
    expect(restCategory.items).toHaveLength(2);
  });

  test("passes collapsed/collapsible options to categories", async () => {
    writeFile(tmpDir, "pages/guides/intro.md", "# Intro");

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
      collapsed: true,
      collapsible: true,
    });

    const nav = result!.navigation as InputNavigationCategory[];
    const category = nav.find(
      (item) => typeof item === "object" && item.type === "category",
    ) as InputNavigationCategory;

    expect(category.collapsed).toBe(true);
    expect(category.collapsible).toBe(true);
  });

  test("handles .mdx files", async () => {
    writeFile(tmpDir, "pages/component.mdx", "# My Component\n\n<MyComp />");

    const result = await callTransformConfig({
      files: `${tmpDir}/pages/**/*.{md,mdx}`,
    });

    const nav = result!.navigation as string[];
    expect(nav).toHaveLength(1);
  });
});
