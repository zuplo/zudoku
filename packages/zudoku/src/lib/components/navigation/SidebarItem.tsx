import { cva } from "class-variance-authority";
import { ExternalLinkIcon } from "lucide-react";
import { NavLink, useSearchParams } from "react-router";

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
  onRequestClose,
}: {
  item: SidebarItemType;
  onRequestClose?: () => void;
}) => {
  const { activeAnchor } = useViewportAnchor();
  const [searchParams] = useSearchParams();

  switch (item.type) {
    case "category":
      return (
        <SidebarCategory category={item} onRequestClose={onRequestClose} />
      );
    case "doc":
      return (
        <NavLink
          className={({ isActive }) => navigationListItem({ isActive })}
          to={joinPath(item.id)}
          onClick={onRequestClose}
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
            className: item.badge?.placement !== "start" && "justify-between",
          })}
          onClick={onRequestClose}
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
          className={navigationListItem()}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onRequestClose}
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
