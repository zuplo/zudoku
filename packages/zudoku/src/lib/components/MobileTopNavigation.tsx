import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cx } from "class-variance-authority";
import { MenuIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/Drawer.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { Search } from "./Search.js";

export const MobileTopNavigation = () => {
  const { topNavigation } = useZudoku();
  return (
    <Drawer direction="right">
      <div className="flex lg:hidden justify-self-end">
        <DrawerTrigger className="lg:hidden">
          <MenuIcon size={22} />
        </DrawerTrigger>
      </div>
      <DrawerContent
        className="lg:hidden h-screen right-0 left-auto w-[320px] rounded-none"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DrawerTitle>Navigation</DrawerTitle>
        </VisuallyHidden>
        <div className="flex p-4">
          <Search />
        </div>
        <ul className="flex flex-col items-center gap-4 p-4">
          {topNavigation.map((item) => (
            <li key={item.label}>
              <NavLink
                className={({ isActive }) =>
                  cx(
                    "block font-medium border-b-2",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground/75 hover:text-foreground hover:border-accent-foreground/25",
                  )
                }
                to={item.id}
              >
                <DrawerClose>{item.label}</DrawerClose>
              </NavLink>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
};
