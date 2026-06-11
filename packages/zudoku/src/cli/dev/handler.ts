import path from "node:path";
import { ZuploEnv } from "../../app/env.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { DevServer } from "../../vite/dev-server.js";
import { logger } from "../common/logger.js";
import { printDiagnosticsToConsole } from "../common/output.js";
import { getZudokuPackageJson } from "../common/package-json.js";
import { runCreateFromZuplo } from "../create-from-zuplo/handler.js";

export interface Arguments {
  dir: string;
  port?: number;
  ssr: boolean;
  open?: boolean;
}

export async function dev(argv: Arguments) {
  const packageJson = getZudokuPackageJson();
  process.env.NODE_ENV = "development";
  const dir = path.resolve(process.cwd(), argv.dir);

  // In Zuplo mode the generated Zuplo config is refreshed before the server
  // starts; failures shouldn't prevent the dev server from coming up.
  if (ZuploEnv.isZuplo) {
    try {
      await runCreateFromZuplo({ dir: argv.dir });
    } catch (error) {
      logger.error("Failed to generate the Zuplo config", {
        timestamp: true,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
  const server = new DevServer({
    dir,
    argPort: argv.port,
    ssr: argv.ssr,
    open: argv.open,
  });

  const { vite } = await server.start();

  const url = joinUrl(
    `${server.protocol}://localhost:${server.resolvedPort}`,
    vite.config.base,
  );

  printDiagnosticsToConsole("Ctrl+C to exit");
  printDiagnosticsToConsole("");
  printDiagnosticsToConsole(
    `🚀 Running Zudoku v${packageJson.version}: ${url}`,
  );
  printDiagnosticsToConsole("");

  let hasExited = false;

  return new Promise<void>((resolve) => {
    function exit() {
      if (!hasExited) {
        hasExited = true;
        server
          .stop()
          .then(() => {
            resolve();
          })
          .catch((e) => {
            console.error("Error stopping server", e);
            resolve();
          });
      }
    }

    process.on("SIGTERM", exit);
    process.on("SIGINT", exit);
    process.on("uncaughtException", (e) => {
      console.error("Uncaught exception", e);
      void exit();
    });
    process.on("unhandledRejection", (e) => {
      if (e instanceof DOMException && e.name === "AbortError") {
        console.log(`[Abort] ${e.message}`);
        return;
      }

      console.error("Unhandled rejection", e);
      void exit();
    });
    process.on("exit", exit);
  });
}
