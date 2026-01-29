import { useState } from "react";
import { CalendarIcon, CircleAlert } from "zudoku/icons";
import { ActionButton } from "zudoku/ui/ActionButton";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import { Button } from "zudoku/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog";
import { Input } from "zudoku/ui/Input";
import { cn } from "../../../../zudoku/src/lib/util/cn";

export const CancelSubscriptionDialog = ({
  open,
  onOpenChange,
  planName,
  onCancel,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  onCancel: () => void;
  isPending?: boolean;
}) => {
  const [confirmationText, setConfirmationText] = useState("");

  const isConfirmed = planName.startsWith(confirmationText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>We're sorry to see you go.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert variant="warning">
            <CalendarIcon className="size-4" />
            <AlertTitle>
              Your plan will be canceled at the end of your billing cycle.
            </AlertTitle>
            <AlertDescription>
              You'll retain access until February 27, 2026
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertTitle>This action cannot be undone</AlertTitle>
            <AlertDescription>
              Once cancelled, you will not be able to recover this plan or its
              associated settings. You would need to subscribe again.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label
              className="text-sm text-foreground"
              htmlFor="confirmationText"
            >
              Type{" "}
              <span className="font-medium text-destructive">{planName}</span>{" "}
              to confirm
            </label>
            <Input
              id="confirmationText"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder=""
            />

            <p
              className={cn(
                "text-xs text-destructive transition-opacity opacity-0",
                confirmationText && !isConfirmed && "opacity-100",
              )}
            >
              Please type the plan name exactly as shown
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <ActionButton
            variant="destructive"
            disabled={
              !isConfirmed || confirmationText !== planName || isPending
            }
            onClick={onCancel}
          >
            {isPending ? "Canceling..." : "Cancel Subscription"}
          </ActionButton>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep my subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
