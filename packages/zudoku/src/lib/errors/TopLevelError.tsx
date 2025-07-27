import type { FallbackProps } from "react-error-boundary";
import { ErrorAlert } from "./ErrorAlert.js";

export function TopLevelError({ error }: FallbackProps) {
  return <ErrorAlert error={error} />;
}
