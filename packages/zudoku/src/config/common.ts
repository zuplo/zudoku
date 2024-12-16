import { CommonConfig } from "./validators/common.js";

// WARNING: If you change this type signature, you must also change the
// corresponding type in packages/config/src/index.d.ts
export type ConfigWithMeta<TConfig extends CommonConfig> = TConfig & {
  __meta: {
    dependencies: string[];
    path: string;
    registerDependency: (...file: string[]) => void;
  };
};
