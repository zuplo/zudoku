import { useState } from "react";
import { Link } from "zudoku/components";
import { CreditCardIcon, RefreshCcw, Settings } from "zudoku/icons";
import { Button } from "zudoku/ui/Button";
import { Card, CardContent } from "zudoku/ui/Card";
import { Separator } from "zudoku/ui/Separator";
import type { Subscription } from "../../types/SubscriptionType.js";
import {
  activePhaseHasBillables,
  hasFutureBillables,
} from "../../utils/billables.js";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog.js";
import { RestoreSubscriptionDialog } from "./RestoreSubscriptionDialog.js";
import { SwitchPlanModal } from "./SwitchPlanModal.js";

export const ManageSubscription = ({
  subscription,
  planName,
}: {
  subscription: Subscription;
  planName: string;
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const billingPeriodEnd =
    subscription.alignment.currentAlignedBillingPeriod.to;
  const canResumeCanceledSubscription =
    subscription.status === "canceled" &&
    new Date(billingPeriodEnd) > new Date();
  const hasCurrentBillables = activePhaseHasBillables(subscription);
  const futureBillables = hasFutureBillables(subscription);

  return (
    <Card>
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        planName={planName}
        subscriptionId={subscription.id}
        billingPeriodEnd={billingPeriodEnd}
        hasCurrentBillables={hasCurrentBillables}
        hasFutureBillables={futureBillables}
      />
      <RestoreSubscriptionDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        planName={planName}
        subscriptionId={subscription.id}
        billingPeriodEnd={billingPeriodEnd}
      />
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1" id="manage">
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
              {subscription.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel subscription
                </Button>
              )}
              {canResumeCanceledSubscription && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestoreDialogOpen(true)}
                >
                  Resume subscription
                </Button>
              )}

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
