import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { Slot } from "../Slot.js";
import { NavigationItem } from "./NavigationItem.js";
import { NavigationWrapper } from "./NavigationWrapper.js";

export const Navigation = ({
  onRequestClose,
  navigation,
}: {
  onRequestClose?: () => void;
  navigation: NavigationItemType[];
}) => (
  <>
    <NavigationWrapper>
      <Slot.Target name="navigation-before" />
      {navigation.map((item) => (
        <NavigationItem
          key={
            item.type +
            ("id" in item ? item.id : "") +
            ("href" in item ? item.href : "") +
            item.label
          }
          item={item}
        />
      ))}
      <Slot.Target name="navigation-after" />
    </NavigationWrapper>
    <DrawerContent
      className="lg:hidden h-[100dvh] start-0 w-[320px] rounded-none"
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
  </>
);
