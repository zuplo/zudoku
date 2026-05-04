import path from "node:path";
import dotenv from "dotenv";
import colors from "picocolors";
import {
  type ConfigEnv,
  type InlineConfig,
  type LogLevel,
  loadConfigFromFile,
  mergeConfig,
} from "vite";
import packageJson from "../../package.json" with { type: "json" };
import { ZuploEnv } from "../app/env.js";
import { logger } from "../cli/common/logger.js";
import { getZudokuRootDir } from "../cli/common/package-json.js";
import { loadZudokuConfig } from "../config/loader.js";
import { CdnUrlSchema } from "../config/validators/ZudokuConfig.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import type { SSRAdapter } from "./build.js";
import { findPackageRoot } from "./package-root.js";
import vitePlugin from "./plugin.js";
import { protectedAnnotatorPlugin } from "./protected/annotator.js";
import {
  getProtectedSourceMatcher,
  PROTECTED_CHUNK_DIR,
} from "./protected/registry.js";
import { getZuploSystemConfigurations } from "./zuplo.js";

export type ZudokuConfigEnv = ConfigEnv & {
  mode: "development" | "production";
};

export const getAppClientEntryPath = () =>
  path.posix.join(getZudokuRootDir(), "src/app/entry.client.tsx");

export const getAppServerEntryPath = () =>
  path.posix.join(getZudokuRootDir(), "src/app/entry.server.tsx");

// the vite config gets loaded multiple times, so we only log the CDN info once
let hasLoggedCdnInfo = false;
const MEDIA_REGEX =
  /\.(a?png|jpe?g|gif|bmp|svg|webp|tiff|ico|webm|ogg|mp3|wav|m4a|avif|mp4)/i;

const defineEnvVars = (vars: string[]) =>
  Object.fromEntries(
    vars.flatMap((v) => [
      [`process.env.${v}`, JSON.stringify(process.env[v])],
      [`import.meta.env.${v}`, JSON.stringify(process.env[v])],
    ]),
  );

export async function getViteConfig(
  dir: string,
  configEnv: ZudokuConfigEnv,
  options: { adapter?: SSRAdapter } = {},
): Promise<InlineConfig> {
  const { config, publicEnv, envPrefix } = await loadZudokuConfig(
    configEnv,
    dir,
  );
  const isWorker = options.adapter === "cloudflare";

  const { match: isProtectedSource, enabled: hasProtectedSources } =
    getProtectedSourceMatcher(config);
  const PROTECTED_GROUP_PREFIX = "protected-";

  const cdnUrl = CdnUrlSchema.parse(config.cdnUrl);

  const base = cdnUrl?.base
    ? joinUrl(cdnUrl.base, config.basePath)
    : config.basePath;

  if (cdnUrl && !hasLoggedCdnInfo) {
    logger.info(colors.blue(`Using CDN URL:`));
    logger.info(colors.blue(`  base:  `) + colors.dim(cdnUrl.base));
    logger.info(colors.blue(`  media: `) + colors.dim(cdnUrl.media));
    hasLoggedCdnInfo = true;
  }

  // We define public env vars as `process.env` vars because Vite only exposes them as `import.meta.env` vars
  const publicVarsProcessEnvDefine = Object.fromEntries(
    Object.entries(publicEnv).map(([key, value]) => [
      `process.env.${key}`,
      value,
    ]),
  );

  if (ZuploEnv.isZuplo) {
    dotenv.config({
      path: path.resolve(config.__meta.rootDir, "../.env.zuplo"),
      quiet: true,
    });
  }

  const deploymentName =
    ZuploEnv.buildConfig?.deploymentName ||
    getZuploSystemConfigurations(process.env.ZUPLO_SYSTEM_CONFIGURATIONS)
      ?.__ZUPLO_DEPLOYMENT_NAME;

  const viteConfig: InlineConfig = {
    root: dir,
    base,
    appType: "custom",
    // Cloudflare Workers: `webworker` makes Vite pick the browser platform
    // for rolldown and avoids emitting `createRequire(import.meta.url)`,
    // which is undefined in Workers. See vitejs/vite#21969 (fix in 8.0.4+).
    ssr: isWorker ? { target: "webworker" } : undefined,
    configFile: false,
    clearScreen: false,
    logLevel: (process.env.LOG_LEVEL ?? "info") as LogLevel,
    customLogger: logger,
    envPrefix,
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@mdx-js/react": import.meta.resolve("@mdx-js/react"),
      },
    },
    define: {
      "process.env.ZUDOKU_VERSION": JSON.stringify(packageJson.version),
      "process.env.IS_ZUPLO": ZuploEnv.isZuplo,
      "import.meta.env.IS_ZUPLO": ZuploEnv.isZuplo,
      "import.meta.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME":
        JSON.stringify(deploymentName),
      ...defineEnvVars([
        "SENTRY_DSN",
        "ZUPLO_BUILD_ID",
        "ZUPLO_BUILD_CONFIG",
        "ZUPLO_ENVIRONMENT_TYPE",
        "ZUPLO_SERVER_URL",
        "ZUPLO_GATEWAY_SERVICE_URL",
      ]),
      ...publicVarsProcessEnvDefine,
    },
    server: {
      middlewareMode: true,
      open: true,
      forwardConsole: false,
      watch: {
        ignored: [
          `${dir}/dist`,
          `${dir}/lib`,
          `${dir}/.git`,
          `${config.__meta.moduleDir}/src/vite`,
          `${config.__meta.moduleDir}/src/cli`,
        ],
      },
    },
    build: {
      sourcemap: true,
      target: "es2022",
      chunkSizeWarningLimit: 1500,
      outDir: path.resolve(path.join(dir, "dist", config.basePath ?? "")),
      emptyOutDir: false,
      rolldownOptions: {
        external: [joinUrl(config.basePath, "/pagefind/pagefind.js")],
        logLevel: process.env.ZUDOKU_ENV === "internal" ? "info" : "warn",
        checks: {
          pluginTimings: process.env.ZUDOKU_ENV === "internal",
        },
      },
    },
    environments: {
      client: {
        build: {
          manifest: true,
          rolldownOptions: {
            input: "zudoku/app/entry.client.tsx",
            output: hasProtectedSources
              ? {
                  // Name every MDX/schema entry. With only the protected
                  // chunk named, Rolldown would bundle shared MDX/React
                  // runtime into it and public chunks would statically import
                  // from `_protected/`. Naming sibling entries forces shared
                  // deps into a separate public chunk.
                  manualChunks: (id: string) => {
                    const chunkBase = path.posix
                      .basename(id.split("?")[0] ?? id)
                      .replace(/\.[^.]+$/, "")
                      .replace(/[^a-zA-Z0-9_-]/g, "_");
                    if (isProtectedSource(id)) {
                      return `${PROTECTED_GROUP_PREFIX}${chunkBase}`;
                    }
                    if (/\.mdx(\?|$)/.test(id)) {
                      return `doc-${chunkBase}`;
                    }
                    return undefined;
                  },
                  chunkFileNames: (info: { name: string }) =>
                    info.name.startsWith(PROTECTED_GROUP_PREFIX)
                      ? `${PROTECTED_CHUNK_DIR}/${info.name.slice(PROTECTED_GROUP_PREFIX.length)}-[hash].js`
                      : "assets/[name]-[hash].js",
                }
              : undefined,
          },
        },
      },
      ssr: {
        // Build: bundle all for self-contained SSR output; dev uses minimal externals for speed.
        resolve:
          configEnv.command === "build"
            ? { noExternal: true }
            : {
                noExternal: [/zudoku/, "@mdx-js/react"],
                external: ["@shikijs/themes", "@shikijs/langs"],
              },
        build: {
          outDir: path.resolve(
            path.join(dir, "dist", config.basePath ?? "", "server"),
          ),
          copyPublicDir: false,
          rolldownOptions: {
            logLevel: "warn",
            input: ["zudoku/app/entry.server.tsx", config.__meta.configPath],
          },
        },
      },
    },
    experimental: {
      renderBuiltUrl(filename) {
        // Protected chunks must resolve through the SSR origin so the auth
        // gate runs; never prefix with a CDN.
        if (filename.startsWith(`${PROTECTED_CHUNK_DIR}/`)) {
          return joinUrl(config.basePath, `/${filename}`);
        }

        if (cdnUrl?.base && [".js", ".css"].includes(path.extname(filename))) {
          return joinUrl(cdnUrl.base, filename);
        }

        if (cdnUrl?.media && MEDIA_REGEX.test(filename)) {
          return joinUrl(cdnUrl.media, filename);
        }

        return { relative: true };
      },
    },
    optimizeDeps: {
      entries: [path.posix.join(getZudokuRootDir(), "src/{app,lib}/**")],
      exclude: ["zudoku"],
      include: [
        "@mdx-js/react",
        "react-dom/client",
        "zudoku/icons",
        ...(process.env.SENTRY_DSN ? ["@sentry/react"] : []),
      ],
    },
    assetsInclude: [
      // Workaround for Pre-transform error for "virtual" file: https://github.com/vitejs/vite/issues/15374
      "/__z/entry.client.tsx",
      "**/pagefind.js",
    ],
    plugins: [protectedAnnotatorPlugin(), vitePlugin()],
    future: {
      removeServerModuleGraph: "warn",
      removeSsrLoadModule: "warn",
      removeServerTransformRequest: "warn",
      removePluginHookHandleHotUpdate: "warn",
      removePluginHookSsrArgument: "warn",
      removeServerHot: "warn",
      removeServerPluginContainer: "warn",
      removeServerReloadModule: "warn",
    },
  };

  // Merge vite configs from plugin directories and user's project
  const configRoots = await Promise.all(
    (config.__pluginDirs ?? []).map(findPackageRoot),
  );
  configRoots.push(dir);

  let mergedViteConfig = viteConfig;

  for (const root of configRoots) {
    if (!root) continue;
    const loaded = await loadConfigFromFile(
      configEnv,
      undefined,
      root,
      undefined,
      undefined,
      "runner",
    );
    if (!loaded) continue;

    mergedViteConfig = mergeConfig(mergedViteConfig, loaded.config, true);

    if (root === dir) {
      logger.info(colors.blue(`merged with custom user Vite config`), {
        timestamp: true,
      });
    }
  }

  return mergedViteConfig;
}
