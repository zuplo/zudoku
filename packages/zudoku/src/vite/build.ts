import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";
import { findOutputPathOfServerConfig } from "../config/loader.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getViteConfig, loadZudokuConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { writeOutput } from "./output.js";
import { prerender } from "./prerender/prerender.js";

const DIST_DIR = "dist";

export async function runBuild(options: { dir: string }) {
  // Shouldn't run in parallel because it's potentially racy
  const viteClientConfig = await getViteConfig(options.dir, {
    mode: "production",
    command: "build",
  });
  const viteServerConfig = await getViteConfig(options.dir, {
    mode: "production",
    command: "build",
    isSsrBuild: true,
  });

  // Don't run in parallel because it might overwrite itself
  const clientResult = await viteBuild(viteClientConfig);
  const serverResult = await viteBuild({
    ...viteServerConfig,
    logLevel: "silent",
  });
  if (Array.isArray(clientResult)) {
    throw new Error("Build failed");
  }

  const { config } = await loadZudokuConfig(
    { mode: "production", command: "build" },
    options.dir,
  );

  if ("output" in clientResult) {
    const [jsEntry, cssEntry] = [
      clientResult.output.find((o) => "isEntry" in o && o.isEntry)?.fileName,
      clientResult.output.find((o) => o.fileName.endsWith(".css"))?.fileName,
    ];

    if (!jsEntry || !cssEntry) {
      throw new Error("Build failed. No js or css assets found");
    }

    const html = getBuildHtml({
      jsEntry: joinUrl(viteClientConfig.base, jsEntry),
      cssEntry: joinUrl(viteClientConfig.base, cssEntry),
    });

    const serverConfigFilename = findOutputPathOfServerConfig(serverResult);

    invariant(viteClientConfig.build?.outDir, "Client build outDir is missing");
    invariant(viteServerConfig.build?.outDir, "Server build outDir is missing");

    try {
      const results = await prerender({
        html,
        dir: options.dir,
        basePath: config.basePath,
        serverConfigFilename,
        writeRedirects: process.env.VERCEL === undefined,
      });

      const indexHtml = path.join(viteClientConfig.build.outDir, "index.html");

      if (!results.find((r) => r.outputPath === indexHtml)) {
        await writeFile(indexHtml, html, "utf-8");
      }

      // Delete the server build output directory because we don't need it anymore
      await rm(viteServerConfig.build.outDir, { recursive: true, force: true });

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
    } catch (e) {
      // dynamic imports in prerender swallow the stack trace, so we log it here
      // eslint-disable-next-line no-console
      console.error(e);
      throw e;
    }

    return;
  }

  throw new Error("Build failed");
}
