import { cn } from "zudoku";
import { Box } from "./Box";

export const BentoBox = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Box className={cn("overflow-hidden text-black", className)}>
      {children}
    </Box>
  );
};

export const BentoImage = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn("h-[330px] overflow-hidden p-8", className)}
      style={{
        background: `url('/grid.svg')`,
        backgroundPosition: "top center",
        backgroundRepeat: "repeat-x",
      }}
    >
      {children}
    </div>
  );
};

export const BentoDescription = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="border-t border-[black] flex flex-col gap-1.5 p-8">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-xl">{description}</p>
    </div>
  );
};
