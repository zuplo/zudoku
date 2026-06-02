import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  stat: vi.fn(() => Promise.resolve({ mtimeMs: 1 })),
}));

vi.mock("vite", () => ({
  runnerImport: vi.fn(),
  loadEnv: vi.fn(() => ({})),
}));

vi.mock("../cli/common/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("../cli/common/package-json.js", () => ({
  getZudokuRootDir: () => "/zudoku-root",
}));

vi.mock("../lib/core/transform-config.js", () => ({
  runPluginTransformConfig: vi.fn((config) => config),
}));

vi.mock("./file-exists.js", () => ({
  fileExists: vi.fn(),
}));

import { runnerImport } from "vite";
import { logger } from "../cli/common/logger.js";
import { fileExists } from "./file-exists.js";
import { loadZudokuConfig } from "./loader.js";

const configEnv = { mode: "development", command: "serve" } as const;

const configStore = globalThis as { __zudokuConfig?: unknown };

beforeEach(() => {
  vi.clearAllMocks();
  // Reset the cached config that lives on globalThis between loads.
  configStore.__zudokuConfig = undefined;
});

describe("loadZudokuConfig", () => {
  it("surfaces the underlying error for a failed import instead of 'no config file found'", async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(runnerImport).mockRejectedValue(
      new Error("Failed to resolve import './does-not-exist'"),
    );

    await expect(loadZudokuConfig(configEnv, "/project")).rejects.toThrow(
      /Invalid Zudoku configuration at/,
    );
    // The actual cause is inlined so the user doesn't have to hunt the logs.
    await expect(loadZudokuConfig(configEnv, "/project")).rejects.toThrow(
      /Failed to resolve import '\.\/does-not-exist'/,
    );
  });

  it("preserves the original error as `cause`", async () => {
    const original = new Error("boom");
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(runnerImport).mockRejectedValue(original);

    await expect(loadZudokuConfig(configEnv, "/project")).rejects.toMatchObject(
      { cause: original },
    );
  });

  it("throws a clear error when the config has no default export", async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(runnerImport).mockResolvedValue({
      module: {},
      dependencies: [],
    } as never);

    await expect(loadZudokuConfig(configEnv, "/project")).rejects.toThrow(
      /must have a default export/,
    );
  });

  it("still reports a genuinely missing config file", async () => {
    vi.mocked(fileExists).mockResolvedValue(false);

    await expect(loadZudokuConfig(configEnv, "/project")).rejects.toThrow(
      "No zudoku config file found in project root.",
    );
  });

  it("logs the error and keeps the last valid config on a failed reload", async () => {
    const cached = {
      __meta: {
        rootDir: "/project",
        moduleDir: "/zudoku-root",
        mode: undefined,
        dependencies: [],
        configPath: "/project/zudoku.config.js",
      },
    };
    configStore.__zudokuConfig = cached;

    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(runnerImport).mockRejectedValue(new Error("syntax error"));

    const result = await loadZudokuConfig(configEnv, "/project");

    expect(result.config).toBe(cached);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("using last valid config"),
      expect.objectContaining({ timestamp: true }),
    );
  });
});
