import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { deepEqual } from "fast-equals";
import {
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import { Separator } from "zudoku/ui/Separator.js";
import { Skeleton } from "zudoku/ui/Skeleton.js";
import {
  isHeaderNavGroup,
  type HeaderNavItem,
  type HeaderNavLinkItem,
} from "../../config/validators/HeaderNavigationSchema.js";
import { useAuth } from "../authentication/hook.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/Collapsible.js";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/Drawer.js";
import { ClientOnly } from "./ClientOnly.js";
import { useCurrentNavigation, useZudoku } from "./context/ZudokuContext.js";
import { PoweredByZudoku } from "./navigation/PoweredByZudoku.js";
import { getFirstMatchingPath, shouldShowItem } from "./navigation/utils.js";
import { PageProgress } from "./PageProgress.js";
import { ThemeSwitch } from "./ThemeSwitch.js";

const MobileHeaderNavLink = ({
  item,
  onClick,
}: {
  item: HeaderNavLinkItem;
  onClick: () => void;
}) => {
  const Icon = item.icon as LucideIcon | undefined;
  return (
    <Link
      to={item.to}
      target={item.target}
      rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={onClick}
      className="flex items-center font-medium gap-2 py-2 text-foreground/80 hover:text-foreground"
    >
      {Icon && <Icon size={16} />}
      {item.label}
    </Link>
  );
};

const MobileHeaderNavItem = ({
  item,
  onNavigate,
}: {
  item: HeaderNavItem;
  onNavigate: () => void;
}) => {
  if ("to" in item) {
    const Icon = item.icon as LucideIcon | undefined;
    return (
      <li className="w-full">
        <Link
          to={item.to}
          target={item.target}
          rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
          onClick={onNavigate}
          className="flex items-center gap-2 py-2 text-base font-medium"
        >
          {Icon && <Icon size={16} />}
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="w-full">
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-base font-medium group">
          {item.label}
          <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col border-l ms-1 ps-3 my-1">
            {item.items.map((subItem) =>
              isHeaderNavGroup(subItem) ? (
                <li key={subItem.label} className="flex flex-col">
                  <div className="text-sm text-muted-foreground py-2">
                    {subItem.label}
                  </div>
                  {subItem.items.map((link) => (
                    <MobileHeaderNavLink
                      key={link.to}
                      item={link}
                      onClick={onNavigate}
                    />
                  ))}
                </li>
              ) : (
                <li key={subItem.to}>
                  <MobileHeaderNavLink item={subItem} onClick={onNavigate} />
                </li>
              ),
            )}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};

export const MobileTopNavigation = () => {
  const context = useZudoku();
  const authState = useAuth();
  const location = useLocation();
  const currentNav = useCurrentNavigation();

  const {
    options: { header, navigation = [], site },
    getProfileMenuItems,
  } = context;
  const headerNavigation = header?.navigation ?? [];
  const { isAuthenticated, profile, isAuthEnabled } = authState;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accountItems = getProfileMenuItems();
  const filteredItems = navigation.filter(
    shouldShowItem({ auth: authState, context }),
  );

  return (
    <Drawer
      direction={site?.dir === "rtl" ? "left" : "right"}
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
    >
      <div className="flex lg:hidden justify-self-end">
        <DrawerTrigger className="lg:hidden" aria-label="Open navigation menu">
          <MenuIcon size={22} aria-hidden="true" />
        </DrawerTrigger>
        <PageProgress />
      </div>
      <DrawerContent
        className="lg:hidden h-dvh inset-e-0 start-auto w-[340px] rounded-none"
        aria-describedby={undefined}
      >
        <div className="py-2 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto overscroll-none">
            <VisuallyHidden>
              <DrawerTitle>Navigation</DrawerTitle>
            </VisuallyHidden>
            <ul className="flex flex-col gap-1 px-4">
              {headerNavigation.map((item) => (
                <MobileHeaderNavItem
                  key={item.label}
                  item={item}
                  onNavigate={() => setDrawerOpen(false)}
                />
              ))}
              {headerNavigation.length > 0 && <Separator className="my-2" />}

              {filteredItems.map((item) => {
                if (item.type === "separator") {
                  return <Separator className="my-2" key={item.label} />;
                }
                if (item.type === "section" || item.type === "filter") {
                  return null;
                }
                const path = getFirstMatchingPath(item);
                const isActive = deepEqual(currentNav.topNavItem, item);
                return (
                  <li key={item.label}>
                    <Link
                      to={path}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-2 py-2 text-base font-medium ${isActive ? "text-foreground" : "text-foreground/75 hover:text-foreground"}`}
                    >
                      {item.icon && <item.icon size={16} />}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {isAuthEnabled && isAuthenticated && (
                <ClientOnly
                  fallback={<Skeleton className="rounded-sm h-5 w-24" />}
                >
                  <Separator className="my-2" />
                  <li className="py-2">
                    <div className="text-base font-medium">
                      {profile?.name ?? "My Account"}
                    </div>
                    {profile?.email && profile.email !== profile?.name && (
                      <div className="text-sm text-muted-foreground">
                        {profile.email}
                      </div>
                    )}
                  </li>
                  {accountItems.map((i) => (
                    <li key={i.label}>
                      <Link
                        to={i.path ?? ""}
                        target={i.target}
                        rel={
                          i.target === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center py-2 text-base font-medium text-foreground/75 hover:text-foreground"
                      >
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ClientOnly>
              )}
            </ul>
          </div>
          <div className="border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {isAuthEnabled && (
                <ClientOnly
                  fallback={<Skeleton className="rounded-sm h-8 w-16" />}
                >
                  {isAuthenticated ? (
                    <Button asChild variant="outline">
                      <Link
                        to="/signout"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-2"
                      >
                        <LogOutIcon
                          size={16}
                          strokeWidth={1}
                          absoluteStrokeWidth
                        />
                        Logout
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link
                        to={`/signin?redirect=${encodeURIComponent(location.pathname)}`}
                        onClick={() => setDrawerOpen(false)}
                      >
                        Login
                      </Link>
                    </Button>
                  )}
                </ClientOnly>
              )}
              <ThemeSwitch />
            </div>
            {site?.showPoweredBy !== false && (
              <PoweredByZudoku className="grow-0 justify-center gap-1" />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
