import express from "express";
import path from "node:path";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { getViteConfig } from "../../vite/config.js";
import type { Arguments } from "../cmds/preview.js";
import { printDiagnosticsToConsole } from "../common/output.js";
import { findAvailablePort } from "../common/utils/ports.js";

export const DEFAULT_PREVIEW_PORT = 4000;

export async function preview(argv: Arguments) {
  const dir = path.resolve(process.cwd(), argv.dir);
  const distDir = path.join(dir, "dist");

  const viteConfig = await getViteConfig(dir, {
    command: "serve",
    mode: "production",
  });

  printDiagnosticsToConsole("Starting build preview server");
  printDiagnosticsToConsole("");

  const port = await findAvailablePort(argv.port ?? DEFAULT_PREVIEW_PORT);
  const app = express();

  app.use(express.static(distDir, { extensions: ["html"] }));

  const server = app.listen(port, () => {
    const url = joinUrl(`http://localhost:${port}`, viteConfig.base);
    printDiagnosticsToConsole(`Build preview server running at: ${url}`);
    printDiagnosticsToConsole("Press Ctrl+C to stop");
  });

  await new Promise<void>((resolve) => {
    const exit = () => {
      server.close();
      resolve();
    };

    process.on("SIGINT", exit);
    process.on("SIGTERM", exit);
    process.on("uncaughtException", exit);
    process.on("unhandledRejection", exit);
    process.on("exit", exit);
  });
}
