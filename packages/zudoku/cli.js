#!/usr/bin/env node

if (process.env.ZUDOKU_INTERNAL_CLI) {
  import("./scripts/cli-dev.js");
} else {
  import("./dist/cli/cli.js");
}
