import { cn } from "zudoku";
import { Heading } from "zudoku/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card";
import { useMonetizationConfig } from "../../MonetizationContext.js";
import type { Item, Subscription } from "../../types/SubscriptionType.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { getPriceFromPlan } from "../../utils/getPriceFromPlan.js";

const detailLabelClassName = "text-sm font-semibold tracking-wide mb-1";
const sectionLabelClassName = "text-base font-semibold tracking-wide mb-3 mt-2";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateRange = (from: string, to: string) =>
  `${formatDate(from)} – ${formatDate(to)}`;

const formatNumber = (value: number) => value.toLocaleString("en-US");

const getOveragePriceFromItem = (
  item: Item,
  currency: string | undefined,
  units?: Record<string, string>,
) => {
  const tiers = item.price?.tiers;
  if (!tiers || tiers.length === 0) return undefined;

  // Align with `categorizeRateCards`: overage is only meaningful when there's a
  // non-zero unit price tier (regardless of `upToAmount` shape).
  const overageTier = tiers.find((t) => {
    const amount = t.unitPrice?.amount;
    if (!amount) return false;
    const parsed = parseFloat(amount);
    return Number.isFinite(parsed) && parsed > 0;
  });
  const amount = overageTier?.unitPrice?.amount;
  if (!amount) return undefined;

  const parsed = parseFloat(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;

  const unitLabel = units?.[item.key] ?? units?.[item.featureKey] ?? "unit";
  return `${formatPrice(parsed, currency)}/${unitLabel}`;
};

const getEntitlementsFromItems = (
  items: Item[],
  currency: string | undefined,
  units?: Record<string, string>,
  fallbackBillingCadence?: string,
) => {
  const features: Array<
    | {
        entitlementType: "metered";
        key: string;
        name: string;
        limit: number;
        period: string;
        overagePrice?: string;
      }
    | {
        entitlementType: "boolean";
        key: string;
        name: string;
      }
    | {
        entitlementType: "static";
        key: string;
        name: string;
        value?: string;
      }
  > = [];

  for (const item of items) {
    const entitlement = item.included?.entitlement;
    if (!entitlement) continue;

    if (entitlement.type === "metered" && entitlement.issueAfterReset != null) {
      const cadence = item.billingCadence ?? fallbackBillingCadence;
      features.push({
        entitlementType: "metered",
        key: item.featureKey ?? item.key,
        name: item.name ?? item.featureKey ?? item.key,
        limit: entitlement.issueAfterReset,
        period: cadence ? formatDuration(cadence) : "month",
        overagePrice:
          entitlement.isSoftLimit !== false
            ? getOveragePriceFromItem(item, currency, units)
            : undefined,
      });
      continue;
    }

    if (entitlement.type === "boolean") {
      features.push({
        entitlementType: "boolean",
        key: item.featureKey ?? item.key,
        name: item.name ?? item.featureKey ?? item.key,
      });
      continue;
    }

    if (entitlement.type === "static") {
      const base = {
        key: item.featureKey ?? item.key,
        name: item.name ?? item.featureKey ?? item.key,
      };

      if (!entitlement.config) {
        features.push({ entitlementType: "static", ...base });
        continue;
      }

      try {
        const parsed = JSON.parse(entitlement.config) as { value?: unknown };
        features.push({
          entitlementType: "static",
          ...base,
          value: parsed?.value != null ? String(parsed.value) : undefined,
        });
      } catch {
        features.push({ entitlementType: "static", ...base });
      }
    }
  }

  return { features };
};

type FeatureRow = {
  key: string;
  name: string;
  phaseId: string;
  activeFrom: string;
  activeTo?: string;
  entitlementType: "metered" | "boolean" | "static";
  limit?: number;
  period?: string;
  overagePrice?: string;
  value?: string;
};

const getPhaseRows = (opts: {
  subscription: Subscription;
  currency: string | undefined;
  units?: Record<string, string>;
}) => {
  const { subscription, currency, units } = opts;

  const phases = [...subscription.phases].sort(
    (a, b) =>
      new Date(a.activeFrom).getTime() - new Date(b.activeFrom).getTime(),
  );

  const featureRows: FeatureRow[] = [];

  for (const phase of phases) {
    const { features } = getEntitlementsFromItems(
      phase.items ?? [],
      currency,
      units,
      subscription.billingCadence,
    );

    for (const f of features) {
      featureRows.push({
        key: f.key,
        name: f.name,
        entitlementType: f.entitlementType,
        limit: f.entitlementType === "metered" ? f.limit : undefined,
        period: f.entitlementType === "metered" ? f.period : undefined,
        overagePrice:
          f.entitlementType === "metered" ? f.overagePrice : undefined,
        value: f.entitlementType === "static" ? f.value : undefined,
        phaseId: phase.id,
        activeFrom: phase.activeFrom,
        activeTo: phase.activeTo,
      });
    }
  }

  return { featureRows };
};

const formatActiveRange = (activeFrom: string, activeTo?: string) => {
  if (!activeTo) return `Starts ${formatDate(activeFrom)}`;
  return `${formatDate(activeFrom)} – ${formatDate(activeTo)}`;
};

export const SubscriptionPlanDetails = ({
  subscription,
}: {
  subscription: Subscription;
}) => {
  const { pricing } = useMonetizationConfig();
  const plan = subscription.plan;
  const currency = subscription.currency ?? plan.currency;
  const priceInfo = getPriceFromPlan(plan);

  const primaryPrice =
    priceInfo.monthly === 0 && priceInfo.yearly === 0 ? (
      <span className="text-primary font-medium">Free</span>
    ) : (
      <>
        <span className="text-primary font-medium text-lg">
          {formatPrice(priceInfo.monthly, currency)}
        </span>
        <span className="text-muted-foreground">
          {" / "}
          {formatDuration(plan.billingCadence)}
        </span>
      </>
    );

  const { featureRows } = getPhaseRows({
    subscription,
    currency,
    units: pricing?.units,
  });

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
                {formatDate(subscription.activeFrom)}
              </dd>
            </div>

            <div>
              <dt className={detailLabelClassName}>Price</dt>
              <dd className="flex flex-wrap items-baseline gap-1">
                {primaryPrice}
              </dd>
            </div>
            <div>
              <dt className={detailLabelClassName}>Current period</dt>
              <dd className="text-foreground">
                {subscription.alignment?.currentAlignedBillingPeriod
                  ? formatDateRange(
                      subscription.alignment.currentAlignedBillingPeriod.from,
                      subscription.alignment.currentAlignedBillingPeriod.to,
                    )
                  : "—"}
              </dd>
            </div>
          </dl>

          {featureRows.length > 0 ? (
            <div className="space-y-5 pt-2 border-t border-border">
              <div className="space-y-2">
                <p className={cn(sectionLabelClassName, "mb-5")}>
                  Entitlements
                </p>
                <ul className="space-y-3">
                  {featureRows.map((row) => (
                    <li
                      key={`${row.key}:${row.phaseId}`}
                      className="grid gap-1 text-sm sm:grid-cols-4 sm:items-center sm:gap-4"
                    >
                      <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                        <span>
                          <span className="text-foreground font-medium">
                            {row.name}{" "}
                          </span>
                          {row.entitlementType === "static" && row.value
                            ? `: ${row.value}`
                            : ""}
                        </span>
                      </div>

                      <div className="text-muted-foreground sm:text-right">
                        {row.entitlementType === "metered" &&
                        row.limit != null ? (
                          <>
                            {formatNumber(row.limit)}
                            {row.period ? ` / ${row.period}` : ""}
                            {row.overagePrice ? (
                              <div className="text-xs mt-0.5">
                                Overage: {row.overagePrice}
                              </div>
                            ) : null}
                          </>
                        ) : row.entitlementType === "static" && row.value ? (
                          row.value
                        ) : (
                          "Included"
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground sm:text-right">
                        {formatActiveRange(row.activeFrom, row.activeTo)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
