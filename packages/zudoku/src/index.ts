export type { ZudokuConfig } from "./config/config.js";
export type {
  SidebarConfig as Sidebar,
  SidebarEntry,
} from "./config/validators/InputSidebarSchema.js";
export type { ExposedComponentProps } from "./lib/components/SlotletProvider.js";
export type { MDXImport } from "./lib/plugins/markdown/index.js";

export type {
  ApiIdentityPlugin,
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
