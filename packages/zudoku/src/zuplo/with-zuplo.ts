import { CommonConfig } from "../config/validators/common.js";

const withZuplo = <TConfig extends CommonConfig>(config: TConfig): TConfig => {
  return {
    ...config,
    isZuplo: true,
    enableStatusPages: true,
    page: {
      showPoweredBy: false,
      ...config.page,
    },
  };
};

export default withZuplo;
