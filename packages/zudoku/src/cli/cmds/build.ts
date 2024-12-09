import { Argv } from "yargs";
import { Arguments, build } from "../build/handler.js";
import { captureEvent } from "../common/analytics/lib.js";

export default {
  desc: "Build",
  command: "build",
  builder: (yargs: Argv): Argv<unknown> => {
    return yargs.option("dir", {
      type: "string",
      describe: "The directory containing your project",
      default: ".",
      normalize: true,
      hidden: true,
    });
  },
  handler: async (argv: unknown) => {
    await captureEvent({
      argv,
      event: "zudoku build",
    });
    process.env.NODE_ENV = "production";
    await build(argv as Arguments);
  },
};
