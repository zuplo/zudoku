import { UnlinkIcon } from "lucide-react";
import { Link, useParams } from "react-router";
import { CategoryHeading } from "./CategoryHeading.js";
import { useTranslation } from "./context/useTranslation.js";
import { useZudoku } from "./context/ZudokuContext.js";
import { DeveloperHint } from "./DeveloperHint.js";
import { Heading } from "./Heading.js";
import { Typography } from "./Typography.js";

export const NotFoundPage = () => {
  const params = useParams();
  const { notFoundPage } = useZudoku();
  const { t } = useTranslation();

  if (notFoundPage) {
    return <>{notFoundPage}</>;
  }

  return (
    <Typography
      className="h-full pt-(--padding-content-top)"
      data-pagefind-ignore="all"
    >
      <CategoryHeading>404</CategoryHeading>
      <Heading level={1} className="flex gap-3.5 items-center">
        {t("notFound.title")}
        <UnlinkIcon size={24} />
      </Heading>
      <DeveloperHint>
        {t("notFound.developerHint", {
          root: "{DOCUMENT_ROOT}",
          path: params["*"] ?? "",
        })}
      </DeveloperHint>
      <p>{t("notFound.body")}</p>
      <Link to="/">{t("notFound.goHome")}</Link>
    </Typography>
  );
};
