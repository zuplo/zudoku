import { Suspense, lazy } from "react";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { DeveloperHint } from "../components/DeveloperHint.js";
import { ZudokuError } from "../util/invariant.js";

const SyntaxHighlight = lazy(() =>
  import("zudoku/ui/SyntaxHighlight.js").then((m) => ({
    default: m.SyntaxHighlight,
  })),
);

export function ErrorMessage({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";

  const showDeveloperHints = process.env.NODE_ENV === "development";

  const hint = error instanceof ZudokuError ? error.developerHint : undefined;
  const title =
    error instanceof ZudokuError ? error.title : "Something went wrong";
  const stack = error instanceof Error ? error.stack : undefined;
  const cause = error instanceof Error ? error.cause : undefined;

  const stringError = cause instanceof Error ? String(cause.stack) : stack;

  return (
    <>
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {showDeveloperHints && hint && (
        <DeveloperHint className="mb-4">{hint}</DeveloperHint>
      )}
      {showDeveloperHints && stringError && (
        <Suspense>
          <SyntaxHighlight
            className="max-h-[400px] [&>pre]:p-4"
            language="js"
            code={stringError}
          />
        </Suspense>
      )}
    </>
  );
}
