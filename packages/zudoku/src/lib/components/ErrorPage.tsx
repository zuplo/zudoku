import type { ReactNode } from "react";
import { CategoryHeading } from "./CategoryHeading.js";
import { Heading } from "./Heading.js";
import { ProseClasses } from "./Markdown.js";

export const ErrorPage = ({
  title = "An error occurred",
  message,
  category,
}: {
  title?: ReactNode;
  message?: ReactNode;
  category?: ReactNode;
}) => {
  return (
    <div className={ProseClasses + " h-full pt-[--padding-content-top]"}>
      {category && <CategoryHeading>{category}</CategoryHeading>}
      {title && (
        <Heading level={1} className="flex gap-3.5 items-center">
          {title}
        </Heading>
      )}
      <p>{message}</p>
    </div>
  );
};
