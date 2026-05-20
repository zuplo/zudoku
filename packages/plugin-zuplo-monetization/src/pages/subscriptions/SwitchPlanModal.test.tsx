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
  monthlyPrice: "10",
  yearlyPrice: "100",
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
      monthlyPrice: "9.99",
      yearlyPrice: "119.88",
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
      monthlyPrice: "9.99",
      yearlyPrice: "119.88",
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
      monthlyPrice: "9.99",
      yearlyPrice: "119.88",
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
      monthlyPrice: "9.99",
      yearlyPrice: "119.88",
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
      monthlyPrice: "9.99",
      yearlyPrice: "119.88",
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
      monthlyPrice: "49",
      yearlyPrice: "490",
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Team (v1)")).toBeInTheDocument();
    expect(within(dialog).getByText("Team (v2)")).toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", { name: "Upgrade" }),
    ).toHaveLength(1);
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
      monthlyPrice: "9.99",
      yearlyPrice: "119.88",
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
      monthlyPrice: "49",
      yearlyPrice: "490",
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
      monthlyPrice: "59",
      yearlyPrice: "590",
    });

    render(<SwitchPlanModal subscription={subscription} />);
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Downgrade Options")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Upgrade Options"),
    ).not.toBeInTheDocument();

    expectPlanAction(dialog, "Team (v1)", "Downgrade");
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
      monthlyPrice: "49",
      yearlyPrice: "490",
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
});
