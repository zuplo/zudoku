import { InfoIcon } from "lucide-react";
import { type ReactNode, Suspense, lazy } from "react";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";

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
    <Alert variant="info" className={className} fit="loose">
      <InfoIcon />
      <AlertTitle>Developer hint</AlertTitle>
      <AlertDescription>
        {typeof children === "string" ? (
          <Suspense>
            <Markdown content={children} />
          </Suspense>
        ) : (
          <div>{children}</div>
        )}
        <small className="italic">Only shown in development mode.</small>
      </AlertDescription>
    </Alert>
  );
};
