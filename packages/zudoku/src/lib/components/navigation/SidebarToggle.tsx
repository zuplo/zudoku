import { PanelLeftIcon, PanelRightCloseIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "../../util/cn.js";
import { useZudoku } from "../context/ZudokuContext.js";
import { useSidebar } from "./sidebarStore.js";

const POSITION_TO_Y = {
  top: "15%",
  center: "50%",
  bottom: "85%",
} as const;

export const SidebarToggle = () => {
  const isCollapsed = useSidebar((s) => s.isCollapsed);
  const toggle = useSidebar((s) => s.toggle);
  const { options } = useZudoku();
  const visibility = options.site?.sidebar?.toggleVisibility ?? "always";
  const position = options.site?.sidebar?.togglePosition ?? "bottom";

  const hoverHidden = visibility === "hover" && !isCollapsed;

  return (
    <div
      className={cn(
        "hidden lg:block col-start-1 row-start-1 group/sidebar-hit",
        "sticky top-(--header-height) h-[calc(100vh-var(--header-height))] pointer-events-none",
      )}
      style={
        {
          "--sidebar-toggle-y-default": POSITION_TO_Y[position],
        } as CSSProperties
      }
    >
      {hoverHidden && (
        <div
          aria-hidden
          className="pointer-events-auto absolute inset-y-0 left-[calc(var(--side-nav-width)-8px)] w-4"
        />
      )}
      <button
        type="button"
        data-sidebar-toggle
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={toggle}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
        className={cn(
          "pointer-events-auto absolute top-(--sidebar-toggle-y,var(--sidebar-toggle-y-default)) -translate-y-1/2 border rounded-full",
          "flex items-center justify-center",
          "bg-background text-muted-foreground shadow-sm",
          "hover:bg-accent hover:text-foreground",
          "transition-all duration-200 ease-out motion-reduce:transition-none",
          isCollapsed
            ? "size-10 left-[max(-16px,calc(16px-max(0px,(100vw-1536px)/2)))] opacity-80 hover:opacity-100 hover:scale-115"
            : "size-6 left-[calc(var(--side-nav-width)-12px)]",
          hoverHidden &&
            "[@media(hover:hover)]:opacity-0 group-hover/sidebar-hit:opacity-100 focus-visible:opacity-100",
        )}
      >
        {isCollapsed ? (
          <PanelRightCloseIcon size={18} strokeWidth={2} />
        ) : (
          <PanelLeftIcon size={12} strokeWidth={2} />
        )}
      </button>
    </div>
  );
};
