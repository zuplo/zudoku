import { type Argv } from "yargs";
import { build } from "../build/handler.js";
import { captureEvent } from "../common/analytics/lib.js";

export type Arguments = {
  dir: string;
  preview: number;
};

export default {
  desc: "Build",
  command: "build",
  builder: (yargs: Argv) =>
    yargs
      .option("dir", {
        type: "string",
        describe: "The directory containing your project",
        default: ".",
        normalize: true,
        hidden: true,
      })
      .option("preview", {
        type: "number",
        describe:
          "Preview the build after completion (optionally with a custom port)",
        default: 4000,
      }),
  handler: async (argv: Arguments) => {
    process.env.NODE_ENV = "production";
    await captureEvent({ argv, event: "zudoku build" });
    await build(argv);
  },
};
