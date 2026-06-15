export { addIcon, iconLoaded } from "@iconify/react";
export {
  configureIconRuntimeFetch,
  Icon,
  type IconInput,
  type ZudokuIconProps,
} from "./components/ZudokuIcon.js";
export * from "./MissingIcon.js";

/**
 * @deprecated Import lucide components from `zudoku/icons` is deprecated. Use string icon
 * names with `<Icon icon="lucide:..." />` instead. This re-export will be removed in a
 * future major version.
 */
export * from "lucide-react";
