import type { ReactNode } from "react";
import { useTranslation } from "./context/useTranslation.js";
import { ErrorPage } from "./ErrorPage.js";
import { NotFoundPage } from "./NotFoundPage.js";

type StatusPageProps = {
  statusCode: number;
  message?: ReactNode;
};

const KNOWN_STATUS_CODES = new Set([
  400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504,
]);

export const StatusPage = ({ statusCode, message }: StatusPageProps) => {
  const { t } = useTranslation();

  if (statusCode === 404) {
    return <NotFoundPage />;
  }

  const prefix = KNOWN_STATUS_CODES.has(statusCode)
    ? `error.${statusCode}`
    : "error.default";

  return (
    <ErrorPage
      title={t(`${prefix}.title`)}
      message={message ?? t(`${prefix}.message`)}
      category={statusCode}
    />
  );
};
