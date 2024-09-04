import { useRef } from "react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { useNavigation } from "../context/ZudokuContext.js";
import { Slotlet } from "../SlotletProvider.js";
import { SidebarItem } from "./SidebarItem.js";
import { SidebarWrapper } from "./SidebarWrapper.js";

export const Sidebar = () => {
  const navRef = useRef<HTMLDivElement | null>(null);
  const navigation = useNavigation();

  return (
    <>
      <SidebarWrapper
        ref={navRef}
        pushMainContent={navigation.data.items.length > 0}
      >
        <Slotlet name="zudoku-before-navigation" />
        {navigation.data.items.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
        <Slotlet name="zudoku-after-navigation" />
      </SidebarWrapper>
      <DrawerContent
        className="lg:hidden h-screen left-0 p-6 w-[320px] rounded-none"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DrawerTitle>Sidebar</DrawerTitle>
        </VisuallyHidden>
        {navigation.data.items.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </DrawerContent>
    </>
  );
};
