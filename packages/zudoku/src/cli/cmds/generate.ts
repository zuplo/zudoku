import type { Argv } from "yargs";
import { examplesHandler } from "../handlers/generate-examples.js";

export default {
  desc: "Generate additions to the OpenAPI schema manually or using AI",
  command: "generate",
  builder: (yargs: Argv): Argv<unknown> => {
    return yargs.command(examplesSubCommand);
    // add more options for generation as sub commands
  },
};

export interface ExamplesArguments {
  schema: string;
  paths?: string[];
  mode?: "ai" | "local" | "manual";
}

const examplesSubCommand = {
  desc: "Generate examples for paths with no request body or response examples",
  command: "examples",
  builder: (yargs: Argv): Argv<unknown> => {
    return yargs
      .option("schema", {
        type: "string",
        alias: "s",
        describe: "The OpenAPI schema file, either YAML or JSON",
        demandOption:
          "Please provide the OpenAPI schema file path to run this command on using --schema or -s",
      })
      .option("paths", {
        type: "array",
        alias: "p",
        describe:
          "Specific API endpoints to generate examples for (e.g. /todo)",
      })
      .option("mode", {
        type: "string",
        alias: "m",
        choices: ["ai", "local", "manual"],
        describe:
          "How Zudoku will generate the examples (AI, local code generation, manual user input)",
      });
  },
  handler: async (argv: unknown) => {
    /** TODO: uncomment for analytics
    await captureEvent({
      argv,
      event: "zudoku dev",
    });
    **/
    await examplesHandler(argv as ExamplesArguments);
  },
};
