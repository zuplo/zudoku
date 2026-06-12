import { writeFile } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import type { Argv } from "yargs";
import { buildSpecJsonSchema } from "../../codegen/json-schema.js";
import { captureEvent } from "../common/analytics/lib.js";
import { printDiagnosticsToConsole } from "../common/output.js";

export type Arguments = {
  output?: string;
};

export default {
  desc: "Emit the JSON Schema for the config spec used by `zudoku generate`",
  command: "schema",
  builder: (yargs: Argv) =>
    yargs.option("output", {
      alias: "o",
      type: "string",
      describe: "Write the schema to a file instead of stdout",
      normalize: true,
    }),
  handler: async (argv: Arguments) => {
    await captureEvent({ argv, event: "zudoku schema" });

    const json = `${JSON.stringify(buildSpecJsonSchema(), null, 2)}\n`;

    if (argv.output) {
      const outputPath = path.resolve(argv.output);
      await writeFile(outputPath, json, "utf-8");
      printDiagnosticsToConsole(
        `${colors.green("✓")} wrote schema to ${colors.dim(outputPath)}`,
      );
      return;
    }

    process.stdout.write(json);
  },
};
