import path from "node:path";
import { runBuild } from "../../vite/build.js";
import type { Arguments } from "../cmds/build.js";
import { printDiagnosticsToConsole } from "../common/output.js";
import { preview as runPreview } from "../preview/handler.js";

export async function build(argv: Arguments) {
  printDiagnosticsToConsole("Starting build");
  printDiagnosticsToConsole("");
  printDiagnosticsToConsole("");

  const dir = path.resolve(process.cwd(), argv.dir);
  await runBuild({ dir });

  if (argv.preview) {
    await runPreview({
      dir: argv.dir,
      port: typeof argv.preview === "number" ? argv.preview : undefined,
    });
  }
}
