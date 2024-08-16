import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import type { SidebarItemCategory } from "../../../config/validators/SidebarSchema.js";
import { cn } from "../../util/cn.js";
import { joinPath } from "../../util/joinPath.js";
import { useTopNavigationItem } from "../context/ZudokuContext.js";
import { navigationListItem, SidebarItem } from "./SidebarItem.js";
import { useIsCategoryOpen } from "./utils.js";

export const SidebarCategory = ({
  category,
  level,
}: {
  category: SidebarItemCategory;
  level: number;
}) => {
  const topNavItem = useTopNavigationItem();
  const isCategoryOpen = useIsCategoryOpen(category);

  const isCollapsible = category.collapsible ?? true;
  const isCollapsed = category.collapsed ?? true;
  const isDefaultOpen = Boolean(
    !isCollapsible || !isCollapsed || isCategoryOpen,
  );
  const [open, setOpen] = useState(isDefaultOpen);

  useEffect(() => {
    // this is triggered when an item from the sidebar is clicked
    // and the sidebar, enclosing this item, is not opened
    if (isCategoryOpen) {
      setOpen(true);
    }
  }, [isCategoryOpen]);

  const ToggleButton = isCollapsible && (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setOpen((prev) => !prev);
      }}
    >
      <ChevronRightIcon
        size={16}
        className="transition shrink-0 group-data-[state=open]:rotate-90"
      />
    </button>
  );

  return (
    <Collapsible.Root
      className={cn("flex flex-col", level === 0 && "-mx-[--padding-nav-item]")}
      defaultOpen={isDefaultOpen}
      open={open}
      onOpenChange={() => setOpen(true)}
    >
      <Collapsible.Trigger
        className={cn(
          "group text-start",
          navigationListItem({ isActive: false, isTopLevel: level === 0 }),
          isCollapsible
            ? "cursor-pointer"
            : "cursor-default hover:bg-transparent",
        )}
        asChild
        disabled={!isCollapsible}
      >
        {category.link?.type === "doc" ? (
          <NavLink to={joinPath(topNavItem?.id, category.link.id)}>
            {({ isActive }) => (
              <div
                className={cn(
                  "flex items-center gap-2 justify-between w-full",
                  isActive ? "text-primary font-medium" : "text-foreground/80",
                )}
              >
                <div className="truncate">{category.label}</div>
                {ToggleButton}
              </div>
            )}
          </NavLink>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2 truncate w-full">{category.label}</div>
            {ToggleButton}
          </div>
        )}
      </Collapsible.Trigger>
      <Collapsible.Content className="CollapsibleContent ms-[calc(var(--padding-nav-item)*1.125)]">
        <ul className="mt-1 border-l ps-2">
          {category.items.map((item) => (
            <SidebarItem
              key={item.label}
              level={level + 1}
              item={item}
              // activeAnchor={activeAnchor}
            />
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
