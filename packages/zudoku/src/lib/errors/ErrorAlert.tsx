// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { DeveloperHint } from "../components/DeveloperHint.js";
import { ZudokuError } from "../util/invariant.js";

export function ErrorAlert({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";

  const hint = error instanceof ZudokuError ? error.developerHint : undefined;
  const title =
    error instanceof ZudokuError ? error.title : "Something went wrong";
  const stack = error instanceof Error ? error.stack : undefined;
  const cause = error instanceof Error ? error.cause : undefined;

  return (
    <div className="flex h-screen max-h-[calc(100vh-var(--header-height))] min-h-full items-center justify-center bg-primary-background px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-[85%] sm:max-w-[50%]">
        <h1 className="text-4xl font-bold tracking-tight text-h1-text sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-h1-text">{message}</p>
        {hint && <DeveloperHint className="mb-4">{hint}</DeveloperHint>}
        {cause instanceof Error ? (
          <pre className="mt-5 max-h-[400px] w-full overflow-scroll rounded-md border border-input-border bg-input-background p-3 text-property-name-text text-red-700">
            {cause.stack}
          </pre>
        ) : stack ? (
          <pre className="mt-5 max-h-[400px] w-full overflow-scroll rounded-md border border-input-border bg-input-background p-3 text-property-name-text text-red-700">
            {stack}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
