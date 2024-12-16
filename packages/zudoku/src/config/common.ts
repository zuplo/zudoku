import { CommonConfig } from "./validators/common.js";

export type ConfigWithMeta<TConfig extends CommonConfig> = TConfig & {
  __meta: {
    dependencies: string[];
    path: string;
    registerDependency: (...file: string[]) => void;
  };
};
