import { cva } from "class-variance-authority";
import { ExternalLinkIcon } from "lucide-react";
import { NavLink, useSearchParams } from "react-router-dom";

import type { SidebarItem as SidebarItemType } from "../../../config/validators/SidebarSchema.js";
import { joinPath } from "../../util/joinPath.js";
import { AnchorLink } from "../AnchorLink.js";
import { useViewportAnchor } from "../context/ViewportAnchorContext.js";
import { SidebarBadge } from "./SidebarBadge.js";
import { SidebarCategory } from "./SidebarCategory.js";

export const navigationListItem = cva(
  "flex items-center gap-2 px-[--padding-nav-item] py-1.5 rounded-lg hover:bg-accent transition-colors duration-300",
  {
    variants: {
      isTopLevel: {
        true: "font-medium -mx-[--padding-nav-item]",
        false: "-mr-[--padding-nav-item] ml-[--padding-nav-item]",
      },
      isActive: {
        true: "text-primary font-medium",
        false: "text-foreground/80",
      },
      isMuted: {
        true: "text-foreground/30",
        false: "",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export const DATA_ANCHOR_ATTR = "data-anchor";

export const SidebarItem = ({
  item,
  level = 0,
}: {
  item: SidebarItemType;
  basePath?: string;
  level?: number;
}) => {
  const { activeAnchor } = useViewportAnchor();
  const [searchParams] = useSearchParams();

  switch (item.type) {
    case "category":
      return <SidebarCategory category={item} level={level} />;
    case "doc":
      return (
        <NavLink
          className={({ isActive }) =>
            navigationListItem({ isActive, isTopLevel: level === 0 })
          }
          to={joinPath(item.id)}
        >
          {item.icon && <item.icon size={16} className="align-[-0.125em]" />}
          {item.badge ? (
            <>
              <span className="truncate flex-1" title={item.label}>
                {item.label}
              </span>
              <SidebarBadge {...item.badge} />
            </>
          ) : (
            item.label
          )}
        </NavLink>
      );
    case "link":
      return item.href.startsWith("#") ? (
        <AnchorLink
          to={{ hash: item.href, search: searchParams.toString() }}
          {...{ [DATA_ANCHOR_ATTR]: item.href.slice(1) }}
          className={navigationListItem({
            isActive: item.href.slice(1) === activeAnchor,
            isTopLevel: level === 0,
            className: item.badge?.placement !== "start" && "justify-between",
          })}
        >
          {item.badge ? (
            <>
              <span className="truncate" title={item.label}>
                {item.label}
              </span>
              <SidebarBadge {...item.badge} />
            </>
          ) : (
            <span className="break-all">{item.label}</span>
          )}
        </AnchorLink>
      ) : !item.href.startsWith("http") ? (
        <NavLink
          className={navigationListItem({
            className: item.badge?.placement !== "start" && "justify-between",
          })}
          to={item.href}
        >
          {item.badge ? (
            <>
              <span className="truncate" title={item.label}>
                {item.label}
              </span>
              <SidebarBadge {...item.badge} />
            </>
          ) : (
            <span className="break-all">{item.label}</span>
          )}
        </NavLink>
      ) : (
        <a
          className={navigationListItem({ isTopLevel: level === 0 })}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="whitespace-normal">{item.label}</span>
          {/* This prevents that the icon would be positioned in its own line if the text fills a line entirely */}
          <span className="whitespace-nowrap">
            <ExternalLinkIcon className="inline -translate-y-0.5" size={12} />
          </span>
        </a>
      );
  }
};
