import { forwardRef } from "react";
import { Spinner } from "../components/Spinner.js";
import { Button, type ButtonProps } from "./Button.js";
import { cn } from "./util.js";

type ActionButtonProps = ButtonProps & { isPending?: boolean };

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ isPending, children, className, ...props }: ActionButtonProps, ref) => {
    return (
      <Button
        ref={ref}
        disabled={isPending}
        {...props}
        className={cn("relative", className)}
      >
        {isPending && (
          <div className="absolute inset-0 grid place-items-center">
            <Spinner />
          </div>
        )}
        <div className={cn(isPending && "invisible")}>{children}</div>
      </Button>
    );
  },
);

ActionButton.displayName = "ActionButton";
