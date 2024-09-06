import path from "node:path";
import { DevServer } from "../../vite/dev-server.js";
import { printDiagnosticsToConsole } from "../common/output.js";
import { isPortAvailable } from "../common/utils/ports.js";

export interface Arguments {
  dir: string;
  port?: number;
  ssr: boolean;
}

export async function dev(argv: Arguments) {
  process.env.NODE_ENV = "development";
  const host = "localhost";
  let port = argv.port;
  if (!port) {
    port = 9000;
    while (!(await isPortAvailable(host, port)) && port < 9800) {
      port++;
    }
  }

  const dir = path.resolve(process.cwd(), argv.dir);
  const server = new DevServer({ dir, port, ssr: argv.ssr });

  await server.start();

  printDiagnosticsToConsole("Started development server");
  printDiagnosticsToConsole("Ctrl+C to exit");
  printDiagnosticsToConsole("");
  printDiagnosticsToConsole(`🚀 Zudoku Portal: http://${host}:${port}`);
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
      // eslint-disable-next-line no-console
      console.error("Unhandled rejection", e);
      void exit();
    });
    process.on("exit", exit);
  });
}
