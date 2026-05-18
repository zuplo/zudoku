// Keep this file's static imports small. Heavy deps (vite, graphql, sentry,
// mdx, shiki, …) must only be reachable via dynamic import inside a cmd.

import type { Argv, CommandModule } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { shutdownAnalytics } from "./common/analytics/lib.js";
import { MAX_WAIT_PENDING_TIME_MS, SENTRY_DSN } from "./common/constants.js";
import { warnIfOutdatedVersion } from "./common/outdated.js";
import { printDiagnosticsToConsole } from "./common/output.js";
import { getZudokuPackageJson } from "./common/package-json.js";
import { warnPackageVersionMismatch } from "./common/version-check.js";

type LazyCmd = {
  command: string;
  desc: string;
  builder: (y: Argv) => Argv;
  // biome-ignore lint/suspicious/noExplicitAny: argv shape varies per command
  handler: (argv: any) => Promise<void> | void;
};

const lazyCommand = (
  command: string,
  describe: string,
  load: () => Promise<{ default: LazyCmd }>,
): CommandModule => ({
  command,
  describe,
  builder: (y) => load().then(({ default: cmd }) => cmd.builder(y)),
  handler: (argv) => load().then(({ default: cmd }) => cmd.handler(argv)),
});

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
  .middleware((args) => {
    if (args.zuplo) {
      process.env.ZUPLO = "1";
      printDiagnosticsToConsole("Running in Zuplo mode");
    }
  })
  .middleware(warnPackageVersionMismatch)
  .command(lazyCommand("build", "Build", () => import("./cmds/build.js")))
  .command(lazyCommand("dev", "Runs locally", () => import("./cmds/dev.js")))
  .command(
    lazyCommand(
      "preview",
      "Preview production build",
      () => import("./cmds/preview.js"),
    ),
  )
  .demandCommand()
  .strictCommands()
  .version(packageJson?.version)
  .fail(false)
  .help();

try {
  void warnIfOutdatedVersion(packageJson?.version);

  await cli.argv;

  if (SENTRY_DSN) {
    const Sentry = await import("@sentry/node");
    void Sentry.close(MAX_WAIT_PENDING_TIME_MS).then(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
} catch (err) {
  if (SENTRY_DSN && err instanceof Error) {
    const Sentry = await import("@sentry/node");
    Sentry.captureException(err);
  }
  throw err;
} finally {
  await shutdownAnalytics();
}
