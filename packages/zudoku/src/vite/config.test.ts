import path from "node:path";
import { globSync } from "glob";
import { expect, it } from "vitest";
import { loadZudokuConfig } from "../config/loader.js";
import {
  getAppClientEntryPath,
  getAppServerEntryPath,
  getDepScanEntries,
} from "./config.js";

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

it("Should scan the client entry but not the SSR entry for dependencies", () => {
  // `entry.server.tsx` imports `virtual:zudoku-markdown-files`, which only the
  // `ssr` environment resolves. Scanning it from the client environment fails
  // the whole scan, and Vite then skips dependency pre-bundling entirely, which
  // serves Zudoku's CommonJS dependencies to the browser as raw source.
  const entries = getDepScanEntries();
  const scanned = globSync(
    entries.filter((entry) => !entry.startsWith("!")),
    {
      ignore: entries
        .filter((entry) => entry.startsWith("!"))
        .map((entry) => entry.slice(1)),
      posix: true,
    },
  );

  expect(scanned).toContain(getAppClientEntryPath());
  expect(scanned).not.toContain(getAppServerEntryPath());
});
