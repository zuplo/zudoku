import { fireEvent, render, screen } from "@testing-library/react";
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

const useMutationMock = vi.hoisted(() => vi.fn(() => mutationStub));

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
  // Midday UTC, so the formatted date is Aug 1 in any test timezone.
  billingPeriodEnd: "2025-08-01T12:00:00.000Z",
};

const periodEndOption = () =>
  screen.getByRole("radio", { name: /At the end of the billing period/ });
const immediateOption = () =>
  screen.getByRole("radio", { name: /Immediately/ });
const cancelButton = () =>
  screen.getByRole("button", { name: "Cancel subscription" });

const confirmAndCancel = () => {
  fireEvent.change(screen.getByLabelText(/to confirm/), {
    target: { value: "Growth" },
  });
  fireEvent.click(cancelButton());
};

describe("CancelSubscriptionDialog", () => {
  beforeEach(() => {
    mutationStub.mutate.mockClear();
    mutationStub.reset.mockClear();
    mutationStub.isError = false;
    mutationStub.error = null;
    useMutationMock.mockClear();
    defaultProps.onOpenChange.mockClear();
  });

  it("defaults to cancelling a paid plan at the end of the billing period", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables
        hasFutureBillables={false}
      />,
    );

    expect(periodEndOption()).toBeChecked();
    expect(
      screen.getByText("You keep access until Aug 1, 2025"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your plan will be canceled at the end of your billing cycle.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You can still resume before then"),
    ).toBeInTheDocument();

    confirmAndCancel();

    expect(mutationStub.mutate).toHaveBeenCalledWith({
      timing: "next_billing_cycle",
    });
  });

  it("cancels a paid plan immediately when the customer picks Immediately", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables
        hasFutureBillables={false}
      />,
    );

    fireEvent.click(immediateOption());

    expect(immediateOption()).toBeChecked();
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

    confirmAndCancel();

    expect(mutationStub.mutate).toHaveBeenCalledWith({ timing: "immediate" });
  });

  it("lets a free plan end at the end of the billing period", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables={false}
        hasFutureBillables={false}
      />,
    );

    expect(periodEndOption()).toBeChecked();
    expect(
      screen.getByText(
        "You'll retain access until Aug 1, 2025. After your billing period ends, this plan will not renew and you would need to subscribe again to continue.",
      ),
    ).toBeInTheDocument();

    confirmAndCancel();

    expect(mutationStub.mutate).toHaveBeenCalledWith({
      timing: "next_billing_cycle",
    });
  });

  it("tells a trial customer they won't be charged with either timing", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables={false}
        hasFutureBillables
      />,
    );

    expect(
      screen.getByText("Cancel your trial of Growth?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You keep access until Aug 1, 2025. Your subscription ends before the trial converts to Growth, so you won't be charged.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(immediateOption());

    expect(
      screen.getByText(
        "Your subscription will end now and you won't be charged when the trial would have converted to Growth.",
      ),
    ).toBeInTheDocument();

    confirmAndCancel();

    expect(mutationStub.mutate).toHaveBeenCalledWith({ timing: "immediate" });
  });

  it("keeps the cancel button disabled until the plan name is typed", () => {
    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables
        hasFutureBillables={false}
      />,
    );

    expect(cancelButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/to confirm/), {
      target: { value: "Growth" },
    });

    expect(cancelButton()).toBeEnabled();
  });

  it("shows why the cancellation failed", () => {
    mutationStub.isError = true;
    mutationStub.error = new Error(
      "validation error: current phase has no billables, there isn't a next_billing_cycle",
    );

    render(
      <CancelSubscriptionDialog
        {...defaultProps}
        hasCurrentBillables={false}
        hasFutureBillables={false}
      />,
    );

    expect(
      screen.getByText("Could not cancel subscription"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "validation error: current phase has no billables, there isn't a next_billing_cycle",
      ),
    ).toBeInTheDocument();
  });

  it("clears the previous choice and error each time it opens", () => {
    const props = {
      ...defaultProps,
      hasCurrentBillables: true,
      hasFutureBillables: false,
    };
    const { rerender } = render(<CancelSubscriptionDialog {...props} />);

    fireEvent.click(immediateOption());
    expect(immediateOption()).toBeChecked();

    rerender(<CancelSubscriptionDialog {...props} open={false} />);
    mutationStub.reset.mockClear();
    rerender(<CancelSubscriptionDialog {...props} open />);

    expect(periodEndOption()).toBeChecked();
    expect(mutationStub.reset).toHaveBeenCalled();
  });
});
