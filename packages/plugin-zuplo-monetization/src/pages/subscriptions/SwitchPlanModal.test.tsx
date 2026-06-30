import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Plan } from "../../types/PlanType.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { SwitchPlanModal } from "./SwitchPlanModal.js";

vi.mock("zudoku/hooks", () => ({
  useZudoku: () => ({ env: {} }),
}));

vi.mock("../../hooks/useDeploymentName.js", () => ({
  useDeploymentName: () => "test-deployment",
}));

vi.mock("../../hooks/useUrlUtils.js", () => ({
  useUrlUtils: () => ({
    generateUrl: (
      path: string,
      opts?: { searchParams?: Record<string, string> },
    ) => `${path}?${new URLSearchParams(opts?.searchParams ?? {}).toString()}`,
  }),
}));

vi.mock("../../MonetizationContext", () => ({
  useMonetizationConfig: () => ({ pricing: undefined }),
}));

const plansItems = vi.hoisted(() => ({ current: [] as Plan[] }));

vi.mock("../../hooks/usePlans.js", () => ({
  usePlans: () => ({ data: { items: plansItems.current } }),
}));

const mutationStub = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null as Error | null,
  reset: vi.fn(),
}));

vi.mock("zudoku/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zudoku/react-query")>();
  return {
    ...actual,
    useMutation: () => mutationStub,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

const meteredRateCard = (): Plan["phases"][number]["rateCards"][number] => ({
  type: "usage_based",
  key: "requests",
  name: "Requests",
  featureKey: "requests",
  billingCadence: "P1M",
  price: null,
  entitlementTemplate: {
    type: "metered",
    issueAfterReset: 1000,
  },
});

const makePublicPlan = (
  overrides: Partial<Plan> & Pick<Plan, "id" | "key" | "name">,
): Plan => ({
  billingCadence: "P1M",
  currency: "USD",
  phases: [
    {
      key: "default",
      name: "Default",
      rateCards: [meteredRateCard()],
    },
  ],
  ...overrides,
});

const baseSubscription = (plan: Subscription["plan"]): Subscription => ({
  activeFrom: "2025-01-01T00:00:00.000Z",
  alignment: {
    billablesMustAlign: false,
    currentAlignedBillingPeriod: {
      from: "2025-06-01T00:00:00.000Z",
      to: "2025-07-01T00:00:00.000Z",
    },
  },
  billingAnchor: "2025-01-01T00:00:00.000Z",
  billingCadence: "P1M",
  createdAt: "2025-01-01T00:00:00.000Z",
  currency: "USD",
  customerId: "cust-1",
  id: "sub-1",
  metadata: {},
  name: "My subscription",
  phases: [
    {
      activeFrom: "2025-01-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
      id: "phase-1",
      itemTimelines: {},
      items: [],
      key: "default",
      metadata: {},
      name: "Default",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
  ],
  plan,
  proRatingConfig: { enabled: false, mode: "prorate_prices" },
  status: "active",
  updatedAt: "2025-01-01T00:00:00.000Z",
  consumer: {
    id: "consumer-1",
    name: "Test",
    createdOn: "2025-01-01T00:00:00.000Z",
    updatedOn: "2025-01-01T00:00:00.000Z",
    tags: {},
    metadata: {},
    apiKeys: [],
    managers: [],
  },
});

const openModal = () => {
  fireEvent.click(screen.getByRole("button", { name: /switch plan/i }));
};

const getPlanCard = (container: HTMLElement, planName: string) => {
  const title = within(container).getByText(planName);
  const card = title.closest("div.border");
  if (!card) {
    throw new Error(`Plan card not found for "${planName}"`);
  }
  return card as HTMLElement;
};

const expectPlanAction = (
  container: HTMLElement,
  planName: string,
  action: "Upgrade" | "Downgrade" | "Switch",
) => {
  const card = getPlanCard(container, planName);
  expect(
    within(card).getByRole("button", { name: action }),
  ).toBeInTheDocument();
};

describe("SwitchPlanModal", () => {
  beforeEach(() => {
    plansItems.current = [];
    mutationStub.mutate.mockClear();
    mutationStub.reset.mockClear();
    mutationStub.isError = false;
    mutationStub.error = null;
  });

  it("lists public plans as Upgrade Options when the subscription plan is private but omitted from the pricing page", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-starter",
        key: "starter",
        name: "Starter",
      }),
      makePublicPlan({
        id: "plan-team",
        key: "team",
        name: "Team",
      }),
    ];

    const subscription = baseSubscription({
      id: "priv-1",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Upgrade Options")).toBeInTheDocument();
    expect(within(dialog).getByText("Private Developer")).toBeInTheDocument();
    expect(within(dialog).getByText("Starter")).toBeInTheDocument();
    expect(within(dialog).getByText("Team")).toBeInTheDocument();

    const upgrades = within(dialog).getAllByRole("button", { name: "Upgrade" });
    expect(upgrades).toHaveLength(2);
  });

  it("lists only non-private targets as Upgrade Options when the current plan is private but present on the pricing page", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-private-listed",
        key: "private_developer",
        name: "Private Developer (portal)",
        metadata: { zuplo_private_plan: "true" },
      }),
      makePublicPlan({
        id: "plan-team",
        key: "team",
        name: "Team",
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-private-listed",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Upgrade Options")).toBeInTheDocument();
    expect(within(dialog).getByText("Private Developer")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Private Developer (portal)"),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("Team")).toBeInTheDocument();
    expect(within(dialog).queryByText("Starter")).not.toBeInTheDocument();

    expect(
      within(dialog).getAllByRole("button", { name: "Upgrade" }),
    ).toHaveLength(1);
  });

  it("lists invited private plans as Private Plan Options when the current plan is private", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-private-current",
        key: "private_developer",
        name: "Private Developer",
        metadata: { zuplo_private_plan: "true" },
      }),
      makePublicPlan({
        id: "plan-private-invited",
        key: "private_enterprise",
        name: "Private Enterprise",
        metadata: { zuplo_private_plan: "true" },
      }),
      makePublicPlan({
        id: "plan-team",
        key: "team",
        name: "Team",
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-private-current",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Upgrade Options")).toBeInTheDocument();
    expect(within(dialog).getByText("Private Plan Option")).toBeInTheDocument();
    expect(within(dialog).getByText("Private Enterprise")).toBeInTheDocument();
    expect(within(dialog).getByText("Team")).toBeInTheDocument();

    expect(
      within(dialog).getAllByRole("button", { name: "Upgrade" }),
    ).toHaveLength(1);
    expect(
      within(dialog).getAllByRole("button", { name: "Switch" }),
    ).toHaveLength(1);
  });

  it("starts checkout with mode private when switching from one private plan to another", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-private-current",
        key: "private_developer",
        name: "Private Developer",
        metadata: { zuplo_private_plan: "true" },
      }),
      makePublicPlan({
        id: "plan-private-invited",
        key: "private_enterprise",
        name: "Private Enterprise",
        metadata: { zuplo_private_plan: "true" },
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-private-current",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    fireEvent.click(screen.getByRole("button", { name: "Switch" }));

    expect(mutationStub.mutate).toHaveBeenCalledTimes(1);
    expect(mutationStub.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "private",
        subscriptionId: "sub-1",
        plan: expect.objectContaining({
          id: "plan-private-invited",
          key: "private_enterprise",
        }),
      }),
    );
  });

  it("starts checkout with mode upgrade when switching from private (unlisted) to a public plan", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-team",
        key: "team",
        name: "Team",
      }),
    ];

    const subscription = baseSubscription({
      id: "priv-1",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    fireEvent.click(screen.getAllByRole("button", { name: "Upgrade" })[0]);

    expect(mutationStub.mutate).toHaveBeenCalledTimes(1);
    expect(mutationStub.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "upgrade",
        subscriptionId: "sub-1",
        plan: expect.objectContaining({
          id: "plan-team",
          key: "team",
        }),
      }),
    );
  });

  it("lists a newer plan version when it shares a key with the subscribed plan", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-team-v2",
        key: "team",
        name: "Team (v2)",
        version: 2,
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-team-v1",
      key: "team",
      name: "Team (v1)",
      version: 1,
      billingCadence: "P1M",
      phases: [],
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Team (v1)")).toBeInTheDocument();
    expect(within(dialog).getByText("Team (v2)")).toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", { name: "Upgrade" }),
    ).toHaveLength(1);
    expect(
      within(getPlanCard(dialog, "Team (v2)")).getByText("New version"),
    ).toBeInTheDocument();
  });

  it("lists a newer private plan version when the subscribed version is not on the pricing page", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-private-v2",
        key: "private_developer",
        name: "Private Developer (v2)",
        version: 2,
        metadata: { zuplo_private_plan: "true" },
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-private-v1",
      key: "private_developer",
      name: "Private Developer (v1)",
      version: 1,
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Private Plan Option")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Private Developer (v2)"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", { name: "Switch" }),
    ).toHaveLength(1);
    expect(
      within(getPlanCard(dialog, "Private Developer (v2)")).getByText(
        "New version",
      ),
    ).toBeInTheDocument();
  });

  it("classifies same-key targets by version when catalog order disagrees with version", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-team-v2",
        key: "team",
        name: "Team (v2)",
        version: 2,
      }),
      makePublicPlan({
        id: "plan-team-v1",
        key: "team",
        name: "Team (v1)",
        version: 1,
      }),
      makePublicPlan({
        id: "plan-starter",
        key: "starter",
        name: "Starter",
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-team-v1",
      key: "team",
      name: "Team (v1)",
      version: 1,
      billingCadence: "P1M",
      phases: [],
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Upgrade Options")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Downgrade Options"),
    ).not.toBeInTheDocument();

    expectPlanAction(dialog, "Team (v2)", "Upgrade");
    expectPlanAction(dialog, "Starter", "Upgrade");
    expect(
      within(getPlanCard(dialog, "Team (v2)")).getByText("New version"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard(dialog, "Starter")).queryByText("New version"),
    ).not.toBeInTheDocument();
  });

  it("classifies an older same-key version as Downgrade when catalog order disagrees with version", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-team-v1",
        key: "team",
        name: "Team (v1)",
        version: 1,
      }),
      makePublicPlan({
        id: "plan-team-v2",
        key: "team",
        name: "Team (v2)",
        version: 2,
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-team-v2",
      key: "team",
      name: "Team (v2)",
      version: 2,
      billingCadence: "P1M",
      phases: [],
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Downgrade Options")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Upgrade Options"),
    ).not.toBeInTheDocument();

    expectPlanAction(dialog, "Team (v1)", "Downgrade");
    expect(
      within(getPlanCard(dialog, "Team (v1)")).queryByText("New version"),
    ).not.toBeInTheDocument();
  });

  it("shows Upgrade and Downgrade Options when switching between public catalog plans", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-starter",
        key: "starter",
        name: "Starter",
      }),
      makePublicPlan({
        id: "plan-team",
        key: "team",
        name: "Team",
      }),
      makePublicPlan({
        id: "plan-growth",
        key: "growth",
        name: "Growth",
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-team",
      key: "team",
      name: "Team",
      billingCadence: "P1M",
      phases: [],
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Upgrade Options")).toBeInTheDocument();
    expect(within(dialog).getByText("Downgrade Options")).toBeInTheDocument();
    expect(within(dialog).getByText("Growth")).toBeInTheDocument();
    expect(within(dialog).getByText("Starter")).toBeInTheDocument();

    expectPlanAction(dialog, "Growth", "Upgrade");
    expectPlanAction(dialog, "Starter", "Downgrade");
    expect(within(dialog).queryByText("New version")).not.toBeInTheDocument();

    fireEvent.click(
      within(getPlanCard(dialog, "Starter")).getByRole("button", {
        name: "Downgrade",
      }),
    );

    expect(mutationStub.mutate).toHaveBeenCalledTimes(1);
    expect(mutationStub.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "downgrade",
        subscriptionId: "sub-1",
        plan: expect.objectContaining({
          id: "plan-starter",
          key: "starter",
        }),
      }),
    );
  });

  it("shows the current plan's real included quota in the baseline", () => {
    plansItems.current = [
      makePublicPlan({ id: "plan-team", key: "team", name: "Team" }),
    ];

    const base = baseSubscription({
      id: "plan-current",
      key: "current",
      name: "My Current Plan",
      billingCadence: "PT1H",
      phases: [],
    });
    const subscription: Subscription = {
      ...base,
      currency: "USD",
      phases: [
        {
          ...base.phases[0],
          items: [
            {
              activeFrom: "2025-01-01T00:00:00.000Z",
              billingCadence: "PT1H",
              createdAt: "2025-01-01T00:00:00.000Z",
              featureKey: "api_requests",
              id: "item-1",
              included: {
                entitlement: {
                  activeFrom: "2025-01-01T00:00:00.000Z",
                  annotations: { "subscription.id": "sub-1" },
                  createdAt: "2025-01-01T00:00:00.000Z",
                  featureId: "f",
                  featureKey: "api_requests",
                  id: "ent-1",
                  issueAfterReset: 10,
                  subjectKey: "s",
                  type: "metered",
                  updatedAt: "2025-01-01T00:00:00.000Z",
                  usagePeriod: {
                    anchor: "x",
                    interval: "PT1H",
                    intervalISO: "PT1H",
                  },
                },
                feature: {
                  createdAt: "x",
                  id: "f",
                  key: "api_requests",
                  name: "API Requests",
                  updatedAt: "x",
                },
              },
              key: "api_requests",
              metadata: {},
              name: "API Requests",
              updatedAt: "2025-01-01T00:00:00.000Z",
            },
          ],
        },
      ],
    };

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Current Plan")).toBeInTheDocument();
    expect(within(dialog).getByText("My Current Plan")).toBeInTheDocument();
    expect(within(dialog).getByText("API Requests:")).toBeInTheDocument();
    expect(within(dialog).getByText(/10 \/ hour/)).toBeInTheDocument();
  });

  it("renders a custom plan as Contact Sales with no price or switch action", () => {
    plansItems.current = [
      makePublicPlan({
        id: "plan-custom",
        key: "enterprise_custom",
        name: "Enterprise Plus",
        metadata: { isCustom: "true" },
      }),
    ];

    const subscription = baseSubscription({
      id: "plan-current",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const card = getPlanCard(screen.getByRole("dialog"), "Enterprise Plus");
    expect(within(card).getByText("Contact Sales")).toBeInTheDocument();
    expect(within(card).getByText("Custom")).toBeInTheDocument();
    expect(
      within(card).queryByRole("button", { name: /Upgrade|Downgrade|Switch/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a per-phase price schedule for a multi-phase target", () => {
    plansItems.current = [
      {
        ...makePublicPlan({
          id: "plan-trial",
          key: "trialplan",
          name: "Trial Plan",
        }),
        billingCadence: "P1M",
        phases: [
          { key: "trial", name: "Free Trial", duration: "P1W", rateCards: [] },
          {
            key: "default",
            name: "Default",
            rateCards: [
              {
                type: "flat_fee",
                key: "fee",
                name: "Fee",
                billingCadence: "P1M",
                price: { type: "flat", amount: "49" },
              },
            ],
          },
        ],
      },
    ];

    const subscription = baseSubscription({
      id: "plan-current",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const card = getPlanCard(screen.getByRole("dialog"), "Trial Plan");
    expect(within(card).getByText("First week")).toBeInTheDocument();
    expect(within(card).getByText("Free")).toBeInTheDocument();
    expect(within(card).getByText("After that")).toBeInTheDocument();
    expect(within(card).getByText("$49")).toBeInTheDocument();
    expect(within(card).getByText("/month")).toBeInTheDocument();
  });

  it("shows per-phase diff sections when the target's phases differ in entitlements", () => {
    const apiQuota = (
      issueAfterReset: number,
    ): Plan["phases"][number]["rateCards"][number] => ({
      type: "flat_fee",
      key: "api_requests",
      name: "API Requests",
      featureKey: "api_requests",
      billingCadence: null,
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset,
        usagePeriod: "P1M",
      },
    });
    const fee = (
      amount: string,
    ): Plan["phases"][number]["rateCards"][number] => ({
      type: "flat_fee",
      key: "monthly_fee",
      name: "Monthly Fee",
      billingCadence: "P1M",
      price: { type: "flat", amount },
    });

    plansItems.current = [
      {
        ...makePublicPlan({ id: "plan-ramp", key: "ramp", name: "Ramp Plan" }),
        phases: [
          {
            key: "intro",
            name: "First 3 months",
            duration: "P3M",
            rateCards: [fee("375"), apiQuota(250_001)],
          },
          {
            key: "steady",
            name: "After 3 months",
            rateCards: [fee("750"), apiQuota(250_000)],
          },
        ],
      },
    ];

    const subscription = baseSubscription({
      id: "plan-current",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const card = getPlanCard(screen.getByRole("dialog"), "Ramp Plan");
    // One diff section per phase, headed by the phase's own price…
    expect(within(card).getByText("· $375/month")).toBeInTheDocument();
    expect(within(card).getByText("· $750/month")).toBeInTheDocument();
    // …each showing that phase's distinct quota.
    expect(within(card).getByText(/250,001 \/ month/)).toBeInTheDocument();
    expect(within(card).getByText(/250,000 \/ month/)).toBeInTheDocument();
  });

  it("shows the target plan's full entitlements without an expander", () => {
    plansItems.current = [
      makePublicPlan({ id: "plan-team", key: "team", name: "Team" }),
    ];

    const subscription = baseSubscription({
      id: "plan-current",
      key: "private_developer",
      name: "Private Developer",
      billingCadence: "P1M",
      phases: [],
      metadata: { zuplo_private_plan: "true" },
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const card = getPlanCard(screen.getByRole("dialog"), "Team");
    // The full annotated list is visible immediately…
    expect(within(card).getByText("Requests")).toBeInTheDocument();
    expect(within(card).getByText(/now included/)).toBeInTheDocument();
    // …with no show/hide details toggle.
    expect(
      within(card).queryByRole("button", { name: /details/i }),
    ).not.toBeInTheDocument();
  });

  it("renders unchanged entitlements plainly alongside highlighted changes", () => {
    // Current subscription provisions 10 requests/hour; the target offers the
    // SAME requests quota (unchanged) plus priority support (added).
    plansItems.current = [
      {
        ...makePublicPlan({ id: "plan-team", key: "team", name: "Team" }),
        phases: [
          {
            key: "default",
            name: "Default",
            rateCards: [
              meteredRateCard(),
              {
                type: "flat_fee",
                key: "priority_support",
                name: "Priority Support",
                featureKey: "priority_support",
                billingCadence: "P1M",
                price: null,
                entitlementTemplate: { type: "boolean" },
              },
            ],
          },
        ],
      },
    ];

    const base = baseSubscription({
      id: "plan-current",
      key: "current",
      name: "My Current Plan",
      billingCadence: "P1M",
      phases: [
        {
          key: "default",
          name: "Default",
          rateCards: [meteredRateCard()],
        },
      ],
    });

    render(<SwitchPlanModal subscription={base} />);
    openModal();

    const card = getPlanCard(screen.getByRole("dialog"), "Team");
    // Unchanged quota renders as a plain row (no change suffix)…
    expect(within(card).getByText("Requests")).toBeInTheDocument();
    expect(
      within(card).queryByText(/no longer included/),
    ).not.toBeInTheDocument();
    // …while the added feature is highlighted.
    expect(within(card).getByText("Priority Support")).toBeInTheDocument();
    expect(within(card).getByText(/now included/)).toBeInTheDocument();
  });

  it("expands a tiered target quota into its actual tier schedule", () => {
    plansItems.current = [
      {
        ...makePublicPlan({
          id: "plan-ent2",
          key: "enterprise2",
          name: "Enterprise 2",
        }),
        phases: [
          {
            key: "default",
            name: "Default",
            rateCards: [
              {
                type: "usage_based",
                key: "api_calls",
                name: "API Calls",
                featureKey: "api_calls",
                billingCadence: "P1M",
                price: {
                  type: "tiered",
                  mode: "graduated",
                  tiers: [
                    { upToAmount: "1000", unitPrice: { amount: "0" } },
                    { unitPrice: { amount: "0.01" } },
                  ],
                },
                entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
              },
            ],
          },
        ],
      },
    ];

    // Current plan provisions a plain 10/hour quota for the same feature key.
    const subscription = baseSubscription({
      id: "plan-current",
      key: "current",
      name: "My Current Plan",
      billingCadence: "P1M",
      phases: [
        {
          key: "default",
          name: "Default",
          rateCards: [
            {
              type: "usage_based",
              key: "api_calls",
              name: "API Calls",
              featureKey: "api_calls",
              billingCadence: "PT1H",
              price: null,
              entitlementTemplate: { type: "metered", issueAfterReset: 10 },
            },
          ],
        },
      ],
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const card = getPlanCard(screen.getByRole("dialog"), "Enterprise 2");
    // The transition line still names the pricing model…
    expect(within(card).getByText("Tiered pricing")).toBeInTheDocument();
    // …but the decision-relevant schedule is shown beneath it.
    expect(within(card).getByText("Up to 1,000: Included")).toBeInTheDocument();
    expect(
      within(card).getByText("Over 1,000: $0.01/unit"),
    ).toBeInTheDocument();
  });
});
