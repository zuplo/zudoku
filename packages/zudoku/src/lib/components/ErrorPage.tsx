import type { ReactNode } from "react";
import { CategoryHeading } from "./CategoryHeading.js";
import { useTranslation } from "./context/useTranslation.js";
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
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("error.default.title");

  return (
    <Typography className={"h-full pt-(--padding-content-top)"}>
      {category && <CategoryHeading>{category}</CategoryHeading>}
      {resolvedTitle && (
        <Heading level={1} className="flex gap-3.5 items-center">
          {resolvedTitle}
        </Heading>
      )}
      <p>{message}</p>
    </Typography>
  );
};
