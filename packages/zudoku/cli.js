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

// .gitignore is tracked in the workspace and stripped from published tarballs,
// so its presence next to cli.js means we're in workspace dev. We only run
// from source when there's no built dist to fall back on: production-style
// builds (Vercel, CI) live in the workspace topology but don't ship `tsx` in
// their resolution path, so they need the bundled output.
const isInternal = fs.existsSync(new URL("./.gitignore", import.meta.url));
const dist = new URL("./dist/cli/cli.js", import.meta.url);

process.env.ZUDOKU_ENV = isInternal ? "internal" : "module";

if (isInternal && !fs.existsSync(dist)) {
  const { tsImport } = await import("tsx/esm/api");
  await tsImport("./src/cli/cli.ts", import.meta.url);
} else {
  await import(dist.href);
}
