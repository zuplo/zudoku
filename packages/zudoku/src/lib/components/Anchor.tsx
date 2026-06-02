import { LinkIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { cn } from "../util/cn.js";

export const Anchor = ({
  id,
  children,
  className,
}: PropsWithChildren<{ id?: string; className?: string }>) => {
  if (!id) return children;
  return (
    <div
      id={id}
      className={cn(
        "group/anchor scroll-mt-(--scroll-padding) flex items-center",
        className,
      )}
    >
      {children}
      <a
        href={`#${id}`}
        aria-label={`Link to ${id}`}
        className="ms-[0.33em] rounded text-muted-foreground p-0.5 -m-0.5 opacity-0 group-hover/anchor:opacity-50 hover:text-primary hover:opacity-100! transition-opacity duration-200 inline-flex items-center align-middle"
      >
        <LinkIcon className="size-[0.9em]" />
      </a>
    </div>
  );
};
