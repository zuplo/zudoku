import { useState } from "react";
import { Link } from "zudoku/components";
import { CreditCardIcon, RefreshCcw, Settings } from "zudoku/icons";
import { Button } from "zudoku/ui/Button";
import { Card, CardContent } from "zudoku/ui/Card";
import { Separator } from "zudoku/ui/Separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "zudoku/ui/Tooltip";
import type { Subscription } from "../../hooks/useSubscriptions.js";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog.js";
import { SwitchPlanModal } from "./SwitchPlanModal.js";

export const ManageSubscription = ({
  subscription,
  planName,
}: {
  subscription: Subscription;
  planName: string;
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  return (
    <Card>
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        planName={planName}
        subscriptionId={subscription.id}
        billingPeriodEnd={subscription.alignment.currentAlignedBillingPeriod.to}
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
              {subscription.status === "canceled" && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/pricing">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    New subscription
                  </Link>
                </Button>
              )}
              {subscription.status === "active" && (
                <SwitchPlanModal subscription={subscription} />
              )}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelDialogOpen(true)}
                      title="You can only cancel your subscription if it is not active."
                      disabled={subscription.status !== "active"}
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

              <Button asChild size="sm" variant="secondary">
                <Link to="/manage-payment">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon />
                    Manage payment details
                  </div>
                </Link>
              </Button>
            </div>
            <Separator className="my-4" />
            <span className="text-sm text-muted-foreground">
              Your payment is securely managed by Stripe.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
