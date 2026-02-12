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
    "group min-w-0 transition-all p-5 space-x-1 rtl:space-x-reverse hover:text-foreground";
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 -mx-4 text-muted-foreground font-semibold",
        prev ? "justify-between" : "justify-end",
        className,
      )}
      data-pagefind-ignore="all"
    >
      {prev && (
        <Button variant="ghost" className="min-w-0 max-w-full" asChild>
          <Link to={prev.to} relative="path" className={linkClass}>
            <ArrowLeftIcon size={14} strokeWidth={2.5} />
            <span className="text-lg truncate">{prev.label}</span>
          </Link>
        </Button>
      )}
      {next && (
        <Button variant="ghost" className="ms-auto min-w-0 max-w-full" asChild>
          <Link to={next.to} relative="path" className={linkClass}>
            <span className="text-lg truncate">{next.label}</span>
            <ArrowRightIcon size={14} strokeWidth={2.5} />
          </Link>
        </Button>
      )}
    </div>
  );
};
