import { type Argv } from "yargs";
import { captureEvent } from "../common/analytics/lib.js";
import { preview } from "../preview/handler.js";

export type Arguments = {
  dir: string;
  port?: number;
};

const previewCommand = {
  desc: "Preview production build",
  command: "preview",
  builder: (yargs: Argv) =>
    yargs
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
      }),
  handler: async (argv: Arguments) => {
    process.env.NODE_ENV = "production";
    await captureEvent({ argv, event: "zudoku preview" });
    await preview(argv);
  },
};

export default previewCommand;
