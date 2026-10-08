import { describe, expect, it } from "vitest";
import {
  identitySelectionToValue,
  NO_IDENTITY,
  valueToIdentitySelection,
} from "./useIdentityStore.js";

describe("identity selection encoding", () => {
  it("keeps the single-scheme encoding unchanged", () => {
    expect(
      identitySelectionToValue({ type: "scheme", names: ["bearer"] }),
    ).toBe("__security:bearer");
  });

  it("encodes grouped schemes independent of order", () => {
    expect(
      identitySelectionToValue({ type: "scheme", names: ["secret", "key"] }),
    ).toBe(
      identitySelectionToValue({ type: "scheme", names: ["key", "secret"] }),
    );
  });

  it("round-trips grouped schemes", () => {
    const value = identitySelectionToValue({
      type: "scheme",
      names: ["key", "secret"],
    });
    expect(valueToIdentitySelection(value)).toEqual({
      type: "scheme",
      names: ["key", "secret"],
    });
  });

  it("decodes none and identities", () => {
    expect(valueToIdentitySelection(NO_IDENTITY)).toEqual({ type: "none" });
    expect(valueToIdentitySelection(null)).toEqual({ type: "none" });
    expect(valueToIdentitySelection("api-key-1")).toEqual({
      type: "identity",
      id: "api-key-1",
    });
  });
});
