import type { Argv } from "yargs";
import { captureEvent } from "../common/analytics/lib.js";
import {
  type Arguments,
  runCreateFromZuplo,
} from "../create-from-zuplo/handler.js";

export default {
  desc: "Generate a Zudoku config from your Zuplo project",
  command: "create-from-zuplo",
  builder: (yargs: Argv) =>
    yargs.option("dir", {
      type: "string",
      describe: "The directory containing your project",
      default: ".",
      normalize: true,
      hidden: true,
    }),
  handler: async (argv: Arguments) => {
    await captureEvent({ argv, event: "zudoku create-from-zuplo" });
    await runCreateFromZuplo(argv);
  },
};
