import type { CommonConfig } from "../config/validators/common.js";
import ZuploBuildCheck from "../lib/components/ZuploBuildCheck.js";

const withZuplo = <TConfig extends CommonConfig>(config: TConfig): TConfig => {
  return {
    ...config,
    isZuplo: true,
    enableStatusPages: true,
    UNSAFE_slotlets: {
      "layout-after-head": ZuploBuildCheck,
    },
    page: {
      showPoweredBy: false,
      ...config.page,
    },
  };
};

export default withZuplo;
