import { cn } from "zudoku";

export const Box = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("border border-[black] rounded-md bg-white", className)}
      {...props}
    >
      {children}
    </div>
  );
};
