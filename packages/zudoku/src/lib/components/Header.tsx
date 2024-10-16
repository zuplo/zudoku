import { MoonStarIcon, SunIcon } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../authentication/hook.js";
import { isProfileMenuPlugin, ProfileNavigationItem } from "../core/plugins.js";
import { Button } from "../ui/Button.js";
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
import { Banner } from "./Banner.js";
import { useTheme } from "./context/ThemeContext.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { MobileTopNavigation } from "./MobileTopNavigation.js";
import { Search } from "./Search.js";
import { Slotlet } from "./SlotletProvider.js";
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
  const [isDark, toggleTheme] = useTheme();
  const { isAuthenticated, profile, isAuthEnabled } = useAuth();
  const context = useZudoku();
  const { page, plugins } = context;

  const accountItems = plugins
    .filter((p) => isProfileMenuPlugin(p))
    .flatMap((p) => p.getProfileMenuItems(context))
    .map((i) => <RecursiveMenu key={i.label} item={i} />);

  const ThemeIcon = isDark ? MoonStarIcon : SunIcon;

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
                      src={page.logo.src.light}
                      alt={page.logo.alt ?? page.pageTitle}
                      style={{ width: page.logo.width }}
                      className={cn("h-10", isDark && "hidden")}
                      loading="lazy"
                    />
                    <img
                      src={page.logo.src.dark}
                      alt={page.logo.alt ?? page.pageTitle}
                      style={{ width: page.logo.width }}
                      className={cn("h-10", !isDark && "hidden")}
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
              {isAuthEnabled && !isAuthenticated ? (
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
              <button
                type="button"
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                className="cursor-pointer hover:bg-secondary p-2.5 -m-2.5 rounded-full"
                onClick={toggleTheme}
              >
                <ThemeIcon size={18} />
              </button>
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
