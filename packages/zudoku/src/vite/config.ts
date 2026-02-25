import path from "node:path";
import { fileURLToPath } from "node:url";
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
import { loadZudokuConfig } from "../config/loader.js";
import { CdnUrlSchema } from "../config/validators/validate.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { findPackageRoot } from "./package-root.js";
import vitePlugin from "./plugin.js";
import { getZuploSystemConfigurations } from "./zuplo.js";

export type ZudokuConfigEnv = ConfigEnv & {
  mode: "development" | "production";
};

export function getModuleDir() {
  const pkgJsonPath = fileURLToPath(import.meta.resolve("zudoku/package.json"));
  const moduleDir = path
    .dirname(pkgJsonPath)
    // Windows compat
    .replaceAll(path.sep, path.posix.sep);

  return moduleDir.endsWith(path.posix.sep)
    ? moduleDir.slice(0, -1)
    : moduleDir;
}

export function getAppClientEntryPath() {
  const modDir = getModuleDir();
  return path.posix.join(modDir, "src", "app", "entry.client.tsx");
}

export function getAppServerEntryPath() {
  const modDir = getModuleDir();
  return path.posix.join(modDir, "src", "app", "entry.server.tsx");
}

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
): Promise<InlineConfig> {
  const { config, publicEnv, envPrefix } = await loadZudokuConfig(
    configEnv,
    dir,
  );

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
    ssr: {
      target: "node",
      noExternal: ["zudoku", "@mdx-js/react"],
    },
    server: {
      middlewareMode: true,
      open: true,
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
      ssr: configEnv.isSsrBuild,
      sourcemap: true,
      target: "es2022",
      outDir: path.resolve(
        path.join(
          dir,
          "dist",
          config.basePath ?? "",
          configEnv.isSsrBuild ? "server" : "",
        ),
      ),
      emptyOutDir: true,
      rollupOptions: {
        input:
          configEnv.command === "build"
            ? configEnv.isSsrBuild
              ? ["zudoku/app/entry.server.tsx", config.__meta.configPath]
              : "zudoku/app/entry.client.tsx"
            : undefined,
        external: [
          joinUrl(config.basePath, "/pagefind/pagefind.js"),
          "mermaid",
        ],
      },
      chunkSizeWarningLimit: 1500,
    },
    experimental: {
      renderBuiltUrl(filename) {
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
      esbuildOptions: {
        target: "es2022",
      },
      entries: [path.posix.join(getModuleDir(), "src/{app,lib}/**")],
      include: [
        "react-dom/client",
        ...(process.env.SENTRY_DSN ? ["@sentry/react"] : []),
      ],
    },
    assetsInclude: [
      // Workaround for Pre-transform error for "virtual" file: https://github.com/vitejs/vite/issues/15374
      "/__z/entry.client.tsx",
      "**/pagefind.js",
    ],
    plugins: [vitePlugin()],
    future: {
      removeServerModuleGraph: "warn",
      removeSsrLoadModule: "warn",
      removeServerTransformRequest: "warn",
      removePluginHookHandleHotUpdate: "warn",
      removePluginHookSsrArgument: "warn",
      removeServerHot: "warn",
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
