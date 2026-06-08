import path from "node:path";
import { preview as vitePreview } from "vite";
import { getViteConfig } from "../../vite/config.js";
import type { Arguments } from "../cmds/preview.js";
import { DEFAULT_PREVIEW_PORT } from "../common/constants.js";
import { printDiagnosticsToConsole } from "../common/output.js";

export async function preview(argv: Arguments) {
  const dir = path.resolve(process.cwd(), argv.dir);

  const viteConfig = await getViteConfig(dir, {
    command: "serve",
    mode: "production",
    isPreview: true,
  });

  const port =
    argv.port ??
    (process.env.PORT ? Number(process.env.PORT) : undefined) ??
    DEFAULT_PREVIEW_PORT;

  const server = await vitePreview({
    ...viteConfig,
    appType: "mpa", // to serve the static generated files
    preview: { port },
  });

  printDiagnosticsToConsole("");
  printDiagnosticsToConsole(
    `Build preview server running at: ${server.resolvedUrls?.local[0]}`,
  );
  printDiagnosticsToConsole("Press Ctrl+C to stop");

  await new Promise<void>((resolve) => {
    const exit = async () => {
      await server.close();
      resolve();
    };

    process.on("SIGINT", exit);
    process.on("SIGTERM", exit);
    process.on("uncaughtException", exit);
    process.on("unhandledRejection", exit);
    process.on("exit", exit);
  });
}
