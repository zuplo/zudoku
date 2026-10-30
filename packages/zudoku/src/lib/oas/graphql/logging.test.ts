import { afterEach, describe, expect, it, vi } from "vitest";
import { createGraphQLServer } from "./index.js";

const request = () =>
  new Request("http://localhost/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ __typename }" }),
  });

const loggedMessages = (spies: ReturnType<typeof vi.spyOn>[]) =>
  spies.flatMap((spy) => spy.mock.calls.flat().map(String));

describe("createGraphQLServer logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not log each request at info", async () => {
    const spies = (["log", "info", "debug"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );

    const response = await createGraphQLServer().fetch(request());

    expect(response.status).toBe(200);
    expect(loggedMessages(spies).join("\n")).not.toContain("Request processed");
  });

  it("lets callers opt back in to info logging", async () => {
    const spies = (["log", "info", "debug"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );

    await createGraphQLServer({ logging: "info" }).fetch(request());

    expect(loggedMessages(spies).join("\n")).toContain("Request processed");
  });
});
