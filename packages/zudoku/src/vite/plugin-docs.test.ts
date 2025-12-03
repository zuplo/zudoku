import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { ConfigWithMeta } from "../config/loader.js";
import { globMarkdownFiles } from "./plugin-docs.js";

describe("plugin-docs", () => {
  let tempDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await mkdtemp(path.join(tmpdir(), "zudoku-test-"));
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(async () => {
    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true });
    process.env.NODE_ENV = originalEnv;
  });

  const createTestConfig = (
    rootDir: string,
    files: string[] = ["docs/**/*.{md,mdx}"],
  ): ConfigWithMeta => ({
    docs: {
      files,
    },
    __meta: {
      rootDir,
      mode: "internal" as const,
      moduleDir: "",
    },
  });

  describe("globMarkdownFiles", () => {
    test("includes all files in development mode", async () => {
      process.env.NODE_ENV = "development";

      // Create test files
      await writeFile(
        path.join(tempDir, "regular.md"),
        "---\ntitle: Regular\n---\n# Regular",
      );
      await writeFile(
        path.join(tempDir, "draft.md"),
        "---\ntitle: Draft\ndraft: true\n---\n# Draft",
      );

      const config = createTestConfig(tempDir, ["*.{md,mdx}"]);
      const fileMapping = await globMarkdownFiles(config, { absolute: false });

      expect(Object.keys(fileMapping)).toHaveLength(2);
      expect(fileMapping["/regular"]).toBeDefined();
      expect(fileMapping["/draft"]).toBeDefined();
    });

    test("excludes draft files in production mode", async () => {
      process.env.NODE_ENV = "production";

      // Create test files
      await writeFile(
        path.join(tempDir, "regular.md"),
        "---\ntitle: Regular\n---\n# Regular",
      );
      await writeFile(
        path.join(tempDir, "draft.md"),
        "---\ntitle: Draft\ndraft: true\n---\n# Draft",
      );

      const config = createTestConfig(tempDir, ["*.{md,mdx}"]);
      const fileMapping = await globMarkdownFiles(config, { absolute: false });

      expect(Object.keys(fileMapping)).toHaveLength(1);
      expect(fileMapping["/regular"]).toBeDefined();
      expect(fileMapping["/draft"]).toBeUndefined();
    });

    test("includes files with draft: false in production mode", async () => {
      process.env.NODE_ENV = "production";

      // Create test files
      await writeFile(
        path.join(tempDir, "explicit-not-draft.md"),
        "---\ntitle: Not Draft\ndraft: false\n---\n# Not Draft",
      );

      const config = createTestConfig(tempDir, ["*.{md,mdx}"]);
      const fileMapping = await globMarkdownFiles(config, { absolute: false });

      expect(Object.keys(fileMapping)).toHaveLength(1);
      expect(fileMapping["/explicit-not-draft"]).toBeDefined();
    });

    test("includes files without draft field in production mode", async () => {
      process.env.NODE_ENV = "production";

      // Create test files
      await writeFile(
        path.join(tempDir, "no-draft-field.md"),
        "---\ntitle: No Draft Field\n---\n# No Draft Field",
      );

      const config = createTestConfig(tempDir, ["*.{md,mdx}"]);
      const fileMapping = await globMarkdownFiles(config, { absolute: false });

      expect(Object.keys(fileMapping)).toHaveLength(1);
      expect(fileMapping["/no-draft-field"]).toBeDefined();
    });

    test("handles mdx files with draft field", async () => {
      process.env.NODE_ENV = "production";

      // Create test files
      await writeFile(
        path.join(tempDir, "regular.mdx"),
        "---\ntitle: Regular\n---\n# Regular",
      );
      await writeFile(
        path.join(tempDir, "draft.mdx"),
        "---\ntitle: Draft\ndraft: true\n---\n# Draft",
      );

      const config = createTestConfig(tempDir, ["*.{md,mdx}"]);
      const fileMapping = await globMarkdownFiles(config, { absolute: false });

      expect(Object.keys(fileMapping)).toHaveLength(1);
      expect(fileMapping["/regular"]).toBeDefined();
      expect(fileMapping["/draft"]).toBeUndefined();
    });
  });
});
