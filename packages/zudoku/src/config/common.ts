import { type CommonConfig } from "./validators/common.js";

export type ConfigWithMeta<TConfig extends CommonConfig> = TConfig & {
  __meta: {
    rootDir: string;
    moduleDir: string;
    configPath: string;
    mode: typeof process.env.ZUDOKU_ENV;
    dependencies: string[];
    registerDependency: (...file: string[]) => void;
  };
};
