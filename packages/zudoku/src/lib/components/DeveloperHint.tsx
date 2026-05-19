import { InfoIcon } from "lucide-react";
import { type ReactNode, Suspense, lazy } from "react";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { useTranslation } from "./context/useTranslation.js";

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
  const { t } = useTranslation();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Alert variant="info" className={className} fit="loose">
      <InfoIcon />
      <AlertTitle>{t("developerHint.title")}</AlertTitle>
      <AlertDescription>
        {typeof children === "string" ? (
          <Suspense>
            <Markdown content={children} />
          </Suspense>
        ) : (
          <div>{children}</div>
        )}
        <small className="italic">{t("developerHint.devOnly")}</small>
      </AlertDescription>
    </Alert>
  );
};
