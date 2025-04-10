import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "../util/cn.js";
import { Button } from "./index.js";

export const Pagination = ({
  prev,
  next,
}: {
  prev: { to: string; label: string } | undefined;
  next: { to: string; label: string } | undefined;
}) => {
  const linkClass =
    "group transition-all p-5 space-x-1 rtl:space-x-reverse transition-all hover:text-foreground";

  return (
    <div
      className={cn(
        "flex my-8 -mx-4 text-muted-foreground font-semibold",
        prev ? "justify-between" : "justify-end",
      )}
    >
      {prev && (
        <Button variant="ghost" asChild>
          <Link to={prev.to} relative="path" className={linkClass}>
            <ArrowLeftIcon
              className="ltr:group-hover:motion-safe:animate-bounce-x-start rtl:rotate-180"
              size={12}
            />
            <span className="truncate">{prev.label}</span>
          </Link>
        </Button>
      )}
      {next && (
        <Button variant="ghost" asChild>
          <Link to={next.to} relative="path" className={linkClass}>
            <span className="truncate ">{next.label}</span>
            <ArrowRightIcon
              className="ltr:group-hover:motion-safe:animate-bounce-x-end rtl:rotate-180"
              size={12}
            />
          </Link>
        </Button>
      )}
    </div>
  );
};
