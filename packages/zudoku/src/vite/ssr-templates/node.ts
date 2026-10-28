import { serve } from "@hono/node-server";
import { createServer } from "zudoku/server";
import { node } from "zudoku/server/adapters/node";

const app = createServer({ adapter: node() });

serve({ fetch: app.fetch, port: Number(process.env.PORT || 3000) }, (info) => {
  // biome-ignore lint/suspicious/noConsole: Log server info
  console.info(`Server is running on ${info.address}:${info.port}`);
});
