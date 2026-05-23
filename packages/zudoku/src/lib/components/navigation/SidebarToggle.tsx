import { PanelLeftIcon, PanelRightCloseIcon } from "lucide-react";
import { cn } from "../../util/cn.js";
import { useSidebar } from "./sidebarStore.js";

export const SidebarToggle = () => {
  const isCollapsed = useSidebar((s) => s.isCollapsed);
  const toggle = useSidebar((s) => s.toggle);

  return (
    <div
      className={cn(
        "hidden lg:block col-start-1 row-start-1",
        "sticky top-(--header-height) h-[calc(100vh-var(--header-height))] pointer-events-none",
      )}
    >
      <button
        type="button"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={toggle}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
        className={cn(
          "pointer-events-auto absolute bottom-[15%] -translate-y-1/2 border rounded-full",
          "flex items-center justify-center",
          "bg-background text-muted-foreground shadow-sm",
          "hover:bg-accent hover:text-foreground",
          "transition-all duration-200 ease-out motion-reduce:transition-none",
          isCollapsed
            ? "size-10 left-[max(-16px,calc(16px-max(0px,(100vw-1536px)/2)))] opacity-80 hover:opacity-100 hover:scale-115"
            : "size-6 left-[calc(var(--side-nav-width)-12px)]",
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
