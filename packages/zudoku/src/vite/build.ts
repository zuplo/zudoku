import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";
import { findOutputPathOfServerConfig } from "../config/loader.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getViteConfig, loadZudokuConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { writeOutput } from "./output.js";
import { prerender } from "./prerender.js";

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
  const serverResult = await viteBuild(viteServerConfig);
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

    try {
      const writtenFiles = await prerender({
        html,
        dir: options.dir,
        basePath: config.basePath,
        serverConfigFilename,
      });

      if (writtenFiles.includes("index.html")) {
        return;
      }

      await writeFile(
        path.join(options.dir, DIST_DIR, config.basePath ?? "", "index.html"),
        html,
        "utf-8",
      );

      const serverDir = path.join(options.dir, DIST_DIR, "server");
      await rm(serverDir, { recursive: true, force: true });
    } catch (e) {
      // dynamic imports in prerender swallow the stack trace, so we log it here
      // eslint-disable-next-line no-console
      console.error(e);
    }

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
    await writeOutput(options.dir, config);

    return;
  }

  throw new Error("Build failed");
}
