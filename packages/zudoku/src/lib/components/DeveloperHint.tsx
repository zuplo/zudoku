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
  const { t } = useTranslation("common");
  if (process.env.NODE_ENV !== "development") return;

  return (
    <Callout
      type="caution"
      title={t("component.developerHint.title")}
      className={className}
    >
      <div className="flex flex-col gap-2">
        {typeof children === "string" ? (
          <Markdown content={children} />
        ) : (
          <div>{children}</div>
        )}
        <small className="italic">{t("component.developerHint.note")}</small>
      </div>
    </Callout>
  );
};
