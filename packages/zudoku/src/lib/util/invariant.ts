export default function invariant(
  condition: any,
  // Not providing an inline default argument for message as the result is smaller
  /**
   * Can provide a string, or a function that returns a string for cases where
   * the message takes a fair amount of effort to compute
   */
  message?: string | (() => string),
): asserts condition {
  if (condition) {
    return;
  }
  // Condition not passed

  const provided: string | undefined =
    typeof message === "function" ? message() : message;

  throw new ZudokuError(provided ?? "Invariant failed");
}

class ZudokuError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZudokuError";
  }
}
