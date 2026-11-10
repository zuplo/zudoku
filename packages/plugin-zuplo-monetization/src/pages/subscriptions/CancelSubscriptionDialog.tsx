import { useEffect, useState } from "react";
import { cn } from "zudoku";
import { useZudoku } from "zudoku/hooks";
import { CalendarIcon, CircleSlashIcon, InfoIcon } from "zudoku/icons";
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
import { Label } from "zudoku/ui/Label";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup";
import { useDeploymentName } from "../../hooks/useDeploymentName.js";
import { formatDate } from "./ApiKey.js";

type CancelTiming = "next_billing_cycle" | "immediate";

const DEFAULT_TIMING: CancelTiming = "next_billing_cycle";

const isCancelTiming = (value: string): value is CancelTiming =>
  value === "next_billing_cycle" || value === "immediate";

const TimingOption = ({
  value,
  title,
  description,
}: {
  value: CancelTiming;
  title: string;
  description: string;
}) => (
  <Label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 font-normal leading-normal hover:bg-accent/50 has-[[data-state=checked]]:border-primary">
    <RadioGroupItem value={value} className="mt-0.5" />
    <span className="grid gap-0.5">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </span>
  </Label>
);

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
  const [timing, setTiming] = useState<CancelTiming>(DEFAULT_TIMING);
  const isConfirmed = planName.startsWith(confirmationText);
  const deploymentName = useDeploymentName();
  const context = useZudoku();
  const queryClient = useQueryClient();

  // A trial is a phase without billable items followed by a paid phase. The
  // billing period is clamped to the current phase, so both timings end the
  // subscription before the trial converts and nothing is charged.
  const isTrial = !hasCurrentBillables && hasFutureBillables;
  const endsAtPeriodEnd = timing === "next_billing_cycle";
  const periodEnd = formatDate(billingPeriodEnd);

  const cancelSubscriptionMutation = useMutation<
    unknown,
    Error,
    { timing: CancelTiming }
  >({
    mutationKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/cancel`,
    ],
    meta: {
      context,
      request: { method: "POST" },
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      onOpenChange(false);
    },
  });

  // The dialog stays mounted between openings, so start each one fresh. A
  // subscription that was canceled and then resumed can be canceled again.
  const { reset: resetCancelMutation } = cancelSubscriptionMutation;
  useEffect(() => {
    if (!open) return;
    setConfirmationText("");
    setTiming(DEFAULT_TIMING);
    resetCancelMutation();
  }, [open, resetCancelMutation]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Stay open while the request runs. Reopening would reset the mutation
        // and allow a second cancellation, and closing would suggest the
        // subscription was kept while the cancellation still goes through.
        if (!nextOpen && cancelSubscriptionMutation.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>We're sorry to see you go.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <p
              id="cancel-timing-label"
              className="text-sm font-medium text-foreground"
            >
              When should your subscription end?
            </p>
            <RadioGroup
              aria-labelledby="cancel-timing-label"
              value={timing}
              // Changing the option resets the mutation, which would detach a
              // request still in flight and re-enable the cancel button.
              disabled={cancelSubscriptionMutation.isPending}
              onValueChange={(value) => {
                if (!isCancelTiming(value)) return;
                setTiming(value);
                resetCancelMutation();
              }}
            >
              <TimingOption
                value="next_billing_cycle"
                title="At the end of the billing period"
                description={`You keep access until ${periodEnd}`}
              />
              <TimingOption
                value="immediate"
                title="Immediately"
                description="You lose access right away"
              />
            </RadioGroup>
          </div>

          <Alert variant="warning">
            <CalendarIcon className="size-4" />
            {isTrial ? (
              <>
                <AlertTitle>Cancel your trial of {planName}?</AlertTitle>
                <AlertDescription>
                  {endsAtPeriodEnd
                    ? `You keep access until ${periodEnd}. Your subscription ends before the trial converts to ${planName}, so you won't be charged.`
                    : `Your subscription will end now and you won't be charged when the trial would have converted to ${planName}.`}
                </AlertDescription>
              </>
            ) : endsAtPeriodEnd ? (
              <>
                <AlertTitle>
                  Your plan will be canceled at the end of your billing cycle.
                </AlertTitle>
                <AlertDescription>
                  You'll retain access until {periodEnd}. After your billing
                  period ends, this plan will not renew and you would need to
                  subscribe again to continue.
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTitle>Cancel your {planName} subscription?</AlertTitle>
                <AlertDescription>
                  Your subscription will end immediately. You'll lose access to
                  its entitlements right away.
                </AlertDescription>
              </>
            )}
          </Alert>

          <Alert variant="info">
            <InfoIcon className="size-4" />
            {endsAtPeriodEnd ? (
              <>
                <AlertTitle>You can still resume before then</AlertTitle>
                <AlertDescription>
                  If you change your mind you have until {periodEnd} to remove
                  this cancellation from Manage subscription.
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTitle>You can subscribe again at any time</AlertTitle>
                <AlertDescription>
                  After canceling, you can return to the pricing page and start
                  a new subscription whenever you're ready.
                </AlertDescription>
              </>
            )}
          </Alert>

          {cancelSubscriptionMutation.isError && (
            <Alert variant="destructive">
              <CircleSlashIcon className="size-4" />
              <AlertTitle>Could not cancel subscription</AlertTitle>
              <AlertDescription>
                {cancelSubscriptionMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

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
            onClick={() => cancelSubscriptionMutation.mutate({ timing })}
          >
            Cancel subscription
          </ActionButton>
          <Button
            variant="ghost"
            disabled={cancelSubscriptionMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Keep my subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
