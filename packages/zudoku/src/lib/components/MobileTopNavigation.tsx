import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MenuIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { Skeleton } from "zudoku/ui/Skeleton.js";
import { useAuth } from "../authentication/hook.js";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/Drawer.js";
import { ClientOnly } from "./ClientOnly.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { PoweredByZudoku } from "./navigation/PoweredByZudoku.js";
import { isHiddenItem } from "./navigation/utils.js";
import { PageProgress } from "./PageProgress.js";
import { Search } from "./Search.js";
import { Slot } from "./Slot.js";
import { ThemeSwitch } from "./ThemeSwitch.js";
import { TopNavItem, TopNavLink } from "./TopNavigation.js";

export const MobileTopNavigation = () => {
  const { navigation, options, getProfileMenuItems } = useZudoku();
  const { isAuthenticated, profile, isAuthEnabled, login } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accountItems = getProfileMenuItems();
  const filteredItems = navigation.filter(isHiddenItem(isAuthenticated));

  return (
    <Drawer
      direction={options.site?.dir === "rtl" ? "left" : "right"}
      open={drawerOpen}
      onOpenChange={(open) => setDrawerOpen(open)}
    >
      <div className="flex lg:hidden justify-self-end">
        <DrawerTrigger className="lg:hidden">
          <MenuIcon size={22} />
        </DrawerTrigger>
        <PageProgress />
      </div>
      <DrawerContent
        className="lg:hidden h-[100dvh] end-0 start-auto w-[320px] rounded-none"
        aria-describedby={undefined}
      >
        <div className="p-4 overflow-y-auto overscroll-none h-full flex flex-col justify-between">
          <div>
            <VisuallyHidden>
              <DrawerTitle>Navigation</DrawerTitle>
            </VisuallyHidden>
            <Search className="flex p-4" />
            <ul className="flex flex-col items-center gap-4 p-4">
              <li className="empty:hidden">
                <Slot.Target name="top-navigation-side" />
              </li>

              {isAuthEnabled && (
                <ClientOnly
                  fallback={<Skeleton className="rounded-sm h-5 w-24 mr-4" />}
                >
                  {!isAuthenticated ? (
                    <li>
                      <TopNavLink
                        to="/signin"
                        onClick={() => setDrawerOpen(false)}
                      >
                        Login
                      </TopNavLink>
                    </li>
                  ) : (
                    Object.values(getProfileMenuItems()).length > 0 && (
                      <Fragment>
                        <li>
                          {profile?.name ? `${profile.name}` : "My Account"}
                          {profile?.email && (
                            <div className="font-normal text-muted-foreground">
                              {profile.email}
                            </div>
                          )}
                        </li>
                      </Fragment>
                    )
                  )}
                </ClientOnly>
              )}
              {filteredItems.map((item) => (
                <li key={item.label}>
                  <button type="button" onClick={() => setDrawerOpen(false)}>
                    <TopNavItem {...item} />
                  </button>
                </li>
              ))}
              {isAuthEnabled && isAuthenticated && accountItems.length > 0 && (
                <ClientOnly
                  fallback={<Skeleton className="rounded-sm h-5 w-24 mr-4" />}
                >
                  {accountItems.map((i) => (
                    <li key={i.label}>
                      <TopNavLink
                        to={i.path ?? ""}
                        onClick={() => setDrawerOpen(false)}
                      >
                        {i.label}
                      </TopNavLink>
                    </li>
                  ))}
                </ClientOnly>
              )}
              <li>
                <ThemeSwitch />
              </li>
            </ul>
          </div>
          {options.site?.showPoweredBy !== false && (
            <PoweredByZudoku className="grow-0 justify-center gap-1" />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
