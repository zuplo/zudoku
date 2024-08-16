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

  await server.watch();

  printDiagnosticsToConsole("Started local development setup");
  printDiagnosticsToConsole("Ctrl+C to exit");
  printDiagnosticsToConsole("");
  printDiagnosticsToConsole(`🚀 Zudoku Portal: http://${host}:${port}`);
  printDiagnosticsToConsole("");
  printDiagnosticsToConsole("");

  return new Promise<void>((resolve) => {
    async function exit() {
      printDiagnosticsToConsole("Closing local development setup");

      await server.stop();

      resolve();
    }

    process.on("SIGTERM", exit);
    process.on("SIGINT", exit);
    process.on("uncaughtException", exit);
    process.on("exit", exit);
  });
}
