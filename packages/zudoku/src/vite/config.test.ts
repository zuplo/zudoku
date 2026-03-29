import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { loadZudokuConfig, setCurrentConfig } from "../config/loader.js";

// Reset the cached config after each test
afterEach(() => {
  setCurrentConfig(undefined as never);
});

it("Should correctly load zudoku.config.ts file", async () => {
  const rootPath = path.resolve(
    import.meta.dirname,
    "../../../../examples/with-config/",
  );
  const { config } = await loadZudokuConfig(
    {
      mode: "development",
      command: "serve",
    },
    rootPath,
  );
  // Normalize the path to Unix-style format
  const normalizedPath = config.__meta.configPath
    .split(path.sep)
    .join(path.posix.sep);

  expect(normalizedPath).includes("/with-config/zudoku.config.");
});

it("Should throw clear error when config file is not found", async () => {
  const rootPath = "/tmp/nonexistent-test-dir";
  await expect(
    loadZudokuConfig(
      {
        mode: "development",
        command: "serve",
      },
      rootPath,
    ),
  ).rejects.toThrow("No zudoku config file found in project root.");
});

it("Should throw clear error when config file has invalid syntax", async () => {
  const tmpDir = path.join("/tmp", `test-invalid-config-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    await fs.writeFile(
      path.join(tmpDir, "zudoku.config.ts"),
      `
// Invalid TypeScript syntax - missing closing brace
export default {
  page: {
    title: "Test"
;`,
    );

    await expect(
      loadZudokuConfig(
        {
          mode: "development",
          command: "serve",
        },
        tmpDir,
      ),
    ).rejects.toThrow(
      "Invalid zudoku config file. Please check the error above for details.",
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
