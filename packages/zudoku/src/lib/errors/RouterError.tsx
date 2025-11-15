import { isRouteErrorResponse, useRouteError } from "react-router";
import { NotFoundPage } from "../components/NotFoundPage.js";
import { cn } from "../util/cn.js";
import { ErrorAlert } from "./ErrorAlert.js";

export function RouterError({ className }: { className?: string }) {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <div className={cn("mx-4 max-w-2xl", className)}>
      <ErrorAlert error={error} />
    </div>
  );
}
