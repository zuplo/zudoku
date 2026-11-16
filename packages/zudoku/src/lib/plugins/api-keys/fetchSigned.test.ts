import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import { ZudokuError } from "../../util/invariant.js";
import { fetchSigned } from "./fetchSigned.js";

const JWT_ACCESS_TOKEN = "header.payload.signature";
const OPAQUE_ACCESS_TOKEN = "opaque-access-token";

const createContext = (accessToken: string) =>
  new ZudokuContext({}, new QueryClient(), {}, { accessToken, profile: null });

const mockFetch = (status: number) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status }));

describe("fetchSigned", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the request with the access token", async () => {
    const fetchSpy = mockFetch(200);

    const response = await fetchSigned(
      createContext(OPAQUE_ACCESS_TOKEN),
      new Request("https://api.example.com/consumers"),
    );

    expect(response.ok).toBe(true);
    const [sentRequest] = fetchSpy.mock.calls[0] ?? [];
    expect(
      sentRequest instanceof Request &&
        sentRequest.headers.get("Authorization"),
    ).toBe(`Bearer ${OPAQUE_ACCESS_TOKEN}`);
  });

  it("reports a configuration error when an opaque token is rejected", async () => {
    mockFetch(401);

    const error = await fetchSigned(
      createContext(OPAQUE_ACCESS_TOKEN),
      new Request("https://api.example.com/consumers"),
    ).catch((error: unknown) => error);

    expect(error).toBeInstanceOf(ZudokuError);
    expect(error).toMatchObject({
      title: "Configuration Error",
      developerHint: expect.stringContaining("`audience`"),
    });
  });

  it("returns non-auth failures unchanged for opaque access tokens", async () => {
    mockFetch(500);

    const response = await fetchSigned(
      createContext(OPAQUE_ACCESS_TOKEN),
      new Request("https://api.example.com/consumers"),
    );

    expect(response.status).toBe(500);
  });

  it("returns failed responses unchanged for JWT access tokens", async () => {
    mockFetch(401);

    const response = await fetchSigned(
      createContext(JWT_ACCESS_TOKEN),
      new Request("https://api.example.com/consumers"),
    );

    expect(response.status).toBe(401);
  });
});
