import { stat } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import {
  type build,
  type ConfigEnv,
  runnerImport,
  loadEnv as viteLoadEnv,
} from "vite";
import { logger } from "../cli/common/logger.js";
import invariant from "../lib/util/invariant.js";
import { getModuleDir } from "../vite/config.js";
import { fileExists } from "./file-exists.js";
import type { ZudokuConfig } from "./validators/validate.js";
import { validateConfig } from "./validators/validate.js";

export type ConfigWithMeta = ZudokuConfig & {
  __meta: {
    rootDir: string;
    moduleDir: string;
    configPath: string;
    mode: typeof process.env.ZUDOKU_ENV;
    dependencies: string[];
  };
};

let config: ConfigWithMeta | undefined;
let envPrefix: string[] | undefined;
let publicEnv: Record<string, string> | undefined;
let modifiedTimes: Map<string, number> | undefined;

const zudokuConfigFiles = [
  "zudoku.config.js",
  "zudoku.config.jsx",
  "zudoku.config.ts",
  "zudoku.config.tsx",
  "zudoku.config.mjs",
];

async function getConfigFilePath(rootDir: string) {
  for (const fileName of zudokuConfigFiles) {
    const filepath = path.join(rootDir, fileName);
    if (await fileExists(filepath)) {
      return filepath;
    }
  }
  throw new Error(`No zudoku config file found in project root.`);
}

async function loadZudokuConfigWithMeta(
  rootDir: string,
): Promise<ConfigWithMeta> {
  const configPath = await getConfigFilePath(rootDir);

  const { module, dependencies } = await runnerImport<{
    default: ZudokuConfig;
  }>(configPath, {
    server: {
      // this allows us to 'load' CSS files in the config
      // see https://github.com/vitejs/vite/pull/19577
      perEnvironmentStartEndDuringDev: true,
    },
  });

  const config = module.default;

  validateConfig(config, configPath);

  const configWithMetadata: ConfigWithMeta = {
    ...config,
    __meta: {
      rootDir,
      moduleDir: getModuleDir(),
      mode: process.env.ZUDOKU_ENV,
      dependencies,
      configPath,
    },
  };

  return configWithMetadata;
}

type BuildResult = Awaited<ReturnType<typeof build>>;

export function findOutputPathOfServerConfig(output: BuildResult) {
  if (Array.isArray(output)) {
    throw new Error("Expected a single output, but got an array");
  }
  if ("output" in output) {
    const result = output.output.find(
      (o) => "isEntry" in o && o.isEntry && o.fileName === "zudoku.config.js",
    );
    if (result) {
      return result.fileName;
    }
  }
  throw new Error("Could not find server config output file");
}

function loadEnv(configEnv: ConfigEnv, rootDir: string) {
  const envPrefix = ["ZUPLO_PUBLIC_", "ZUDOKU_PUBLIC_"];
  const localEnv = viteLoadEnv(configEnv.mode, rootDir, envPrefix);

  process.env = { ...localEnv, ...process.env };

  const publicEnv = Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => envPrefix.some((prefix) => key.startsWith(prefix)))
      .map(([key, value]) => [key, JSON.stringify(value)]),
  );

  return { publicEnv, envPrefix };
}

async function hasConfigChanged() {
  if (!config || !modifiedTimes) return true;

  const files = [config.__meta.configPath, ...config.__meta.dependencies];

  try {
    const hasChanged = await Promise.all(
      files.map(async (depPath) => {
        const depStat = await stat(depPath);
        const cachedMtime = modifiedTimes?.get(depPath);
        return !cachedMtime || depStat.mtimeMs !== cachedMtime;
      }),
    ).then((results) => results.some(Boolean));

    return hasChanged;
  } catch {
    return true;
  }
}

async function updateModifiedTimes() {
  if (!config) return;

  const files = [config.__meta.configPath, ...config.__meta.dependencies];

  modifiedTimes = new Map();

  await Promise.all(
    files.map(async (depPath) => {
      const depStat = await stat(depPath);
      modifiedTimes?.set(depPath, depStat.mtimeMs);
    }),
  );
}

export const getCurrentConfig = () => {
  invariant(config, "Config not loaded");
  return config;
};

export const setCurrentConfig = (newConfig: ConfigWithMeta) => {
  config = newConfig;
};

export async function loadZudokuConfig(
  configEnv: ConfigEnv,
  rootDir: string,
): Promise<{
  config: ConfigWithMeta;
  envPrefix: string[];
  publicEnv: Record<string, string>;
}> {
  const shouldReload = await hasConfigChanged();

  if (!shouldReload && config && envPrefix && publicEnv) {
    return { config, envPrefix, publicEnv };
  }

  ({ publicEnv, envPrefix } = loadEnv(configEnv, rootDir));

  try {
    config = await loadZudokuConfigWithMeta(rootDir);

    logger.info(
      colors.cyan(`loaded config file `) + colors.dim(config.__meta.configPath),
      { timestamp: true },
    );

    return { config, envPrefix, publicEnv };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (config) {
      // return the last valid config if it exists
      return { config, envPrefix, publicEnv };
    }

    throw new Error(errorMessage, { cause: error });
  } finally {
    await updateModifiedTimes();
  }
}

export const setStandaloneConfig = (rootDir: string) => {
  config = {
    __meta: {
      rootDir,
      moduleDir: getModuleDir(),
      mode: "standalone",
      dependencies: [],
      configPath: "",
    },
  };
};
