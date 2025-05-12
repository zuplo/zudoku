import path from "node:path";
import packageJson from "../../../package.json" with { type: "json" };
import { joinUrl } from "../../lib/util/joinUrl.js";
import { DevServer } from "../../vite/dev-server.js";
import { printDiagnosticsToConsole } from "../common/output.js";

export interface Arguments {
  dir: string;
  port?: number;
  ssr: boolean;
  open?: boolean;
}

export async function dev(argv: Arguments) {
  process.env.NODE_ENV = "development";
  const dir = path.resolve(process.cwd(), argv.dir);
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
            // eslint-disable-next-line no-console
            console.error("Error stopping server", e);
            resolve();
          });
      }
    }

    process.on("SIGTERM", exit);
    process.on("SIGINT", exit);
    process.on("uncaughtException", (e) => {
      // eslint-disable-next-line no-console
      console.error("Uncaught exception", e);
      void exit();
    });
    process.on("unhandledRejection", (e) => {
      if (e instanceof DOMException && e.name === "AbortError") {
        // eslint-disable-next-line no-console
        console.log(`[Abort] ${e.message}`);
        return;
      }

      // eslint-disable-next-line no-console
      console.error("Unhandled rejection", e);
      void exit();
    });
    process.on("exit", exit);
  });
}
