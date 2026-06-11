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
import {
  navigationItemKey,
  navigationListItem,
  useIsCategoryOpen,
} from "./utils.js";

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
  const linkHref = category.link
    ? category.link.type === "doc"
      ? category.link.path
      : category.link.to
    : "";
  const match = useMatch(linkHref);
  const isActive = category.link ? match : false;

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
      aria-label={open ? "Collapse section" : "Expand section"}
      aria-expanded={open}
      className="size-6 hover:bg-[hsl(from_var(--accent)_h_s_calc(l+6*var(--dark)))]"
    >
      <ChevronRightIcon
        size={16}
        aria-hidden="true"
        className={cn(
          hasInteracted && "transition",
          "shrink-0 group-data-[state=open]:rotate-90 rtl:rotate-180",
        )}
      />
    </Button>
  );

  const icon = category.icon && (
    <category.icon
      className={cn(
        "size-4 shrink-0 align-[-0.125em]",
        isActive && "text-primary",
      )}
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
      onOpenChange={(value) => {
        // Categories with a link navigate on row click, so they only open here
        // (closing is done via the chevron). Without a link the row toggles.
        setOpen(category.link ? true : value);
        setHasInteracted(true);
      }}
    >
      <Collapsible.Trigger className="group" asChild disabled={!isCollapsible}>
        {category.link ? (
          <NavLink
            to={{
              pathname: joinUrl(linkHref),
              search: location.search,
            }}
            className={styles}
            onClick={() => {
              // if it is the current path and closed then open it because there's no path change to trigger the open
              if (isActive && !open) {
                setHasInteracted(true);
                setOpen(true);
              }
            }}
          >
            {({ isActive: linkActive, isPending }) => (
              <>
                {icon}
                <div
                  className={cn(
                    "flex items-center gap-2 justify-between w-full text-foreground/80",
                    (linkActive || isPending) && "text-primary",
                  )}
                >
                  <div className="truncate">{category.label}</div>
                  {ToggleButton}
                </div>
              </>
            )}
          </NavLink>
        ) : (
          <div className={styles}>
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
        onAnimationEnd={() => setHasInteracted(false)}
      >
        <ul className="relative after:absolute after:-inset-s-(--padding-nav-item) after:translate-x-[1.5px] after:top-0 after:bottom-0 after:w-px after:bg-border">
          {category.items.map((item) => (
            <NavigationItem
              key={navigationItemKey(item)}
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
