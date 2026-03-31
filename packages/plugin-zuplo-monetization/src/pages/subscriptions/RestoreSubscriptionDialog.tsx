import { useEffect } from "react";
import { useZudoku } from "zudoku/hooks";
import { CalendarIcon, CircleSlashIcon } from "zudoku/icons";
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
import { useDeploymentName } from "../../hooks/useDeploymentName.js";
import { formatDate } from "./ApiKey.js";

export const RestoreSubscriptionDialog = ({
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
  const deploymentName = useDeploymentName();
  const context = useZudoku();
  const queryClient = useQueryClient();

  const restoreSubscriptionMutation = useMutation({
    mutationKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/restore`,
    ],
    meta: {
      context,
      request: {
        method: "POST",
      },
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      restoreSubscriptionMutation.reset();
    }
  }, [open, restoreSubscriptionMutation]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      restoreSubscriptionMutation.reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resume subscription</DialogTitle>
          <DialogDescription>
            You scheduled <span className="font-medium">{planName}</span> to
            end. You can still change your mind before the current billing
            period ends.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert variant="info">
            <CalendarIcon className="size-4" />
            <AlertTitle>What happens if you resume</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Your access stays in place until {formatDate(billingPeriodEnd)}{" "}
                either way.
              </p>
              <p>
                Confirming will remove the pending cancellation. Your
                subscription will remain active and continue to renew on your
                normal billing schedule, and charges will apply as usual.
              </p>
            </AlertDescription>
          </Alert>

          {restoreSubscriptionMutation.isError && (
            <Alert variant="destructive">
              <CircleSlashIcon className="size-4" />
              <AlertTitle>Could not resume subscription</AlertTitle>
              <AlertDescription>
                {restoreSubscriptionMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <ActionButton
            disabled={restoreSubscriptionMutation.isPending}
            isPending={
              restoreSubscriptionMutation.isPending ||
              restoreSubscriptionMutation.isSuccess
            }
            onClick={() => restoreSubscriptionMutation.mutate()}
          >
            Resume subscription
          </ActionButton>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Keep cancellation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
