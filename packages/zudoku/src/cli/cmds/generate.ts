import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import type { Argv } from "yargs";
import { generateConfig } from "../../codegen/generate.js";
import { captureEvent } from "../common/analytics/lib.js";
import { printDiagnosticsToConsole } from "../common/output.js";

export type Arguments = {
  spec: string;
  output: string;
};

const generate = async (argv: Arguments) => {
  const specPath = path.resolve(argv.spec);
  const outputPath = path.resolve(argv.output);

  let raw: string;
  try {
    raw = await readFile(specPath, "utf-8");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read config spec at ${specPath}:\n${detail}`);
  }

  let spec: unknown;
  try {
    spec = JSON.parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Config spec at ${specPath} is not valid JSON:\n${detail}`);
  }

  await writeFile(outputPath, generateConfig(spec), "utf-8");

  const extendsHint = `./${path.basename(outputPath).replace(/\.[^.]+$/, "")}`;
  printDiagnosticsToConsole(
    `${colors.green("✓")} generated ${colors.dim(outputPath)}`,
  );
  printDiagnosticsToConsole(
    `Compose it in your zudoku.config: ${colors.dim(`extends: ["${extendsHint}"]`)}`,
  );
};

export default {
  desc: "Generate a config from a serializable config spec",
  command: "generate <spec>",
  builder: (yargs: Argv) =>
    yargs
      .positional("spec", {
        type: "string",
        describe: "Path to the config spec (JSON)",
        normalize: true,
        demandOption: true,
      })
      .option("output", {
        alias: "o",
        type: "string",
        describe: "Path of the generated config module",
        default: "zudoku.base.ts",
        normalize: true,
      }),
  handler: async (argv: Arguments) => {
    await captureEvent({ argv, event: "zudoku generate" });
    await generate(argv);
  },
};
