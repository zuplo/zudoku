import { writeFile } from "fs/promises";
import { build as viteBuild } from "vite";
import { joinPath } from "../lib/util/joinPath.js";
import { getViteConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { prerender } from "./prerender.js";

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
  await viteBuild(viteServerConfig);

  if (Array.isArray(clientResult)) {
    throw new Error("Build failed");
  }

  if ("output" in clientResult) {
    const jsEntry = clientResult.output.find(
      (o) => "isEntry" in o && o.isEntry,
    )?.fileName;
    const cssEntry = clientResult.output.find((o) =>
      o.fileName.endsWith(".css"),
    )?.fileName;

    if (!jsEntry || !cssEntry) {
      throw new Error("Build failed. No js or css assets found");
    }

    const html = getBuildHtml({
      jsEntry: joinPath(viteClientConfig.base, jsEntry),
      cssEntry: joinPath(viteClientConfig.base, cssEntry),
    });

    try {
      const writtenFiles = await prerender(html, options.dir);

      if (writtenFiles.includes("index.html")) {
        return;
      }

      await writeFile(`${options.dir}/dist/index.html`, html, "utf-8");
    } catch (e) {
      // dynamic imports in prerender swallow the stack trace, so we log it here
      // eslint-disable-next-line no-console
      console.error(e);
    }

    return;
  }

  throw new Error("Build failed");
}
