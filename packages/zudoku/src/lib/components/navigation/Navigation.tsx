import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { Slot } from "../Slot.js";
import { NavigationFilterProvider } from "./NavigationFilterContext.js";
import { NavigationFrames } from "./NavigationFrames.js";
import { NavigationWrapper } from "./NavigationWrapper.js";
import { useNavigationFrame } from "./useNavigationFrame.js";
import { getItemPath } from "./utils.js";

export const Navigation = ({
  navigation,
  topNavItem,
}: {
  onRequestClose?: () => void;
  navigation: NavigationItemType[];
  topNavItem?: NavigationItemType;
}) => {
  const frame = useNavigationFrame(navigation, topNavItem);
  const section = topNavItem
    ? (getItemPath(topNavItem) ?? topNavItem.label)
    : "";

  return (
    <NavigationFilterProvider resetKey={`${section}\n${frame.id}`}>
      <NavigationWrapper>
        <Slot.Target name="navigation-before" />
        <NavigationFrames frame={frame} />
        <Slot.Target name="navigation-after" />
      </NavigationWrapper>
    </NavigationFilterProvider>
  );
};
