import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import build from "./cmds/build.js";
import dev from "./cmds/dev.js";
import preview from "./cmds/preview.js";
import { shutdownAnalytics } from "./common/analytics/lib.js";
import { warnIfOutdatedVersion } from "./common/outdated.js";
import { printDiagnosticsToConsole } from "./common/output.js";
import { getZudokuPackageJson } from "./common/package-json.js";
import { warnPackageVersionMismatch } from "./common/version-check.js";

process.env.ZUDOKU_ENV = process.env.ZUDOKU_INTERNAL_DEV
  ? "internal"
  : "module";

const packageJson = getZudokuPackageJson();

const cli = yargs(hideBin(process.argv))
  .option("zuplo", {
    type: "boolean",
    description: "Enable Zuplo mode",
    global: true,
  })
  .middleware((argv) => {
    if (argv.zuplo) {
      process.env.ZUPLO = "1";
      printDiagnosticsToConsole("Running in Zuplo mode");
    }
  })
  .middleware(warnPackageVersionMismatch)
  .command(build)
  .command(dev)
  .command(preview)
  .demandCommand()
  .strictCommands()
  .version(packageJson?.version)
  .fail(false)
  .help();

try {
  // Don't block
  void warnIfOutdatedVersion(packageJson?.version);

  await cli.argv;
} finally {
  await shutdownAnalytics();
}

// Force termination once analytics have flushed, but without an explicit code
// so that any exit code set via `process.exitCode` is preserved.
process.exit();
