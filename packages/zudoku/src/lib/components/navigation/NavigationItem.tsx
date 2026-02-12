import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Separator } from "zudoku/ui/Separator.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "zudoku/ui/Tooltip.js";
import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { useAuth } from "../../authentication/hook.js";
import { cn } from "../../util/cn.js";
import { joinUrl } from "../../util/joinUrl.js";
import { AnchorLink } from "../AnchorLink.js";
import { useViewportAnchor } from "../context/ViewportAnchorContext.js";
import { useZudoku } from "../context/ZudokuContext.js";
import { NavigationBadge } from "./NavigationBadge.js";
import { NavigationCategory } from "./NavigationCategory.js";
import { useNavigationFilter } from "./NavigationFilterContext.js";
import { NavigationFilterInput } from "./NavigationFilterInput.js";
import { navigationListItem, shouldShowItem } from "./utils.js";

const TruncatedLabel = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    if (ref.current.offsetWidth < ref.current.scrollWidth) {
      setIsTruncated(true);
    }
  }, []);

  return (
    <>
      <span
        className={cn("truncate flex-1", className)}
        title={label}
        ref={ref}
      >
        {label}
      </span>
      {isTruncated && (
        <Tooltip disableHoverableContent>
          <TooltipTrigger className="absolute inset-0 z-10" />
          <TooltipContent className="max-w-64" side="bottom" align="center">
            {label}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
};

export const DATA_ANCHOR_ATTR = "data-anchor";

export const NavigationItem = ({
  item,
  onRequestClose,
}: {
  item: NavigationItemType;
  onRequestClose?: () => void;
}) => {
  const location = useLocation();
  const { activeAnchor } = useViewportAnchor();
  const auth = useAuth();
  const context = useZudoku();
  const { query } = useNavigationFilter();

  if (!shouldShowItem(auth, context, query)(item)) {
    return null;
  }

  switch (item.type) {
    case "category":
      return (
        <NavigationCategory category={item} onRequestClose={onRequestClose} />
      );
    case "separator":
      return (
        <Separator className="my-1 mx-auto w-[calc(100%-var(--padding-nav-item)*2)]!" />
      );
    case "section":
      return (
        <div className="mt-4 px-(--padding-nav-item) text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {item.label}
        </div>
      );
    case "filter":
      return <NavigationFilterInput placeholder={item.placeholder} />;
    case "doc":
      return (
        <NavLink
          viewTransition
          className={({ isActive, isPending }) =>
            navigationListItem({ isActive, isPending })
          }
          to={joinUrl(item.path)}
          onClick={onRequestClose}
          end
        >
          {item.icon && (
            <item.icon size={16} className="align-[-0.125em] shrink-0" />
          )}
          {item.badge ? (
            <>
              {item.label && (
                <TruncatedLabel label={item.label} className="flex-1" />
              )}
              <NavigationBadge {...item.badge} />
            </>
          ) : (
            item.label
          )}
        </NavLink>
      );
    case "link":
    case "custom-page": {
      const href = item.type === "link" ? item.to : joinUrl(item.path);
      return !href.startsWith("http") ? (
        <AnchorLink
          to={{
            pathname: href.split("#")[0],
            hash: href.split("#")[1],
            search: location.search,
          }}
          {...{ [DATA_ANCHOR_ATTR]: href.split("#")[1] }}
          className={navigationListItem({
            isActive:
              href ===
              [location.pathname, activeAnchor].filter(Boolean).join("#"),
          })}
          onClick={onRequestClose}
        >
          {item.icon && (
            <item.icon size={16} className="align-[-0.125em] shrink-0" />
          )}
          {item.badge ? (
            <>
              {item.label && <TruncatedLabel label={item.label} />}
              <NavigationBadge {...item.badge} />
            </>
          ) : (
            <span className="break-all">{item.label}</span>
          )}
        </AnchorLink>
      ) : (
        <a
          className={navigationListItem()}
          href={href}
          target={"target" in item ? item.target : "_blank"}
          rel="noopener noreferrer"
          onClick={onRequestClose}
        >
          {item.icon && (
            <item.icon size={16} className="align-[-0.125em] shrink-0" />
          )}
          <span className="whitespace-normal">{item.label}</span>
          {/* This prevents that the icon would be positioned in its own line if the text fills a line entirely */}
          <span className="whitespace-nowrap">
            <ExternalLinkIcon className="inline -translate-y-0.5" size={12} />
          </span>
        </a>
      );
    }
  }
};
