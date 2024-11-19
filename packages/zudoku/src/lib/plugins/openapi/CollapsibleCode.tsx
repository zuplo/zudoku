import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "zudoku/ui/Button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { cn } from "../../util/cn.js";

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

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

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
          "relative overflow-hidden",
          !open && isOverflowing && "max-h-[--max-height]",
        )}
      >
        {!open && isOverflowing && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-50/90 dark:to-zinc-800/90 z-10"></div>
        )}
        <div ref={contentRef}>{children}</div>
        {!open && isOverflowing && (
          <CollapsibleTrigger
            className="absolute inset-0 grid place-items-center z-10"
            asChild
          >
            <div>
              <Button className="bg-primary/70 border border-accent-foreground/25">
                Expand code
              </Button>
            </div>
          </CollapsibleTrigger>
        )}
      </CollapsibleContent>
      {isOverflowing && (
        <div
          className={cn("flex justify-center w-full mb-2", !open && "hidden")}
        >
          <CollapsibleTrigger asChild>
            <Button className="border border-accent-foreground/25">
              Collapse code
            </Button>
          </CollapsibleTrigger>
        </div>
      )}
    </Collapsible>
  );
};
