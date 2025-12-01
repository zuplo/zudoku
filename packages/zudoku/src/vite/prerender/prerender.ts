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
import type { ZudokuConfig } from "../../config/validators/validate.js";
import invariant from "../../lib/util/invariant.js";
import type { MarkdownFileInfo } from "../plugin-markdown-export.js";
import { isTTY, throttle, writeLine } from "../reporter.js";
import { generateSitemap } from "../sitemap.js";
import { routesToPaths } from "./utils.js";
import type { StaticWorkerData, WorkerData } from "./worker.js";

const Piscina = PiscinaImport as unknown as typeof PiscinaImport.default;

export type WorkerResult = {
  outputPath: string;
  html: string;
  redirect?: { from: string; to: string };
};

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

  const config: ZudokuConfig = await import(serverConfigPath).then(
    (m) => m.default,
  );

  const buildConfig = await getBuildConfig();
  const module = await import(entryServerPath);
  const getRoutes = module.getRoutesByConfig as typeof getRoutesByConfig;

  const routes = getRoutes(config);
  const paths = routesToPaths(routes);
  const maxThreads =
    buildConfig?.prerender?.workers ?? Math.floor(os.cpus().length * 0.8);

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
    maxThreads,
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

      await pagefindIndex?.addHTMLFile({
        url: urlPath,
        content: result.html,
      });

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

  const pagefindWriteResult = await pagefindIndex?.writeFiles({
    outputPath: path.join(distDir, "pagefind"),
  });

  const seconds = ((performance.now() - start) / 1000).toFixed(1);

  const message = `✓ finished prerendering ${paths.length} routes in ${seconds} seconds using ${maxThreads} workers`;

  if (isTTY()) {
    writeLine(colors.blue(`${message}\n`));
  } else {
    logger.info(colors.blue(message));
  }
  if (pagefindWriteResult?.outputPath) {
    logger.info(
      colors.blue(`✓ pagefind index built: ${pagefindWriteResult.outputPath}`),
    );
  }

  await generateSitemap({
    basePath: config.basePath,
    outputUrls: paths,
    config: config.sitemap,
    baseOutputDir: distDir,
  });

  // Generate llms.txt files if markdown export is enabled
  if (config.docs) {
    const { DocsConfigSchema } = await import(
      "../../config/validators/validate.js"
    );
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
        workerResults,
      });
    }

    if (!docsConfig.publishMarkdown) {
      await Promise.all(
        markdownFileInfos.map((info) => rm(info.filePath).catch(() => {})),
      );
    }
  }

  return workerResults;
};
