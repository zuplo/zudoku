import { isRouteErrorResponse, useRouteError } from "react-router";
import { NotFoundPage } from "../components/NotFoundPage.js";
import { ErrorAlert } from "./ErrorAlert.js";

export function RouterError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return <ErrorAlert error={error} />;
}
