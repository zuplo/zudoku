import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { Slot } from "../Slot.js";
import { NavigationFilterProvider } from "./NavigationFilterContext.js";
import { NavigationFrames } from "./NavigationFrames.js";
import { NavigationWrapper } from "./NavigationWrapper.js";
import { useNavigationFrame } from "./useNavigationFrame.js";
import { sectionLanding } from "./utils.js";

export const Navigation = ({
  onRequestClose,
  navigation,
  topNavItem,
}: {
  onRequestClose?: () => void;
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
      <DrawerContent
        className="lg:hidden h-dvh inset-s-0 w-[320px] rounded-none"
        aria-describedby={undefined}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-4 overflow-y-auto overscroll-none">
          <VisuallyHidden>
            <DrawerTitle>Navigation</DrawerTitle>
          </VisuallyHidden>
          <NavigationFrames
            frame={frame}
            section={section}
            onRequestClose={onRequestClose}
          />
        </div>
      </DrawerContent>
    </NavigationFilterProvider>
  );
};
