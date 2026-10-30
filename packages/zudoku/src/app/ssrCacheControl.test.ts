import { describe, expect, it } from "vitest";
import { getSsrCacheControl } from "./ssrCacheControl.js";

describe("getSsrCacheControl", () => {
  it("forces private, no-store on authed renders regardless of status", () => {
    expect(getSsrCacheControl(200, true)).toBe("private, no-store");
    expect(getSsrCacheControl(404, true)).toBe("private, no-store");
    expect(getSsrCacheControl(500, true)).toBe("private, no-store");
  });

  it("emits the cacheable two-tier header on anon 200 renders", () => {
    expect(getSsrCacheControl(200, false)).toBe(
      "public, max-age=0, s-maxage=60, must-revalidate",
    );
  });

  it("emits nothing on anon non-200 renders so the caller can decide", () => {
    expect(getSsrCacheControl(301, false)).toBeUndefined();
    expect(getSsrCacheControl(404, false)).toBeUndefined();
    expect(getSsrCacheControl(500, false)).toBeUndefined();
  });
});
