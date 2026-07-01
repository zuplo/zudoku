import { describe, expect, it } from "vitest";
import { IconSchema } from "./IconSchema.js";

describe("IconSchema", () => {
  it.each(["home", "lucide:home", "ph:acorn-duotone", "mdi:account"])(
    "accepts the icon string %s",
    (value) => expect(IconSchema.safeParse(value).success).toBe(true),
  );

  it.each(["Home", "lucide:", "a:b:c", "https://example.com"])(
    "rejects the malformed icon string %s",
    (value) => expect(IconSchema.safeParse(value).success).toBe(false),
  );

  it.each([42, null, undefined, {}])(
    "rejects the non-string value %s",
    (value) => expect(IconSchema.safeParse(value).success).toBe(false),
  );
});
