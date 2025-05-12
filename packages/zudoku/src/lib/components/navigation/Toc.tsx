import type { TocEntry } from "@stefanprobst/rehype-extract-toc";
import { ListTreeIcon } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
} from "react";
import { cn } from "../../util/cn.js";
import { AnchorLink } from "../AnchorLink.js";
import { useViewportAnchor } from "../context/ViewportAnchorContext.js";

const DATA_ANCHOR_ATTR = "data-active";

const TocItem = ({
  item,
  children,
  className,
  isActive,
}: PropsWithChildren<{
  item: TocEntry;
  isActive: boolean;
  className?: string;
}>) => {
  return (
    <li className={cn("truncate", className)} title={item.value}>
      <AnchorLink
        to={`#${item.id}`}
        {...{ [DATA_ANCHOR_ATTR]: item.id }}
        className={cn(
          isActive
            ? "text-primary"
            : "hover:text-accent-foreground text-muted-foreground",
        )}
      >
        {item.value}
      </AnchorLink>
      {children}
    </li>
  );
};

export const Toc = ({ entries }: { entries: TocEntry[] }) => {
  const { activeAnchor } = useViewportAnchor();
  const listWrapperRef = useRef<HTMLUListElement>(null);
  const paintedOnce = useRef(false);
  const [indicatorStyle, setIndicatorStyles] = useState<CSSProperties>({
    top: 0,
    opacity: 0,
  });

  // synchronize active anchor indicator with the scroll position
  useEffect(() => {
    if (!listWrapperRef.current) return;

    const activeElement = listWrapperRef.current.querySelector(
      `[${DATA_ANCHOR_ATTR}='${activeAnchor}']`,
    );

    if (!activeElement) {
      setIndicatorStyles({ top: 0, opacity: 0 });
      return;
    }

    const topParent = listWrapperRef.current.getBoundingClientRect().top;
    const topElement = activeElement.getBoundingClientRect().top;

    setIndicatorStyles({
      opacity: 1,
      top: `${topElement - topParent}px`,
    });

    if (paintedOnce.current) return;

    // after all is painted, the indicator should animate
    requestIdleCallback(() => {
      paintedOnce.current = true;
    });
  }, [activeAnchor]);

  return (
    <aside className="sticky scrollbar top-8 lg:top-[--header-height] h-[calc(100vh-var(--header-height))] pt-[--padding-content-top] pb-[--padding-content-bottom] overflow-y-auto ps-1 text-sm">
      <div className="flex items-center gap-2 font-medium mb-2">
        <ListTreeIcon size={16} />
        On this page
      </div>
      <div className="relative ms-2 ps-4">
        <div className="absolute inset-0 right-auto bg-border w-[2px]" />
        <div
          className={cn(
            "absolute -left-px -translate-y-1 h-6 w-[4px] rounded bg-primary",
            paintedOnce.current &&
              "ease-out [transition:top_150ms,opacity_325ms]",
          )}
          style={indicatorStyle}
        />
        <ul
          ref={listWrapperRef}
          className="relative font-medium list-none space-y-2"
        >
          {entries.map((item) => (
            <TocItem
              isActive={item.id === activeAnchor}
              key={item.id}
              item={item}
              className="pl-0"
            >
              {item.children && (
                <ul className="list-none pl-4 pt-2 space-y-2">
                  {item.children.map((child) => (
                    <TocItem
                      item={child}
                      isActive={child.id === activeAnchor}
                      key={child.id}
                    />
                  ))}
                </ul>
              )}
            </TocItem>
          ))}
        </ul>
      </div>
    </aside>
  );
};
