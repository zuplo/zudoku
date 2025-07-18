import { cn } from "zudoku";
import { Box } from "./Box";

export const BoxLongshadow = ({
  children,
  className,
  shadowLength = "medium",
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  shadowLength?: "medium" | "large";
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <Box
      className={cn(
        "overflow-hidden",
        shadowLength === "medium" && "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        shadowLength === "large" && "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className,
      )}
      {...props}
    >
      {children}
    </Box>
  );
};

export default BoxLongshadow;
