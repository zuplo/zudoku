import { useState } from "react";
import { cn } from "zudoku";
import { useZudoku } from "zudoku/hooks";
import { CalendarIcon, CircleAlert } from "zudoku/icons";
import { useMutation, useQueryClient } from "zudoku/react-query";
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
import { useDeploymentName } from "../../hooks/useDeploymentName";
import { formatDate } from "./ApiKey";

export const CancelSubscriptionDialog = ({
  open,
  onOpenChange,
  planName,
  subscriptionId,
  billingPeriodEnd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  subscriptionId: string;
  billingPeriodEnd: string;
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmed = planName.startsWith(confirmationText);
  const deploymentName = useDeploymentName();
  const context = useZudoku();
  const queryClient = useQueryClient();

  const cancelSubscriptionMutation = useMutation({
    mutationKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/cancel`,
    ],
    meta: {
      context,
      request: {
        method: "POST",
        body: JSON.stringify({ timing: "next_billing_cycle" }),
      },
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      onOpenChange(false);
    },
  });

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
              You'll retain access until {formatDate(billingPeriodEnd)}
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
              !isConfirmed ||
              confirmationText !== planName ||
              cancelSubscriptionMutation.isPending
            }
            isPending={
              cancelSubscriptionMutation.isPending ||
              cancelSubscriptionMutation.isSuccess
            }
            onClick={() => cancelSubscriptionMutation.mutate()}
          >
            Cancel subscription
          </ActionButton>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep my subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
