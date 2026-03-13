import { describe, expect, it } from "vitest";
import invariant from "../../lib/util/invariant.js";
import { createRedirectLoader } from "./createRedirectLoader.js";

describe("createRedirectLoader", () => {
  it("returns undefined when no redirects", () => {
    expect(createRedirectLoader(undefined)).toBeUndefined();
  });

  it("redirects matching path with 301", () => {
    const loader = createRedirectLoader([{ from: "/old", to: "/new" }]);
    invariant(loader, "loader should be defined");
    const result = loader({
      request: new Request("http://localhost/old"),
    }) as Response;
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(301);
    expect(result.headers.get("location")).toBe("/new");
  });

  it("returns null for non-matching path", () => {
    const loader = createRedirectLoader([{ from: "/old", to: "/new" }]);
    invariant(loader, "loader should be defined");
    expect(
      loader({ request: new Request("http://localhost/other") }),
    ).toBeNull();
  });

  it("normalizes paths without leading slash", () => {
    const loader = createRedirectLoader([{ from: "no-slash", to: "/target" }]);
    invariant(loader, "loader should be defined");
    const result = loader({
      request: new Request("http://localhost/no-slash"),
    }) as Response;
    expect(result).toBeInstanceOf(Response);
    expect(result.headers.get("location")).toBe("/target");
  });

  it("normalizes paths with trailing slash", () => {
    const loader = createRedirectLoader([
      { from: "/trailing/", to: "/target" },
    ]);
    invariant(loader, "loader should be defined");
    const result = loader({
      request: new Request("http://localhost/trailing"),
    }) as Response;
    expect(result).toBeInstanceOf(Response);
    expect(result.headers.get("location")).toBe("/target");
  });

  it("strips basePath before matching", () => {
    const loader = createRedirectLoader(
      [{ from: "/old", to: "/new" }],
      "/base",
    );
    invariant(loader, "loader should be defined");
    const result = loader({
      request: new Request("http://localhost/base/old"),
    }) as Response;
    expect(result).toBeInstanceOf(Response);
    expect(result.headers.get("location")).toBe("/new");
  });
});
