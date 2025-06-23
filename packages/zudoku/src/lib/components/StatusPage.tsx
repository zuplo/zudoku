import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ErrorPage } from "./ErrorPage.js";

type StatusPageProps = {
  statusCode: number;
  message?: ReactNode;
};

const getDefaultContent = (
  statusCode: number,
  t: (key: string) => string,
): { title: string; message: string } => {
  switch (statusCode) {
    case 400:
      return {
        title: t("statusPage.400.title"),
        message: t("statusPage.400.message"),
      };
    case 403:
      return {
        title: t("statusPage.403.title"),
        message: t("statusPage.403.message"),
      };
    case 404:
      return {
        title: t("statusPage.404.title"),
        message: t("statusPage.404.message"),
      };
    case 405:
      return {
        title: t("statusPage.405.title"),
        message: t("statusPage.405.message"),
      };
    case 414:
      return {
        title: t("statusPage.414.title"),
        message: t("statusPage.414.message"),
      };
    case 416:
      return {
        title: t("statusPage.416.title"),
        message: t("statusPage.416.message"),
      };
    case 500:
      return {
        title: t("statusPage.500.title"),
        message: t("statusPage.500.message"),
      };
    case 501:
      return {
        title: t("statusPage.501.title"),
        message: t("statusPage.501.message"),
      };
    case 502:
      return {
        title: t("statusPage.502.title"),
        message: t("statusPage.502.message"),
      };
    case 503:
      return {
        title: t("statusPage.503.title"),
        message: t("statusPage.503.message"),
      };
    case 504:
      return {
        title: t("statusPage.504.title"),
        message: t("statusPage.504.message"),
      };
    default:
      return {
        title: t("statusPage.default.title"),
        message: t("statusPage.default.message"),
      };
  }
};

export const StatusPage = ({ statusCode, message }: StatusPageProps) => {
  const { t } = useTranslation("common");
  const defaultContent = getDefaultContent(statusCode, t);

  return (
    <ErrorPage
      title={defaultContent.title}
      message={message ?? defaultContent.message}
      category={statusCode}
    />
  );
};
