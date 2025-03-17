import { useEffect, useRef } from "react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { SidebarItem as SidebarItemType } from "../../../config/validators/SidebarSchema.js";
import { DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { scrollIntoViewIfNeeded } from "../../util/scrollIntoViewIfNeeded.js";
import { useZudoku } from "../context/ZudokuContext.js";
import { Search } from "../Search.js";
import { Slotlet } from "../SlotletProvider.js";
import { SideNavigation } from "../TopNavigation.js";
import { SidebarItem } from "./SidebarItem.js";
import { SidebarWrapper } from "./SidebarWrapper.js";

export const Sidebar = ({
  onRequestClose,
  sidebar,
}: {
  onRequestClose?: () => void;
  sidebar: SidebarItemType[];
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const { page } = useZudoku();

  useEffect(() => {
    const active = navRef.current?.querySelector('[aria-current="page"]');
    scrollIntoViewIfNeeded(active ?? null);
  }, []);

  return (
    <>
      <SidebarWrapper ref={navRef}>
        <Slotlet name="zudoku-before-navigation" />
        {page?.layout === "wide" && <SideNavigation />}
        {sidebar.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
        <Slotlet name="zudoku-after-navigation" />
      </SidebarWrapper>
      <DrawerContent
        className="lg:hidden h-[100dvh] right-0 left-auto w-[320px] rounded-none"
        aria-describedby={undefined}
      >
        <div className="p-4 overflow-y-auto overscroll-none">
          <VisuallyHidden>
            <DrawerTitle>Sidebar</DrawerTitle>
          </VisuallyHidden>
          <Search className="mb-4" />
          <SideNavigation />
          {sidebar.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              onRequestClose={onRequestClose}
            />
          ))}
        </div>
      </DrawerContent>
    </>
  );
};
