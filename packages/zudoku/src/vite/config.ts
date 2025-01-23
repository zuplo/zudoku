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
import tailwindConfig from "../app/tailwind.js";
import { logger } from "../cli/common/logger.js";
import { isPortAvailable } from "../cli/common/utils/ports.js";
import type {
  LoadedConfig,
  ZudokuConfig,
  ZudokuPluginOptions,
} from "../config/config.js";
import { tryLoadZudokuConfig } from "../config/loader.js";
import { ZuploEnv } from "../zuplo/env.js";
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

// We extend the dependencies with the files from configured APIs
// so that the server restarts when these files change.
const registerApiFileImportDependencies = (
  config: LoadedConfig,
  rootDir: string,
) => {
  if (!config.apis) return;

  const apis = Array.isArray(config.apis) ? config.apis : [config.apis];

  const files = apis
    .filter((c) => c.type === "file")
    .flatMap((c) => (Array.isArray(c.input) ? c.input : [c.input]))
    .map((c) => path.posix.join(rootDir, c));

  config.__meta.registerDependency(...files);
};

function loadEnv(configEnv: ConfigEnv, rootDir: string) {
  const envPrefix = [
    ...(ZuploEnv.isZuplo ? ["ZUPLO_PUBLIC_"] : []),
    "ZUDOKU_PUBLIC_",
  ];
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
    const loadedConfig = await tryLoadZudokuConfig(rootDir, envVars);

    registerApiFileImportDependencies(loadedConfig, rootDir);

    logger.info(
      colors.yellow(`loaded config file `) +
        colors.dim(loadedConfig.__meta.path),
      {
        timestamp: true,
      },
    );

    config = loadedConfig;

    return { config, envPrefix, publicEnv };
  } catch (error) {
    logger.error(colors.red(`Error loading Zudoku config`), {
      timestamp: true,
      error,
    });
  }

  // Default config
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

export function getPluginOptions({
  dir,
  mode,
}: {
  dir: string;
  mode: ZudokuPluginOptions["mode"];
}): ZudokuPluginOptions {
  const moduleDir = getModuleDir();
  return {
    ...config!,
    rootDir: dir,
    moduleDir,
    mode,
  };
}

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

  let websocketPort = 9800;
  while (
    !(await isPortAvailable("localhost", websocketPort)) &&
    websocketPort < 9999
  ) {
    websocketPort++;
  }

  const pluginOptions = getPluginOptions({
    dir,
    mode: process.env.ZUDOKU_INTERNAL_DEV ? "internal" : "module",
  });

  const base = config.cdnUrl
    ? new URL(config.basePath ?? "/", config.cdnUrl).href
    : config.basePath;

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
        "@mdx-js/react": path.resolve(
          pluginOptions.moduleDir,
          "node_modules/@mdx-js/react",
        ),
      },
    },
    define: {
      "process.env.SENTRY_DSN": JSON.stringify(process.env.SENTRY_DSN),
      ...publicEnv,
    },
    ssr: {
      target: "node",
      noExternal: ["@mdx-js/react"],
    },
    server: {
      middlewareMode: true,
      open: true,
      hmr: {
        port: websocketPort,
      },
      watch: {
        ignored: [
          `${dir}/dist`,
          `${dir}/lib`,
          `${dir}/.git`,
          `${pluginOptions.moduleDir}/src/vite`,
          `${pluginOptions.moduleDir}/src/cli`,
        ],
      },
    },
    build: {
      ssr: configEnv.isSsrBuild,
      sourcemap: true,
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
              ? ["zudoku/app/entry.server.tsx", config.__meta.path]
              : "zudoku/app/entry.client.tsx"
            : undefined,
      },
    },
    experimental: config.cdnUrl
      ? {
          renderBuiltUrl(filename, { type, hostType }) {
            if (type === "asset" && (hostType === "js" || hostType === "css")) {
              return new URL(filename, config.cdnUrl).href;
            }
            return { relative: true };
          },
        }
      : undefined,
    optimizeDeps: {
      entries: [
        configEnv.isSsrBuild
          ? getAppServerEntryPath()
          : getAppClientEntryPath(),
      ],
      include: ["react-dom/client", "@sentry/react"],
    },
    // Workaround for Pre-transform error for "virtual" file: https://github.com/vitejs/vite/issues/15374
    assetsInclude: ["/__z/entry.client.tsx"],
    plugins: [vitePlugin(pluginOptions, handleConfigChange)],
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
              `${pluginOptions.moduleDir}/src/lib/**/*.{js,ts,jsx,tsx,md,mdx}`,
              // Include the config file and every file it depends on
              config.__meta.path,
              ...config.__meta.dependencies.map(
                (dep) => `${path.dirname(config.__meta.path)}/${dep}`,
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
  const userConfig = await loadConfigFromFile(configEnv, undefined, dir);
  if (userConfig) {
    const merged: InlineConfig = mergeConfig(
      userConfig.config,
      viteConfig,
      true,
    );

    return merged;
  }

  return viteConfig;
}
