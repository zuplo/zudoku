import { describe, expect, it } from "vitest";
import { collectIconLiterals } from "./plugin-icons.js";

// `collectIconLiterals` runs on post-react-transform code, so authored `<Icon icon="...">`
// JSX reaches it as a plain `icon: "..."` object property — the form these tests use.
const collect = (code: string) => collectIconLiterals(code, "test.tsx");

describe("collectIconLiterals", () => {
  it("collects a prefixed icon from an object property", () => {
    expect(collect(`const x = { icon: "ph:acorn-duotone" };`)).toEqual(
      new Set(["ph:acorn-duotone"]),
    );
  });

  it("collects a bare name when it is a real lucide icon", () => {
    expect(collect(`const x = { icon: "house" };`)).toEqual(new Set(["house"]));
  });

  it("ignores a bare name that is not a lucide icon", () => {
    expect(collect(`const x = { icon: "totally-not-an-icon-xyz" };`)).toEqual(
      new Set(),
    );
  });

  it("collects from compiled JSX-style call props", () => {
    expect(collect(`jsx(Icon, { icon: "lucide:zap" });`)).toEqual(
      new Set(["lucide:zap"]),
    );
  });

  it("ignores computed keys", () => {
    expect(collect(`const k = "icon"; const x = { [k]: "ph:acorn" };`)).toEqual(
      new Set(),
    );
  });

  it("ignores non-string values", () => {
    expect(collect(`const x = { icon: someVariable };`)).toEqual(new Set());
  });

  it("ignores keys that are not exactly `icon`", () => {
    expect(collect(`const x = { iconName: "ph:acorn" };`)).toEqual(new Set());
  });

  it("ignores values that are not icon-name shaped", () => {
    expect(collect(`const x = { icon: "Foo:Bar" };`)).toEqual(new Set());
  });

  it("dedupes repeated icons", () => {
    expect(
      collect(`[{ icon: "house" }, { icon: "house" }, { icon: "ph:rocket" }];`),
    ).toEqual(new Set(["house", "ph:rocket"]));
  });

  it("returns an empty set for unparseable code instead of throwing", () => {
    expect(() => collect(`const x = @@@ <<< not valid`)).not.toThrow();
    expect(collect(`const x = @@@ <<< not valid`)).toEqual(new Set());
  });

  it("warns about an icon-shaped bare name that isn't a known lucide icon", () => {
    const warnings: string[] = [];
    const found = collectIconLiterals(
      `const x = { icon: "totally-not-an-icon-xyz" };`,
      "test.tsx",
      (message) => warnings.push(message),
    );

    expect(found).toEqual(new Set());
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("totally-not-an-icon-xyz");
  });

  it("does not warn for known or prefixed icons", () => {
    const warnings: string[] = [];
    collectIconLiterals(
      `[{ icon: "house" }, { icon: "ph:rocket" }];`,
      "test.tsx",
      (message) => warnings.push(message),
    );

    expect(warnings).toHaveLength(0);
  });
});
