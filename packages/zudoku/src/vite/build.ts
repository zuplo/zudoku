import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createBuilder } from "vite";
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
import { writeOutput } from "./output.js";
import { prerender } from "./prerender/prerender.js";

const DIST_DIR = "dist";

export async function runBuild(options: { dir: string }) {
  const viteConfig = await getViteConfig(options.dir, {
    mode: "production",
    command: "build",
  });

  const builder = await createBuilder(viteConfig);

  invariant(builder.environments.client, "Client environment is missing");
  invariant(builder.environments.ssr, "SSR environment is missing");

  const clientResult = await builder.build(builder.environments.client);
  const serverResult = await builder.build(builder.environments.ssr);

  invariant(
    clientResult && !Array.isArray(clientResult),
    "Client build failed to produce valid output",
  );
  invariant(serverResult, "SSR build failed to produce valid output");

  const { config } = await loadZudokuConfig(
    { mode: "production", command: "build" },
    options.dir,
  );

  const issuer = await getIssuer(config);

  const base = viteConfig.base ?? "/";
  const clientOutDir = viteConfig.environments?.client?.build?.outDir;
  const serverOutDir = viteConfig.environments?.ssr?.build?.outDir;

  invariant(clientOutDir, "Client build outDir is missing");
  invariant(serverOutDir, "Server build outDir is missing");

  if (!("output" in clientResult)) {
    throw new Error("Client build output is missing");
  }

  const [jsEntry, cssEntries] = [
    clientResult.output.find((o) => "isEntry" in o && o.isEntry)?.fileName,
    clientResult.output
      .filter((o) => o.fileName.endsWith(".css"))
      .map((o) => o.fileName),
  ];

  if (!jsEntry || cssEntries.length === 0) {
    throw new Error("Build failed. No js or css assets found");
  }

  const html = getBuildHtml({
    jsEntry: joinUrl(base, jsEntry),
    cssEntries: cssEntries.map((css) => joinUrl(base, css)),
    dir: config.site?.dir,
  });

  const serverConfigFilename = findOutputPathOfServerConfig(serverResult);

  try {
    const results = await prerender({
      html,
      dir: options.dir,
      basePath: config.basePath,
      serverConfigFilename,
      writeRedirects: process.env.VERCEL === undefined,
    });

    const indexHtml = path.join(clientOutDir, "index.html");

    if (!results.find((r) => r.outputPath === indexHtml)) {
      await writeFile(indexHtml, html, "utf-8");
    }

    // find 400.html, 404.html, 500.html
    const statusPages = results.flatMap((r) =>
      /400|404|500\.html$/.test(r.outputPath) ? r.outputPath : [],
    );

    // move status pages to root path (i.e. without base path)
    for (const statusPage of statusPages) {
      await rename(
        statusPage,
        path.join(options.dir, DIST_DIR, path.basename(statusPage)),
      );
    }

    // Delete the server build output directory because we don't need it anymore
    await rm(serverOutDir, { recursive: true, force: true });

    if (process.env.VERCEL) {
      await mkdir(path.join(options.dir, ".vercel/output/static"), {
        recursive: true,
      });
      await rename(
        path.join(options.dir, DIST_DIR),
        path.join(options.dir, ".vercel/output/static"),
      );
    }

    // Write the build output file
    await writeOutput(options.dir, {
      config,
      redirects: results.flatMap((r) => r.redirect ?? []),
    });

    if (ZuploEnv.isZuplo && issuer) {
      await writeFile(
        path.join(options.dir, DIST_DIR, ".output/zuplo.json"),
        JSON.stringify({ issuer }, null, 2),
        "utf-8",
      );
    }
  } catch (e) {
    // dynamic imports in prerender swallow the stack trace, so we log it here
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.error(e);
    throw e;
  }
}
