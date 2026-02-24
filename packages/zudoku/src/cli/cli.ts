import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as Sentry from "@sentry/node";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import build from "./cmds/build.js";
import dev from "./cmds/dev.js";
import preview from "./cmds/preview.js";
import { shutdownAnalytics } from "./common/analytics/lib.js";
import { MAX_WAIT_PENDING_TIME_MS, SENTRY_DSN } from "./common/constants.js";
import { warnIfOutdatedVersion } from "./common/outdated.js";
import { printDiagnosticsToConsole } from "./common/output.js";
import { warnPackageVersionMismatch } from "./common/version-check.js";

process.env.ZUDOKU_ENV = process.env.ZUDOKU_INTERNAL_DEV
  ? "internal"
  : "module";

// Minimal representation of a package.json file
type PackageJson = {
  name: string;
  version: string;
  type: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

export const getPackageJson = (path: string): PackageJson =>
  JSON.parse(readFileSync(path, "utf-8")) as PackageJson;

const packageJson = getPackageJson(
  fileURLToPath(import.meta.resolve("zudoku/package.json")),
);

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: packageJson?.version,
  });
}

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

  void Sentry.close(MAX_WAIT_PENDING_TIME_MS).then(() => {
    process.exit(0);
  });
} catch (err) {
  if (err instanceof Error) {
    Sentry.captureException(err);
  }
  throw err;
} finally {
  await shutdownAnalytics();
}
