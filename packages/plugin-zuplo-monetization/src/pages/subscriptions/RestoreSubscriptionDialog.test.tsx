import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "zudoku/react-query";
import { RestoreSubscriptionDialog } from "./RestoreSubscriptionDialog.js";

vi.mock("zudoku/hooks", () => ({
  useZudoku: () => ({ env: { ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test-env" } }),
}));

vi.mock("../../hooks/useDeploymentName.js", () => ({
  useDeploymentName: () => "test-deployment",
}));

// A real QueryClient rather than a mocked useMutation, so the dialog sees how
// useMutation really behaves: a new result object on every render, and state
// that changes after the request settles.
const renderDialog = ({
  mutationFn = vi.fn().mockResolvedValue({}),
  onOpenChange = vi.fn(),
} = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, mutationFn } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RestoreSubscriptionDialog
        open
        onOpenChange={onOpenChange}
        planName="Growth"
        subscriptionId="sub-123"
        billingPeriodEnd="2025-08-01T12:00:00.000Z"
      />
    </QueryClientProvider>,
  );

  return { mutationFn, onOpenChange };
};

const resumeButton = () =>
  screen.getByRole("button", { name: "Resume subscription" });

describe("RestoreSubscriptionDialog", () => {
  it("renders title and plan name when open", () => {
    renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Resume subscription" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Growth")).toBeInTheDocument();
  });

  it("renders resume guidance copy", () => {
    renderDialog();

    expect(screen.getByText("What happens if you resume")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep cancellation" }),
    ).toBeInTheDocument();
    expect(resumeButton()).toBeInTheDocument();
  });

  it("resumes the subscription and closes", async () => {
    const { mutationFn, onOpenChange } = renderDialog();

    fireEvent.click(resumeButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it("shows why resuming failed", async () => {
    renderDialog({
      mutationFn: vi.fn().mockRejectedValue(new Error("Network error")),
    });

    fireEvent.click(resumeButton());

    expect(
      await screen.findByText("Could not resume subscription"),
    ).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});
