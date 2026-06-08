import type { ReactNode } from "react";
import { cn } from "zudoku";
import { Anchor, Heading } from "zudoku/components";

export const SectionTitle = ({
  id,
  label,
  suffix,
  className,
}: {
  id?: string;
  label: ReactNode;
  suffix?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-baseline justify-between gap-3 border-b border-border/60 pb-2",
      className,
    )}
  >
    <Anchor id={id} className="flex items-baseline gap-2">
      <Heading level={2} className="leading-none">
        {label}
      </Heading>
      {suffix && (
        <>
          <span className="text-muted-foreground/75">·</span>
          {suffix}
        </>
      )}
    </Anchor>
  </div>
);
