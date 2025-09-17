import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "zudoku/ui/Tooltip.js";
import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { useAuth } from "../../authentication/hook.js";
import { cn } from "../../util/cn.js";
import { joinUrl } from "../../util/joinUrl.js";
import { AnchorLink } from "../AnchorLink.js";
import { useViewportAnchor } from "../context/ViewportAnchorContext.js";
import { useZudoku } from "../context/ZudokuContext.js";
import { NavigationBadge } from "./NavigationBadge.js";
import { NavigationCategory } from "./NavigationCategory.js";
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
        <TooltipProvider delayDuration={500}>
          <Tooltip disableHoverableContent>
            <TooltipTrigger className="absolute inset-0 z-10" />
            <TooltipContent
              className="max-w-64 rounded-lg"
              side="bottom"
              align="center"
            >
              <TooltipArrow />
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

  if (!shouldShowItem(auth, context)(item)) {
    return null;
  }

  switch (item.type) {
    case "category":
      return (
        <NavigationCategory category={item} onRequestClose={onRequestClose} />
      );
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
          {item.icon && <item.icon size={16} className="align-[-0.125em]" />}
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
          {item.icon && <item.icon size={16} className="align-[-0.125em]" />}
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
          {item.icon && <item.icon size={16} className="align-[-0.125em]" />}
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
