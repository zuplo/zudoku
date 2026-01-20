import fs from "node:fs/promises";
import type { Server } from "node:http";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";
import {
  createServer as createViteServer,
  isRunnableDevEnvironment,
  mergeConfig,
  type Plugin,
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
import { getDevHtml } from "./html.js";
import { buildPagefindDevIndex } from "./pagefind-dev-index.js";

const DEFAULT_DEV_PORT = 3000;

type EntryServerImport = typeof import("../app/entry.server.js");

export class DevServer {
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

  private async createNodeServer(config: LoadedConfig): Promise<Server> {
    if (!config.https) return http.createServer();

    this.protocol = "https";
    const { dir } = this.options;

    const [key, cert, ca] = await Promise.all([
      fs.readFile(path.resolve(dir, config.https.key)),
      fs.readFile(path.resolve(dir, config.https.cert)),
      config.https.ca
        ? fs.readFile(path.resolve(dir, config.https.ca))
        : undefined,
    ]);

    return https.createServer({ key, cert, ca });
  }

  async start(): Promise<{ vite: ViteDevServer }> {
    const configEnv: ZudokuConfigEnv = {
      mode: "development",
      command: "serve",
      isSsrBuild: this.options.ssr,
    };
    const viteConfig = await getViteConfig(this.options.dir, configEnv);
    const { config } = await loadZudokuConfig(configEnv, this.options.dir);

    this.resolvedPort = await findAvailablePort(
      this.options.argPort ?? config.port ?? DEFAULT_DEV_PORT,
    );

    const server = await this.createNodeServer(config);

    const vite = await createViteServer(
      mergeConfig(viteConfig, {
        server: { hmr: { server } },
        plugins: [
          {
            name: "zudoku:entry-client",
            configureServer(vite) {
              const entryPath = path.posix.join(
                vite.config.base,
                "/__z/entry.client.tsx",
              );
              vite.middlewares.use(entryPath, async (_req, res) => {
                const transformed =
                  await vite.environments.client.transformRequest(
                    getAppClientEntryPath(),
                  );
                if (!transformed) {
                  res.writeHead(500);
                  res.end("Error transforming client entry");
                  return;
                }
                res.writeHead(200, { "Content-Type": "text/javascript" });
                res.end(transformed.code);
              });
            },
          } satisfies Plugin,
        ],
      }),
    );
    const graphql = createGraphQLServer({ graphqlEndpoint: "/__z/graphql" });

    // Handle base path redirect
    vite.middlewares.use((req, res, next) => {
      if (
        req.method === "GET" &&
        req.url === "/" &&
        config.basePath &&
        config.basePath !== "/"
      ) {
        res.writeHead(307, { Location: config.basePath });
        res.end();
        return;
      }
      next();
    });

    vite.middlewares.use(graphql.graphqlEndpoint, graphql);

    // Pagefind reindex endpoint (SSE)
    vite.middlewares.use("/__z/pagefind-reindex", async (_req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const { config: currentConfig } = await loadZudokuConfig(
        configEnv,
        this.options.dir,
      );

      const sendEvent = (data: unknown) =>
        res.write(`data: ${JSON.stringify(data)}\n\n`);

      if (currentConfig.search?.type !== "pagefind") {
        sendEvent({
          type: "complete",
          success: false,
          indexed: 0,
          error: "Pagefind search is not enabled",
        });
        res.end();
        return;
      }

      try {
        for await (const event of buildPagefindDevIndex(vite, currentConfig)) {
          sendEvent(event);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        sendEvent({
          type: "complete",
          success: false,
          indexed: 0,
          error: message,
        });
      }

      res.end();
    });

    printDiagnosticsToConsole(
      `Server-side rendering ${this.options.ssr ? "enabled" : "disabled"}`,
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

    vite.middlewares.use(async (req, res) => {
      const url = req.originalUrl ?? req.url ?? "/";
      const ssrEnvironment = vite.environments.ssr;

      if (!isRunnableDevEnvironment(ssrEnvironment)) {
        res.writeHead(500);
        res.end("SSR environment not available");
        return;
      }

      try {
        const { config: currentConfig } = await loadZudokuConfig(
          configEnv,
          this.options.dir,
        );
        const rawHtml = getDevHtml({
          jsEntry: "/__z/entry.client.tsx",
          dir: currentConfig.site?.dir,
        });
        const template = await vite.transformIndexHtml(url, rawHtml);

        if (this.options.ssr) {
          const entryServer =
            await ssrEnvironment.runner.import<EntryServerImport>(
              getAppServerEntryPath(),
            );

          const request = new Request(
            `${this.protocol}://${req.headers.host}${url}`,
            {
              method: req.method,
              headers: req.headers as HeadersInit,
            },
          );

          const response = await entryServer.handleRequest({
            template,
            request,
            routes: entryServer.getRoutesByConfig(currentConfig),
            basePath: currentConfig.basePath,
          });

          res.writeHead(response.status, Object.fromEntries(response.headers));
          if (response.body) {
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(template);
        }
      } catch (e) {
        logger.error(e);
        const html = `<!DOCTYPE html><html><body><script type="module">
          import { ErrorOverlay } from '/@vite/client';
          document.body.appendChild(new ErrorOverlay(${JSON.stringify({
            message: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : "",
          })}));
        </script></body></html>`;
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(html);
      }
    });

    server.on("request", vite.middlewares);

    await new Promise<void>((resolve) => {
      server.listen(this.resolvedPort, resolve);
    });

    this.terminator = createHttpTerminator({ server });

    if (this.options.open || process.env.ZUDOKU_OPEN_BROWSER) {
      const url = `${this.protocol}://localhost:${this.resolvedPort}`;
      vite.resolvedUrls = {
        local: [`${url}${vite.config.base || "/"}`],
        network: [],
      };
      vite.openBrowser();
    }

    return { vite };
  }

  async stop() {
    await this.terminator?.terminate();
  }
}
