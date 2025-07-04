export type { ZudokuBuildConfig, ZudokuConfig } from "./config/config.js";
export type { InputNavigation as Navigation } from "./config/validators/InputNavigationSchema.js";
export type { SlotType } from "./lib/components/context/SlotProvider.js";
export { Slot, type CustomSlotNames } from "./lib/components/Slot.js";
export type { MDXImport } from "./lib/plugins/markdown/index.js";
export { defaultLanguages } from "./lib/shiki.js";
export { cn } from "./lib/ui/util.js";

export type {
  ApiIdentityPlugin,
  AuthenticationPlugin,
  CommonPlugin,
  NavigationPlugin,
  ProfileMenuPlugin,
  ProfileNavigationItem,
  RouteObject,
  SearchProviderPlugin,
  ZudokuPlugin,
} from "./lib/core/plugins.js";
export { ZudokuContext, type ApiIdentity } from "./lib/core/ZudokuContext.js";
export type { MdxComponentsType } from "./lib/util/MdxComponents.js";

/** @deprecated Import from `zudoku/hooks` instead */
export { useEvent } from "./lib/hooks/index.js";
