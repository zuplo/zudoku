import { PanelLeftIcon } from "lucide-react";
import { type PropsWithChildren, useState } from "react";
import { useNavigation } from "react-router";
import { Drawer, DrawerTrigger } from "zudoku/ui/Drawer.js";
import { cn } from "../util/cn.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { Sidebar } from "./navigation/Sidebar.js";
import { Slot } from "./Slot.js";

export const Main = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { sidebar } = useCurrentNavigation();
  const hasSidebar = sidebar.length > 0;
  const isNavigating = useNavigation().state === "loading";
  const { options } = useZudoku();

  return (
    <Drawer
      direction={options.page?.dir === "rtl" ? "right" : "left"}
      open={isDrawerOpen}
      onOpenChange={(open) => setDrawerOpen(open)}
    >
      {hasSidebar && (
        <Sidebar
          onRequestClose={() => setDrawerOpen(false)}
          sidebar={sidebar}
        />
      )}
      {hasSidebar && (
        <div className="lg:hidden -mx-4 px-4 py-2 sticky bg-background/80 backdrop-blur-xs z-10 top-0 start-0 end-0 border-b">
          <DrawerTrigger className="flex items-center gap-2 px-4">
            <PanelLeftIcon size={16} strokeWidth={1.5} />
            <span className="text-sm">Menu</span>
          </DrawerTrigger>
        </div>
      )}
      <main
        data-pagefind-body
        className={cn(
          "px-4 lg:pe-8 lg:px-8",
          !hasSidebar && "col-span-full",
          isNavigating && "animate-pulse",
        )}
      >
        <Slot.Target name="content-before" />
        {children}
        <Slot.Target name="content-after" />
      </main>
    </Drawer>
  );
};
