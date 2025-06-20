import { type Argv } from "yargs";
import { captureEvent } from "../common/analytics/lib.js";
import { generateExamples } from "../generate-examples/handler.js";

export type Arguments = {
  file: string;
  output?: string;
};

export default {
  desc: "Generate examples for OpenAPI schemas interactively",
  command: "generate-examples",
  builder: (yargs: Argv) =>
    yargs
      .option("file", {
        type: "string",
        describe: "Path to the OpenAPI JSON/YAML file",
        demandOption: true,
      })
      .option("output", {
        type: "string",
        describe: "Output file path (defaults to overwriting the input file)",
      }),
  handler: async (argv: Arguments) => {
    await captureEvent({ argv, event: "zudoku generate-examples" });
    await generateExamples(argv);
  },
};
