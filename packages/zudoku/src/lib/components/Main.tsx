import { PanelLeftIcon } from "lucide-react";
import { type PropsWithChildren, useState } from "react";
import { useNavigation } from "react-router";
import { Drawer, DrawerTrigger } from "zudoku/ui/Drawer.js";
import { cn } from "../util/cn.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { Navigation } from "./navigation/Navigation.js";
import { Slot } from "./Slot.js";

export const Main = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { navigation } = useCurrentNavigation();
  const hasNavigation = navigation.length > 0;
  const isNavigating = useNavigation().state === "loading";
  const { options } = useZudoku();

  return (
    <Drawer
      direction={options.site?.dir === "rtl" ? "right" : "left"}
      open={isDrawerOpen}
      onOpenChange={(open) => setDrawerOpen(open)}
    >
      {hasNavigation && (
        <Navigation
          onRequestClose={() => setDrawerOpen(false)}
          navigation={navigation}
        />
      )}
      {hasNavigation && (
        <div className="lg:hidden m-0 p-0 md:-mx-4 md:px-4 py-2 sticky bg-background/80 backdrop-blur-xs z-10 top-0 start-0 end-0 border-b">
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
          !hasNavigation && "col-span-full",
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
