import { useState } from "react";
import { useZudoku } from "zudoku/hooks";
import { ExternalLink, RefreshCcw, Settings } from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { Button } from "zudoku/ui/Button";
import { Card, CardContent } from "zudoku/ui/Card";
import {
  createMutationFn,
  queryClient,
} from "../../ZuploMonetizationWrapper.js";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog.js";

export const ManageSubscription = ({
  deploymentName,
  subscriptionId,
  planName,
  billingCycleEnd,
}: {
  deploymentName: string;
  subscriptionId: string;
  planName: string;
  billingCycleEnd: Date;
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const context = useZudoku();
  const cancelSubscriptionMutation = useMutation({
    mutationFn: createMutationFn(
      () =>
        `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/cancel`,
      context,
      {
        method: "POST",
        body: JSON.stringify({
          timing: "next_billing_cycle",
        }),
      },
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  return (
    <Card>
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        planName={planName}
        billingCycleEnd={billingCycleEnd}
        onCancel={() => cancelSubscriptionMutation.mutateAsync()}
        isPending={cancelSubscriptionMutation.isPending}
      />
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Manage Subscription
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Switch to a different plan or cancel your current subscription.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Switch Plans
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel subscription
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <span>
                To manage your payment method or billing information, visit{" "}
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Stripe
                </a>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
