import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as esbuild } from "esbuild";
import { createBuilder } from "vite";
import { ZuploEnv } from "../app/env.js";
import { getZudokuRootDir } from "../cli/common/package-json.js";
import {
  findOutputPathOfServerConfig,
  loadZudokuConfig,
} from "../config/loader.js";
import { getIssuer } from "../lib/auth/issuer.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getViteConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { writeOutput } from "./output.js";
import { prerender } from "./prerender/prerender.js";

const DIST_DIR = "dist";

export type BuildOptions = {
  dir: string;
  ssr?: boolean;
  adapter?: "node" | "cloudflare" | "vercel";
};

export async function runBuild(options: BuildOptions) {
  const { dir, ssr, adapter = "node" } = options;

  const viteConfig = await getViteConfig(dir, {
    mode: "production",
    command: "build",
  });

  const builder = await createBuilder(viteConfig);

  invariant(builder.environments.client, "Client environment is missing");
  invariant(builder.environments.ssr, "SSR environment is missing");

  const [clientResult, serverResult] = await Promise.all([
    builder.build(builder.environments.client),
    builder.build(builder.environments.ssr),
  ]);

  invariant(
    clientResult && !Array.isArray(clientResult) && "output" in clientResult,
    "Client build failed to produce valid output",
  );
  invariant(serverResult, "SSR build failed to produce valid output");

  const { config } = await loadZudokuConfig(
    { mode: "production", command: "build" },
    dir,
  );

  const base = viteConfig.base ?? "/";
  const clientOutDir = viteConfig.environments?.client?.build?.outDir;
  const serverOutDir = viteConfig.environments?.ssr?.build?.outDir;

  invariant(clientOutDir, "Client build outDir is missing");
  invariant(serverOutDir, "Server build outDir is missing");

  const jsEntry = clientResult.output.find(
    (o) => "isEntry" in o && o.isEntry,
  )?.fileName;
  const cssEntries = clientResult.output
    .filter((o) => o.fileName.endsWith(".css"))
    .map((o) => o.fileName);

  if (!jsEntry || cssEntries.length === 0) {
    throw new Error("Build failed. No js or css assets found");
  }

  const html = getBuildHtml({
    jsEntry: joinUrl(base, jsEntry),
    cssEntries: cssEntries.map((css) => joinUrl(base, css)),
    dir: config.site?.dir,
  });

  if (ssr) {
    // SSR: bundle entry.js and remove index.html
    await bundleSSREntry({
      dir,
      adapter,
      serverOutDir,
      html,
      basePath: config.basePath,
    });
    await rm(path.join(clientOutDir, "index.html"), { force: true });
  } else {
    // SSG: prerender and clean up server
    await runPrerender({
      dir,
      config,
      html,
      clientOutDir,
      serverOutDir,
      serverResult,
    });
  }
}

type PrerenderOptions = {
  dir: string;
  config: Awaited<ReturnType<typeof loadZudokuConfig>>["config"];
  html: string;
  clientOutDir: string;
  serverOutDir: string;
  serverResult: Awaited<ReturnType<typeof import("vite").build>>;
};

const runPrerender = async (options: PrerenderOptions) => {
  const { dir, config, html, clientOutDir, serverOutDir, serverResult } =
    options;
  const issuer = await getIssuer(config);
  const serverConfigFilename = findOutputPathOfServerConfig(serverResult);

  try {
    const { workerResults, rewrites } = await prerender({
      html,
      dir,
      basePath: config.basePath,
      serverConfigFilename,
      writeRedirects: process.env.VERCEL === undefined,
    });

    const indexHtml = path.join(clientOutDir, "index.html");
    if (!workerResults.find((r) => r.outputPath === indexHtml)) {
      await writeFile(indexHtml, html, "utf-8");
    }

    // Move status pages (400, 404, 500) to root path
    const statusPages = workerResults.flatMap((r) =>
      /^(400|404|500)\.html$/.test(path.basename(r.outputPath))
        ? r.outputPath
        : [],
    );
    for (const statusPage of statusPages) {
      await rename(
        statusPage,
        path.join(dir, DIST_DIR, path.basename(statusPage)),
      );
    }

    // Delete server build - not needed after prerender
    await rm(serverOutDir, { recursive: true, force: true });

    if (process.env.VERCEL) {
      await mkdir(path.join(dir, ".vercel/output/static"), { recursive: true });
      await rename(
        path.join(dir, DIST_DIR),
        path.join(dir, ".vercel/output/static"),
      );
    }

    await writeOutput(dir, {
      config,
      redirects: workerResults.flatMap((r) => r.redirect ?? []),
      rewrites,
    });

    if (ZuploEnv.isZuplo && issuer) {
      const provider = config.authentication?.type;

      await writeFile(
        path.join(dir, DIST_DIR, ".output/zuplo.json"),
        JSON.stringify({ issuer, provider }, null, 2),
        "utf-8",
      );
    }
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.error(e);
    throw e;
  }
};

type SSREntryOptions = {
  dir: string;
  adapter: "node" | "cloudflare" | "vercel";
  serverOutDir: string;
  html: string;
  basePath?: string;
};

const bundleSSREntry = async (options: SSREntryOptions) => {
  const { dir, adapter, serverOutDir, html, basePath } = options;
  const tempEntryPath = path.join(dir, "__ssr-entry.ts");

  const packageRoot = getZudokuRootDir();

  const templateContent = await readFile(
    path.join(packageRoot, "src/vite/ssr-templates", `${adapter}.ts`),
    "utf-8",
  );

  const entryContent = templateContent
    .replace('"__TEMPLATE__"', JSON.stringify(html))
    .replace(
      '"__BASE_PATH__"',
      basePath ? JSON.stringify(basePath) : "undefined",
    );

  await writeFile(tempEntryPath, entryContent, "utf-8");

  try {
    await esbuild({
      entryPoints: [tempEntryPath],
      bundle: true,
      platform: adapter === "node" ? "node" : "neutral",
      target: "es2022",
      format: "esm",
      outfile: path.join(serverOutDir, "entry.js"),
      external: ["./entry.server.js", "./zudoku.config.js"],
      nodePaths: [path.join(packageRoot, "node_modules")],
      banner: { js: "// Bundled SSR entry" },
    });
  } finally {
    await rm(tempEntryPath, { force: true });
  }
};
