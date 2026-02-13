import { readFile } from "node:fs/promises";
import path from "node:path";
import { preview as vitePreview } from "vite";
import { getViteConfig } from "../../vite/config.js";
import type { Arguments } from "../cmds/preview.js";
import { printDiagnosticsToConsole } from "../common/output.js";

export const DEFAULT_PREVIEW_PORT = 4000;

export async function preview(argv: Arguments) {
  const dir = path.resolve(process.cwd(), argv.dir);

  const viteConfig = await getViteConfig(dir, {
    command: "serve",
    mode: "production",
    isPreview: true,
  });

  const server = await vitePreview({
    ...viteConfig,
    appType: "mpa", // to serve the static generated files
    preview: {
      port: argv.port ?? DEFAULT_PREVIEW_PORT,
    },
  });

  // Serve 404.html for unmatched routes as a fallback
  const notFoundPage = path.join(dir, "dist", "404.html");
  server.middlewares.use((_req, res) => {
    readFile(notFoundPage, "utf-8").then(
      (content) => {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(content);
      },
      () => {
        res.statusCode = 404;
        res.end("Not Found");
      },
    );
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
