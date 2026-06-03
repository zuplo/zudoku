import { Heading } from "zudoku/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card";
import { useMonetizationConfig } from "../../MonetizationContext.js";
import { PlanEntitlements } from "../../pricing-ui/PlanEntitlements.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPlanPrice } from "../../utils/formatPlanPrice.js";
import { formatPrice } from "../../utils/formatPrice.js";
import {
  planHasDefaultTaxBehavior,
  subscriptionTaxLegendSentence,
} from "../../utils/pricingTaxLegend.js";

const detailLabelClassName = "text-sm font-semibold tracking-wide mb-1";
const sectionLabelClassName = "text-base font-semibold tracking-wide mb-3 mt-2";

const formatDateTimeRange = (from: string, to: string) =>
  `${formatDateTime(from)} – ${formatDateTime(to)}`;

export const SubscriptionPlanDetails = ({
  subscription,
}: {
  subscription: Subscription;
}) => {
  const { pricing } = useMonetizationConfig();
  const plan = subscription.plan;
  const currency = subscription.currency ?? plan.currency;
  const priceLabel = formatPlanPrice(plan);
  const taxLegendSentence = planHasDefaultTaxBehavior(plan)
    ? subscriptionTaxLegendSentence(plan.defaultTaxConfig?.behavior ?? "")
    : undefined;

  // The headline mirrors the pricing card. For usage-based plans the concrete
  // per-unit / tier prices live in the entitlements list below (rendered with
  // the same logic as the pricing table), so "Pay as you go" stays a summary
  // rather than the only thing the customer sees.
  const primaryPrice =
    priceLabel.type === "priced" ? (
      <>
        <span className="text-primary font-medium text-lg">
          {formatPrice(priceLabel.amount, currency)}
        </span>
        <span className="text-muted-foreground">
          {" / "}
          {formatDuration(plan.billingCadence)}
        </span>
      </>
    ) : priceLabel.type === "payg" ? (
      <div>
        <div className="text-primary font-medium">{priceLabel.main}</div>
        <div className="text-xs text-muted-foreground">{priceLabel.sub}</div>
      </div>
    ) : (
      <span className="text-primary font-medium">Free</span>
    );

  const hasEntitlements =
    plan.phases?.some((p) =>
      p.rateCards?.some((rc) => rc.entitlementTemplate),
    ) ?? false;

  return (
    <div className="space-y-4">
      <Heading level={3}>Subscription Details</Heading>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold leading-tight">
            {plan.name}
          </CardTitle>
          {plan.description ? (
            <CardDescription>{plan.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className={detailLabelClassName}>Subscription ID</dt>
              <dd className="text-foreground font-mono text-xs break-all">
                {subscription.id}
              </dd>
            </div>
            <div>
              <dt className={detailLabelClassName}>Active since</dt>
              <dd className="text-foreground">
                {formatDateTime(subscription.activeFrom)}
              </dd>
            </div>

            <div>
              <dt className={detailLabelClassName}>Price</dt>
              <dd>
                <div className="flex flex-wrap items-baseline gap-1">
                  {primaryPrice}
                </div>
                {taxLegendSentence ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    {taxLegendSentence}
                  </p>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className={detailLabelClassName}>Current period</dt>
              <dd className="text-foreground">
                {subscription.alignment?.currentAlignedBillingPeriod
                  ? formatDateTimeRange(
                      subscription.alignment.currentAlignedBillingPeriod.from,
                      subscription.alignment.currentAlignedBillingPeriod.to,
                    )
                  : "—"}
              </dd>
            </div>
          </dl>

          {hasEntitlements ? (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className={sectionLabelClassName}>What's included</p>
              <PlanEntitlements
                phases={plan.phases}
                currency={currency}
                billingCadence={plan.billingCadence}
                units={pricing?.units}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
