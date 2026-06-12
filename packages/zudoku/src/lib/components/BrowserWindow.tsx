import { MinusIcon, PlusIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button.js";
import { cn } from "../util/cn.js";

// Zoom steps as found in real browsers
const ZOOM_LEVELS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
];
const MIN_ZOOM = Math.min(...ZOOM_LEVELS);
const MAX_ZOOM = Math.max(...ZOOM_LEVELS);

export type BrowserWindowProps = {
  /** Address displayed in the URL bar */
  url?: string;
  /**
   * Initial zoom applied to the content (e.g. `0.75` for 75%).
   * The zoom control is only shown when a value is passed.
   */
  scale?: number;
  className?: string;
  /** Additional classes for the content viewport */
  contentClassName?: string;
  children: ReactNode;
};

export const BrowserWindow = ({
  url = "localhost:3000",
  scale: initialScale,
  className,
  contentClassName,
  children,
}: BrowserWindowProps) => {
  const [scale, setScale] = useState(initialScale ?? 1);
  const [contentHeight, setContentHeight] = useState<number>();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() =>
      setContentHeight(content.offsetHeight),
    );
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const zoomIn = () =>
    setScale((current) => ZOOM_LEVELS.find((l) => l > current) ?? current);
  const zoomOut = () =>
    setScale(
      (current) => ZOOM_LEVELS.filter((l) => l < current).at(-1) ?? current,
    );

  return (
    <div
      className={cn(
        "not-prose overflow-hidden rounded-xl border bg-background shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-yellow-400" />
          <span className="size-3 rounded-full bg-green-400" />
        </div>
        <div className="flex h-7 min-w-0 flex-1 items-center rounded-md border bg-background px-3 text-xs text-muted-foreground">
          <span className="truncate">{url}</span>
        </div>
        {initialScale != null && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={zoomOut}
              disabled={scale <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              <MinusIcon />
            </Button>
            <button
              type="button"
              onClick={() => setScale(initialScale)}
              title="Reset zoom"
              className="w-11 text-center text-xs tabular-nums text-muted-foreground transition-colors hover:text-foreground"
            >
              {Math.round(scale * 100)}%
            </button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={zoomIn}
              disabled={scale >= MAX_ZOOM}
              aria-label="Zoom in"
            >
              <PlusIcon />
            </Button>
          </div>
        )}
      </div>
      <div
        className="overflow-hidden"
        style={
          scale !== 1 && contentHeight != null
            ? { height: contentHeight * scale }
            : undefined
        }
      >
        <div
          ref={contentRef}
          className={contentClassName}
          style={
            scale !== 1
              ? {
                  width: `${100 / scale}%`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
};
