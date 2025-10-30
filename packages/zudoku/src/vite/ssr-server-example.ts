/**
 * Example SSR Server Configuration
 *
 * This file demonstrates how to set up an SSR server with custom middleware
 * and configuration options.
 */

import { createSSRServer } from "./ssr-server.js";

async function main() {
  // Create the SSR server
  const app = await createSSRServer({
    dir: process.cwd(),
  });

  // You can add custom middleware here
  // app.use((req, res, next) => {
  //   // Custom middleware logic
  //   next();
  // });

  // Start the server
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;
  const host = process.env.HOST || "0.0.0.0";

  app.listen(port, host, () => {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log(`Zudoku SSR server listening on http://${host}:${port}`);
  });
}

main().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.error("Failed to start SSR server:", error);
  process.exit(1);
});
