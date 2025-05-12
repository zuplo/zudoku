import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "../util/cn.js";
import { Button } from "./index.js";

export const Pagination = ({
  prev,
  next,
  className,
}: {
  prev: { to: string; label: string } | undefined;
  next: { to: string; label: string } | undefined;
  className?: string;
}) => {
  const linkClass =
    "group transition-all p-5 space-x-1 transition-all hover:text-foreground";

  return (
    <div
      className={cn(
        "flex -mx-4 text-muted-foreground font-semibold",
        prev ? "justify-between" : "justify-end",
        className,
      )}
    >
      {prev && (
        <Button variant="ghost" asChild>
          <Link to={prev.to} relative="path" className={linkClass}>
            <ArrowLeftIcon
              className="group-hover:motion-safe:animate-bounce-x-start"
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
              className="group-hover:motion-safe:animate-bounce-x-end"
              size={12}
            />
          </Link>
        </Button>
      )}
    </div>
  );
};
