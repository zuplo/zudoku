import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { SidebarItem as SidebarItemType } from "../../../config/validators/SidebarSchema.js";
import { DrawerContent, DrawerTitle } from "../../ui/Drawer.js";
import { Slotlet } from "../SlotletProvider.js";
import { SidebarItem } from "./SidebarItem.js";
import { SidebarWrapper } from "./SidebarWrapper.js";

export const Sidebar = ({
  onRequestClose,
  sidebar,
}: {
  onRequestClose?: () => void;
  sidebar: SidebarItemType[];
}) => (
  <>
    <SidebarWrapper>
      <Slotlet name="zudoku-before-navigation" />
      {sidebar.map((item) => (
        <SidebarItem
          key={
            ("id" in item ? item.id : "") +
            ("href" in item ? item.href : "") +
            item.label
          }
          item={item}
        />
      ))}
      <Slotlet name="zudoku-after-navigation" />
    </SidebarWrapper>
    <DrawerContent
      className="lg:hidden h-[100dvh] left-0 w-[320px] rounded-none"
      aria-describedby={undefined}
    >
      <div className="p-4 overflow-y-auto overscroll-none">
        <VisuallyHidden>
          <DrawerTitle>Sidebar</DrawerTitle>
        </VisuallyHidden>
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
