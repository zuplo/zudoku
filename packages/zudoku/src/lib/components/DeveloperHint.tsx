import type { ReactNode } from "react";
import { Callout } from "../ui/Callout.js";
import { Markdown } from "./Markdown.js";

export const DeveloperHint = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  if (process.env.NODE_ENV !== "development") return;

  return (
    <Callout type="caution" title="Developer hint" className={className}>
      <div className="flex flex-col gap-2">
        {typeof children === "string" ? (
          <Markdown content={children} />
        ) : (
          <div>{children}</div>
        )}
        <small className="italic">
          Note: This hint is only shown in development mode.
        </small>
      </div>
    </Callout>
  );
};
