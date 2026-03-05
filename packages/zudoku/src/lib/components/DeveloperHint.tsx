import { type ReactNode, Suspense, lazy } from "react";
import { Callout } from "../ui/Callout.js";

// Lazy: Markdown imports shiki.ts — keeping it out of the entry chunk.
const Markdown = lazy(() =>
  import("./Markdown.js").then((m) => ({ default: m.Markdown })),
);

export const DeveloperHint = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Callout type="caution" title="Developer hint" className={className}>
      <div className="flex flex-col gap-2">
        {typeof children === "string" ? (
          <Suspense>
            <Markdown content={children} />
          </Suspense>
        ) : (
          <div>{children}</div>
        )}
        <small className="italic">Only shown in development mode.</small>
      </div>
    </Callout>
  );
};
