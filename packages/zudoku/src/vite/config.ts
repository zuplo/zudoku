import autoprefixer from "autoprefixer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import colors from "picocolors";
import tailwindcss from "tailwindcss";
import {
  type ConfigEnv,
  type InlineConfig,
  type LogLevel,
  loadConfigFromFile,
  mergeConfig,
  loadEnv as viteLoadEnv,
} from "vite";
import packageJson from "../../package.json" with { type: "json" };
import { ZuploEnv } from "../app/env.js";
import tailwindConfig from "../app/tailwind.js";
import { logger } from "../cli/common/logger.js";
import type { LoadedConfig, ZudokuConfig } from "../config/config.js";
import { tryLoadZudokuConfig } from "../config/loader.js";
import { CdnUrlSchema } from "../config/validators/common.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import vitePlugin from "./plugin.js";

export type ZudokuConfigEnv = ConfigEnv & {
  mode: "development" | "production";
  forceReload?: boolean;
};

const getDocsConfigFiles = (
  docsConfig: ZudokuConfig["docs"],
  baseDir: string,
): string[] => {
  if (!docsConfig) return [];
  const docsArray = Array.isArray(docsConfig) ? docsConfig : [docsConfig];

  return docsArray.map((doc) => path.posix.join(baseDir, doc.files));
};

function loadEnv(configEnv: ConfigEnv, rootDir: string) {
  const envPrefix = ["ZUPLO_", "ZUDOKU_PUBLIC_"];
  const localEnv = viteLoadEnv(configEnv.mode, rootDir, envPrefix);

  process.env = { ...localEnv, ...process.env };

  const publicEnv = Object.entries(process.env).reduce(
    (val, [key]) => {
      if (envPrefix.some((prefix) => key.startsWith(prefix))) {
        val[key] = JSON.stringify(process.env[key]);
      }
      return val;
    },
    {} as Record<string, string>,
  );

  return { publicEnv, envPrefix };
}

let config: LoadedConfig | undefined;
let envPrefix: string[] | undefined;
let publicEnv: Record<string, string> | undefined;

export const getStandaloneConfig = (rootDir: string): LoadedConfig => ({
  __meta: {
    rootDir,
    moduleDir: getModuleDir(),
    mode: "standalone",
    dependencies: [],
    configPath: "",
  },
});

export async function loadZudokuConfig(
  configEnv: ConfigEnv,
  rootDir: string,
  forceReload?: boolean,
): Promise<{
  config: LoadedConfig;
  envPrefix: string[];
  publicEnv: Record<string, string>;
}> {
  if (!forceReload && config && envPrefix && publicEnv) {
    return { config, envPrefix, publicEnv };
  }

  ({ publicEnv, envPrefix } = loadEnv(configEnv, rootDir));

  try {
    const envVars: Record<string, string | undefined> = {};
    for (const key in process.env) {
      if (envPrefix.some((prefix) => key.startsWith(prefix))) {
        envVars[key] = process.env[key];
      }
    }

    config = await tryLoadZudokuConfig(rootDir, getModuleDir(), envVars);

    logger.info(
      colors.yellow(`loaded config file `) +
        colors.dim(config.__meta.configPath),
      { timestamp: true },
    );

    return { config, envPrefix, publicEnv };
  } catch (error) {
    logger.error(colors.red(`Error loading Zudoku config`), {
      timestamp: true,
      error,
    });
  }

  logger.error(colors.red(`no zudoku config file found in project root.`), {
    timestamp: true,
  });
  process.exit(1);
}

function getModuleDir() {
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

export async function getViteConfig(
  dir: string,
  configEnv: ZudokuConfigEnv,
  onConfigChange?: (config: LoadedConfig) => void,
): Promise<InlineConfig> {
  const { config, publicEnv, envPrefix } = await loadZudokuConfig(
    configEnv,
    dir,
  );

  const handleConfigChange = async () => {
    const { config } = await loadZudokuConfig(configEnv, dir, true);
    onConfigChange?.(config);

    return config;
  };

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
      "process.env.SENTRY_DSN": JSON.stringify(process.env.SENTRY_DSN),
      // This env var doesn't start with the public `ZUPLO_` prefix, so we need to manually define it here
      "process.env.IS_ZUPLO": ZuploEnv.isZuplo,
      "import.meta.env.IS_ZUPLO": ZuploEnv.isZuplo,
      ...publicEnv,
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
      esbuildOptions: {
        target: "esnext",
      },
      entries: [
        configEnv.isSsrBuild
          ? getAppServerEntryPath()
          : getAppClientEntryPath(),
      ],
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
    plugins: [vitePlugin(config, handleConfigChange)],
    future: {
      removeServerModuleGraph: "warn",
      removeSsrLoadModule: "warn",
      removeServerTransformRequest: "warn",
      removePluginHookHandleHotUpdate: "warn",
      removePluginHookSsrArgument: "warn",
      removeServerHot: "warn",
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss({
            ...tailwindConfig(config),
            content: [
              // Zudoku components and styles
              // Tailwind seems to crash if it tries to parse compiled .js files
              // as a workaround, we will just ship the source file and use those
              // `${moduleDir}/lib/**/*.{js,ts,jsx,tsx,md,mdx}`,
              `${config.__meta.moduleDir}/src/lib/**/*.{js,ts,jsx,tsx,md,mdx}`,
              // Include the config file and every file it depends on
              config.__meta.configPath,
              ...config.__meta.dependencies.map(
                (dep) => `${path.dirname(config.__meta.configPath)}/${dep}`,
              ),
              `${dir}/src/**/*.{js,ts,jsx,tsx,md,mdx}`,
              // All doc files
              ...getDocsConfigFiles(config.docs, dir),
            ],
          }),
          autoprefixer,
        ],
      },
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
