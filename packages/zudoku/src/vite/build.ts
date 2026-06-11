import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as esbuild } from "esbuild";
import { createBuilder } from "vite";
import { ZuploEnv } from "../app/env.js";
import { getZudokuRootDir } from "../cli/common/package-json.js";
import { type ConfigWithMeta, loadZudokuConfig } from "../config/loader.js";
import { getIssuer } from "../lib/auth/issuer.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getViteConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { writeManifest } from "./manifest.js";
import { writeOutput } from "./output.js";
import { prerender } from "./prerender/prerender.js";
import {
  assertCloudflareWranglerGatesProtected,
  assertNoProtectedLeaks,
  moveProtectedChunks,
  assertProtectedPatternsCovered,
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
    { adapter, ssr },
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
    // SSR: bundle entry.js and remove index.html
    await bundleSSREntry({
      dir,
      adapter,
      serverOutDir,
      html,
    });
    assertProtectedPatternsCovered(config);
    assertNoProtectedLeaks(clientResult.output);
    // On Cloudflare, protected chunks stay public (gate uses env.ASSETS.fetch).
    // wrangler.toml must set run_worker_first for /_protected/*.
    if (adapter !== "cloudflare") {
      await moveProtectedChunks(clientOutDir, serverOutDir);
    } else {
      await assertCloudflareWranglerGatesProtected(dir, config);
    }

    // Mark the output as ESM so runtimes without a surrounding package.json
    // (e.g. unzipped Lambda at /var/task) don't fall back to CommonJS.
    await writeFile(
      path.join(distDir, "package.json"),
      `${JSON.stringify({ type: "module" }, null, 2)}\n`,
      "utf-8",
    );
    await writeManifest(distDir, config);
    await rm(path.join(clientOutDir, "index.html"), { force: true });
  } else {
    // SSG: prerender and clean up server
    await runPrerender({
      dir,
      config,
      html,
      clientOutDir,
      serverOutDir,
    });
  }
}

type PrerenderOptions = {
  dir: string;
  config: ConfigWithMeta;
  html: string;
  clientOutDir: string;
  serverOutDir: string;
};

const runPrerender = async (options: PrerenderOptions) => {
  const { dir, config, html, clientOutDir, serverOutDir } = options;
  const issuer = await getIssuer(config);

  try {
    const { workerResults, rewrites } = await prerender({
      html,
      dir,
      basePath: config.basePath,
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
};

const findUserEntry = (dir: string) => {
  for (const ext of ["ts", "tsx", "js", "mjs"]) {
    const candidate = path.join(dir, `zudoku.server.${ext}`);
    if (existsSync(candidate)) return candidate;
  }
};

const bundleSSREntry = async (options: SSREntryOptions) => {
  const { dir, adapter, serverOutDir, html } = options;

  const packageRoot = getZudokuRootDir();
  const userEntry = findUserEntry(dir);

  let entryPoint = userEntry;
  let tempEntryPath: string | undefined;

  if (!entryPoint) {
    tempEntryPath = path.join(dir, "__ssr-entry.ts");
    const templateContent = await readFile(
      path.join(packageRoot, "src/vite/ssr-templates", `${adapter}.ts`),
      "utf-8",
    );
    await writeFile(tempEntryPath, templateContent, "utf-8");
    entryPoint = tempEntryPath;
  }

  const frameworkPath = path.join(serverOutDir, "entry.server.js");

  try {
    await esbuild({
      entryPoints: [entryPoint],
      bundle: true,
      platform: ["node", "lambda"].includes(adapter) ? "node" : "neutral",
      target: "es2022",
      format: "esm",
      outfile: path.join(serverOutDir, "entry.js"),
      external: ["./zudoku.config.js"],
      nodePaths: [path.join(packageRoot, "node_modules")],
      banner: { js: "// Bundled SSR entry" },
      define: {
        __ZUDOKU_TEMPLATE__: JSON.stringify(html),
      },
      plugins: [
        {
          name: "zudoku-ssr-entry",
          setup(build) {
            // Point at the Vite-pre-built framework (virtual modules
            // already resolved) so esbuild's `define` can reach into it.
            build.onResolve({ filter: /^zudoku\/server$/ }, () => ({
              path: frameworkPath,
            }));
          },
        },
      ],
    });
    // Framework is inlined into entry.js; drop the standalone Vite SSR output.
    await Promise.all([
      rm(frameworkPath, { force: true }),
      rm(`${frameworkPath}.map`, { force: true }),
      rm(path.join(serverOutDir, "assets"), {
        recursive: true,
        force: true,
      }),
    ]);
  } finally {
    if (tempEntryPath) await rm(tempEntryPath, { force: true });
  }
};
