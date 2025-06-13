import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../ui/Pagination.js";

export const Pager = ({
  prev,
  next,
  className,
}: {
  prev: { to: string; label: string } | undefined;
  next: { to: string; label: string } | undefined;
  className?: string;
}) => {
  return (
    <Pagination className={className}>
      <PaginationContent className="not-prose justify-between w-full">
        {prev ? (
          <PaginationItem>
            <PaginationPrevious to={prev.to} relative="path">
              {prev.label}
            </PaginationPrevious>
          </PaginationItem>
        ) : (
          <div />
        )}
        {next && (
          <PaginationItem>
            <PaginationNext to={next.to} relative="path">
              {next.label}
            </PaginationNext>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};
