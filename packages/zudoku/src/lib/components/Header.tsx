import { Helmet } from "@zudoku/react-helmet-async";
import { LogOutIcon } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import { Skeleton } from "zudoku/ui/Skeleton.js";
import { useAuth } from "../authentication/hook.js";
import type { ProfileNavigationItem } from "../core/plugins.js";
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
import { HeaderNavigation } from "./HeaderNavigation.js";
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
          {item.children.map((child) => (
            <RecursiveMenu key={child.label} item={child} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  ) : (
    <Link
      to={item.path ?? ""}
      target={item.target}
      rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
    >
      <DropdownMenuItem key={item.label} className="flex gap-2">
        {item.icon && (
          <item.icon size={16} strokeWidth={1} absoluteStrokeWidth />
        )}
        {item.label}
      </DropdownMenuItem>
    </Link>
  );
};

const ProfileMenu = () => {
  const context = useZudoku();
  const profileItems = context.getProfileMenuItems();
  const auth = useAuth();
  const { isAuthEnabled, isAuthenticated, profile } = auth;

  if (!isAuthEnabled) return null;

  return (
    <ClientOnly fallback={<Skeleton className="rounded-sm h-5 w-24 mr-4" />}>
      {!isAuthenticated ? (
        <Button size="lg" variant="ghost" onClick={() => auth.login()}>
          Login
        </Button>
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="lg" variant="ghost">
              {profile?.name ?? "My Account"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>
              {profile?.name ?? "My Account"}
              {profile?.email && profile.email !== profile?.name && (
                <div className="font-normal text-muted-foreground">
                  {profile.email}
                </div>
              )}
            </DropdownMenuLabel>
            {profileItems.filter((i) => i.category === "top").length > 0 && (
              <DropdownMenuSeparator />
            )}
            {profileItems
              .filter((i) => i.category === "top")
              .map((i) => (
                <RecursiveMenu key={i.label} item={i} />
              ))}
            {profileItems.filter((i) => !i.category || i.category === "middle")
              .length > 0 && <DropdownMenuSeparator />}
            {profileItems
              .filter((i) => !i.category || i.category === "middle")
              .map((i) => (
                <RecursiveMenu key={i.label} item={i} />
              ))}
            {profileItems.filter((i) => i.category === "bottom").length > 0 && (
              <DropdownMenuSeparator />
            )}
            {profileItems
              .filter((i) => i.category === "bottom")
              .map((i) => (
                <RecursiveMenu key={i.label} item={i} />
              ))}
            <DropdownMenuSeparator />
            <Link to="/signout">
              <DropdownMenuItem className="flex gap-2">
                <LogOutIcon size={16} strokeWidth={1} absoluteStrokeWidth />
                Logout
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </ClientOnly>
  );
};
export const Header = memo(function HeaderInner() {
  const context = useZudoku();
  const {
    options: { site, header, basePath },
  } = context;

  const searchPosition = header?.placements?.search ?? "center";
  const navPosition = header?.placements?.navigation ?? "end";
  const authPlacement = header?.placements?.auth ?? "navigation";
  const showThemeSwitch = header?.showThemeSwitch;
  const authPosition =
    authPlacement === "navigation" ? navPosition : authPlacement;

  const logoLightSrc = site?.logo
    ? /https?:\/\//.test(site.logo.src.light)
      ? site.logo.src.light
      : joinUrl(basePath, site.logo.src.light)
    : undefined;
  const logoDarkSrc = site?.logo
    ? /https?:\/\//.test(site.logo.src.dark)
      ? site.logo.src.dark
      : joinUrl(basePath, site.logo.src.dark)
    : undefined;

  const borderBottom = "inset-shadow-[0_-1px_0_0_var(--border)]";

  return (
    <header
      className="sticky lg:top-0 z-10 bg-background/80 backdrop-blur w-full"
      data-pagefind-ignore="all"
    >
      <Banner />
      <div className={cn(borderBottom, "relative")}>
        <PageProgress />
        <div className="max-w-screen-2xl mx-auto flex lg:grid lg:grid-cols-[1fr_auto_1fr] gap-2 items-center justify-between h-(--top-header-height) px-4 lg:px-8 border-transparent">
          <div className="flex items-center gap-4 min-w-0 justify-self-start">
            <Link
              to={site?.logo?.href ?? "/"}
              reloadDocument={site?.logo?.reloadDocument ?? true}
              className="shrink-0"
            >
              <div className="flex items-center gap-3.5">
                {site?.logo ? (
                  <>
                    <Helmet>
                      <link rel="preload" as="image" href={logoLightSrc} />
                      <link rel="preload" as="image" href={logoDarkSrc} />
                    </Helmet>
                    <img
                      src={logoLightSrc}
                      alt={site.logo.alt ?? site.title}
                      style={{ width: site.logo.width }}
                      className="max-h-(--top-header-height) dark:hidden"
                    />
                    <img
                      src={logoDarkSrc}
                      alt={site.logo.alt ?? site.title}
                      style={{ width: site.logo.width }}
                      className="max-h-(--top-header-height) hidden dark:block"
                    />
                  </>
                ) : (
                  <span className="font-semibold text-2xl">{site?.title}</span>
                )}
              </div>
            </Link>
            <Slot.Target name="head-navigation-start" />
            {searchPosition === "start" && (
              <Search className="hidden lg:flex" />
            )}
            {authPosition === "start" && (
              <div className="hidden lg:flex">
                <ProfileMenu />
              </div>
            )}
            {navPosition === "start" && (
              <div className="hidden lg:block min-w-0">
                <HeaderNavigation />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <Search
              className={cn(
                searchPosition === "center" ? "flex" : "flex lg:hidden",
              )}
            />
            {navPosition === "center" && (
              <div className="hidden lg:block min-w-0">
                <HeaderNavigation />
              </div>
            )}
            {authPosition === "center" && (
              <div className="hidden lg:flex">
                <ProfileMenu />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <MobileTopNavigation />
            <div className="hidden lg:flex items-center text-sm gap-2">
              {navPosition === "end" && (
                <div className="min-w-0">
                  <HeaderNavigation />
                </div>
              )}
              {authPosition === "end" && <ProfileMenu />}
              {searchPosition === "end" && <Search />}
              <Slot.Target name="head-navigation-end" />
              {showThemeSwitch && <ThemeSwitch />}
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
