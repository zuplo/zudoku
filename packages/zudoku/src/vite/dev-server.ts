import chokidar from "chokidar";
import express from "express";
import { Server } from "node:http";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { type render as serverRender } from "../app/entry.server.js";
import { logger } from "../cli/common/logger.js";
import { printDiagnosticsToConsole } from "../cli/common/output.js";
import type { ZudokuConfig } from "../config/config.js";
import { createGraphQLServer } from "../lib/oas/graphql/index.js";
import {
  getAppClientEntryPath,
  getAppServerEntryPath,
  getViteConfig,
  loadZuploConfig,
  zuploConfigFiles,
} from "./config.js";
import { getDevHtml } from "./html.js";

export class DevServer {
  private server: Server | undefined;
  private currentConfig: ZudokuConfig | undefined;

  constructor(private options: { port: number; dir: string; ssr?: boolean }) {}

  async watch() {
    // Watches files for changes and restarts the server
    const watcher = chokidar.watch(
      zuploConfigFiles.map((filename) => path.join(this.options.dir, filename)),
      {
        persistent: true,
      },
    );

    watcher.on("change", async () => {
      await this.stop();
      await this.start();

      this.currentConfig = await loadZuploConfig(this.options.dir, {
        command: "serve",
        mode: "development",
        forceReload: true,
      });

      printDiagnosticsToConsole(
        `Configuration file changed. Restarted server.`,
      );
    });

    await this.start();
  }

  async start() {
    const app = express();

    const viteConfig = await getViteConfig(this.options.dir, {
      mode: "development",
      command: "serve",
      isSsrBuild: this.options.ssr,
    });

    const vite = await createViteServer(viteConfig);

    this.currentConfig = await loadZuploConfig(this.options.dir, {
      command: "serve",
      mode: "development",
    });

    const graphql = createGraphQLServer({
      graphqlEndpoint: "/__z/graphql",
    });

    app.use(graphql.graphqlEndpoint, graphql);
    app.use(vite.middlewares);
    printDiagnosticsToConsole(
      `Server-side rendering ${this.options.ssr ? "enabled" : "disabled"}`,
    );

    app.use("*", async (request, response) => {
      const url = request.originalUrl;

      try {
        const entryJs = getAppClientEntryPath();
        const rawHtml = getDevHtml(entryJs);
        const template = await vite.transformIndexHtml(url, rawHtml);

        if (this.options.ssr) {
          if (!this.currentConfig) {
            throw new Error("No config loaded");
          }

          const module = await vite.ssrLoadModule(getAppServerEntryPath());
          const render = module.render as typeof serverRender;

          void render({
            template,
            request,
            response,
            config: this.currentConfig,
          });
        } else {
          response
            .status(200)
            .set({ "Content-Type": "text/html" })
            .end(template);
        }
      } catch (e) {
        vite.ssrFixStacktrace(e);
        logger.error(e);
        response.status(500).end(e.message);
      }
    });

    return new Promise<void>((resolve) => {
      this.server = app.listen(this.options.port, resolve);
    });
  }

  async stop() {
    if (this.server) {
      return new Promise<void>((resolve, reject) => {
        this.server!.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}
