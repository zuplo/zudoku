export default function invariant(
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  condition: any,
  // Not providing an inline default argument for message as the result is smaller
  /**
   * Can provide a string, or a function that returns a string for cases where
   * the message takes a fair amount of effort to compute
   */
  message?: string | (() => string),
  options?: ZudokuErrorOptions,
): asserts condition {
  if (condition) {
    return;
  }
  // Condition not passed

  const provided: string | undefined =
    typeof message === "function" ? message() : message;

  throw new ZudokuError(provided ?? "Invariant failed", options);
}

export type ZudokuErrorOptions = {
  developerHint?: string;
  title?: string;
  cause?: Error;
};

export class ZudokuError extends Error {
  public developerHint: string | undefined;
  public title: string | undefined;

  constructor(
    message: string,
    { developerHint, title, cause }: ZudokuErrorOptions = {},
  ) {
    super(message, { cause });
    this.name = "ZudokuError";
    this.title = title;
    this.developerHint = developerHint;
  }
}
