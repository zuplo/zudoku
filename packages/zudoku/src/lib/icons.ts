export { addIcon, iconLoaded } from "@iconify/react";
export {
  configureIconRuntimeFetch,
  Icon,
  type IconInput,
  type ZudokuIconProps,
} from "./components/ZudokuIcon.js";
export * from "./MissingIcon.js";

/**
 * @deprecated Importing lucide components from `zudoku/icons` is deprecated. Use string
 * icon names with `<Icon icon="lucide:..." />` instead. Removed in a future major version.
 */
export * from "lucide-react";
