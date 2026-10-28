import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "zudoku/react-query";
import { queryClient } from "../../ZuploMonetizationWrapper.js";
import { ApiKeysList } from "./ApiKeysList.js";

vi.mock("zudoku/hooks", () => ({
  useZudoku: () => ({
    env: { ZUPLO_GATEWAY_SERVICE_URL: "https://gateway.example.com" },
    getAuthState: () => ({ isAuthenticated: true }),
    signRequest: async (request: Request) => {
      request.headers.set("Authorization", "Bearer test-token");
      return request;
    },
  }),
}));

const apiKeys = [
  {
    id: "current",
    key: "current-secret",
    createdOn: "2026-10-23T00:00:00Z",
    updatedOn: "2026-10-23T00:00:00Z",
  },
  {
    id: "previous",
    key: "previous-secret",
    createdOn: "2026-10-22T00:00:00Z",
    updatedOn: "2026-10-23T00:00:00Z",
    expiresOn: "2099-10-30T00:00:00Z",
  },
];

const renderKeys = (keys = apiKeys) =>
  render(
    <QueryClientProvider client={queryClient}>
      <ApiKeysList
        apiKeys={keys}
        deploymentName="test-deployment"
        consumerId="test-consumer"
        isPendingFirstPayment={false}
      />
    </QueryClientProvider>,
  );

describe("API key deletion", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    queryClient.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    queryClient.clear();
  });

  it("only offers deletion for keys with an expiration date, including expired keys", () => {
    renderKeys([
      ...apiKeys,
      {
        id: "expired",
        key: "expired-secret",
        createdOn: "2019-12-25T00:00:00Z",
        updatedOn: "2019-12-25T00:00:00Z",
        expiresOn: "2020-01-01T00:00:00Z",
      },
    ]);
    expect(
      screen.getAllByRole("button", { name: "Delete API key" }),
    ).toHaveLength(2);
  });

  it("does not delete when confirmation is canceled", () => {
    renderKeys();
    fireEvent.click(screen.getByRole("button", { name: "Delete API key" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deletes the selected key with a signed request and refreshes queries", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    renderKeys();
    fireEvent.click(screen.getByRole("button", { name: "Delete API key" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByText("API key was deleted");
    const request = fetchMock.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    if (!(request instanceof Request)) throw new Error("Expected a request");
    expect(request.method).toBe("DELETE");
    expect(request.url).toBe(
      "https://gateway.example.com/v3/zudoku-metering/test-deployment/consumers/test-consumer/keys/previous",
    );
    expect(request.headers.get("Authorization")).toBe("Bearer test-token");
    expect(invalidate).toHaveBeenCalled();
  });

  it("disables deletion while pending and allows retry after a failure", async () => {
    let rejectRequest: (error: Error) => void = () => {};
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    renderKeys();
    fireEvent.click(screen.getByRole("button", { name: "Delete API key" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Delete API key" }),
      ).toBeDisabled(),
    );
    rejectRequest(new Error("Connection failed"));
    await screen.findByText("Could not delete API key");
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("API key was deleted");
  });
});
