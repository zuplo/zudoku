import { ErrorAlert } from "./ErrorAlert.js";

export function ServerError({ error }: { error: unknown }) {
  return <ErrorAlert error={error} />;
}
