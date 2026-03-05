import { Button, type ButtonProps } from "zudoku/ui/Button.js";
import { Spinner } from "../components/Spinner.js";
import { cn } from "../util/cn.js";

type ActionButtonProps = ButtonProps & { isPending?: boolean };

export const ActionButton = ({
  isPending,
  children,
  className,
  ...props
}: ActionButtonProps) => (
  <Button disabled={isPending} {...props} className={cn("relative", className)}>
    {isPending && (
      <div className="absolute inset-0 grid place-items-center">
        <Spinner />
      </div>
    )}
    <span className={cn("block", isPending && "invisible")}>{children}</span>
  </Button>
);
