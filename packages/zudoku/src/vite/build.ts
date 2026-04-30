import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as esbuild } from "esbuild";
import { createBuilder, type Rolldown } from "vite";
import { ZuploEnv } from "../app/env.js";
import { getZudokuRootDir } from "../cli/common/package-json.js";
import { type ConfigWithMeta, loadZudokuConfig } from "../config/loader.js";
import { getIssuer } from "../lib/auth/issuer.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getViteConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { writeOutput } from "./output.js";
import { prerender } from "./prerender/prerender.js";
import {
  assertNoProtectedLeaks,
  moveProtectedChunks,
  warnUnmatchedProtectedPatterns,
} from "./protected/build.js";

const DIST_DIR = "dist";

export type SSRAdapter = "node" | "cloudflare" | "vercel" | "lambda";

export type BuildOptions = {
  dir: string;
  ssr?: boolean;
  adapter?: SSRAdapter;
};

export async function runBuild(options: BuildOptions) {
  const { dir, ssr, adapter = "node" } = options;

  const viteConfig = await getViteConfig(
    dir,
    { mode: "production", command: "build" },
    { adapter },
  );

  const builder = await createBuilder(viteConfig);

  invariant(builder.environments.client, "Client environment is missing");
  invariant(builder.environments.ssr, "SSR environment is missing");

  const distDir = path.resolve(path.join(dir, "dist"));
  await rm(distDir, { recursive: true, force: true });

  const [clientResult, serverResult] = await Promise.all([
    builder.build(builder.environments.client),
    builder.build(builder.environments.ssr),
  ]);

  invariant(
    clientResult && !Array.isArray(clientResult) && "output" in clientResult,
    "Client build failed to produce valid output",
  );

  invariant(
    serverResult && !Array.isArray(serverResult) && "output" in serverResult,
    "SSR build failed to produce valid output",
  );

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
    // Cloudflare Workers and Vercel Edge runtimes don't have a filesystem
    // static server we can plug into protectedAssets, so /_protected/*
    // chunks would 404 instead of being auth-gated. Fail closed until we
    // ship adapter-specific implementations.
    const ADAPTERS_WITH_PROTECTED_GATE: SSRAdapter[] = ["node", "lambda"];
    if (
      config.protectedRoutes &&
      !ADAPTERS_WITH_PROTECTED_GATE.includes(adapter)
    ) {
      throw new Error(
        `protectedRoutes is configured but the "${adapter}" SSR adapter does ` +
          `not yet support gating /_protected chunks. Supported adapters: ` +
          `${ADAPTERS_WITH_PROTECTED_GATE.join(", ")}. Either remove ` +
          `protectedRoutes or switch adapters.`,
      );
    }
    // SSR: bundle entry.js and remove index.html
    await bundleSSREntry({
      dir,
      adapter,
      serverOutDir,
      html,
      basePath: config.basePath,
    });
    assertNoProtectedLeaks(clientResult.output);
    warnUnmatchedProtectedPatterns(config);
    await moveProtectedChunks(clientOutDir, serverOutDir);
    // Mark the output as ESM so runtimes without a surrounding package.json
    // (e.g. unzipped Lambda at /var/task) don't fall back to CommonJS.
    await writeFile(
      path.join(distDir, "package.json"),
      `${JSON.stringify({ type: "module" }, null, 2)}\n`,
      "utf-8",
    );
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
  config: ConfigWithMeta;
  html: string;
  clientOutDir: string;
  serverOutDir: string;
  serverResult: Rolldown.RolldownOutput;
};

const findServerConfigFilename = (result: Rolldown.RolldownOutput) => {
  const entry = result.output.find(
    (o) => o.type === "chunk" && o.isEntry && o.fileName === "zudoku.config.js",
  );
  invariant(entry, "Could not find zudoku.config entry in server build output");

  return entry.fileName;
};

const runPrerender = async (options: PrerenderOptions) => {
  const { dir, config, html, clientOutDir, serverOutDir, serverResult } =
    options;
  const issuer = await getIssuer(config);
  const serverConfigFilename = findServerConfigFilename(serverResult);

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
  adapter: SSRAdapter;
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
      platform: adapter === "node" || adapter === "lambda" ? "node" : "neutral",
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
