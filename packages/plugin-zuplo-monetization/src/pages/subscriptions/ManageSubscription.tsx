import { useState } from "react";
import { Link } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { ExternalLink, RefreshCcw, Settings } from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { Button } from "zudoku/ui/Button";
import { Card, CardContent } from "zudoku/ui/Card";
import { Tooltip, TooltipContent, TooltipTrigger } from "zudoku/ui/Tooltip";
import { useDeploymentName } from "../../hooks/useDeploymentName.js";
import type { Subscription } from "../../hooks/useSubscriptions.js";
import {
  createMutationFn,
  queryClient,
} from "../../ZuploMonetizationWrapper.js";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog.js";

export const ManageSubscription = ({
  subscription,
  planName,
}: {
  subscription: Subscription;
  planName: string;
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const context = useZudoku();
  const deploymentName = useDeploymentName();
  const cancelSubscriptionMutation = useMutation({
    mutationFn: createMutationFn(
      () =>
        `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscription.id}/cancel`,
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
              <Button variant="outline" size="sm" asChild>
                <Link to="/pricing">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  New Subscription
                </Link>
              </Button>

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelDialogOpen(true)}
                      title="You can only cancel your subscription if it is not active."
                      disabled={subscription.status === "canceled"}
                    >
                      Cancel subscription
                    </Button>
                  </div>
                </TooltipTrigger>
                {subscription.status === "canceled" && (
                  <TooltipContent>
                    Your subscription is already cancelled.
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <span>
                Your payment is managed by{" "}
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
