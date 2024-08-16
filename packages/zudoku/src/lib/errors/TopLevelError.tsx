import { FallbackProps } from "react-error-boundary";
import { ErrorAlert } from "./ErrorAlert.js";

export function TopLevelError({ error, resetErrorBoundary }: FallbackProps) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return <ErrorAlert error={error} />;
}
