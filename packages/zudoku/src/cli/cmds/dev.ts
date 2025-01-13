import { Argv } from "yargs";
import { captureEvent } from "../common/analytics/lib.js";
import { Arguments, dev } from "../dev/handler.js";

export default {
  desc: "Runs locally",
  command: "dev",
  builder: (yargs: Argv): Argv<unknown> => {
    return yargs
      .option("dir", {
        type: "string",
        describe: "The directory containing your project",
        default: ".",
        normalize: true,
        hidden: true,
      })
      .option("port", {
        type: "number",
        describe: "The port to run the local server on",
      })
      .option("ssr", {
        type: "boolean",
        describe: "Enable server-side rendering",
        default: true,
      })
      .option("open", {
        type: "boolean",
        describe: "Automatically open the browser",
        default: false,
      });
  },
  handler: async (argv: unknown) => {
    await captureEvent({
      argv,
      event: "zudoku dev",
    });
    await dev(argv as Arguments);
  },
};
