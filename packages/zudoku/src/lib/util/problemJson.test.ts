import { describe, expect, it } from "vitest";
import {
  getProblemJson,
  type ProblemJson,
  throwIfProblemJson,
} from "./problemJson.js";

const createResponse = (
  body: unknown,
  { status = 400, contentType = "application/problem+json" } = {},
) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });

describe("getProblemJson", () => {
  it("should return a ProblemJson for a valid problem+json response", async () => {
    const body = {
      type: "https://example.com/probs/out-of-credit",
      title: "You do not have enough credit.",
      status: 403,
      detail: "Your current balance is 30, but that costs 50.",
      instance: "/account/12345/msgs/abc",
    };
    const result = await getProblemJson(createResponse(body));

    expect(result).toEqual(body);
  });

  it("should default type to about:blank when type is missing", async () => {
    const body = { title: "Not Found", status: 404 };
    const result = await getProblemJson(createResponse(body));

    expect(result?.type).toBe("about:blank");
  });

  it("should default type to about:blank when type is not a string", async () => {
    const body = { type: 123, title: "Bad Request" };
    const result = await getProblemJson(createResponse(body));

    expect(result?.type).toBe("about:blank");
  });

  it("should preserve extension members", async () => {
    const body = {
      type: "https://example.com/probs/out-of-credit",
      title: "You do not have enough credit.",
      balance: 30,
      accounts: ["/account/12345", "/account/67890"],
    };
    const result = await getProblemJson(createResponse(body));

    expect(result?.balance).toBe(30);
    expect(result?.accounts).toEqual(["/account/12345", "/account/67890"]);
  });

  it("should return undefined for non-problem+json content type", async () => {
    const body = { type: "https://example.com/error", title: "Error" };
    const result = await getProblemJson(
      createResponse(body, { contentType: "application/json" }),
    );

    expect(result).toBeUndefined();
  });

  it("should handle content type with charset parameter", async () => {
    const body = { title: "Error", status: 500 };
    const result = await getProblemJson(
      createResponse(body, {
        contentType: "application/problem+json; charset=utf-8",
      }),
    );

    expect(result).toBeDefined();
    expect(result?.title).toBe("Error");
  });

  it("should return undefined for invalid JSON body", async () => {
    const result = await getProblemJson(
      createResponse("not json {{{", {
        contentType: "application/problem+json",
      }),
    );

    expect(result).toBeUndefined();
  });

  it("should return undefined when body is a JSON array", async () => {
    const result = await getProblemJson(createResponse("[1,2,3]"));

    expect(result).toBeUndefined();
  });

  it("should return undefined when body is a JSON primitive", async () => {
    const result = await getProblemJson(createResponse('"string"'));

    expect(result).toBeUndefined();
  });

  it("should handle minimal valid problem json (empty object)", async () => {
    const result = await getProblemJson(createResponse({}));

    expect(result).toBeDefined();
    expect(result?.type).toBe("about:blank");
  });

  it("should handle the about:blank problem type", async () => {
    const body = {
      type: "about:blank",
      title: "Not Found",
      status: 404,
    };
    const result = await getProblemJson(createResponse(body));

    expect(result?.type).toBe("about:blank");
    expect(result?.title).toBe("Not Found");
    expect(result?.status).toBe(404);
  });
});

describe("throwIfProblemJson", () => {
  it("should throw with detail message when present", async () => {
    const body = {
      type: "https://example.com/probs/out-of-credit",
      title: "You do not have enough credit.",
      detail: "Your current balance is 30, but that costs 50.",
    };

    await expect(throwIfProblemJson(createResponse(body))).rejects.toThrow(
      "Your current balance is 30, but that costs 50.",
    );
  });

  it("should throw with title when detail is missing", async () => {
    const body = {
      type: "https://example.com/probs/out-of-credit",
      title: "You do not have enough credit.",
    };

    await expect(throwIfProblemJson(createResponse(body))).rejects.toThrow(
      "You do not have enough credit.",
    );
  });

  it("should throw with 'Unknown error' when both detail and title are missing", async () => {
    const body = { status: 500 };

    await expect(throwIfProblemJson(createResponse(body))).rejects.toThrow(
      "Unknown error",
    );
  });

  it("should not throw for ok responses even with problem+json content type", async () => {
    const body = {
      type: "https://example.com/probs/error",
      title: "Error",
    };

    await expect(
      throwIfProblemJson(createResponse(body, { status: 200 })),
    ).resolves.toBeUndefined();
  });

  it("should not throw for non-problem+json error responses", async () => {
    const body = { error: "something went wrong" };

    await expect(
      throwIfProblemJson(
        createResponse(body, { contentType: "application/json" }),
      ),
    ).resolves.toBeUndefined();
  });

  it("should not throw for error responses with invalid JSON", async () => {
    await expect(
      throwIfProblemJson(createResponse("not json")),
    ).resolves.toBeUndefined();
  });
});

describe("ProblemJson type", () => {
  it("should accept all standard RFC 9457 fields", () => {
    const problem: ProblemJson = {
      type: "https://example.com/probs/out-of-credit",
      title: "You do not have enough credit.",
      status: 403,
      detail: "Your current balance is 30, but that costs 50.",
      instance: "/account/12345/msgs/abc",
    };

    expect(problem.type).toBe("https://example.com/probs/out-of-credit");
    expect(problem.status).toBe(403);
  });

  it("should accept extension members", () => {
    const problem: ProblemJson = {
      type: "https://example.com/probs/out-of-credit",
      balance: 30,
      accounts: ["/account/12345"],
    };

    expect(problem.balance).toBe(30);
  });

  it("should require only the type field", () => {
    const problem: ProblemJson = {
      type: "about:blank",
    };

    expect(problem.type).toBe("about:blank");
    expect(problem.title).toBeUndefined();
    expect(problem.status).toBeUndefined();
    expect(problem.detail).toBeUndefined();
    expect(problem.instance).toBeUndefined();
  });
});
