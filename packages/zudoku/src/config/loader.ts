import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RollupOutput, RollupWatcher } from "rollup";
import { tsImport } from "tsx/esm/api";
import withZuplo from "../zuplo/with-zuplo.js";
import { ConfigWithMeta } from "./common.js";
import { CommonConfig, validateCommonConfig } from "./validators/common.js";
import { validateConfig } from "./validators/validate.js";

const zudokuConfigFiles = [
  "zudoku.config.js",
  "zudoku.config.jsx",
  "zudoku.config.ts",
  "zudoku.config.tsx",
  "zudoku.config.mjs",
];

const devPortalConfigFile = "dev-portal.json";

const fileExists = (path: string) =>
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
  rootDir: string,
  configPath: string,
): Promise<{ dependencies: string[]; config: TConfig }> {
  const configFilePath = pathToFileURL(configPath).href;

  const dependencies: string[] = [];
  const config = await tsImport(configFilePath, {
    parentURL: import.meta.url,
    onImport: (file: string) => {
      const path = fileURLToPath(
        file.startsWith("file://") ? file : pathToFileURL(file).href,
      );

      if (path.startsWith(rootDir)) {
        dependencies.push(path);
      }
    },
  }).then((m) => m.default as TConfig);

  if (!config) {
    throw new Error(`Failed to load config file: ${configPath}`);
  }

  validateConfig(config);

  return { dependencies, config };
}

async function loadDevPortalConfig<TConfig extends CommonConfig>(
  configPath: string,
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

  validateCommonConfig(config);

  return withZuplo(config);
}

// WARNING: If you change function signature, you must also change the
// corresponding type in packages/config/src/index.d.ts
export async function tryLoadZudokuConfig<TConfig extends CommonConfig>(
  rootDir: string,
): Promise<ConfigWithMeta<TConfig>> {
  const { configPath, configType } = await getConfigFilePath(rootDir);

  let config: TConfig;
  let dependencies: string[];
  if (configType === "dev-portal") {
    config = await loadDevPortalConfig<TConfig>(configPath);
    dependencies = [];
  } else {
    ({ config, dependencies } = await loadZudokuCodeConfig<TConfig>(
      rootDir,
      configPath,
    ));
  }

  const configWithMetadata: ConfigWithMeta<TConfig> = {
    ...config,
    __meta: {
      dependencies,
      path: configPath,
      registerDependency: (...files: string[]) => dependencies.push(...files),
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
