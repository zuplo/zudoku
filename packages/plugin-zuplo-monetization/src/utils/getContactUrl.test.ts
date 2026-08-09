import { describe, expect, it } from "vitest";
import type { Plan } from "../types/PlanType.js";
import { getContactUrl } from "./getContactUrl.js";

const withMetadata = (metadata?: Plan["metadata"]): Pick<Plan, "metadata"> => ({
  metadata,
});

describe("getContactUrl", () => {
  it("returns a mailto: contactUrl", () => {
    expect(
      getContactUrl(withMetadata({ contactUrl: "mailto:sales@example.com" })),
    ).toBe("mailto:sales@example.com");
  });

  it("returns an https: contactUrl", () => {
    expect(
      getContactUrl(
        withMetadata({ contactUrl: "https://example.com/contact" }),
      ),
    ).toBe("https://example.com/contact");
  });

  it("trims surrounding whitespace", () => {
    expect(
      getContactUrl(
        withMetadata({ contactUrl: "  mailto:sales@example.com " }),
      ),
    ).toBe("mailto:sales@example.com");
  });

  it("rejects unsafe or non-link schemes", () => {
    expect(
      getContactUrl(withMetadata({ contactUrl: "javascript:alert(1)" })),
    ).toBeUndefined();
    expect(
      getContactUrl(withMetadata({ contactUrl: "http://example.com" })),
    ).toBeUndefined();
    expect(
      getContactUrl(withMetadata({ contactUrl: "example.com/contact" })),
    ).toBeUndefined();
  });

  it("returns undefined for missing or non-string values", () => {
    expect(getContactUrl(withMetadata(undefined))).toBeUndefined();
    expect(getContactUrl(withMetadata({}))).toBeUndefined();
    expect(getContactUrl(withMetadata({ contactUrl: 42 }))).toBeUndefined();
    expect(getContactUrl(withMetadata({ contactUrl: "" }))).toBeUndefined();
  });
});
