// import * as dotenv from "dotenv";
// dotenv.config();

import * as Sentry from "@sentry/node";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gte } from "semver";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import build from "./cmds/build.js";
import dev from "./cmds/dev.js";
import { shutdownAnalytics } from "./common/analytics/lib.js";
import { MAX_WAIT_PENDING_TIME_MS, SENTRY_DSN } from "./common/constants.js";
import { logger } from "./common/logger.js";
import { warnIfOutdatedVersion } from "./common/outdated.js";
import { printCriticalFailureToConsoleAndExit } from "./common/output.js";

const MIN_NODE_VERSION = "20.0.0";

if (gte(process.versions.node, MIN_NODE_VERSION)) {
  let packageJson;
  try {
    packageJson = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../../package.json", import.meta.url)),
        "utf-8",
      ),
    );
  } catch (e) {
    logger.error(e);
    await printCriticalFailureToConsoleAndExit(
      `Unable to load zudoku cli. The package.json is missing or malformed.`,
    );
  }

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      release: packageJson?.version,
    });
  }

  const cli = yargs(hideBin(process.argv))
    .command(build)
    .command(dev)
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
    await printCriticalFailureToConsoleAndExit(err.message ?? err);
    cli.showHelp();
  } finally {
    await shutdownAnalytics();
  }
} else {
  await printCriticalFailureToConsoleAndExit(
    `The Zudoku CLI requires at least node.js v${MIN_NODE_VERSION}. You are using v${process.versions.node}. Please update your version of node.js.

    Consider using a Node.js version manager such as https://github.com/nvm-sh/nvm.`,
  );
}
