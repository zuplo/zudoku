import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { RefObject } from "react";
import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { Drawer, DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { NavigationFilterProvider } from "./NavigationFilterContext.js";
import { NavigationFrames } from "./NavigationFrames.js";
import { useNavigationFrame } from "./useNavigationFrame.js";
import { getItemPath } from "./utils.js";

export const MobileNavigationDrawer = ({
  id,
  direction,
  navigation,
  onOpenChange,
  open,
  topNavItem,
  triggerRef,
}: {
  id: string;
  direction: "left" | "right";
  navigation: NavigationItemType[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  topNavItem?: NavigationItemType;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) => {
  const frame = useNavigationFrame(navigation, topNavItem);
  const section = topNavItem
    ? (getItemPath(topNavItem) ?? topNavItem.label)
    : "";

  return (
    <Drawer direction={direction} open={open} onOpenChange={onOpenChange}>
      <NavigationFilterProvider resetKey={`${section}\n${frame.id}`}>
        <DrawerContent
          id={id}
          className="lg:hidden h-dvh inset-s-0 w-[320px] rounded-none"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <div className="p-4 overflow-y-auto overscroll-none">
            <VisuallyHidden>
              <DrawerTitle>Navigation</DrawerTitle>
            </VisuallyHidden>
            <NavigationFrames
              frame={frame}
              onRequestClose={() => onOpenChange(false)}
            />
          </div>
        </DrawerContent>
      </NavigationFilterProvider>
    </Drawer>
  );
};
