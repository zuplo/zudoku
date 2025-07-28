#!/usr/bin/env node

import semver from "semver";

if (!semver.satisfies(process.version, ">=20.19.0 <21.0.0 || >=22.7.0")) {
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.error(
    `⚠️ Zudoku requires Node.js version >=20.19.0 or >=22.7.0. Your version: ${process.version}`,
  );
  process.exit(1);
}

if (process.env.ZUDOKU_INTERNAL_CLI) {
  await import("./scripts/cli-dev.js");
} else {
  await import("./dist/cli/cli.js");
}
