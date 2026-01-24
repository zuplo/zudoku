import { describe, expect, test } from "vitest";
import { isPlainObject, mergeConfig } from "./transform-config.js";

describe("isPlainObject", () => {
  test("returns true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  test("returns false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  test("returns false for null and undefined", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });

  test("returns false for class instances", () => {
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(new Map())).toBe(false);
    expect(isPlainObject(/regex/)).toBe(false);
  });
});

describe("mergeConfig", () => {
  test("merges flat objects", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    expect(mergeConfig(target, source)).toEqual({ a: 1, b: 3, c: 4 });
  });

  test("merges nested objects", () => {
    const target = { nested: { a: 1, b: 2 } } as Record<string, unknown>;
    const source = { nested: { b: 3, c: 4 } };
    expect(mergeConfig(target, source)).toEqual({
      nested: { a: 1, b: 3, c: 4 },
    });
  });

  test("replaces arrays instead of merging", () => {
    const target = { arr: [1, 2, 3] };
    const source = { arr: [4, 5] };
    expect(mergeConfig(target, source)).toEqual({ arr: [4, 5] });
  });

  test("preserves React elements without deep cloning", () => {
    const element = <div className="test">Hello</div>;
    const target = { banner: { message: "old" } };
    const source = { banner: { message: element } };

    const result = mergeConfig(target, source);

    // Should be the exact same reference, not a clone
    expect(result.banner.message).toBe(element);
  });

  test("does not clone React element children", () => {
    const child = <strong>Bold</strong>;
    const element = <div>{child} text</div>;
    const target = { site: { banner: {} } };
    const source = { site: { banner: { message: element } } };

    const result = mergeConfig(target, source);

    // The element should be identical (same reference)
    expect(result.site.banner.message).toBe(element);
    // Children should be preserved exactly
    expect(result.site.banner.message.props.children).toBe(
      element.props.children,
    );
  });

  test("handles null and undefined values", () => {
    const target = { a: 1, b: 2 };
    const source = { a: null, c: undefined };
    expect(mergeConfig(target, source)).toEqual({
      a: null,
      b: 2,
      c: undefined,
    });
  });

  test("replaces non-plain objects", () => {
    const date = new Date("2024-01-01");
    const target = { date: new Date("2020-01-01") };
    const source = { date };
    const result = mergeConfig(target, source);
    expect(result.date).toBe(date);
  });

  test("does not mutate target", () => {
    const target = { a: 1, nested: { b: 2 } };
    const source = { a: 2, nested: { c: 3 } };
    mergeConfig(target, source);
    expect(target).toEqual({ a: 1, nested: { b: 2 } });
  });
});
