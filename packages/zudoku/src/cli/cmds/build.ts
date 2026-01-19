import type { Argv } from "yargs";
import { build } from "../build/handler.js";
import { captureEvent } from "../common/analytics/lib.js";
import { DEFAULT_PREVIEW_PORT } from "../preview/handler.js";

export type Arguments = {
  dir: string;
  preview?: boolean | number;
  ssr?: boolean;
  adapter?: string;
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
      })
      .option("ssr", {
        type: "boolean",
        describe: "Build for server-side rendering",
        default: false,
      })
      .option("adapter", {
        type: "string",
        describe: "SSR adapter (node, cloudflare, vercel)",
        choices: ["node", "cloudflare", "vercel"] as const,
        default: "node",
      }),
  handler: async (argv: Arguments) => {
    process.env.NODE_ENV = "production";
    await captureEvent({ argv, event: "zudoku build" });
    await build(argv);
  },
};
