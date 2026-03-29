import type { ReactNode } from "react";
import { useTranslation } from "../i18n/I18nContext.js";
import { ErrorPage } from "./ErrorPage.js";
import { NotFoundPage } from "./NotFoundPage.js";

type StatusPageProps = {
  statusCode: number;
  message?: ReactNode;
};

const KNOWN_STATUS_CODES = [
  400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504,
];

export const StatusPage = ({ statusCode, message }: StatusPageProps) => {
  const { t } = useTranslation();

  if (statusCode === 404) {
    return <NotFoundPage />;
  }

  const statusKey = KNOWN_STATUS_CODES.includes(statusCode)
    ? statusCode
    : "default";

  return (
    <ErrorPage
      title={t(`status.${statusKey}.title`)}
      message={message ?? t(`status.${statusKey}.message`)}
      category={statusCode}
    />
  );
};
