import { stat } from "node:fs/promises";
import path from "node:path";
import type { RollupOutput, RollupWatcher } from "rollup";
import { runnerImport } from "vite";
import { type ConfigWithMeta } from "./common.js";
import { type CommonConfig } from "./validators/common.js";
import { validateConfig } from "./validators/validate.js";

const zudokuConfigFiles = [
  "zudoku.config.js",
  "zudoku.config.jsx",
  "zudoku.config.ts",
  "zudoku.config.tsx",
  "zudoku.config.mjs",
];

export const fileExists = (path: string) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

async function getConfigFilePath(rootDir: string) {
  for (const fileName of zudokuConfigFiles) {
    const filepath = path.join(rootDir, fileName);
    if (await fileExists(filepath)) {
      return filepath;
    }
  }
  throw new Error(`No zudoku config file found in project root.`);
}

async function loadZudokuConfig<TConfig>(
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

export async function tryLoadZudokuConfig<TConfig extends CommonConfig>(
  rootDir: string,
  moduleDir: string,
): Promise<ConfigWithMeta<TConfig>> {
  const configPath = await getConfigFilePath(rootDir);

  const { config, dependencies } = await loadZudokuConfig<TConfig>(configPath);
  validateConfig(config);

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

export function findOutputPathOfServerConfig(
  output: RollupOutput | RollupOutput[] | RollupWatcher,
) {
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
