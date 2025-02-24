import express, { type Express } from "express";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";
import fs from "node:fs/promises";
import http, { type Server } from "node:http";
import https from "node:https";
import path from "node:path";
import {
  createServer as createViteServer,
  isRunnableDevEnvironment,
  type ViteDevServer,
} from "vite";
import { type render as serverRender } from "../app/entry.server.js";
import { logger } from "../cli/common/logger.js";
import { printDiagnosticsToConsole } from "../cli/common/output.js";
import { findAvailablePort } from "../cli/common/utils/ports.js";
import type { LoadedConfig } from "../config/config.js";
import { createGraphQLServer } from "../lib/oas/graphql/index.js";
import {
  getAppClientEntryPath,
  getAppServerEntryPath,
  getViteConfig,
  loadZudokuConfig,
  type ZudokuConfigEnv,
} from "./config.js";
import { errorMiddleware } from "./error-handler.js";
import { getDevHtml } from "./html.js";

const DEFAULT_DEV_PORT = 3000;

export class DevServer {
  private currentConfig: LoadedConfig | undefined;
  private terminator: HttpTerminator | undefined;
  public resolvedPort = 0;
  public protocol = "http";

  constructor(
    private options: {
      dir: string;
      ssr?: boolean;
      open?: boolean;
      argPort?: number;
    },
  ) {}

  private async createNodeServer(
    app: Express,
    config: LoadedConfig,
  ): Promise<Server> {
    if (!config.https) return http.createServer(app);

    this.protocol = "https";
    const { dir } = this.options;

    const [key, cert, ca] = await Promise.all([
      fs.readFile(path.resolve(dir, config.https.key)),
      fs.readFile(path.resolve(dir, config.https.cert)),
      config.https.ca
        ? fs.readFile(path.resolve(dir, config.https.ca))
        : undefined,
    ]);

    return https.createServer({ key, cert, ca }, app);
  }

  async start(): Promise<{ vite: ViteDevServer; express: Express }> {
    const app = express();

    const configEnv: ZudokuConfigEnv = {
      mode: "development",
      command: "serve",
      isSsrBuild: this.options.ssr,
    };
    const viteConfig = await getViteConfig(
      this.options.dir,
      configEnv,
      (zudokuConfig) => (this.currentConfig = zudokuConfig),
    );

    const { config } = await loadZudokuConfig(configEnv, this.options.dir);
    this.currentConfig = config;

    this.resolvedPort = await findAvailablePort(
      this.options.argPort ?? config.port ?? DEFAULT_DEV_PORT,
    );

    const server = await this.createNodeServer(app, config);

    viteConfig.server = {
      ...viteConfig.server,
      open: this.options.open,
      hmr: { server },
    };

    const vite = await createViteServer(viteConfig);

    const graphql = createGraphQLServer({
      graphqlEndpoint: "/__z/graphql",
    });

    const proxiedEntryClientPath = path.posix.join(
      vite.config.base,
      "/__z/entry.client.tsx",
    );

    app.use((req, res, next) => {
      const base = this.currentConfig?.basePath;
      if (
        req.method.toLowerCase() === "get" &&
        req.url === "/" &&
        base &&
        base !== "/"
      ) {
        return res.redirect(307, base);
      }
      next();
    });

    app.use(graphql.graphqlEndpoint, graphql);
    app.use(proxiedEntryClientPath, async (_req, res) => {
      const transformed = await vite.environments.client.transformRequest(
        getAppClientEntryPath(),
      );
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

      const ssrEnvironment = vite.environments.ssr;

      if (!isRunnableDevEnvironment(ssrEnvironment)) {
        throw new Error("Server-side rendering is not enabled");
      }

      try {
        const rawHtml = getDevHtml("/__z/entry.client.tsx");
        const template = await vite.transformIndexHtml(url, rawHtml);

        if (this.options.ssr) {
          if (!this.currentConfig) {
            throw new Error("Error loading configuration.");
          }

          const module = await ssrEnvironment.runner.import(
            getAppServerEntryPath(),
          );
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

    await new Promise<void>((resolve) => {
      server.listen(this.resolvedPort, () => resolve());
    });

    this.terminator = createHttpTerminator({ server });

    return { vite, express: app };
  }

  async stop() {
    await this.terminator?.terminate();
  }
}
