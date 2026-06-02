import { readFileSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createIndex, type PagefindIndex } from "pagefind";
import colors from "picocolors";
import PiscinaImport from "piscina";
import type { getRoutesByConfig } from "../../app/main.js";
import { logger } from "../../cli/common/logger.js";
import { fileExists } from "../../config/file-exists.js";
import { getBuildConfig } from "../../config/validators/BuildSchema.js";
import type { ZudokuConfig } from "../../config/validators/ZudokuConfig.js";
import { runPluginTransformConfig } from "../../lib/core/transform-config.js";
import invariant from "../../lib/util/invariant.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import {
  getMarkdownOutputPath,
  type MarkdownFileInfo,
} from "../plugin-markdown-export.js";
import { isTTY, throttle, writeLine } from "../reporter.js";
import { generateSitemap } from "../sitemap.js";
import { routesToPaths, routesToRewrites } from "./utils.js";
import type { StaticWorkerData, WorkerData } from "./worker.js";

const Piscina = PiscinaImport as unknown as typeof PiscinaImport.default;

export type WorkerResult = {
  outputPath: string;
  html: string;
  statusCode: number;
  redirect?: { from: string; to: string };
};

export const getRedirectUrls = (
  workerResults: WorkerResult[],
  basePath: string | undefined,
): Set<string> =>
  new Set(
    workerResults.flatMap((r) => {
      if (!r.redirect) return [];
      const from = r.redirect.from;
      return [
        basePath && from.startsWith(basePath)
          ? from.slice(basePath.length) || "/"
          : from,
      ];
    }),
  );

export const prerender = async ({
  html,
  dir,
  basePath = "",
  serverConfigFilename,
  writeRedirects = true,
}: {
  html: string;
  dir: string;
  basePath?: string;
  serverConfigFilename: string;
  writeRedirects: boolean;
}) => {
  const distDir = path.join(dir, "dist", basePath);
  const serverConfigPath = pathToFileURL(
    path.join(distDir, "server", serverConfigFilename),
  ).href;
  const entryServerPath = pathToFileURL(
    path.join(distDir, "server/entry.server.js"),
  ).href;

  const rawConfig: ZudokuConfig = await import(serverConfigPath).then(
    (m) => m.default,
  );
  const config = await runPluginTransformConfig(rawConfig);

  const buildConfig = await getBuildConfig();
  const module = await import(entryServerPath);
  const getRoutes = module.getRoutesByConfig as typeof getRoutesByConfig;

  const routes = getRoutes(config);
  const paths = routesToPaths(routes);
  const rewrites = routesToRewrites(routes);

  // Add redirect source paths so they get prerendered as redirects
  if (config.redirects) {
    for (const r of config.redirects) {
      paths.push(joinUrl(r.from));
    }
  }
  const { maxThreads, maxOldGenerationSizeMb } = getWorkerScaling(
    buildConfig?.prerender?.workers,
  );

  const start = performance.now();
  const LOG_INTERVAL_MS = 30_000; // Log every 30 seconds
  let lastLogTime = start;

  const writeProgress = throttle(
    (count: number, total: number, urlPath: string) => {
      writeLine(`prerendering (${count}/${total}) ${colors.dim(urlPath)}`);
    },
  );

  if (!isTTY()) {
    logger.info(
      colors.dim(
        `prerendering ${paths.length} routes using ${maxThreads} workers...`,
      ),
    );
  }

  let completedCount = 0;
  let pagefindIndex: PagefindIndex | undefined;

  if (config.search?.type === "pagefind") {
    const { index, errors } = await createIndex();
    invariant(
      index,
      `Failed to create pagefind index: ${JSON.stringify(errors)}`,
    );
    pagefindIndex = index;
  }

  const pool = new Piscina<WorkerData, WorkerResult>({
    filename: new URL("./worker.js", import.meta.url).href,
    idleTimeout: 5_000,
    minThreads: 1,
    maxThreads,
    resourceLimits: {
      maxOldGenerationSizeMb,
    },
    execArgv: ["--no-deprecation"],
    workerData: {
      template: html,
      distDir,
      serverConfigPath,
      entryServerPath,
      writeRedirects,
    } satisfies StaticWorkerData,
  });

  const workerResults = await Promise.all(
    paths.map(async (urlPath) => {
      const result = await pool.run({ urlPath } satisfies WorkerData);

      completedCount++;

      if (isTTY()) {
        writeProgress(completedCount, paths.length, urlPath);
      } else {
        const now = performance.now();
        if (now - lastLogTime >= LOG_INTERVAL_MS) {
          logger.info(
            colors.blue(
              `prerendered ${completedCount}/${paths.length} routes using ${maxThreads} workers`,
            ),
          );
          lastLogTime = now;
        }
      }
      return result;
    }),
  );

  const seconds = ((performance.now() - start) / 1000).toFixed(1);

  const message = `✓ finished prerendering ${paths.length} routes in ${seconds} seconds using ${maxThreads} workers`;

  if (isTTY()) {
    writeLine(colors.blue(`${message}\n`));
  } else {
    logger.info(colors.blue(message));
  }

  if (pagefindIndex) {
    const pagesToIndex = workerResults.flatMap(({ statusCode, html }, i) =>
      statusCode < 400 ? { url: paths[i], html } : [],
    );
    // Batch size caps concurrent IPC writes to the pagefind child process;
    // higher values can overflow its pipe buffer and trigger ENOBUFS.
    const BATCH_SIZE = 40;
    const pagefindStart = performance.now();

    for (let offset = 0; offset < pagesToIndex.length; offset += BATCH_SIZE) {
      const batch = pagesToIndex.slice(offset, offset + BATCH_SIZE);
      await Promise.all(
        batch.map(({ url, html }) =>
          pagefindIndex.addHTMLFile({ url, content: html }),
        ),
      );
      if (isTTY()) {
        const done = offset + batch.length;
        writeLine(
          `pagefind indexing (${done}/${pagesToIndex.length}) ${colors.dim(batch.at(-1)?.url ?? "")}`,
        );
      }
    }

    if (isTTY()) writeLine("");

    const { outputPath } = await pagefindIndex.writeFiles({
      outputPath: path.join(distDir, "pagefind"),
    });

    if (outputPath) {
      const duration = (performance.now() - pagefindStart) / 1000;
      logger.info(
        colors.blue(
          `✓ pagefind index built in ${duration.toFixed(1)} seconds: ${outputPath}`,
        ),
      );
    }
  }

  const redirectUrls = getRedirectUrls(workerResults, config.basePath);

  await generateSitemap({
    basePath: config.basePath,
    outputUrls: paths,
    config: config.sitemap,
    baseOutputDir: distDir,
    redirectUrls,
  });

  // Generate llms.txt files if markdown export is enabled
  if (config.docs) {
    const { DocsConfigSchema } =
      await import("../../config/validators/ZudokuConfig.js");
    const { generateLlmsTxtFiles } = await import("../llms.js");

    const docsConfig = DocsConfigSchema.parse(config.docs);
    const llmsConfig = docsConfig.llms ?? {};

    const markdownInfoPath = path.join(
      dir,
      "node_modules/.zudoku/markdown-info.json",
    );
    let markdownFileInfos: MarkdownFileInfo[] = [];

    if (await fileExists(markdownInfoPath)) {
      const markdownInfoContent = await readFile(markdownInfoPath, "utf-8");
      markdownFileInfos = JSON.parse(markdownInfoContent);
    }

    if (llmsConfig.llmsTxt || llmsConfig.llmsTxtFull) {
      await generateLlmsTxtFiles({
        markdownFileInfos,
        basePath: config.basePath,
        outputUrls: paths,
        baseOutputDir: distDir,
        siteName: config.site?.title,
        llmsTxt: llmsConfig.llmsTxt,
        llmsTxtFull: llmsConfig.llmsTxtFull,
        redirectUrls,
      });
    }

    if (!docsConfig.publishMarkdown) {
      await Promise.all(
        markdownFileInfos.map((info) => {
          const outputPath = getMarkdownOutputPath(distDir, info.routePath);
          if (!path.resolve(outputPath).startsWith(path.resolve(distDir))) {
            return;
          }
          return rm(outputPath).catch(() => {});
        }),
      );
    }
  }

  return { workerResults, rewrites };
};

/**
 * Compute worker count and per-worker heap limit for prerendering.
 *
 * Each prerender worker loads the entire SSR bundle (OpenAPI specs, React
 * components) into its own V8 isolate: 2-5 GB baseline for large projects.
 * Two problems make naive scaling dangerous:
 *
 * 1. NODE_OPTIONS inheritance: CI like CodeBuild sets
 *    --max-old-space-size=57344, which worker_threads inherit. V8 thinks
 *    it has 57 GB and doesn't GC aggressively, so workers lazily grow
 *    until the container OOMs.
 * 2. No swap on Linux containers: any spike past physical RAM is an
 *    instant OOM kill (unlike macOS which swaps).
 *
 * Fix: cap each worker's heap via `resourceLimits.maxOldGenerationSizeMb`
 * (the only way to override the inherited NODE_OPTIONS for workers), and
 * pick a conservative worker count. Prerendering is memory-bound, so beyond
 * ~8 workers gains are marginal and memory pressure dominates. Empirically
 * on a 72 GB / 36 vCPU container, worker count must stay near CPU/5 to
 * avoid OOM before completion.
 */
const getWorkerScaling = (
  workersOverride?: number,
): { maxThreads: number; maxOldGenerationSizeMb: number } => {
  const PER_WORKER_HEAP_LIMIT_MB = 4096;
  const MAX_WORKERS = 8;

  // In containers, os.totalmem() may report the host's memory, not the
  // container's cgroup limit. Take the lesser of the two.
  const osTotalMb = Math.floor(os.totalmem() / (1024 * 1024));
  const cgroupMemMb = getContainerMemoryLimitMb();
  const totalMemMb =
    cgroupMemMb !== undefined ? Math.min(cgroupMemMb, osTotalMb) : osTotalMb;

  // Reserve memory for the main process (Vite, pagefind) and OS overhead.
  const reservedMb = Math.max(2048, Math.floor(totalMemMb * 0.25));
  const availableForWorkersMb = totalMemMb - reservedMb;

  const memBasedWorkers = Math.max(
    1,
    Math.floor(availableForWorkersMb / PER_WORKER_HEAP_LIMIT_MB),
  );
  const cpuBasedWorkers = Math.max(1, Math.floor(os.cpus().length * 0.5));
  const defaultWorkers = Math.min(
    memBasedWorkers,
    cpuBasedWorkers,
    MAX_WORKERS,
  );
  const validOverride =
    workersOverride && workersOverride > 0 ? workersOverride : undefined;
  const maxThreads = validOverride ?? defaultWorkers;

  const maxOldGenerationSizeMb = Math.min(
    PER_WORKER_HEAP_LIMIT_MB,
    Math.max(512, Math.floor(availableForWorkersMb / maxThreads)),
  );

  return { maxThreads, maxOldGenerationSizeMb };
};

/**
 * Read the container's cgroup memory limit. Returns undefined when not
 * running inside a cgroup-constrained container (e.g. bare metal / macOS).
 *
 * Tries cgroup v2 first (`/sys/fs/cgroup/memory.max`), then falls back to
 * cgroup v1 (`/sys/fs/cgroup/memory/memory.limit_in_bytes`). cgroup v2 uses
 * the literal string "max" to signal "no limit"; cgroup v1 uses a near-
 * LLONG_MAX value (~9.2e18) instead, so any number above 2^50 (~1 PB) is
 * treated as unlimited.
 */
const getContainerMemoryLimitMb = (): number | undefined => {
  const CGROUP_PATHS = [
    "/sys/fs/cgroup/memory.max", // cgroup v2
    "/sys/fs/cgroup/memory/memory.limit_in_bytes", // cgroup v1
  ];

  for (const filePath of CGROUP_PATHS) {
    try {
      const raw = readFileSync(filePath, "utf8").trim();
      if (raw === "max") return undefined;
      const bytes = Number(raw);
      if (!Number.isFinite(bytes) || bytes > 2 ** 50) return undefined;
      return Math.floor(bytes / (1024 * 1024));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
  return undefined;
};
