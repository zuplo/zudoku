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

const MAX_HEIGHT = 200;

export const CollapsibleCode = ({ children }: { children: ReactNode }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setIsOverflowing(el.scrollHeight > MAX_HEIGHT);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <Collapsible
      className="group"
      open={open}
      onOpenChange={setOpen}
      style={{ "--max-height": `${MAX_HEIGHT}px` } as CSSProperties}
    >
      <CollapsibleContent
        forceMount
        className={cn(
          "relative overflow-hidden",
          !open && isOverflowing && "max-h-[--max-height]",
          !open && isOverflowing && "",
        )}
      >
        {!open && isOverflowing && (
          // bg-zinc-50 dark:bg-zinc-800
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-50/90 dark:to-zinc-800/90 z-10"></div>
        )}
        <div ref={contentRef}>{children}</div>
        {!open && isOverflowing && (
          <CollapsibleTrigger className="absolute inset-0 grid place-items-center z-10">
            <Button className="bg-primary/50">Expand code</Button>
          </CollapsibleTrigger>
        )}
      </CollapsibleContent>
      {isOverflowing && (
        <div
          className={cn("flex justify-center w-full mb-2", !open && "hidden")}
        >
          <CollapsibleTrigger asChild>
            <Button>Collapse code</Button>
          </CollapsibleTrigger>
        </div>
      )}
    </Collapsible>
  );
};
