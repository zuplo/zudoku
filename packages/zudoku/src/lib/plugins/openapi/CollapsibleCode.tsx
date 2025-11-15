import { FoldVerticalIcon, UnfoldVerticalIcon } from "lucide-react";
import { type CSSProperties, type ReactNode, useRef, useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { cn } from "../../util/cn.js";
import useIsomorphicLayoutEffect from "../../util/useIsomorphicLayoutEffect.js";

export const OverflowOverlay = () => (
  <div className="absolute inset-0 bg-linear-to-b from-transparent to-zinc-50/60 dark:to-zinc-950/90 z-10 transition-all group-hover:to-transparent" />
);

export const CollapsibleCode = ({
  children,
  maxHeight = 250,
}: {
  children: ReactNode;
  maxHeight?: number;
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [open, setOpen] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    setIsOverflowing(el.scrollHeight > maxHeight);

    const observer = new ResizeObserver(() => {
      setIsOverflowing(el.scrollHeight > maxHeight);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [maxHeight]);

  return (
    <Collapsible
      className="group"
      open={open}
      onOpenChange={setOpen}
      style={{ "--max-height": `${maxHeight}px` } as CSSProperties}
    >
      <CollapsibleContent
        forceMount
        className={cn(
          "relative overflow-hidden group",
          !open && isOverflowing && "max-h-(--max-height)",
        )}
      >
        {!open && isOverflowing && <OverflowOverlay />}
        <div ref={contentRef}>{children}</div>
        {!open && isOverflowing && (
          <CollapsibleTrigger
            className="absolute inset-0 grid place-items-center z-10 cursor-pointer peer"
            asChild
          >
            <div>
              <Button variant="outline" className="hidden group-hover:flex">
                <UnfoldVerticalIcon size={14} className="me-1.5" />
                Click to expand
              </Button>
            </div>
          </CollapsibleTrigger>
        )}
      </CollapsibleContent>
      {isOverflowing && (
        <div
          className={cn(
            "flex justify-center w-full py-2 bg-muted/50",
            !open && "hidden",
          )}
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              Collapse
              <FoldVerticalIcon size={14} className="ms-1.5" />
            </Button>
          </CollapsibleTrigger>
        </div>
      )}
    </Collapsible>
  );
};
