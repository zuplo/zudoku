import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as esbuild, type Plugin } from "esbuild";
import type { Rollup } from "vite";
import { build as viteBuild } from "vite";
import { ZuploEnv } from "../app/env.js";
import {
  findOutputPathOfServerConfig,
  loadZudokuConfig,
} from "../config/loader.js";
import { getIssuer } from "../lib/auth/issuer.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getViteConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { writeOutput, writeVercelSSROutput } from "./output.js";
import { prerender } from "./prerender/prerender.js";

const DIST_DIR = "dist";

const extractAssets = (result: Rollup.RollupOutput) => {
  const jsEntry = result.output.find(
    (o) => "isEntry" in o && o.isEntry,
  )?.fileName;
  const cssEntries = result.output
    .filter((o) => o.fileName.endsWith(".css"))
    .map((o) => o.fileName);

  if (!jsEntry || cssEntries.length === 0) {
    throw new Error("Build failed. No js or css assets found");
  }

  return { jsEntry, cssEntries };
};

export type BuildOptions = {
  dir: string;
  ssr?: boolean;
  adapter?: "node" | "cloudflare" | "vercel";
};

export async function runBuild(options: BuildOptions) {
  const { dir, ssr, adapter = "node" } = options;

  // Build client and server bundles
  const viteClientConfig = await getViteConfig(dir, {
    mode: "production",
    command: "build",
  });
  const viteServerConfig = await getViteConfig(dir, {
    mode: "production",
    command: "build",
    isSsrBuild: true,
  });

  const clientResult = await viteBuild(viteClientConfig);
  const serverResult = await viteBuild({
    ...viteServerConfig,
    logLevel: "silent",
  });

  if (Array.isArray(clientResult) || !("output" in clientResult)) {
    throw new Error("Client build failed");
  }
  if (Array.isArray(serverResult) || !("output" in serverResult)) {
    throw new Error("Server build failed");
  }

  const { config } = await loadZudokuConfig(
    { mode: "production", command: "build" },
    dir,
  );

  const { jsEntry, cssEntries } = extractAssets(clientResult);

  const html = getBuildHtml({
    jsEntry: joinUrl(viteClientConfig.base, jsEntry),
    cssEntries: cssEntries.map((css) => joinUrl(viteClientConfig.base, css)),
    dir: config.site?.dir,
  });

  invariant(viteClientConfig.build?.outDir, "Client build outDir is missing");
  invariant(viteServerConfig.build?.outDir, "Server build outDir is missing");

  const clientOutDir = viteClientConfig.build.outDir;
  const serverOutDir = viteServerConfig.build.outDir;

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

    // For Vercel SSR, generate Build Output API config
    if (adapter === "vercel") {
      await writeVercelSSROutput(dir, serverOutDir);
    }
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
  serverResult: Rollup.RollupOutput;
};

const runPrerender = async (options: PrerenderOptions) => {
  const { dir, config, html, clientOutDir, serverOutDir, serverResult } =
    options;
  const issuer = await getIssuer(config);
  const serverConfigFilename = findOutputPathOfServerConfig(serverResult);

  try {
    const results = await prerender({
      html,
      dir,
      basePath: config.basePath,
      serverConfigFilename,
      writeRedirects: process.env.VERCEL === undefined,
    });

    const indexHtml = path.join(clientOutDir, "index.html");
    if (!results.find((r) => r.outputPath === indexHtml)) {
      await writeFile(indexHtml, html, "utf-8");
    }

    // Move status pages (400, 404, 500) to root path
    const statusPages = results.flatMap((r) =>
      /400|404|500\.html$/.test(r.outputPath) ? r.outputPath : [],
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
      redirects: results.flatMap((r) => r.redirect ?? []),
    });

    if (ZuploEnv.isZuplo && issuer) {
      await writeFile(
        path.join(dir, DIST_DIR, ".output/zuplo.json"),
        JSON.stringify({ issuer }, null, 2),
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
  const tempEntryPath = path.join(dir, "__ssr-entry.js");

  const templateContent = await readFile(
    new URL(`./ssr-templates/${adapter}.js`, import.meta.url),
    "utf-8",
  );

  const entryContent = templateContent
    .replace('"__TEMPLATE__"', JSON.stringify(html))
    .replace(
      '"__BASE_PATH__"',
      basePath ? JSON.stringify(basePath) : "undefined",
    );

  await writeFile(tempEntryPath, entryContent, "utf-8");

  const zudokuResolvePlugin: Plugin = {
    name: "zudoku-resolve",
    setup(build) {
      build.onResolve({ filter: /^(hono|@hono\/.*)$/ }, (args) => ({
        path: new URL(import.meta.resolve(args.path, import.meta.url)).pathname,
      }));
    },
  };

  try {
    await esbuild({
      entryPoints: [tempEntryPath],
      bundle: true,
      platform: adapter === "node" ? "node" : "neutral",
      target: "es2022",
      format: "esm",
      outfile: path.join(serverOutDir, "entry.js"),
      external: ["./entry.server.js", "./zudoku.config.js"],
      plugins: [zudokuResolvePlugin],
      banner: { js: "// Bundled SSR entry" },
    });
  } finally {
    await rm(tempEntryPath, { force: true });
  }
};
