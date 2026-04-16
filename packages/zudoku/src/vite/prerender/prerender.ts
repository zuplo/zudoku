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
  // ── Worker scaling strategy ──────────────────────────────────────────
  //
  // Each prerender worker loads the ENTIRE SSR bundle (all OpenAPI specs,
  // React components, etc.) into its own V8 isolate. For large projects
  // this baseline alone can be 2-5 GB per worker.
  //
  // Two problems make naive scaling dangerous:
  //
  // 1. NODE_OPTIONS inheritance: CI environments like CodeBuild set
  //    --max-old-space-size=57344 (57 GB). Worker threads inherit this,
  //    so V8 thinks each worker has 57 GB and doesn't GC aggressively.
  //    Workers lazily grow their heaps until the container OOMs.
  //
  // 2. No swap on Linux containers: On macOS, the OS provides swap to
  //    absorb memory spikes. On CodeBuild/Docker containers there is no
  //    swap — any spike past physical RAM is an instant OOM kill.
  //
  // The fix has two parts:
  //
  // (a) resourceLimits.maxOldGenerationSizeMb on each worker. This is
  //     the ONLY way to override the inherited --max-old-space-size for
  //     worker_threads. It caps V8's heap and, critically, makes V8 GC
  //     aggressively relative to the cap. 4 GB per worker is enough for
  //     even very large projects (tested with 2390 routes, 3.4 MB OAS
  //     specs). Note: this is a hard kill — if a worker exceeds it, the
  //     worker is terminated immediately with ERR_WORKER_OUT_OF_MEMORY.
  //
  // (b) Conservative default worker count. Prerendering is memory-bound,
  //     not CPU-bound — more workers beyond ~8 gives diminishing returns
  //     while increasing memory pressure. We cap the default at 8 and
  //     use 0.5 * CPUs (not 0.8) as the CPU-based heuristic.
  //
  // Tested on CodeBuild XLARGE (72 GB, 36 vCPU):
  //   28 workers → instant OOM
  //   14 workers → OOM at ~1159/2390 routes
  //    7 workers → SUCCESS (2390 routes in 99s)
  //
  // Users can override via `prerender.workers` in their build config.
  // ────────────────────────────────────────────────────────────────────

  // Step 1: Detect actual memory. In containers, os.totalmem() may
  // report the host's memory, not the container's cgroup limit.
  const osTotalMb = Math.floor(os.totalmem() / (1024 * 1024));
  const cgroupMemMb = getContainerMemoryLimitMb();
  const totalMemMb =
    cgroupMemMb !== undefined ? Math.min(cgroupMemMb, osTotalMb) : osTotalMb;

  // Step 2: Reserve memory for the main process (Vite, pagefind, etc.)
  // and OS overhead. Use 25% of total or 2 GB, whichever is larger.
  const reservedMb = Math.max(2048, Math.floor(totalMemMb * 0.25));
  const availableForWorkersMb = totalMemMb - reservedMb;

  // Step 3: Per-worker heap limit. This overrides NODE_OPTIONS and
  // forces V8 to GC aggressively within this budget.
  const PER_WORKER_HEAP_LIMIT_MB = 4096;

  // Step 4: Worker count — the lesser of memory-based, CPU-based, and
  // hard cap. Beyond 8 workers the gains are marginal and memory
  // pressure dominates.
  const MAX_WORKERS = 8;
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
  const maxThreads = buildConfig?.prerender?.workers ?? defaultWorkers;

  // Step 5: Per-worker resource limits. Cap at PER_WORKER_HEAP_LIMIT_MB
  // or the fair share of available memory, whichever is smaller.
  const maxOldGenerationSizeMb = Math.min(
    PER_WORKER_HEAP_LIMIT_MB,
    Math.max(512, Math.floor(availableForWorkersMb / maxThreads)),
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
        `prerendering ${paths.length} routes using ${maxThreads} workers (total: ${totalMemMb} MB${cgroupMemMb !== undefined ? ` [cgroup]` : ""}, available: ${availableForWorkersMb} MB, per-worker limit: ${maxOldGenerationSizeMb} MB)...`,
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
          `pagefind indexing (${done}/${pagesToIndex.length}) ${colors.dim(batch.at(-1)?.url)}`,
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
 * Read the container's cgroup memory limit. Returns undefined when not
 * running inside a cgroup-constrained container (e.g. bare metal / macOS).
 *
 * Tries cgroup v2 first (`/sys/fs/cgroup/memory.max`), then falls back to
 * cgroup v1 (`/sys/fs/cgroup/memory/memory.limit_in_bytes`). A value of
 * "max" or a number larger than 2^50 (~1 PB) means "no limit" — treated
 * the same as not running in a container.
 */
function getContainerMemoryLimitMb(): number | undefined {
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
    } catch {
      // File doesn't exist — try next path
    }
  }
  return undefined;
}
