import type { Argv } from "yargs";
import generate from "./generate.js";

export default {
  desc: "Generate additions to the OpenAPI schema manually or using AI",
  command: "schema",
  builder: (yargs: Argv): Argv<unknown> => {
    return yargs.command(generate);
    // add more options for schema utilities as sub commands
  },
  handler: () => {},
};
