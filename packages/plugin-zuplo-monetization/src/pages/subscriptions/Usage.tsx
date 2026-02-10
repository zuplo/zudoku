import { cn } from "zudoku";
import { Button, Heading } from "zudoku/components";
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  Grid2x2XIcon,
  Loader2Icon,
} from "zudoku/icons";
import { Link } from "zudoku/router";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "zudoku/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "zudoku/ui/Card";
import { Progress } from "zudoku/ui/Progress";
import type { Item } from "../../hooks/useSubscriptions";

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
  status: string;
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
}: {
  meter: MeteredEntitlement;
  item?: Item;
}) => {
  const overageTier =
    item?.price?.tiers?.find((t) => !t.upToAmount) ??
    item?.price?.tiers?.at(-1);
  const rate = overageTier?.unitPrice?.amount;

  return (
    <Card
      className={cn(meter.overage > 0 && "border-destructive bg-destructive/5")}
    >
      <CardHeader>
        {meter.overage > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="size-4 text-red-600 shrink-0" />
            <AlertTitle>You've exceeded your monthly quota</AlertTitle>
            <AlertDescription>
              Additional usage is being charged at the overage rate
              {rate ? ` ($${Number(rate).toFixed(2)}/call)` : ""}. Upgrade to a
              higher plan for more usage.
            </AlertDescription>

            <AlertAction>
              <Button variant="destructive" size="sm" asChild>
                <Link to="/pricing">
                  <ArrowUpIcon />
                  Upgrade
                </Link>
              </Button>
            </AlertAction>
          </Alert>
        )}
        <CardTitle>
          {item?.name ?? "Limit"} {item?.price?.amount}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col gap-2 mb-2">
            <span
              className={cn(meter.overage > 0 && "text-red-600 font-medium")}
            >
              {meter.usage.toLocaleString()} used
              {meter.overage > 0 && (
                <span className="ml-1 text-xs">
                  (+{meter.overage.toLocaleString()} overage)
                </span>
              )}
            </span>
          </div>
          <span className="text-foreground font-medium">
            {meter.balance.toLocaleString()} limit
          </span>
        </div>
        <Progress
          value={(meter.usage / meter.balance) * 100}
          className={cn("mb-3 h-2", meter.overage > 0 && "bg-red-500")}
        />
        <p className="text-xs text-muted-foreground">
          {(meter.balance - meter.usage).toLocaleString()} remaining this month
        </p>
      </CardContent>
    </Card>
  );
};

export const Usage = ({
  usage,
  currentItems,
}: {
  usage: UsageResult;
  currentItems?: Item[];
}) => {
  const hasUsage = Object.values(usage.entitlements).some((value) =>
    isMeteredEntitlement(value),
  );

  return (
    <div className="space-y-4">
      <Heading level={3}>Usage</Heading>
      {usage.paymentStatus.status === "pending" && (
        <Alert fit="loose">
          <Loader2Icon className="size-5 animate-spin mr-1 ml-1 self-center" />
          <AlertTitle>Your payment is being processed</AlertTitle>
          <AlertDescription>
            Your API keys may take a minute to load. Please wait while we set up
            your subscription.
          </AlertDescription>
        </Alert>
      )}
      {usage.paymentStatus.status === "failed" && (
        <Alert variant="destructive" fit="loose">
          <AlertTriangleIcon className="size-4 shrink-0" />
          <AlertTitle>Payment failed</AlertTitle>
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
              item={currentItems?.find((item) => item.featureKey === key)}
            />
          ) : (
            []
          ),
        )
      ) : (
        <Alert variant="warning">
          <Grid2x2XIcon />
          <AlertTitle>No usage data available</AlertTitle>
          <AlertDescription>
            This subscription does not have any usage data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
