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
  const [hasInteracted, setHasInteracted] = useState(false);

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
        setHasInteracted(true);
      }}
    >
      <ChevronRightIcon
        size={16}
        className={cn(
          hasInteracted && "transition",
          "shrink-0 group-data-[state=open]:rotate-90",
        )}
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
      <Collapsible.Trigger className="group" asChild disabled={!isCollapsible}>
        <div
          className={cn(
            "text-start",
            navigationListItem({ isActive: false, isTopLevel: level === 0 }),
            isCollapsible
              ? "cursor-pointer"
              : "cursor-default hover:bg-transparent",
          )}
        >
          {category.icon && (
            <category.icon
              size={16}
              className="align-[-0.125em] -translate-x-1"
            />
          )}
          {category.link?.type === "doc" ? (
            <NavLink
              to={joinPath(topNavItem?.id, category.link.id)}
              className="flex-1"
              onClick={() => setHasInteracted(true)}
            >
              {({ isActive }) => (
                <div
                  className={cn(
                    "flex items-center gap-2 justify-between w-full",
                    isActive
                      ? "text-primary font-medium"
                      : "text-foreground/80",
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
        </div>
      </Collapsible.Trigger>
      <Collapsible.Content
        className={cn(
          // CollapsibleContent class is used to animate and it should only be applied when the user has triggered the toggle
          hasInteracted && "CollapsibleContent",
          "ms-[calc(var(--padding-nav-item)*1.125)]",
        )}
      >
        <ul className="mt-1 border-l ps-2">
          {category.items.map((item) => (
            <SidebarItem
              key={
                ("id" in item ? item.id : "") +
                ("href" in item ? item.href : "") +
                item.label
              }
              level={level + 1}
              item={item}
            />
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
