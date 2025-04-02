import { cva } from "class-variance-authority";
import { ExternalLinkIcon } from "lucide-react";
import { NavLink, useLocation, useSearchParams } from "react-router";

import type { SidebarItem as SidebarItemType } from "../../../config/validators/SidebarSchema.js";
import { joinUrl } from "../../util/joinUrl.js";
import { AnchorLink } from "../AnchorLink.js";
import { useViewportAnchor } from "../context/ViewportAnchorContext.js";
import { SidebarBadge } from "./SidebarBadge.js";
import { SidebarCategory } from "./SidebarCategory.js";

export const navigationListItem = cva(
  "flex items-center gap-2 px-[--padding-nav-item] my-0.5 py-1.5 rounded-lg hover:bg-accent tabular-nums",
  {
    variants: {
      isActive: {
        true: "bg-accent font-medium",
        false: "text-foreground/80",
      },
      isMuted: {
        true: "text-foreground/30",
        false: "",
      },
      isPending: {
        true: "bg-accent animate-pulse",
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
  const location = useLocation();
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
          className={({ isActive, isPending }) =>
            navigationListItem({ isActive, isPending })
          }
          to={joinUrl(item.id)}
          onClick={onRequestClose}
          end
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
      return !item.href.startsWith("http") ? (
        <AnchorLink
          to={{
            pathname: item.href.split("#")[0],
            hash: item.href.split("#")[1],
            search: searchParams.toString(),
          }}
          {...{ [DATA_ANCHOR_ATTR]: item.href.split("#")[1] }}
          className={navigationListItem({
            isActive: item.href === [location.pathname, activeAnchor].join("#"),
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
