import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { Slot } from "../Slot.js";
import { NavigationFilterProvider } from "./NavigationFilterContext.js";
import { NavigationFrames } from "./NavigationFrames.js";
import { NavigationWrapper } from "./NavigationWrapper.js";
import { useNavigationFrame } from "./useNavigationFrame.js";
import { sectionLanding } from "./utils.js";

export const Navigation = ({
  navigation,
  topNavItem,
}: {
  navigation: NavigationItemType[];
  topNavItem?: NavigationItemType;
}) => {
  const frame = useNavigationFrame(navigation, topNavItem);
  // Linkless sections fall back to their first page, so two sections with the
  // same label still get distinct keys.
  const section = topNavItem
    ? sectionLanding(topNavItem) || topNavItem.label
    : "";

  return (
    <NavigationFilterProvider resetKey={`${section}\n${frame.id}`}>
      <NavigationWrapper>
        <Slot.Target name="navigation-before" />
        <NavigationFrames frame={frame} section={section} />
        <Slot.Target name="navigation-after" />
      </NavigationWrapper>
    </NavigationFilterProvider>
  );
};
