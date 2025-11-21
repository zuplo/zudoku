import * as Collapsible from "@radix-ui/react-collapsible";
import { deepEqual } from "fast-equals";
import { ChevronRightIcon } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useLocation, useMatch } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import type { NavigationPluginItem as NavigationPluginType } from "../../../config/validators/NavigationSchema.js";
import { cn } from "../../util/cn.js";
import { NavigationItem } from "./NavigationItem.js";
import { navigationListItem, useIsCategoryOpen } from "./utils.js";

const NavigationPluginInner = ({
  plugin,
  onRequestClose,
}: {
  plugin: NavigationPluginType;
  onRequestClose?: () => void;
}) => {
  const isCategoryOpen = useIsCategoryOpen(plugin);
  const [hasInteracted, setHasInteracted] = useState(false);
  const location = useLocation();

  const isCollapsible = true;
  const isCollapsed = false;
  const isDefaultOpen = Boolean(
    !isCollapsible || !isCollapsed || isCategoryOpen,
  );
  const [open, setOpen] = useState(isDefaultOpen);
  const isActive = useMatch(plugin.path ?? "");

  useEffect(() => {
    // this is triggered when an item from the navigation is clicked
    // and the navigation, enclosing this item, is not opened
    if (isCategoryOpen) {
      setOpen(true);
    }
  }, [isCategoryOpen]);

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

  const icon = plugin.icon && (
    <plugin.icon
      size={16}
      className={cn("align-[-0.125em] ", isActive && "text-primary")}
    />
  );

  const styles = navigationListItem({
    className: [
      "group text-start font-medium",
      isCollapsible || typeof plugin.path !== "undefined"
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
        <button
          type="button"
          onClick={() => setHasInteracted(true)}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") setHasInteracted(true);
          }}
          className={styles}
        >
          {icon}
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2 truncate w-full">{plugin.label}</div>
            {ToggleButton}
          </div>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content
        className={cn(
          // CollapsibleContent class is used to animate and it should only be applied when the user has triggered the toggle
          hasInteracted && "CollapsibleContent",
          // plugin.items.length === 0 && "hidden",
          "ms-6 my-1",
        )}
      >
        <ul className="relative after:absolute after:-start-(--padding-nav-item) after:translate-x-[1.5px] after:top-0 after:bottom-0 after:w-px after:bg-border">
          {plugin.items.map((item) => (
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

export const NavigationPlugin = memo(NavigationPluginInner, deepEqual);

NavigationPlugin.displayName = "NavigationPlugin";
