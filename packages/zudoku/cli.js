#!/usr/bin/env node

import fs from "node:fs";
import semver from "semver";

if (!semver.satisfies(process.version, ">=20.19.0 <21.0.0 || >=22.12.0")) {
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.error(
    `⚠️ Zudoku requires Node.js version >=20.19.0 or >=22.12.0. Your version: ${process.version}`,
  );
  process.exit(1);
}

const isInternal = fs.existsSync(new URL("./.gitignore", import.meta.url));
process.env.ZUDOKU_ENV = isInternal ? "internal" : "module";

if (isInternal) {
  const { tsImport } = await import("tsx/esm/api");
  await tsImport("./src/cli/cli.ts", import.meta.url);
} else {
  await import(new URL("./dist/cli/cli.js", import.meta.url).href);
}
