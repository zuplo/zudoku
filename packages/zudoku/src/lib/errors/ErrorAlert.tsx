import { DeveloperHint } from "../components/DeveloperHint.js";
import { Heading } from "../components/Heading.js";
import { Typography } from "../components/Typography.js";
import { ZudokuError } from "../util/invariant.js";

export function ErrorAlert({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";

  const hint = error instanceof ZudokuError ? error.developerHint : undefined;
  const title =
    error instanceof ZudokuError ? error.title : "Something went wrong";
  const stack = error instanceof Error ? error.stack : undefined;
  const cause = error instanceof Error ? error.cause : undefined;

  const stringError = cause instanceof Error ? String(cause.stack) : stack;

  return (
    <Typography className="grid grid-cols-1 max-w-none! pt-(--padding-content-top)">
      <Heading level={1}>{title}</Heading>
      Error: {message}
      {hint && <DeveloperHint className="mb-4">{hint}</DeveloperHint>}
      {stringError && (
        <pre className="max-h-[400px] [&>pre]:p-4">{stringError}</pre>
      )}
    </Typography>
  );
}
