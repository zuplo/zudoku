import fs from "node:fs/promises";
import http, { type Server } from "node:http";
import https from "node:https";
import path from "node:path";
import express, { type Express } from "express";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";
import {
  createServer as createViteServer,
  isRunnableDevEnvironment,
  type ViteDevServer,
} from "vite";
import { logger } from "../cli/common/logger.js";
import { printDiagnosticsToConsole } from "../cli/common/output.js";
import { findAvailablePort } from "../cli/common/utils/ports.js";
import type { LoadedConfig } from "../config/config.js";
import { loadZudokuConfig } from "../config/loader.js";
import { createGraphQLServer } from "../lib/oas/graphql/index.js";
import {
  getAppClientEntryPath,
  getAppServerEntryPath,
  getViteConfig,
  type ZudokuConfigEnv,
} from "./config.js";
import { errorMiddleware } from "./error-handler.js";
import { getDevHtml } from "./html.js";

type EntryServerImport = typeof import("../app/entry.server.js");
type DevServerOptions = {
  dir: string;
  ssr?: boolean;
  open?: boolean;
  argPort?: number;
};

const DEFAULT_DEV_PORT = 3000;

export class DevServer {
  resolvedPort = 0;
  protocol = "http";
  #terminator: HttpTerminator | undefined;
  #options: DevServerOptions;

  constructor(options: DevServerOptions) {
    this.#options = options;
  }

  private async createNodeServer(
    app: Express,
    config: LoadedConfig,
  ): Promise<Server> {
    if (!config.https) return http.createServer(app);

    this.protocol = "https";
    const { dir } = this.#options;

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
      isSsrBuild: this.#options.ssr,
    };
    const viteConfig = await getViteConfig(this.#options.dir, configEnv);
    const { config } = await loadZudokuConfig(configEnv, this.#options.dir);

    this.resolvedPort = await findAvailablePort(
      this.#options.argPort ?? config.port ?? DEFAULT_DEV_PORT,
    );

    const server = await this.createNodeServer(app, config);

    viteConfig.server = {
      ...viteConfig.server,
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

    app.use(async (req, res, next) => {
      const { config } = await loadZudokuConfig(configEnv, this.#options.dir);
      const base = config.basePath;
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
      `Server-side rendering ${this.#options.ssr ? "enabled" : "disabled"}`,
    );

    if (config.search?.type === "pagefind") {
      const pagefindPath = path.join(
        vite.config.publicDir,
        "pagefind/pagefind.js",
      );
      const exists = await fs.stat(pagefindPath).catch(() => false);

      if (!exists) {
        await fs.mkdir(path.dirname(pagefindPath), { recursive: true });
        await fs.writeFile(pagefindPath, 'throw new Error("NOT_BUILT_YET");');
      }
    }

    app.use(/(.*)/, async (request, response, next) => {
      const url = request.originalUrl;

      const ssrEnvironment = vite.environments.ssr;

      if (!isRunnableDevEnvironment(ssrEnvironment)) {
        throw new Error("Server-side rendering is not enabled");
      }

      try {
        const { config } = await loadZudokuConfig(configEnv, this.#options.dir);
        const rawHtml = getDevHtml({
          jsEntry: "/__z/entry.client.tsx",
          dir: config.site?.dir,
        });
        const template = await vite.transformIndexHtml(url, rawHtml);

        if (this.#options.ssr) {
          const server = await ssrEnvironment.runner.import<EntryServerImport>(
            getAppServerEntryPath(),
          );

          void server.render({
            template,
            request,
            response,
            routes: server.getRoutesByConfig(config),
            basePath: config.basePath,
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

    this.#terminator = createHttpTerminator({ server });

    // Manually set resolved URLs on the Vite server since we're managing the HTTP server
    if (this.#options.open || process.env.ZUDOKU_OPEN_BROWSER) {
      const url = `${this.protocol}://localhost:${this.resolvedPort}`;
      vite.resolvedUrls = {
        local: [`${url}${vite.config.base || "/"}`],
        network: [],
      };
      vite.openBrowser();
    }

    return { vite, express: app };
  }

  async stop() {
    await this.#terminator?.terminate();
  }
}
