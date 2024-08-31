import { vitePluginSsrCss } from "@hiogawa/vite-plugin-ssr-css";
import autoprefixer from "autoprefixer";
import { stat } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import tailwindcss from "tailwindcss";
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

export const zuploConfigFiles = [
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

  for (const fileName of zuploConfigFiles) {
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
  vite: { dependencies: string[]; path: string };
};

let config: LoadedConfig | undefined;

export async function loadZudokuConfig(
  rootDir: string,
  configEnv: ZudokuConfigEnv,
): Promise<LoadedConfig> {
  if (!configEnv.forceReload && config) {
    return config;
  }
  const filepath = await getConfigFilePath(rootDir);

  try {
    logger.info(colors.yellow(`loaded config file `) + colors.dim(filepath), {
      timestamp: true,
    });
    // NOTE: This function technically is for loading vite configs, but it
    // doesn't actually have anything to do with vite config, it just loads
    // typescript files. So we can use it to load our zudoku config file.
    // It is possible they change this and it wont work in the future.
    const loaded = await loadConfigFromFile(configEnv, filepath, rootDir);
    if (!loaded) {
      throw new Error(`Failed to load config file: ${filepath}`);
    }
    // Using `loaded` directly breaks Vite in unexpected ways:
    // Errors with: "(intermediate value).glob is not a function"
    // Maybe worth revisiting at some point in time
    config = {
      ...(loaded.config as ZudokuConfig),
      vite: {
        dependencies: loaded.dependencies,
        path: loaded.path,
      },
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
  const moduleDir = new URL("../../", import.meta.url).pathname;
  if (moduleDir.endsWith("/")) {
    return moduleDir.slice(0, -1);
  } else {
    return moduleDir;
  }
}

export function getAppClientEntryPath() {
  const modDir = getModuleDir();
  return path.join(modDir, "src", "app", "entry.client.tsx");
}

export function getAppServerEntryPath() {
  const modDir = getModuleDir();
  return path.join(modDir, "src", "app", "entry.server.tsx");
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
    ...config,
    rootDir: dir,
    moduleDir,
    mode,
  };
}

export async function getViteConfig(
  dir: string,
  configEnv: ZudokuConfigEnv,
): Promise<InlineConfig> {
  const config = await loadZudokuConfig(dir, configEnv);

  const onConfigChange = () =>
    loadZudokuConfig(dir, { ...configEnv, forceReload: true });

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
        path.join(dir, "dist", configEnv.isSsrBuild ? "server" : ""),
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
    plugins: [
      vitePluginSsrCss({
        entries: [`${pluginOptions.moduleDir}/src/app/entry.client.tsx`],
      }),
      vitePlugin(pluginOptions, onConfigChange),
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
              config.vite.path,
              ...config.vite.dependencies.map(
                (dep) => `${path.dirname(config.vite.path)}/${dep}`,
              ),
              `${pluginOptions.moduleDir}/src/lib/**/*.{js,ts,jsx,tsx,md,mdx}`,
              // Users custom components
              // NOTE: For now we are requiring components to be in `src` folder
              // would be good to make this more dynamic though because users
              // could put their components anywhere
              `${dir}/src/**/*.{js,ts,jsx,tsx,md,mdx}`,
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
