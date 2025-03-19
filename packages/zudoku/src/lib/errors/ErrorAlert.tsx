// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import { DeveloperHint } from "../components/DeveloperHint.js";
import { Heading } from "../components/Heading.js";
import { ProseClasses } from "../components/Markdown.js";
import { cn } from "../util/cn.js";
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
    <div
      className={cn(
        ProseClasses,
        "grid grid-cols-1 !max-w-none pt-[--padding-content-top]",
      )}
    >
      <Heading level={1}>{title}</Heading>
      Error: {message}
      {hint && <DeveloperHint className="mb-4">{hint}</DeveloperHint>}
      {stringError && (
        <div>
          <SyntaxHighlight
            className="max-h-[400px] border mt-2"
            language="jsstacktrace"
            code={stringError}
          />
        </div>
      )}
    </div>
  );
}
