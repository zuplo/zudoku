import { cn } from "zudoku";
import { Button, Heading, Link } from "zudoku/components";
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  Grid2x2XIcon,
  Loader2Icon,
} from "zudoku/icons";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "zudoku/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "zudoku/ui/Card";
import { Progress } from "zudoku/ui/Progress";
import type { Item, Subscription } from "../../hooks/useSubscriptions";
import { SwitchPlanModal } from "./SwitchPlanModal";

export type UsageResult = {
  $schema: string;
  customerId: string;
  entitlements: Record<string, Entitlement | MeteredEntitlement>;
  planKey: string;
  subscriptionId: string;
  paymentStatus: PaymentStatus;
  annotations?: Annotations;
};

export type PaymentStatus = {
  status: "failed" | "paid" | "uncollectible" | "not_required" | "pending";
  isFirstPayment?: boolean;
  lastPaymentSucceededAt?: string;
  lastPaymentFailedAt?: string;
};

export type Annotations = {
  "subscription.previous.id"?: string;
};

export type Entitlement = {
  hasAccess: boolean;
  config?: string;
};

export type MeteredEntitlement = Entitlement & {
  balance: number;
  usage: number;
  overage: number;
};

const isMeteredEntitlement = (
  entitlement: Entitlement | MeteredEntitlement,
): entitlement is MeteredEntitlement => {
  return "balance" in entitlement;
};

const UsageItem = ({
  meter,
  item,
  subscription,
}: {
  meter: MeteredEntitlement;
  item?: Item;
  subscription?: Subscription;
}) => {
  const isSoftLimit = item?.included?.entitlement?.isSoftLimit ?? true;
  const overageTier =
    item?.price?.tiers?.find((t) => !t.upToAmount) ??
    item?.price?.tiers?.at(-1);
  const rate = overageTier?.unitPrice?.amount;
  const hasOverage = meter.overage > 0;
  const limit = meter.balance + meter.usage - meter.overage;
  const isAtLimit = !isSoftLimit && meter.usage >= limit;
  const dangerZone = hasOverage || isAtLimit;

  return (
    <Card className={cn(dangerZone && "border-destructive bg-destructive/5")}>
      <CardHeader>
        {hasOverage && isSoftLimit && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="size-4 text-red-600 shrink-0" />
            <AlertTitle>You've exceeded your monthly quota</AlertTitle>
            <AlertDescription>
              Additional usage is being charged at the overage rate
              {rate ? ` ($${Number(rate).toFixed(2)}/call)` : ""}. Upgrade to a
              higher plan for more usage.
            </AlertDescription>

            {subscription && (
              <AlertAction>
                <SwitchPlanModal subscription={subscription}>
                  <Button variant="destructive" size="xs">
                    <ArrowUpIcon />
                    Upgrade
                  </Button>
                </SwitchPlanModal>
              </AlertAction>
            )}
          </Alert>
        )}
        {isAtLimit && !isSoftLimit && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="size-4 text-red-600 shrink-0" />
            <AlertTitle>You've reached your monthly limit</AlertTitle>
            <AlertDescription>
              Requests beyond your quota are blocked. Upgrade to a higher plan
              for more usage.
            </AlertDescription>

            {subscription && (
              <AlertAction>
                <SwitchPlanModal subscription={subscription}>
                  <Button variant="destructive" size="xs">
                    <ArrowUpIcon />
                    Upgrade
                  </Button>
                </SwitchPlanModal>
              </AlertAction>
            )}
          </Alert>
        )}
        <CardTitle>
          {item?.name ?? "Limit"} {item?.price?.amount}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col gap-2 mb-2">
            <span className={cn(dangerZone && "text-red-600 font-medium")}>
              {meter.usage.toLocaleString()} used
              {hasOverage && isSoftLimit && (
                <span className="ml-1 text-xs">
                  (+{meter.overage.toLocaleString()} overage)
                </span>
              )}
            </span>
          </div>
          <span className="text-foreground font-medium">
            {limit.toLocaleString()} limit
          </span>
        </div>
        <Progress
          value={Math.min(100, limit > 0 ? (meter.usage / limit) * 100 : 100)}
          className={cn("mb-3 h-2", dangerZone && "bg-destructive")}
        />
        <p className="text-xs text-muted-foreground">
          {meter.balance.toLocaleString()} remaining this month
        </p>
      </CardContent>
    </Card>
  );
};

export const Usage = ({
  usage,
  isFetching,
  currentItems,
  subscription,
  isPendingFirstPayment,
}: {
  usage: UsageResult;
  isFetching: boolean;
  currentItems?: Item[];
  subscription?: Subscription;
  isPendingFirstPayment: boolean;
}) => {
  const hasUsage = Object.values(usage.entitlements).some((value) =>
    isMeteredEntitlement(value),
  );

  return (
    <div className="space-y-4">
      <Heading level={3}>Usage</Heading>
      {(isPendingFirstPayment || usage.paymentStatus.status === "pending") && (
        <Alert fit="loose">
          <Loader2Icon className="size-5 animate-spin mr-1 ml-1 self-center" />
          <AlertTitle>Your payment is being processed</AlertTitle>
          <AlertDescription>
            Your API keys may take a minute to load. Please wait while we set up
            your subscription.
          </AlertDescription>
        </Alert>
      )}
      {(usage.paymentStatus.status === "failed" ||
        usage.paymentStatus.status === "uncollectible") && (
        <Alert variant="destructive" fit="loose">
          <AlertTriangleIcon className="size-4 shrink-0" />
          <AlertTitle>
            {usage.paymentStatus.status === "failed"
              ? "Payment failed"
              : "Payment unsuccessful"}
          </AlertTitle>
          <AlertDescription>
            Your last payment was unsuccessful. Please update your billing
            information to continue using your subscription.
          </AlertDescription>
          <AlertAction>
            <Button variant="destructive" size="xs" asChild>
              <Link to="/manage-payment" target="_blank">
                Manage billing
              </Link>
            </Button>
          </AlertAction>
        </Alert>
      )}
      {hasUsage ? (
        Object.entries(usage.entitlements).flatMap(([key, value]) =>
          isMeteredEntitlement(value) ? (
            <UsageItem
              key={key}
              meter={{ ...value }}
              subscription={subscription}
              item={currentItems?.find((item) => item.featureKey === key)}
            />
          ) : (
            []
          ),
        )
      ) : !isFetching &&
        !subscription?.annotations?.["subscription.previous.id"] ? (
        <Alert variant="warning">
          <Grid2x2XIcon />
          <AlertTitle>No usage data available</AlertTitle>
          <AlertDescription>
            This subscription does not have any usage data.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};
