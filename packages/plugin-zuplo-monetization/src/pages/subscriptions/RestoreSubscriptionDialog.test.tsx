import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RestoreSubscriptionDialog } from "./RestoreSubscriptionDialog.js";

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

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  planName: "Growth",
  subscriptionId: "sub-123",
  billingPeriodEnd: "2025-08-01T00:00:00.000Z",
};

describe("RestoreSubscriptionDialog", () => {
  beforeEach(() => {
    mutationStub.mutate.mockClear();
    mutationStub.reset.mockClear();
    mutationStub.isError = false;
    mutationStub.isSuccess = false;
    mutationStub.error = null;
    defaultProps.onOpenChange.mockClear();
  });

  it("renders title and plan name when open", () => {
    render(<RestoreSubscriptionDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Resume subscription" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Growth")).toBeInTheDocument();
  });

  it("renders resume guidance copy", () => {
    render(<RestoreSubscriptionDialog {...defaultProps} />);

    expect(screen.getByText("What happens if you resume")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep cancellation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resume subscription" }),
    ).toBeInTheDocument();
  });

  it("shows error alert when mutation failed", () => {
    mutationStub.isError = true;
    mutationStub.error = new Error("Network error");

    render(<RestoreSubscriptionDialog {...defaultProps} />);

    expect(
      screen.getByText("Could not resume subscription"),
    ).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});
