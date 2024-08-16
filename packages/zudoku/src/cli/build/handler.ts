import path from "node:path";
import { runBuild } from "../../vite/build.js";
import { printDiagnosticsToConsole } from "../common/output.js";

export interface Arguments {
  dir: string;
}

export async function build(argv: Arguments) {
  printDiagnosticsToConsole("Starting build");
  printDiagnosticsToConsole("");
  printDiagnosticsToConsole("");

  const dir = path.resolve(process.cwd(), argv.dir);
  await runBuild({ dir });
}
