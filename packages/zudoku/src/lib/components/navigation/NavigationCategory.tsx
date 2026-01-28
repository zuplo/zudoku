import * as Collapsible from "@radix-ui/react-collapsible";
import { deepEqual } from "fast-equals";
import { ChevronRightIcon } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { NavLink, useLocation, useMatch } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import type { NavigationCategory as NavigationCategoryType } from "../../../config/validators/NavigationSchema.js";
import { cn } from "../../util/cn.js";
import { joinUrl } from "../../util/joinUrl.js";
import { useNavigationFilter } from "./NavigationFilterContext.js";
import { NavigationItem } from "./NavigationItem.js";
import { navigationListItem, useIsCategoryOpen } from "./utils.js";

const NavigationCategoryInner = ({
  category,
  onRequestClose,
}: {
  category: NavigationCategoryType;
  onRequestClose?: () => void;
}) => {
  const isCategoryOpen = useIsCategoryOpen(category);
  const [hasInteracted, setHasInteracted] = useState(false);
  const location = useLocation();
  const { query: filterQuery } = useNavigationFilter();

  const isCollapsible = category.collapsible ?? true;
  const isCollapsed = category.collapsed ?? true;
  const isDefaultOpen = Boolean(
    !isCollapsible || !isCollapsed || isCategoryOpen,
  );
  const [open, setOpen] = useState(isDefaultOpen);
  const isActive = useMatch(category.link?.path ?? "");

  useEffect(() => {
    // this is triggered when an item from the navigation is clicked
    // and the navigation, enclosing this item, is not opened
    if (isCategoryOpen) {
      setOpen(true);
    }
  }, [isCategoryOpen]);

  // Auto-expand when there's an active filter query
  useEffect(() => {
    if (filterQuery.trim()) {
      setOpen(true);
    }
  }, [filterQuery]);

  const ToggleButton = isCollapsible && (
    <Button
      onClick={(e) => {
        e.preventDefault();
        setOpen((prev) => !prev);
        setHasInteracted(true);
      }}
      variant="ghost"
      size="icon"
      className="size-6 hover:bg-[hsl(from_var(--accent)_h_s_calc(l+6*var(--dark)))]"
    >
      <ChevronRightIcon
        size={16}
        className={cn(
          hasInteracted && "transition",
          "shrink-0 group-data-[state=open]:rotate-90 rtl:rotate-180",
        )}
      />
    </Button>
  );

  const icon = category.icon && (
    <category.icon
      size={16}
      className={cn("align-[-0.125em] ", isActive && "text-primary")}
    />
  );

  const styles = navigationListItem({
    className: [
      "group text-start font-medium",
      isCollapsible || typeof category.link !== "undefined"
        ? "cursor-pointer"
        : "cursor-default hover:bg-transparent",
    ],
  });

  return (
    <Collapsible.Root
      className="flex flex-col"
      defaultOpen={isDefaultOpen}
      open={open}
      onOpenChange={() => setOpen(true)}
    >
      <Collapsible.Trigger className="group" asChild disabled={!isCollapsible}>
        {category.link?.type === "doc" ? (
          <NavLink
            to={{
              pathname: joinUrl(category.link.path),
              search: location.search,
            }}
            className={styles}
            onClick={() => {
              setHasInteracted(true);
              // if it is the current path and closed then open it because there's no path change to trigger the open
              if (isActive && !open) {
                setOpen(true);
              }
            }}
          >
            {icon}
            <div className="flex items-center gap-2 justify-between w-full text-foreground/80 group-aria-[current='page']:text-primary">
              <div className="truncate">{category.label}</div>
              {ToggleButton}
            </div>
          </NavLink>
        ) : (
          // biome-ignore lint/a11y/noStaticElementInteractions: This is only to track if the user has interacted
          <div
            onClick={() => setHasInteracted(true)}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") setHasInteracted(true);
            }}
            className={styles}
          >
            {icon}
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2 truncate w-full">{category.label}</div>
              {ToggleButton}
            </div>
          </div>
        )}
      </Collapsible.Trigger>
      <Collapsible.Content
        className={cn(
          // CollapsibleContent class is used to animate and it should only be applied when the user has triggered the toggle
          hasInteracted && "CollapsibleContent",
          category.items.length === 0 && "hidden",
          "ms-6 my-1",
        )}
      >
        <ul className="relative after:absolute after:-start-(--padding-nav-item) after:translate-x-[1.5px] after:top-0 after:bottom-0 after:w-px after:bg-border">
          {category.items.map((item) => (
            <NavigationItem
              key={
                item.type +
                (item.label ?? "") +
                ("path" in item ? item.path : "") +
                ("file" in item ? item.file : "") +
                ("to" in item ? item.to : "")
              }
              onRequestClose={onRequestClose}
              item={item}
            />
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

export const NavigationCategory = memo(NavigationCategoryInner, deepEqual);

NavigationCategory.displayName = "NavigationCategory";
