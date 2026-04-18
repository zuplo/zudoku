import { Link } from "react-router";
import { cn } from "../../../util/cn.js";
import { slugify } from "../../../util/slugify.js";

export const SchemaRefLink = ({
  name,
  suffix,
  className,
}: {
  name: string;
  suffix?: string;
  className?: string;
}) => (
  <Link
    to={{ pathname: "../~schemas", hash: slugify(name) }}
    className={cn(
      "text-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid",
      className,
    )}
  >
    {name}
    {suffix}
  </Link>
);
