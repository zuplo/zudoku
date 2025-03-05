import { type Argv } from "yargs";
import { captureEvent } from "../common/analytics/lib.js";
import { type Arguments, dev } from "../dev/handler.js";
import { pagefindCommand } from "../dev/pagefind-command.js";

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
      })
      .command(
        "pagefind",
        "Creates a search index for pagefind based on the current build",
        (yargs: Argv) =>
          yargs.option("force-build", {
            type: "boolean",
            description: "Run build before generating pagefind index",
            default: false,
          }),
        pagefindCommand,
      );
  },
  handler: async (argv: unknown) => {
    await captureEvent({
      argv,
      event: "zudoku dev",
    });
    await dev(argv as Arguments);
  },
};
