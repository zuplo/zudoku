import path from "node:path";
import { runBuild, type SSRAdapter } from "../../vite/build.js";
import type { Arguments } from "../cmds/build.js";
import { logger } from "../common/logger.js";
import { printDiagnosticsToConsole } from "../common/output.js";
import { getZudokuPackageJson } from "../common/package-json.js";
import { preview as runPreview } from "../preview/handler.js";

export async function build(argv: Arguments) {
  const packageJson = getZudokuPackageJson();
  printDiagnosticsToConsole(`Starting Zudoku build v${packageJson.version}`);
  printDiagnosticsToConsole("");
  printDiagnosticsToConsole("");

  const dir = path.resolve(process.cwd(), argv.dir);
  try {
    await runBuild({
      dir,
      ssr: argv.experimentalSsr,
      adapter: argv.adapter as SSRAdapter | undefined,
    });
  } catch (error) {
    logger.error("❌ Build failed");
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (argv.preview) {
    await runPreview({
      dir: argv.dir,
      port: typeof argv.preview === "number" ? argv.preview : undefined,
    });
  }
}
