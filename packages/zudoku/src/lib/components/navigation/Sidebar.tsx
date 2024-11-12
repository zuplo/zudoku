import { useRef } from "react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { useCurrentNavigation } from "../context/ZudokuContext.js";
import { Slotlet } from "../SlotletProvider.js";
import { SidebarItem } from "./SidebarItem.js";
import { SidebarWrapper } from "./SidebarWrapper.js";

export const Sidebar = () => {
  const navRef = useRef<HTMLDivElement | null>(null);
  const navigation = useCurrentNavigation();

  return (
    <>
      <SidebarWrapper
        ref={navRef}
        pushMainContent={navigation.data.sidebar.length > 0}
      >
        <Slotlet name="zudoku-before-navigation" />
        {navigation.data.sidebar.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
        <Slotlet name="zudoku-after-navigation" />
      </SidebarWrapper>
      <DrawerContent
        className="lg:hidden h-screen left-0 p-6 w-[320px] rounded-none overflow-auto"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DrawerTitle>Sidebar</DrawerTitle>
        </VisuallyHidden>
        {navigation.data.sidebar.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </DrawerContent>
    </>
  );
};
