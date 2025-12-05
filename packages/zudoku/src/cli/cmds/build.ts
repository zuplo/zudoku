import type { Argv } from "yargs";
import { captureEvent } from "../common/analytics/lib.js";
import { build } from "../handlers/build.js";
import { DEFAULT_PREVIEW_PORT } from "../handlers/preview.js";

export type Arguments = {
  dir: string;
  preview?: boolean | number;
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
        describe:
          "Preview the build after completion (optionally with a custom port)",
        coerce: (value: unknown) => {
          if (typeof value === "number") return value;
          if (value === true) return DEFAULT_PREVIEW_PORT;
          return undefined;
        },
      }),
  handler: async (argv: Arguments) => {
    process.env.NODE_ENV = "production";
    await captureEvent({ argv, event: "zudoku build" });
    await build(argv);
  },
};
