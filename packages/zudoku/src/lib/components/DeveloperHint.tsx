import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Callout } from "../ui/Callout.js";
import { Markdown } from "./Markdown.js";

export const DeveloperHint = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { t } = useTranslation();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Callout type="caution" title={t("developerHint")} className={className}>
      <div className="flex flex-col gap-2">
        {typeof children === "string" ? (
          <Markdown content={children} />
        ) : (
          <div>{children}</div>
        )}
        <small className="italic">{t("developerHintNote")}</small>
      </div>
    </Callout>
  );
};
