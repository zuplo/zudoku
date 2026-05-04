import { useState } from "react";
import { cn } from "zudoku";
import { useZudoku } from "zudoku/hooks";
import { CalendarIcon, InfoIcon } from "zudoku/icons";
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
  hasCurrentBillables,
  hasFutureBillables,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  subscriptionId: string;
  billingPeriodEnd: string;
  hasCurrentBillables: boolean;
  hasFutureBillables: boolean;
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmed = planName.startsWith(confirmationText);
  const deploymentName = useDeploymentName();
  const context = useZudoku();
  const queryClient = useQueryClient();

  // Monetization backend rejects `next_billing_cycle` when the active phase has no
  // billable items (free plans, in-trial paid plans). Fall back to immediate.
  const cancelTiming = hasCurrentBillables ? "next_billing_cycle" : "immediate";
  const isImmediateCancel = !hasCurrentBillables;
  const isTrialCancel = isImmediateCancel && hasFutureBillables;

  const cancelSubscriptionMutation = useMutation({
    mutationKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/cancel`,
    ],
    meta: {
      context,
      request: {
        method: "POST",
        body: JSON.stringify({ timing: cancelTiming }),
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
            {isTrialCancel ? (
              <>
                <AlertTitle>Cancel your trial of {planName}?</AlertTitle>
                <AlertDescription>
                  Your subscription will end now and you won't be charged when
                  the trial would have converted to {planName}.
                </AlertDescription>
              </>
            ) : isImmediateCancel ? (
              <>
                <AlertTitle>Cancel your {planName} subscription?</AlertTitle>
                <AlertDescription>
                  Your subscription will end immediately. You'll lose access to
                  its entitlements right away.
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTitle>
                  Your plan will be canceled at the end of your billing cycle.
                </AlertTitle>
                <AlertDescription>
                  You'll retain access until {formatDate(billingPeriodEnd)}.
                  After your billing period ends, this plan will not renew and
                  you would need to subscribe again to continue.
                </AlertDescription>
              </>
            )}
          </Alert>

          <Alert variant="info">
            <InfoIcon className="size-4" />
            {isImmediateCancel ? (
              <>
                <AlertTitle>You can subscribe again at any time</AlertTitle>
                <AlertDescription>
                  After canceling, you can return to the pricing page and start
                  a new subscription whenever you're ready.
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTitle>You can still resume before then</AlertTitle>
                <AlertDescription>
                  If you change your mind you have until{" "}
                  {formatDate(billingPeriodEnd)} to remove this cancellation
                  from Manage subscription.
                </AlertDescription>
              </>
            )}
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
