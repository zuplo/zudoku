import { UnlinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { CategoryHeading } from "./CategoryHeading.js";
import { DeveloperHint } from "./DeveloperHint.js";
import { Heading } from "./Heading.js";
import { Typography } from "./Typography.js";

export const NotFoundPage = () => {
  const params = useParams();
  const { t } = useTranslation();

  return (
    <Typography className="h-full pt-(--padding-content-top)">
      <CategoryHeading>404</CategoryHeading>
      <Heading level={1} className="flex gap-3.5 items-center">
        {t("pageNotFound")}
        <UnlinkIcon size={24} />
      </Heading>
      <DeveloperHint>
        {t("startByAddingFile", "Start by adding a file at")}{" "}
        <code>
          {"{PROJECT_ROOT}"}/{params["*"]}.mdx
        </code>{" "}
        {t(
          "addContentToRemoveError",
          "and add some content to make this error go away.",
        )}
      </DeveloperHint>
      <p>
        {t(
          "pageNotFoundMessage",
          "It seems that the page you are looking for does not exist or may have been moved. Please check the URL for any typos or use the navigation menu to find the correct page.",
        )}
      </p>
      <Link to="/">{t("backHome")}</Link>
    </Typography>
  );
};
