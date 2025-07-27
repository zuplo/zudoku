export type { ZudokuBuildConfig, ZudokuConfig } from "./config/config.js";
export type { InputNavigation as Navigation } from "./config/validators/InputNavigationSchema.js";
export type { SlotType } from "./lib/components/context/SlotProvider.js";
export { type CustomSlotNames, Slot } from "./lib/components/Slot.js";
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
export { type ApiIdentity, ZudokuContext } from "./lib/core/ZudokuContext.js";
/** @deprecated Import from `zudoku/hooks` instead */
export { useEvent } from "./lib/hooks/index.js";
export type { MDXImport } from "./lib/plugins/markdown/index.js";
export { defaultLanguages } from "./lib/shiki.js";
export { cn } from "./lib/ui/util.js";
export type { MdxComponentsType } from "./lib/util/MdxComponents.js";
