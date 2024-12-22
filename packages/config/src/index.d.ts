/**
 * NOTE: This file is a copy of a few of the types in Zudoku.
 * We should generate this, but its simple to copy for now.
 *
 * As part of the build, this gets copied into the dist folder
 */

// This file is generated as part of the build script
import { CommonConfig } from "./config.d.ts";

export { CommonConfig };

export type LoadZudokuConfigFn = <TConfig>(
  rootDir: string,
  configPath: string,
  envVars: Record<string, string | undefined>,
) => Promise<{
  dependencies: string[];
  config: TConfig;
}>;

export type ConfigLoaderOverrides = {
  loadZudokuCodeConfig?: LoadZudokuConfigFn;
};

export type ConfigWithMeta<TConfig extends CommonConfig> = TConfig & {
  __meta: {
    dependencies: string[];
    path: string;
    registerDependency: (...file: string[]) => void;
  };
};

export declare function tryLoadZudokuConfig<TConfig extends CommonConfig>(
  rootDir: string,
  envVars: Record<string, string | undefined>,
  overrides?: ConfigLoaderOverrides,
): Promise<ConfigWithMeta<TConfig>>;

export declare function findConfigFilePath(
  rootDir: string,
): Promise<
  { configPath: string; configType: "zudoku" | "dev-portal" } | undefined
>;
