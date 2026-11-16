/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlotProvider } from "../../../components/context/SlotProvider.js";
import { ZudokuProvider } from "../../../components/context/ZudokuProvider.js";
import { ZudokuContext } from "../../../core/ZudokuContext.js";
import type { Content } from "../interfaces.js";
import { type Header, Playground } from "./Playground.js";

const jsonContent: Content[] = [
  {
    mediaType: "application/json",
    schema: { type: "object" },
    examples: [],
  },
];

const sendRequest = async ({
  method = "PUT",
  headers,
  examples = jsonContent,
}: {
  method?: string;
  headers?: Header[];
  examples?: Content[];
}) => {
  // Never resolve: only the outgoing request matters, not the result panel
  const fetchMock = vi.fn(
    (_request: Request) => new Promise<Response>(() => {}),
  );
  vi.stubGlobal("fetch", fetchMock);

  const queryClient = new QueryClient();
  const context = new ZudokuContext({}, queryClient, {});

  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>
          <SlotProvider>
            <Playground
              server="https://api.example.com"
              url="/leads"
              method={method}
              headers={headers}
              examples={examples}
              defaultBody='{"name":"Nebula"}'
            />
          </SlotProvider>
        </ZudokuProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );

  // Sending only works once the (empty) API identities have loaded
  await waitFor(() => {
    if (fetchMock.mock.calls.length === 0) {
      fireEvent.click(screen.getByRole("button", { name: /^Send/ }));
    }
    expect(fetchMock).toHaveBeenCalled();
  });
  const request = fetchMock.mock.calls[0]?.[0];
  if (!request) throw new Error("No request sent");
  return request;
};

describe("Playground request Content-Type", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the request body media type as Content-Type", async () => {
    const request = await sendRequest({});

    expect(request.headers.get("Content-Type")).toBe("application/json");
  });

  it("keeps a Content-Type header defined by the operation", async () => {
    const request = await sendRequest({
      headers: [
        {
          name: "content-type",
          defaultValue: "application/vnd.cosmo+json",
          defaultActive: true,
        },
      ],
    });

    expect(request.headers.get("Content-Type")).toBe(
      "application/vnd.cosmo+json",
    );
  });

  it("does not add a Content-Type for operations without a body", async () => {
    const request = await sendRequest({ method: "GET", examples: undefined });

    expect(request.headers.get("Content-Type")).toBeNull();
  });
});
