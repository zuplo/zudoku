#!/usr/bin/env node

if (process.env.ZUDOKU_INTERNAL_CLI) {
  await import("./scripts/cli-dev.js");
} else {
  await import("./dist/cli/cli.js");
}
