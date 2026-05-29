import type { ReactNode } from "react";
import { cn } from "zudoku";
import { Heading } from "zudoku/components";

export const SectionTitle = ({
  id,
  label,
  suffix,
  actions,
  className,
}: {
  id?: string;
  label: ReactNode;
  suffix?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-baseline justify-between gap-3 border-b border-border/60 pb-2",
      className,
    )}
  >
    <div className="flex items-baseline gap-2">
      <Heading level={3} id={id} className="leading-none">
        {label}
      </Heading>
      {suffix && (
        <>
          <span className="text-muted-foreground/75">·</span>
          {suffix}
        </>
      )}
    </div>
    {actions}
  </div>
);
