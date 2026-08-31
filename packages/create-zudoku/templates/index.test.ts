import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installTemplate } from "./index.js";

describe("default template", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
      tempDirs
        .splice(0)
        .map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it.each(["js", "ts"] as const)(
    "scaffolds the minimal Vercel contract for %s projects",
    async (mode) => {
      vi.spyOn(console, "log").mockImplementation(() => undefined);
      const root = await mkdtemp(
        path.join(os.tmpdir(), `create-zudoku-${mode}-`),
      );
      tempDirs.push(root);

      await installTemplate({
        appName: "example-portal",
        root,
        packageManager: "pnpm",
        isOnline: false,
        template: "default",
        mode,
        eslint: false,
        skipInstall: true,
        zudokuVersion: "0.0.0-test",
      });

      await expect(
        readFile(path.join(root, "vercel.json"), "utf-8").then(JSON.parse),
      ).resolves.toEqual({
        $schema: "https://openapi.vercel.sh/vercel.json",
        framework: null,
        buildCommand: "pnpm run build",
        outputDirectory: null,
      });
    },
  );
});
