import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tsImport } from "tsx/esm/api";

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

async function getConfigFilePath(rootDir: string): Promise<string> {
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

export type ConfigWithMeta<TConfig> = TConfig & {
  __meta: { dependencies: string[]; path: string };
};

export async function loadZudokuConfig<TConfig>(
  rootDir: string,
): Promise<ConfigWithMeta<TConfig>> {
  const filepath = await getConfigFilePath(rootDir);

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
  }).then((m) => m.default as TConfig);

  if (!loadedConfig) {
    throw new Error(`Failed to load config file: ${filepath}`);
  }

  const config: ConfigWithMeta<TConfig> = {
    ...loadedConfig,
    __meta: { dependencies, path: filepath },
  };

  return config;
}
