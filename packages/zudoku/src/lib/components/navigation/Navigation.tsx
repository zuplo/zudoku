import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { Slot } from "../Slot.js";
import { NavigationFilterProvider } from "./NavigationFilterContext.js";
import { NavigationItem } from "./NavigationItem.js";
import { NavigationWrapper } from "./NavigationWrapper.js";

export const Navigation = ({
  onRequestClose,
  navigation,
}: {
  onRequestClose?: () => void;
  navigation: NavigationItemType[];
}) => (
  <NavigationFilterProvider>
    <NavigationWrapper>
      <Slot.Target name="navigation-before" />
      {navigation.map((item) => (
        <NavigationItem
          key={
            item.type +
            (item.label ?? "") +
            ("path" in item ? item.path : "") +
            ("file" in item ? item.file : "") +
            ("to" in item ? item.to : "")
          }
          item={item}
        />
      ))}
      <Slot.Target name="navigation-after" />
    </NavigationWrapper>
    <DrawerContent
      className="lg:hidden h-dvh start-0 w-[320px] rounded-none"
      aria-describedby={undefined}
    >
      <div className="p-4 overflow-y-auto overscroll-none">
        <VisuallyHidden>
          <DrawerTitle>Navigation</DrawerTitle>
        </VisuallyHidden>
        {navigation.map((item) => (
          <NavigationItem
            key={item.label}
            item={item}
            onRequestClose={onRequestClose}
          />
        ))}
      </div>
    </DrawerContent>
  </NavigationFilterProvider>
);
