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
    "group transition-all p-5 space-x-1 rtl:space-x-reverse transition-all hover:text-foreground min-w-0";

  return (
    <div
      className={cn(
        "flex -mx-4 text-muted-foreground font-semibold gap-2",
        prev ? "justify-between" : "justify-end",
        className,
      )}
      data-pagefind-ignore="all"
    >
      {prev && (
        <Button
          variant="ghost"
          asChild
          className="min-w-0 max-w-[calc(50%-0.25rem)]"
        >
          <Link to={prev.to} relative="path" className={linkClass}>
            <ArrowLeftIcon size={14} strokeWidth={2.5} className="shrink-0" />
            <span className="text-lg truncate">{prev.label}</span>
          </Link>
        </Button>
      )}
      {next && (
        <Button
          variant="ghost"
          asChild
          className="min-w-0 max-w-[calc(50%-0.25rem)]"
        >
          <Link to={next.to} relative="path" className={linkClass}>
            <span className="text-lg truncate">{next.label}</span>
            <ArrowRightIcon size={14} strokeWidth={2.5} className="shrink-0" />
          </Link>
        </Button>
      )}
    </div>
  );
};
