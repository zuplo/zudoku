import path from "node:path";
import { fileURLToPath } from "node:url";
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
import { defaultHighlightOptions, defaultLanguages } from "../lib/shiki.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import vitePlugin from "./plugin.js";

export type ZudokuConfigEnv = ConfigEnv & {
  mode: "development" | "production";
};

export function getModuleDir() {
  // NOTE: This is relative to the /dist folder because the dev server
  // runs the compiled JS files, but vite uses the raw TS files
  const moduleDir = fileURLToPath(new URL("../../", import.meta.url))
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

  // These dependencies are listed explicitly to prevent cascading page reloads that occur during auto-discovery
  const zudokuIncludeOptimizedDeps = [
    "@sindresorhus/slugify",
    "react-hook-form",
    "cmdk",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
    "@radix-ui/react-select",
    "@radix-ui/react-popover",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-label",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-slot",
    "@envelop/core",
    "@pothos/core",
    "graphql-yoga",
    "graphql",
    "graphql/index.js",
    "graphql/error/index.js",
    "openapi-types",
    "@zudoku/httpsnippet",
    "graphql-type-json",
    "yaml",
    "@clerk/clerk-js",
    "@scalar/openapi-parser",
    "allof-merge",
    ...(config.syntaxHighlighting?.languages ?? defaultLanguages).map(
      (lang) => `@shikijs/langs/${lang}`,
    ),
    ...Object.values(
      config.syntaxHighlighting?.themes ?? defaultHighlightOptions.themes,
    ).map((theme) => `@shikijs/themes/${theme}`),
  ].map((dep) => `zudoku > ${dep}`);

  // We define public env vars as `process.env` vars because Vite only exposes them as `import.meta.env` vars
  const publicVarsProcessEnvDefine = Object.fromEntries(
    Object.entries(publicEnv).map(([key, value]) => [
      `process.env.${key}`,
      value,
    ]),
  );

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
      alias: {
        "@mdx-js/react": import.meta.resolve("@mdx-js/react"),
      },
    },
    define: {
      "process.env.ZUDOKU_VERSION": JSON.stringify(packageJson.version),
      "process.env.IS_ZUPLO": ZuploEnv.isZuplo,
      "import.meta.env.IS_ZUPLO": ZuploEnv.isZuplo,
      ...defineEnvVars([
        "SENTRY_DSN",
        "ZUPLO_BUILD_ID",
        "ZUPLO_BUILD_CONFIG",
        "ZUPLO_ENVIRONMENT_TYPE",
        "ZUPLO_SERVER_URL",
      ]),
      ...publicVarsProcessEnvDefine,
    },
    ssr: {
      target: "node",
      noExternal: ["@mdx-js/react"],
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
        external: [joinUrl(config.basePath, "/pagefind/pagefind.js")],
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
      entries: [
        configEnv.isSsrBuild
          ? getAppServerEntryPath()
          : getAppClientEntryPath(),
      ],
      include: [
        "react-dom/client",
        ...(process.env.SENTRY_DSN ? ["@sentry/react"] : []),
        ...zudokuIncludeOptimizedDeps,
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

  // If the user has supplied a vite.config file, merge it with ours
  const userConfig = await loadConfigFromFile(
    configEnv,
    undefined,
    dir,
    undefined,
    undefined,
    "runner",
  );

  if (userConfig) {
    const merged: InlineConfig = mergeConfig(
      viteConfig,
      userConfig.config,
      true,
    );

    logger.info(colors.blue(`merged with custom user Vite config`), {
      timestamp: true,
    });

    return merged;
  }

  return viteConfig;
}
