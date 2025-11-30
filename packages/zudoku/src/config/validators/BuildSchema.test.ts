import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigWithMeta } from "../loader.js";

// Mock the loader module
vi.mock("../loader.js", () => ({
  getCurrentConfig: vi.fn(),
}));

// Mock vite's runnerImport
vi.mock("vite", () => ({
  runnerImport: vi.fn(),
}));

describe("BuildSchema", () => {
  let tempDir: string;
  let mockConfig: ConfigWithMeta;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = path.join(
      process.cwd(),
      "tmp",
      `build-schema-test-${Date.now()}`,
    );
    await mkdir(tempDir, { recursive: true });

    // Setup mock config
    mockConfig = {
      __meta: {
        rootDir: tempDir,
        moduleDir: "",
        configPath: "",
        mode: "development",
        dependencies: [],
      },
    };

    // Setup mocks
    const { getCurrentConfig } = await import("../loader.js");
    vi.mocked(getCurrentConfig).mockReturnValue(mockConfig);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  const supportedExtensions = [
    "zudoku.build.js",
    "zudoku.build.jsx",
    "zudoku.build.ts",
    "zudoku.build.tsx",
    "zudoku.build.mjs",
    "zudoku.build.cjs",
  ];

  for (const filename of supportedExtensions) {
    it(`should find and load ${filename}`, async () => {
      // Create a test build config file
      const buildFilePath = path.join(tempDir, filename);
      await writeFile(buildFilePath, "export default {};");

      // Mock runnerImport to return a valid config
      const { runnerImport } = await import("vite");
      vi.mocked(runnerImport).mockResolvedValue({
        module: { default: {} },
        dependencies: [],
      });

      // Import the function after mocks are set up
      const { getBuildConfig } = await import("./BuildSchema.js");

      const result = await getBuildConfig();

      expect(result).toBeDefined();
      expect(runnerImport).toHaveBeenCalledWith(buildFilePath);
    });
  }

  it("should return undefined when no build config file exists", async () => {
    // Don't create any build config file

    // Import the function after mocks are set up
    const { getBuildConfig } = await import("./BuildSchema.js");

    const result = await getBuildConfig();

    expect(result).toBeUndefined();
  });

  it("should prioritize files in order", async () => {
    // Create multiple build config files (create .jsx and .ts, .js is first in priority)
    await writeFile(
      path.join(tempDir, "zudoku.build.jsx"),
      "export default {};",
    );
    await writeFile(
      path.join(tempDir, "zudoku.build.ts"),
      "export default {};",
    );
    await writeFile(
      path.join(tempDir, "zudoku.build.js"),
      "export default {};",
    );

    // Mock runnerImport
    const { runnerImport } = await import("vite");
    vi.mocked(runnerImport).mockResolvedValue({
      module: { default: {} },
      dependencies: [],
    });

    // Import the function after mocks are set up
    const { getBuildConfig } = await import("./BuildSchema.js");

    await getBuildConfig();

    // Should load .js first as it's first in the array
    expect(runnerImport).toHaveBeenCalledWith(
      path.join(tempDir, "zudoku.build.js"),
    );
  });
});
