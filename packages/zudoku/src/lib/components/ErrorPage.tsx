import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CategoryHeading } from "./CategoryHeading.js";
import { Heading } from "./Heading.js";
import { Typography } from "./Typography.js";

export const ErrorPage = ({
  title,
  message,
  category,
}: {
  title?: ReactNode;
  message?: ReactNode;
  category?: ReactNode;
}) => {
  const { t } = useTranslation("common");
  const effectiveTitle = title ?? t("component.errorPage.title");
  return (
    <Typography className={"h-full pt-(--padding-content-top)"}>
      {category && <CategoryHeading>{category}</CategoryHeading>}
      {effectiveTitle && (
        <Heading level={1} className="flex gap-3.5 items-center">
          {effectiveTitle}
        </Heading>
      )}
      <p>{message}</p>
    </Typography>
  );
};
