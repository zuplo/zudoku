import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";
import { ZuploEnv } from "../app/env.js";
import {
  findOutputPathOfServerConfig,
  loadZudokuConfig,
} from "../config/loader.js";
import type { ZudokuConfig } from "../config/validators/validate.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getViteConfig } from "./config.js";
import { getBuildHtml } from "./html.js";
import { writeOutput } from "./output.js";
import { prerender } from "./prerender/prerender.js";

const DIST_DIR = "dist";

const getIssuer = async (config: ZudokuConfig) => {
  switch (config.authentication?.type) {
    case "clerk": {
      const frontendApiEncoded = config.authentication.clerkPubKey
        .split("_")
        .at(-1);
      invariant(frontendApiEncoded, "Clerk public key is invalid");
      const frontendApi = atob(frontendApiEncoded).split("$").at(0);
      invariant(frontendApi, "Clerk frontend API is invalid");
      return frontendApi;
    }
    case "auth0": {
      return `https://${config.authentication.domain}/`;
    }
    case "openid": {
      return config.authentication.issuer;
    }
    case "supabase": {
      return config.authentication.supabaseUrl;
    }
    case undefined: {
      return undefined;
    }
    default: {
      throw new Error(`Unsupported authentication type`);
    }
  }
};
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

  const issuer = await getIssuer(config);

  if ("output" in clientResult) {
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
      jsEntry: joinUrl(viteClientConfig.base, jsEntry),
      cssEntries: cssEntries.map((css) => joinUrl(viteClientConfig.base, css)),
      dir: config.page?.dir,
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

      if (ZuploEnv.isZuplo) {
        if (!issuer) {
          throw new Error("Issuer is required for Zuplo");
        }
        await writeFile(
          path.join(options.dir, "dist/.output/zuplo.json"),
          JSON.stringify({ issuer }, null, 2),
          "utf-8",
        );
      }
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
