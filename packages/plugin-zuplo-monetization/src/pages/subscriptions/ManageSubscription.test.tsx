import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subscription } from "../../hooks/useSubscriptions.js";
import { ManageSubscription } from "./ManageSubscription.js";

vi.mock("zudoku/hooks", () => ({
  useZudoku: () => ({ env: { ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test-env" } }),
}));

vi.mock("../../hooks/useDeploymentName.js", () => ({
  useDeploymentName: () => "test-deployment",
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

vi.mock("zudoku/components", async (importOriginal) => ({
  ...(await importOriginal<typeof import("zudoku/components")>()),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./SwitchPlanModal.js", () => ({
  SwitchPlanModal: () => <span>Switch plan</span>,
}));

const baseSubscription = (): Subscription => ({
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
  name: "Pro Plan",
  phases: [
    {
      activeFrom: "2025-01-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
      id: "phase-1",
      itemTimelines: {},
      items: [],
      key: "pro",
      metadata: {},
      name: "Pro",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
  ],
  plan: { id: "plan-1", key: "pro", version: 1 },
  proRatingConfig: { enabled: false, mode: "prorata" },
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

const renderManage = (subscription: Subscription) =>
  render(
    <ManageSubscription subscription={subscription} planName="Pro Plan" />,
  );

describe("ManageSubscription", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00.000Z"));
    mutationStub.mutate.mockClear();
    mutationStub.reset.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows cancel and switch plan for an active subscription", () => {
    renderManage(baseSubscription());

    expect(
      screen.getByRole("button", { name: "Cancel subscription" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Switch plan")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Resume subscription" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /New subscription/ }),
    ).not.toBeInTheDocument();
  });

  it("shows resume and new subscription when canceled but billing period has not ended", () => {
    const sub = {
      ...baseSubscription(),
      status: "canceled",
      alignment: {
        billablesMustAlign: false,
        currentAlignedBillingPeriod: {
          from: "2025-06-01T00:00:00.000Z",
          to: "2025-07-01T00:00:00.000Z",
        },
      },
    };
    renderManage(sub);

    expect(
      screen.getByRole("button", { name: "Resume subscription" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /New subscription/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel subscription" }),
    ).not.toBeInTheDocument();
  });

  it("shows only new subscription when canceled and billing period has ended", () => {
    const sub = {
      ...baseSubscription(),
      status: "canceled",
      alignment: {
        billablesMustAlign: false,
        currentAlignedBillingPeriod: {
          from: "2025-05-01T00:00:00.000Z",
          to: "2025-06-01T00:00:00.000Z",
        },
      },
    };
    renderManage(sub);

    expect(
      screen.getByRole("link", { name: /New subscription/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Resume subscription" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel subscription" }),
    ).not.toBeInTheDocument();
  });

  it("always shows manage payment details", () => {
    renderManage(baseSubscription());
    expect(
      screen.getByRole("link", { name: /Manage payment details/ }),
    ).toBeInTheDocument();
  });
});
