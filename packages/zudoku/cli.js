#!/usr/bin/env node

import { register } from "node:module";
register("esm-loader-css", import.meta.url);

if (process.env.ZUDOKU_INTERNAL_CLI) {
  await import("./scripts/cli-dev.js");
} else {
  await import("./dist/cli/cli.js");
}
