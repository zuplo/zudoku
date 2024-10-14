import express from "express";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { Server } from "node:http";
import { createServer as createViteServer } from "vite";
import { type render as serverRender } from "../app/entry.server.js";
import { logger } from "../cli/common/logger.js";
import { printDiagnosticsToConsole } from "../cli/common/output.js";
import { createGraphQLServer } from "../lib/oas/graphql/index.js";
import {
  getAppClientEntryPath,
  getAppServerEntryPath,
  getViteConfig,
  type LoadedConfig,
  loadZudokuConfig,
} from "./config.js";
import { errorMiddleware } from "./error-handler.js";
import { getDevHtml } from "./html.js";

export class DevServer {
  private server: Server | undefined;
  private currentConfig: LoadedConfig | undefined;
  private terminator: HttpTerminator | undefined;

  constructor(private options: { port: number; dir: string; ssr?: boolean }) {}

  async start() {
    const app = express();

    const viteConfig = await getViteConfig(
      this.options.dir,
      {
        mode: "development",
        command: "serve",
        isSsrBuild: this.options.ssr,
      },
      (zudokuConfig) => (this.currentConfig = zudokuConfig),
    );

    const vite = await createViteServer(viteConfig);

    this.currentConfig = await loadZudokuConfig(this.options.dir);

    const graphql = createGraphQLServer({
      graphqlEndpoint: "/__z/graphql",
    });

    app.use(graphql.graphqlEndpoint, graphql);
    app.use("/__z/entry.client.tsx", async (_req, res, next) => {
      const transformed = await vite.transformRequest(getAppClientEntryPath());
      if (!transformed) throw new Error("Error transforming client entry");

      res
        .status(200)
        .set({ "Content-Type": "text/javascript" })
        .end(transformed.code);
    });
    app.use(vite.middlewares);

    printDiagnosticsToConsole(
      `Server-side rendering ${this.options.ssr ? "enabled" : "disabled"}`,
    );

    app.use("*", async (request, response, next) => {
      const url = request.originalUrl;

      try {
        const rawHtml = getDevHtml("/__z/entry.client.tsx");
        const template = await vite.transformIndexHtml(url, rawHtml);

        if (this.options.ssr) {
          if (!this.currentConfig) {
            throw new Error("Error loading configuration.");
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
        logger.error(e);
        next(e);
      }
    });

    app.use(errorMiddleware(vite));

    return new Promise<void>((resolve) => {
      this.server = app.listen(this.options.port, resolve);
      this.terminator = createHttpTerminator({
        server: this.server,
      });
    });
  }

  async stop() {
    await this.terminator?.terminate();
  }
}
