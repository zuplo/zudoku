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
import { cn } from "../util/cn.js";
import { joinUrl } from "../util/joinUrl.js";
import { Banner } from "./Banner.js";
import { ClientOnly } from "./ClientOnly.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { MobileTopNavigation } from "./MobileTopNavigation.js";
import { PageProgress } from "./PageProgress.js";
import { Search } from "./Search.js";
import { Slot } from "./Slot.js";
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
  const { page, plugins, options } = context;

  const accountItems = plugins
    .filter((p) => isProfileMenuPlugin(p))
    .flatMap((p) => p.getProfileMenuItems(context))
    .sort((i) => i.weight ?? 0);

  const logoLightSrc = page?.logo
    ? /https?:\/\//.test(page.logo.src.light)
      ? page.logo.src.light
      : joinUrl(options.basePath, page.logo.src.light)
    : undefined;
  const logoDarkSrc = page?.logo
    ? /https?:\/\//.test(page.logo.src.dark)
      ? page.logo.src.dark
      : joinUrl(options.basePath, page.logo.src.dark)
    : undefined;

  const borderBottom = "inset-shadow-[0_-1px_0_0_var(--border)]";

  return (
    <header className="sticky lg:top-0 z-10 bg-background/80 backdrop-blur w-full">
      <Banner />
      <div className={cn(borderBottom, "relative")}>
        <PageProgress />
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-(--top-header-height) px-4 lg:px-8 border-transparent">
          <div className="flex">
            <Link to="/">
              <div className="flex items-center gap-3.5">
                {page?.logo && (
                  <>
                    <img
                      src={logoLightSrc}
                      alt={page.logo.alt ?? page.pageTitle}
                      style={{ width: page.logo.width }}
                      className="max-h-(--top-header-height) dark:hidden"
                      loading="lazy"
                    />
                    <img
                      src={logoDarkSrc}
                      alt={page.logo.alt ?? page.pageTitle}
                      style={{ width: page.logo.width }}
                      className="max-h-(--top-header-height) hidden dark:block"
                      loading="lazy"
                    />
                  </>
                )}
                <span className="font-semibold text-2xl">
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
              <Slot.Target name="head-navigation-start" />
              {isAuthEnabled && (
                <ClientOnly
                  fallback={<Skeleton className="rounded-sm h-5 w-24 mr-4" />}
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
                            {profile?.name ?? "My Account"}
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
              <Slot.Target name="head-navigation-end" />
              <ThemeSwitch />
            </div>
          </div>
        </div>
      </div>
      <div className={cn("hidden lg:block", borderBottom)}>
        <div className="max-w-screen-2xl mx-auto border-transparent relative">
          <Slot.Target name="top-navigation-before" />
          <TopNavigation />
          <Slot.Target name="top-navigation-after" />
        </div>
      </div>
    </header>
  );
});
