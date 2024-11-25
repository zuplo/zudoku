import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "zudoku/ui/Button.js";
import { Skeleton } from "zudoku/ui/Skeleton.js";
import { useAuth } from "../authentication/hook.js";
import { isProfileMenuPlugin, ProfileNavigationItem } from "../core/plugins.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu.js";
import { joinPath } from "../util/joinPath.js";
import { Banner } from "./Banner.js";
import { ClientOnly } from "./ClientOnly.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { MobileTopNavigation } from "./MobileTopNavigation.js";
import { Search } from "./Search.js";
import { Slotlet } from "./SlotletProvider.js";
import { ThemeSwitch } from "./ThemeSwitch.js";
import { TopNavigation } from "./TopNavigation.js";

const RecursiveMenu = ({ item }: { item: ProfileNavigationItem }) => {
  return item.children ? (
    <DropdownMenuSub key={item.label}>
      <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {item.children.map((item, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <RecursiveMenu key={i} item={item} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  ) : (
    <Link to={item.path ?? ""}>
      <DropdownMenuItem key={item.label}>{item.label}</DropdownMenuItem>
    </Link>
  );
};

export const Header = memo(function HeaderInner() {
  const auth = useAuth();
  const { isAuthenticated, profile, isAuthEnabled } = useAuth();
  const context = useZudoku();
  const { page, plugins } = context;

  const accountItems = plugins
    .filter((p) => isProfileMenuPlugin(p))
    .flatMap((p) => p.getProfileMenuItems(context))
    .map((i) => <RecursiveMenu key={i.label} item={i} />);

  return (
    <header className="sticky lg:top-0 z-10 bg-background/80 backdrop-blur w-full">
      <Banner />
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-[calc(var(--side-nav-width))_1fr] lg:gap-12 items-center border-b px-10 lg:px-12 h-[--top-header-height]">
          <div className="flex">
            <Link to="/">
              <div className="flex items-center gap-3.5">
                {page?.logo && (
                  <>
                    <img
                      src={
                        /https?:\/\//.test(page.logo.src.light)
                          ? page.logo.src.light
                          : joinPath(
                              import.meta.env.BASE_URL,
                              page.logo.src.light,
                            )
                      }
                      alt={page.logo.alt ?? page.pageTitle}
                      style={{ width: page.logo.width }}
                      className="h-10 dark:hidden"
                      loading="lazy"
                    />
                    <img
                      data-hide-on-theme="light"
                      src={
                        /https?:\/\//.test(page.logo.src.dark)
                          ? page.logo.src.dark
                          : joinPath(
                              import.meta.env.BASE_URL,
                              page.logo.src.dark,
                            )
                      }
                      alt={page.logo.alt ?? page.pageTitle}
                      style={{ width: page.logo.width }}
                      className="h-10"
                      loading="lazy"
                    />
                  </>
                )}
                <span className="font-bold text-2xl text-foreground/85 tracking-wide">
                  {page?.pageTitle}
                </span>
              </div>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[--sidecar-grid-cols] items-center gap-8">
            <div className="w-full justify-center hidden lg:flex">
              <Search />
            </div>

            <MobileTopNavigation />
            <div className="hidden lg:flex items-center justify-self-end text-sm gap-2">
              <Slotlet name="head-navigation-start" />
              {isAuthEnabled && (
                <ClientOnly
                  fallback={<Skeleton className="rounded h-5 w-24 mr-4" />}
                >
                  {!isAuthenticated ? (
                    <Button variant="ghost" onClick={() => auth.login()}>
                      Login
                    </Button>
                  ) : (
                    accountItems.length > 0 && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost">
                            {profile?.email ? `${profile.email}` : "My Account"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>My Account</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {accountItems}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  )}
                </ClientOnly>
              )}
              <ThemeSwitch />
              <Slotlet name="head-navigation-end" />
            </div>
          </div>
        </div>
        <Slotlet name="top-navigation-before" />
        <TopNavigation />
        <Slotlet name="top-navigation-after" />
      </div>
    </header>
  );
});
