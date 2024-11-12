import { vitePluginSsrCss } from "@hiogawa/vite-plugin-ssr-css";
import autoprefixer from "autoprefixer";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import colors from "picocolors";
import tailwindcss from "tailwindcss";
import { tsImport } from "tsx/esm/api";
import {
  type ConfigEnv,
  type InlineConfig,
  type LogLevel,
  loadConfigFromFile,
  mergeConfig,
} from "vite";
import tailwindConfig from "../app/tailwind.js";
import { logger } from "../cli/common/logger.js";
import { isPortAvailable } from "../cli/common/utils/ports.js";
import type { ZudokuConfig, ZudokuPluginOptions } from "../config/config.js";
import { validateConfig } from "../config/validators/validate.js";
import vitePlugin from "./plugin.js";

export const zudokuConfigFiles = [
  "zudoku.config.js",
  "zudoku.config.jsx",
  "zudoku.config.ts",
  "zudoku.config.tsx",
  "zudoku.config.mjs",
];

const fileExists = (path: string) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

let configPath: string | undefined;

export async function getConfigFilePath(rootDir: string): Promise<string> {
  // Also check if file exists, so renaming the file will trigger a restart as well
  if (configPath && (await fileExists(configPath))) {
    return configPath;
  }

  for (const fileName of zudokuConfigFiles) {
    const filepath = path.join(rootDir, fileName);

    if (await fileExists(filepath)) {
      configPath = filepath;
      return filepath;
    }
  }
  configPath = undefined;
  throw new Error(`No zudoku config file found in project root.`);
}

export type ZudokuConfigEnv = ConfigEnv & {
  mode: "development" | "production";
  forceReload?: boolean;
};

export type LoadedConfig = ZudokuConfig & {
  __meta: { dependencies: string[]; path: string };
};

let config: LoadedConfig | undefined;

const getDocsConfigFiles = (
  docsConfig: ZudokuConfig["docs"],
  baseDir: string,
): string[] => {
  if (!docsConfig) return [];
  const docsArray = Array.isArray(docsConfig) ? docsConfig : [docsConfig];

  return docsArray.map((doc) => path.posix.join(baseDir, doc.files));
};

export async function loadZudokuConfig(
  rootDir: string,
  forceReload?: boolean,
): Promise<LoadedConfig> {
  if (!forceReload && config) {
    return config;
  }

  const filepath = await getConfigFilePath(rootDir);

  try {
    logger.info(colors.yellow(`loaded config file `) + colors.dim(filepath), {
      timestamp: true,
    });

    const configFilePath = pathToFileURL(filepath).href;

    const dependencies: string[] = [];
    const loadedConfig = await tsImport(configFilePath, {
      parentURL: import.meta.url,
      onImport: (file: string) => {
        const path = fileURLToPath(
          file.startsWith("file://") ? file : pathToFileURL(file).href,
        );

        if (path.startsWith(rootDir)) {
          dependencies.push(path);
        }
      },
    }).then((m) => m.default as ZudokuConfig);

    if (!loadedConfig) {
      throw new Error(`Failed to load config file: ${filepath}`);
    }

    config = {
      ...loadedConfig,
      __meta: { dependencies, path: filepath },
    };

    return config;
  } catch (e) {
    logger.error(e);
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
  const config = await loadZudokuConfig(dir);

  const handleConfigChange = async () => {
    const config = await loadZudokuConfig(dir, true);
    onConfigChange?.(config);

    return config;
  };

  validateConfig(config);

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

  const viteConfig: InlineConfig = {
    root: dir,
    base: config.basePath,
    appType: "custom",
    configFile: false,
    clearScreen: false,
    logLevel: (process.env.LOG_LEVEL ?? "info") as LogLevel,
    customLogger: logger,
    envPrefix: "PUBLIC_",
    worker: {
      format: "es",
    },
    ssr: {
      target: "node",
      noExternal: [],
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
              ? ["zudoku/app/entry.server.tsx", configPath!]
              : "zudoku/app/entry.client.tsx"
            : undefined,
      },
    },
    optimizeDeps: {
      entries: [
        configEnv.isSsrBuild
          ? getAppServerEntryPath()
          : getAppClientEntryPath(),
      ],
      include: ["react-dom/client"],
      exclude: [
        // Vite does not like optimizing the worker dependency
        "zudoku/openapi-worker",
        "worker",
      ],
    },
    // Workaround for Pre-transform error for "virtual" file: https://github.com/vitejs/vite/issues/15374
    assetsInclude: ["/__z/entry.client.tsx"],
    plugins: [
      vitePluginSsrCss({
        entries: [`${pluginOptions.moduleDir}/src/app/entry.client.tsx`],
      }),
      vitePlugin(pluginOptions, handleConfigChange),
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss({
            ...tailwindConfig,
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
