import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import {
  isHeaderNavGroup,
  type HeaderNavGroup,
  type HeaderNavItem,
  type HeaderNavLinkItem,
} from "../../config/validators/HeaderNavigationSchema.js";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../ui/NavigationMenu.js";
import { cn } from "../util/cn.js";
import { useZudoku } from "./context/ZudokuContext.js";

const NavLinkItem = ({ item }: { item: HeaderNavLinkItem }) => {
  const Icon = item.icon as LucideIcon | undefined;
  return (
    <NavigationMenuLink asChild>
      <Link
        to={item.to}
        target={item.target}
        rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
        className="block select-none rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon size={16} className="shrink-0 text-muted-foreground" />
          )}
          <div className="text-sm font-medium leading-none">{item.label}</div>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1.5">
            {item.description}
          </p>
        )}
      </Link>
    </NavigationMenuLink>
  );
};

const DropdownContent = ({
  items,
}: {
  items: Array<HeaderNavLinkItem | HeaderNavGroup>;
}) => {
  return items.some(isHeaderNavGroup) ? (
    <div className="flex gap-4 p-4">
      {items.map((item) =>
        isHeaderNavGroup(item) ? (
          <div key={item.label} className="min-w-[200px]">
            <div className="mb-2 px-3 text-sm font-medium text-muted-foreground">
              {item.label}
            </div>
            <ul className="flex flex-col gap-1">
              {item.items.map((subItem) => (
                <li key={subItem.to}>
                  <NavLinkItem item={subItem} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div key={item.to}>
            <NavLinkItem item={item} />
          </div>
        ),
      )}
    </div>
  ) : (
    <ul className="grid gap-1 p-3 w-[400px] md:grid-cols-2">
      {items.flatMap((item) =>
        !isHeaderNavGroup(item) ? (
          <li key={item.to}>
            <NavLinkItem item={item} />
          </li>
        ) : (
          []
        ),
      )}
    </ul>
  );
};

const HeaderNavItemComponent = ({ item }: { item: HeaderNavItem }) => {
  if ("to" in item) {
    const Icon = item.icon as LucideIcon | undefined;
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link
            to={item.to}
            target={item.target}
            rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
            className={cn(
              navigationMenuTriggerStyle(),
              "flex items-center gap-2",
            )}
          >
            {Icon && <Icon size={16} />}
            {item.label}
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="bg-transparent">
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <DropdownContent items={item.items} />
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export const HeaderNavigation = () => {
  const { options } = useZudoku();
  const items = options.header?.navigation;
  const navPosition = options.header?.placements?.navigation ?? "end";
  if (!items || items.length === 0) return null;

  const viewportAlign =
    navPosition === "end"
      ? "**:data-[slot=navigation-menu-viewport-wrapper]:left-auto **:data-[slot=navigation-menu-viewport-wrapper]:right-0"
      : navPosition === "center"
        ? "**:data-[slot=navigation-menu-viewport-wrapper]:left-1/2 **:data-[slot=navigation-menu-viewport-wrapper]:-translate-x-1/2"
        : undefined;

  return (
    <NavigationMenu className={viewportAlign}>
      <NavigationMenuList>
        {items.map((item, index) => (
          <HeaderNavItemComponent key={`${item.label}-${index}`} item={item} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
