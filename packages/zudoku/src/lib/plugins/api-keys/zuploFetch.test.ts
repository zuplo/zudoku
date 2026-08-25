import { afterEach, describe, expect, test, vi } from "vitest";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { ZudokuError } from "../../util/invariant.js";
import { zuploFetch } from "./zuploFetch.js";

const JWT_TOKEN = "header.payload.signature";
const OPAQUE_TOKEN = "opaque-access-token";

const createContext = (token: string | undefined): ZudokuContext =>
  ({
    signRequest: async (request: Request) => {
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      return request;
    },
  }) as unknown as ZudokuContext;

const mockFetch = (response: Response) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

const problemJson = (status: number, detail: string) =>
  new Response(JSON.stringify({ status, detail }), {
    status,
    headers: { "content-type": "application/problem+json" },
  });

const run = (token: string | undefined, response: Response) => {
  mockFetch(response);
  return zuploFetch(
    createContext(token),
    new Request("https://api.zuploedge.com/v2/client/dep/consumers"),
    "Failed to fetch API keys",
  );
};

describe("zuploFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns the response when the request succeeds", async () => {
    const response = await run(JWT_TOKEN, new Response("{}", { status: 200 }));

    expect(response.status).toBe(200);
  });

  test("signs the request with the access token", async () => {
    const fetchSpy = mockFetch(new Response("{}", { status: 200 }));

    await zuploFetch(
      createContext(JWT_TOKEN),
      new Request("https://api.zuploedge.com/v2/client/dep/consumers"),
      "Failed to fetch API keys",
    );

    const signed = fetchSpy.mock.calls[0]?.[0] as Request;
    expect(signed.headers.get("Authorization")).toBe(`Bearer ${JWT_TOKEN}`);
  });

  describe("when the Zuplo API rejects the token", () => {
    test.each([401, 403])(
      "hints at the missing audience for an opaque token (%i)",
      async (status) => {
        const error = await run(
          OPAQUE_TOKEN,
          problemJson(status, "Unauthorized"),
        ).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ZudokuError);
        expect((error as ZudokuError).message).toBe("Failed to fetch API keys");
        expect((error as ZudokuError).developerHint).toContain("`audience`");
      },
    );

    test("does not blame the audience when the token is a JWT", async () => {
      const error = await run(
        JWT_TOKEN,
        problemJson(401, "Unauthorized"),
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ZudokuError);
      expect((error as ZudokuError).developerHint).not.toContain("opaque");
    });

    test("does not blame the audience when no token was attached", async () => {
      const error = await run(
        undefined,
        problemJson(401, "Unauthorized"),
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ZudokuError);
      expect((error as ZudokuError).developerHint).not.toContain("opaque");
    });
  });

  test("surfaces the problem detail for non-auth failures", async () => {
    const error = await run(
      OPAQUE_TOKEN,
      problemJson(500, "Deployment unavailable"),
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Deployment unavailable");
  });

  test("falls back to the failure message when the body is not a problem", async () => {
    const error = await run(
      OPAQUE_TOKEN,
      new Response("nope", { status: 500 }),
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ZudokuError);
    expect((error as Error).message).toBe("Failed to fetch API keys");
  });
});
