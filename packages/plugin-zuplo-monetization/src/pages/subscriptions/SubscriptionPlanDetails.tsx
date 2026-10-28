import { Heading } from "zudoku/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card";
import { useMonetizationConfig } from "../../MonetizationContext.js";
import { PlanPriceTag } from "../../pricing-ui/PlanPriceTag.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import {
  planHasDefaultTaxBehavior,
  subscriptionTaxLegendSentence,
} from "../../utils/pricingTaxLegend.js";
import {
  getSubscriptionPhaseViews,
  getSubscriptionPlanView,
  hasSubscriptionEntitlements,
} from "../../utils/subscriptionEntitlements.js";
import { SubscriptionEntitlements } from "../components/SubscriptionEntitlements.js";
import {
  PreviousPhases,
  UpcomingPhases,
} from "../components/SubscriptionPhases.js";

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
  const hasEnded =
    !!subscription.activeTo &&
    new Date(subscription.activeTo).getTime() < Date.now();
  const plan = subscription.plan;
  const view = getSubscriptionPlanView(subscription, { units: pricing?.units });
  const { priceLabel } = view;
  const taxLegendSentence = planHasDefaultTaxBehavior(plan)
    ? subscriptionTaxLegendSentence(plan.defaultTaxConfig?.behavior ?? "")
    : undefined;

  const hasEntitlements = hasSubscriptionEntitlements(view);
  const phaseViews = getSubscriptionPhaseViews(subscription, {
    units: pricing?.units,
  });
  const hasUpcomingPhases = phaseViews.some((p) => p.status === "future");
  const hasPreviousPhases = phaseViews.some((p) => p.status === "past");

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
                {/* For usage-based plans the concrete per-unit / tier prices
                    live in the entitlements list below, so the "Pay as you go"
                    headline stays a summary rather than the whole story. */}
                <div className="flex flex-wrap items-baseline gap-1">
                  <PlanPriceTag
                    label={priceLabel}
                    currency={view.currency}
                    billingCadence={view.billingCadence}
                    description
                  />
                </div>
                {taxLegendSentence ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    {taxLegendSentence}
                  </p>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className={detailLabelClassName}>
                {hasEnded ? "Ended" : "Current period"}
              </dt>
              <dd className="text-foreground">
                {/* An ended subscription has no current period — the aligned
                    period the API reports can even be a backwards range
                    (now-anchored start, end clamped to expiry). */}
                {hasEnded
                  ? formatDateTime(subscription.activeTo ?? "")
                  : subscription.alignment?.currentAlignedBillingPeriod
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
              <SubscriptionEntitlements
                view={view}
                currency={view.currency}
                billingCadence={view.billingCadence}
                units={pricing?.units}
              />
            </div>
          ) : null}

          {hasUpcomingPhases ? (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className={sectionLabelClassName}>Upcoming phases</p>
              <UpcomingPhases
                subscription={subscription}
                units={pricing?.units}
              />
            </div>
          ) : null}

          {hasPreviousPhases ? (
            <div className="pt-2 border-t border-border">
              <PreviousPhases
                subscription={subscription}
                units={pricing?.units}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
