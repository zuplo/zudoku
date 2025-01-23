import { CommonConfig } from "../config/validators/common.js";

export const withZuplo = <TConfig extends CommonConfig>(
  config: TConfig,
): TConfig => {
  return {
    ...config,
    isZuplo: true,
    enableStatusPages: true,
  };
};
