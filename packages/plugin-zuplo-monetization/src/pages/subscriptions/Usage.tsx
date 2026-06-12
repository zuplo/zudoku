import { cn } from "zudoku";
import { Button, Heading, Link } from "zudoku/components";
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  BadgePercentIcon,
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
import type { PendingCredit } from "../../hooks/usePendingCredits.js";
import type { Item, Subscription } from "../../types/SubscriptionType.js";
import { formatDurationAdjective } from "../../utils/formatDuration.js";
import { deriveUsageView } from "./deriveUsageView.js";
import { SwitchPlanModal } from "./SwitchPlanModal";

export type { PendingCredit };

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
  featureKey,
  pendingCredit,
}: {
  meter: MeteredEntitlement;
  item?: Item;
  subscription?: Subscription;
  featureKey: string;
  pendingCredit?: PendingCredit;
}) => {
  const cadence = item?.billingCadence ?? subscription?.billingCadence;
  const billingPeriod = cadence ? formatDurationAdjective(cadence) : "monthly";
  // All entitlement/price reasoning lives in the presenter; this component
  // only renders the resulting view.
  const view = deriveUsageView(meter, item);
  const atHardLimit = view.kind === "capped" && view.atLimit;
  const overIncluded = view.kind === "included" && view.overage > 0;

  const upgradeAction = (variant: "outline" | "destructive") =>
    subscription && (
      <AlertAction>
        <SwitchPlanModal subscription={subscription}>
          <Button variant={variant} size="xs">
            <ArrowUpIcon />
            Upgrade
          </Button>
        </SwitchPlanModal>
      </AlertAction>
    );

  return (
    <Card className={cn(atHardLimit && "border-destructive bg-destructive/5")}>
      <CardHeader>
        {/* A credit is a discount on this period's usage — shown whenever one
            exists, independent of quota or overage state. */}
        {pendingCredit && (
          <Alert className="mb-4">
            <BadgePercentIcon className="size-4 text-green-600 shrink-0" />
            <AlertTitle>Usage credit applied</AlertTitle>
            <AlertDescription>
              A credit of {pendingCredit.units.toLocaleString()}{" "}
              {pendingCredit.units === 1 ? "unit" : "units"} applies to this
              billing period and will be deducted from your next invoice
              automatically.
            </AlertDescription>
          </Alert>
        )}
        {overIncluded && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <AlertTitle>
              You've used your included {billingPeriod} usage
            </AlertTitle>
            <AlertDescription>
              Additional usage is billed
              {view.rateLabel ? ` at ${view.rateLabel}` : ""}. Upgrade to a
              higher plan for more included usage.
            </AlertDescription>
            {upgradeAction("outline")}
          </Alert>
        )}
        {atHardLimit && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="size-4 text-red-600 shrink-0" />
            <AlertTitle>You've reached your {billingPeriod} limit</AlertTitle>
            <AlertDescription>
              Requests beyond your quota are blocked. Upgrade to a higher plan
              for more usage.
            </AlertDescription>
            {upgradeAction("destructive")}
          </Alert>
        )}
        <CardTitle>{item?.name ?? featureKey}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {view.kind === "capped" || view.kind === "included" ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col gap-2 mb-2">
                <span className={cn(atHardLimit && "text-red-600 font-medium")}>
                  {view.usage.toLocaleString()} used
                  {view.kind === "included" && view.overage > 0 && (
                    <span className="ml-1 text-xs">
                      (+{view.overage.toLocaleString()} overage)
                    </span>
                  )}
                </span>
              </div>
              <span className="text-foreground font-medium">
                {view.kind === "capped"
                  ? `${view.quota.toLocaleString()} limit`
                  : `${view.included.toLocaleString()} included`}
              </span>
            </div>
            <Progress
              value={Math.min(
                100,
                (view.kind === "capped" ? view.quota : view.included) > 0
                  ? (view.usage /
                      (view.kind === "capped" ? view.quota : view.included)) *
                      100
                  : 100,
              )}
              className={cn("mb-3 h-2", atHardLimit && "bg-destructive")}
            />
            <p className="text-xs text-muted-foreground">
              {view.remaining.toLocaleString()}
              {view.kind === "included" ? " included" : ""} remaining this
              billing period
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span>
                {view.usage.toLocaleString()} used this billing period
              </span>
              {view.kind === "meteredGeneric" && view.quota !== undefined ? (
                <span className="text-foreground font-medium">
                  {view.quota.toLocaleString()} quota
                </span>
              ) : (
                view.rateLabel && (
                  <span className="text-muted-foreground">
                    {view.rateLabel}
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {view.kind === "payAsYouGo"
                ? "Pay as you go — every call is billed; there is no usage cap."
                : view.caption}
            </p>
          </>
        )}
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
  pendingCredits,
}: {
  usage: UsageResult;
  isFetching: boolean;
  currentItems?: Item[];
  subscription?: Subscription;
  isPendingFirstPayment: boolean;
  pendingCredits?: PendingCredit[];
}) => {
  const hasUsage = Object.values(usage.entitlements).some((value) =>
    isMeteredEntitlement(value),
  );

  const creditByFeature = new Map(
    (pendingCredits ?? []).map((credit) => [credit.featureKey, credit]),
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
              featureKey={key}
              meter={{ ...value }}
              subscription={subscription}
              item={currentItems?.find((item) => item.featureKey === key)}
              pendingCredit={creditByFeature.get(key)}
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
