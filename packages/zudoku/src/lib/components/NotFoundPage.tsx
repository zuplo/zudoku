import { UnlinkIcon } from "lucide-react";
import { Link, useParams } from "react-router";
import { useTranslation } from "../i18n/I18nContext.js";
import { CategoryHeading } from "./CategoryHeading.js";
import { DeveloperHint } from "./DeveloperHint.js";
import { Heading } from "./Heading.js";
import { Typography } from "./Typography.js";

export const NotFoundPage = () => {
  const params = useParams();
  const { t } = useTranslation();

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
        Start by adding a file at{" "}
        <code>
          {"{DOCUMENT_ROOT}"}/{params["*"]}.mdx
        </code>{" "}
        and add some content to make this error go away. By default{" "}
        <code>DOCUMENT_ROOT</code> is the `pages` directory.
      </DeveloperHint>
      <p>{t("notFound.description")}</p>
      <Link to="/">{t("notFound.goHome")}</Link>
    </Typography>
  );
};
