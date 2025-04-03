import { memo } from "react";
import { Link } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import { Skeleton } from "zudoku/ui/Skeleton.js";
import { useAuth } from "../authentication/hook.js";
import {
  isProfileMenuPlugin,
  type ProfileNavigationItem,
} from "../core/plugins.js";
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
import { joinUrl } from "../util/joinUrl.js";
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
      <DropdownMenuItem key={item.label} className="flex gap-2">
        {item.icon && (
          <item.icon size={16} strokeWidth={1} absoluteStrokeWidth />
        )}
        {item.label}
      </DropdownMenuItem>
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
    .sort((i) => i.weight ?? 0);

  return (
    <header className="sticky lg:top-0 z-10 bg-background/80 backdrop-blur w-full">
      <Banner />
      <div className="border-b">
        <div className="max-w-screen-2xl mx-auto flex relative items-center justify-between px-4 lg:px-8 h-[--top-header-height] border-transparent">
          <div className="flex">
            <Link to="/">
              <div className="flex items-center gap-3.5">
                {page?.logo && (
                  <>
                    <img
                      src={
                        /https?:\/\//.test(page.logo.src.light)
                          ? page.logo.src.light
                          : joinUrl(
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
                      src={
                        /https?:\/\//.test(page.logo.src.dark)
                          ? page.logo.src.dark
                          : joinUrl(
                              import.meta.env.BASE_URL,
                              page.logo.src.dark,
                            )
                      }
                      alt={page.logo.alt ?? page.pageTitle}
                      style={{ width: page.logo.width }}
                      className="h-10 hidden dark:block"
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

          <div className="absolute inset-x-0 justify-center items-center hidden lg:flex w-full pointer-events-none">
            <Search className="pointer-events-auto" />
          </div>

          <div className="flex items-center gap-8">
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
                    Object.values(accountItems).length > 0 && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost">
                            {profile?.name ? `${profile.name}` : "My Account"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>
                            {profile?.name ? `${profile.name}` : "My Account"}
                            {profile?.email && (
                              <div className="font-normal text-muted-foreground">
                                {profile.email}
                              </div>
                            )}
                          </DropdownMenuLabel>
                          {accountItems.filter((i) => i.category === "top")
                            .length > 0 && <DropdownMenuSeparator />}
                          {accountItems
                            .filter((i) => i.category === "top")
                            .map((i) => (
                              <RecursiveMenu key={i.label} item={i} />
                            ))}
                          {accountItems.filter(
                            (i) => !i.category || i.category === "middle",
                          ).length > 0 && <DropdownMenuSeparator />}
                          {accountItems
                            .filter(
                              (i) => !i.category || i.category === "middle",
                            )
                            .map((i) => (
                              <RecursiveMenu key={i.label} item={i} />
                            ))}
                          {accountItems.filter((i) => i.category === "bottom")
                            .length > 0 && <DropdownMenuSeparator />}
                          {accountItems
                            .filter((i) => i.category === "bottom")
                            .map((i) => (
                              <RecursiveMenu key={i.label} item={i} />
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  )}
                </ClientOnly>
              )}
              <Slotlet name="head-navigation-end" />
              <ThemeSwitch />
            </div>
          </div>
        </div>
      </div>
      <div className="border-b hidden lg:block">
        <div className="max-w-screen-2xl mx-auto border-transparent">
          <Slotlet name="top-navigation-before" />
          <TopNavigation />
          <Slotlet name="top-navigation-after" />
        </div>
      </div>
    </header>
  );
});
