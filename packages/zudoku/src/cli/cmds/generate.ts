import path from "node:path";
import type { Argv } from "yargs";
import {
  DEFAULT_OUTPUT_FILE,
  DEFAULT_SPEC_FILE,
  generateBaseConfig,
} from "../../config/spec/generate.js";
import { getSpecJsonSchema } from "../../config/spec/schema.js";
import { captureEvent } from "../common/analytics/lib.js";
import { printDiagnosticsToConsole } from "../common/output.js";

export type Arguments = {
  spec?: string;
  output: string;
  dir: string;
  printSchema?: boolean;
};

export default {
  desc: "Generate a base config from a spec file",
  command: "generate [spec]",
  builder: (yargs: Argv) =>
    yargs
      .positional("spec", {
        type: "string",
        describe: `The spec file to compile (defaults to ${DEFAULT_SPEC_FILE} when present)`,
      })
      .option("output", {
        alias: "o",
        type: "string",
        describe: "The base config file to write",
        default: DEFAULT_OUTPUT_FILE,
      })
      .option("dir", {
        type: "string",
        describe: "The directory containing your project",
        default: ".",
        normalize: true,
        hidden: true,
      })
      .option("print-schema", {
        type: "boolean",
        describe: "Print the spec JSON Schema and exit",
        default: false,
      }),
  handler: async (argv: Arguments) => {
    if (argv.printSchema) {
      console.log(JSON.stringify(getSpecJsonSchema(), null, 2));
      return;
    }

    await captureEvent({ argv, event: "zudoku generate" });

    const dir = path.resolve(process.cwd(), argv.dir);
    const result = await generateBaseConfig({
      dir,
      specPath: argv.spec,
      outputPath: argv.output,
    });

    const source = result.specPath
      ? path.relative(dir, result.specPath)
      : "Zuplo project inspection";
    printDiagnosticsToConsole(
      result.written
        ? `Generated ${path.relative(dir, result.outputPath)} from ${source}`
        : `${path.relative(dir, result.outputPath)} is up to date`,
    );
  },
};
