import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog.js";

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

const useMutationMock = vi.hoisted(() =>
  vi.fn((_options: { meta: { request: { body: string } } }) => mutationStub),
);

vi.mock("zudoku/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zudoku/react-query")>();
  return {
    ...actual,
    useMutation: useMutationMock,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  planName: "Growth",
  subscriptionId: "sub-123",
  billingPeriodEnd: "2025-08-01T00:00:00.000Z",
};

const lastMutationBody = () => {
  const lastCall = useMutationMock.mock.calls.at(-1);
  if (!lastCall) throw new Error("useMutation was not called");
  return JSON.parse(lastCall[0].meta.request.body);
};

describe("CancelSubscriptionDialog", () => {
  beforeEach(() => {
    mutationStub.mutate.mockClear();
    mutationStub.reset.mockClear();
    useMutationMock.mockClear();
    defaultProps.onOpenChange.mockClear();
  });

  it("sends timing 'next_billing_cycle' and shows scheduled-cancel copy for paid plans", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables
        hasFutureBillables={false}
      />,
    );

    expect(lastMutationBody()).toEqual({ timing: "next_billing_cycle" });
    expect(
      screen.getByText(
        "Your plan will be canceled at the end of your billing cycle.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You can still resume before then"),
    ).toBeInTheDocument();
  });

  it("sends timing 'immediate' and shows immediate-cancel copy for free plans (no current or future billables)", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables={false}
        hasFutureBillables={false}
      />,
    );

    expect(lastMutationBody()).toEqual({ timing: "immediate" });
    expect(
      screen.getByText("Cancel your Growth subscription?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your subscription will end immediately. You'll lose access to its entitlements right away.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You can subscribe again at any time"),
    ).toBeInTheDocument();
  });

  it("sends timing 'immediate' and shows trial-specific copy when in trial (no current billables, future billables exist)", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables={false}
        hasFutureBillables
      />,
    );

    expect(lastMutationBody()).toEqual({ timing: "immediate" });
    expect(
      screen.getByText("Cancel your trial of Growth?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your subscription will end now and you won't be charged when the trial would have converted to Growth.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You can subscribe again at any time"),
    ).toBeInTheDocument();
  });
});
