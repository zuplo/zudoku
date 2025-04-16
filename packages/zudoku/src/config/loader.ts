import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { RollupOutput, RollupWatcher } from "rollup";
import { runnerImport } from "vite";
import { type ConfigWithMeta } from "./common.js";
import {
  type CommonConfig,
  validateCommonConfig,
} from "./validators/common.js";
import { validateConfig } from "./validators/validate.js";

const zudokuConfigFiles = [
  "zudoku.config.js",
  "zudoku.config.jsx",
  "zudoku.config.ts",
  "zudoku.config.tsx",
  "zudoku.config.mjs",
];

const devPortalConfigFile = "dev-portal.json";

export const fileExists = (path: string) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

let configPath: string | undefined;
let configType: "zudoku" | "dev-portal" | undefined;

export async function findConfigFilePath(
  rootDir: string,
): Promise<
  | { configPath: string; configType: "zudoku" | "dev-portal" }
  | { configPath: undefined; configType: undefined }
> {
  // Also check if file exists, so renaming the file will trigger a restart as well
  if (configPath && configType && (await fileExists(configPath))) {
    return { configPath, configType };
  }

  const devPortalConfigPath = path.join(rootDir, devPortalConfigFile);
  if (await fileExists(devPortalConfigPath)) {
    configPath = devPortalConfigPath;
    configType = "dev-portal";
    return { configPath, configType };
  }

  for (const fileName of zudokuConfigFiles) {
    const filepath = path.join(rootDir, fileName);

    if (await fileExists(filepath)) {
      configPath = filepath;
      configType = "zudoku";
      return { configPath, configType };
    }
  }

  configPath = undefined;
  configType = undefined;
  return { configPath, configType };
}

async function getConfigFilePath(
  rootDir: string,
): Promise<{ configPath: string; configType: "zudoku" | "dev-portal" }> {
  const result = await findConfigFilePath(rootDir);
  if (result.configType) {
    return result;
  }
  throw new Error(`No zudoku config file found in project root.`);
}

async function loadZudokuCodeConfig<TConfig>(
  configPath: string,
): Promise<{ dependencies: string[]; config: TConfig }> {
  const { module, dependencies } = await runnerImport<{ default: TConfig }>(
    configPath,
    {
      server: {
        // this allows us to 'load' CSS files in the config
        // see https://github.com/vitejs/vite/pull/19577
        perEnvironmentStartEndDuringDev: true,
      },
    },
  );

  return {
    dependencies: [configPath, ...dependencies],
    config: module.default,
  };
}

async function loadDevPortalConfig<TConfig extends CommonConfig>(
  configPath: string,
  envVars: Record<string, string | undefined>,
) {
  const json = await readFile(configPath, "utf-8");

  let config: TConfig;
  try {
    config = JSON.parse(json);
  } catch {
    throw new Error(
      "Failed to parse dev-portal.json. Check that the file is valid JSON.",
    );
  }

  // 1. Validate the config
  validateCommonConfig(config);

  // 2. Replace $env() placeholders with actual environment
  config = replaceEnvVariables(config, envVars);

  return config;
}

/**
 * Replaces the $env() placeholders in the config with the actual environment
 */

function replaceEnvVariables(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  envVars: Record<string, string | undefined>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (typeof obj === "string") {
    const envVarMatch = obj.match(/^\$env\(([^)]+)\)$/);
    if (envVarMatch) {
      const envVarName = envVarMatch[1]!;
      return envVars[envVarName];
    }
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map((o) => replaceEnvVariables(o, envVars));
  } else if (typeof obj === "object" && obj !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newObj: any = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        newObj[key] = replaceEnvVariables(obj[key], envVars);
      }
    }
    return newObj;
  }
  return obj;
}

export type ConfigLoaderOverrides = {
  loadZudokuCodeConfig?: typeof loadZudokuCodeConfig;
};

export async function tryLoadZudokuConfig<TConfig extends CommonConfig>(
  rootDir: string,
  moduleDir: string,
  envVars: Record<string, string | undefined>,
  overrides?: ConfigLoaderOverrides,
): Promise<ConfigWithMeta<TConfig>> {
  const { configPath, configType } = await getConfigFilePath(rootDir);

  let config: TConfig;
  let dependencies: string[];
  if (configType === "dev-portal") {
    config = await loadDevPortalConfig<TConfig>(configPath, envVars);
    dependencies = [];
  } else {
    const loadConfig = overrides?.loadZudokuCodeConfig ?? loadZudokuCodeConfig;
    ({ config, dependencies } = await loadConfig<TConfig>(configPath));
    // This is here instead of in the load function so that
    // it works even if we are overriding the load function
    validateConfig(config);
  }

  const configWithMetadata: ConfigWithMeta<TConfig> = {
    ...config,
    __meta: {
      rootDir,
      moduleDir,
      mode: process.env.ZUDOKU_ENV,
      dependencies,
      configPath,
    },
  };

  return configWithMetadata;
}

const outputFileNames = ["dev-portal.js", "zudoku.config.js"];

export function findOutputPathOfServerConfig(
  output: RollupOutput | RollupOutput[] | RollupWatcher,
) {
  if (Array.isArray(output)) {
    throw new Error("Expected a single output, but got an array");
  }
  if ("output" in output) {
    const result = output.output.find(
      (o) =>
        "isEntry" in o && o.isEntry && outputFileNames.includes(o.fileName),
    );
    if (result) {
      return result.fileName;
    }
  }
  throw new Error("Could not find server config output file");
}
