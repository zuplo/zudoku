import type { CommonConfig } from "../config/validators/common.js";
import { PoweredByZuplo } from "../lib/components/navigation/PoweredByZudoku.js";

const withZuplo = <TConfig extends CommonConfig>(config: TConfig): TConfig => {
  return {
    ...config,
    isZuplo: true,
    enableStatusPages: true,
    UNSAFE_slotlets: {
      "sidebar-footer": PoweredByZuplo,
    },
    page: {
      showPoweredBy: false,
      ...config.page,
    },
  };
};

export default withZuplo;
