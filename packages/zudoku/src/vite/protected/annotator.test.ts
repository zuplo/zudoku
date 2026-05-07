import { parse } from "vite";
import { describe, expect, it } from "vitest";
import { matchPathObject, matchRouteDict } from "./annotator.js";

// biome-ignore lint/suspicious/noExplicitAny: walker-shape AST
const firstObject = async (code: string): Promise<any> => {
  const { program } = await parse("test.js", code);
  let found: unknown;
  const visit = (n: unknown) => {
    if (found) return;
    // biome-ignore lint/suspicious/noExplicitAny: generic walker
    const node = n as any;
    if (node?.type === "ObjectExpression") {
      found = node;
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const key of Object.keys(node)) {
      const v = node[key];
      if (Array.isArray(v)) for (const x of v) visit(x);
      else if (v && typeof v === "object") visit(v);
    }
  };
  visit(program);
  return found;
};

describe("matchPathObject (Shape A)", () => {
  it("captures path + nested dynamic imports", async () => {
    const node = await firstObject(
      `const r = { path: "/admin", lazy: () => import("./admin") };`,
    );
    expect(matchPathObject(node)).toEqual({
      root: "/admin",
      specs: ["./admin"],
    });
  });

  it("collects imports from all non-path property values", async () => {
    const node = await firstObject(
      `const r = { path: "/api", schemaImports: { "k1": () => import("./a"), "k2": () => import("./b") } };`,
    );
    expect(matchPathObject(node)).toEqual({
      root: "/api",
      specs: ["./a", "./b"],
    });
  });

  it("returns undefined without a string path", async () => {
    const node = await firstObject(
      `const r = { path: dynamicPath, lazy: () => import("./x") };`,
    );
    expect(matchPathObject(node)).toBeUndefined();
  });

  it("returns undefined when there are no dynamic imports", async () => {
    const node = await firstObject(`const r = { path: "/foo", label: "x" };`);
    expect(matchPathObject(node)).toBeUndefined();
  });
});

describe("matchRouteDict (Shape B)", () => {
  it("captures all entries of a route-path dict", async () => {
    const node = await firstObject(
      `const m = { "/foo": () => import("./foo"), "/bar": () => import("./bar") };`,
    );
    expect(matchRouteDict(node)).toEqual([
      { root: "/foo", spec: "./foo" },
      { root: "/bar", spec: "./bar" },
    ]);
  });

  it("rejects dicts whose keys contain a dot (file-path dicts)", async () => {
    const node = await firstObject(
      `const m = { "/abs/path/file.js": () => import("./file.js") };`,
    );
    expect(matchRouteDict(node)).toBeUndefined();
  });

  it("rejects dicts whose keys don't start with /", async () => {
    const node = await firstObject(
      `const m = { "foo": () => import("./foo") };`,
    );
    expect(matchRouteDict(node)).toBeUndefined();
  });

  it("rejects dicts with any non-arrow-import value", async () => {
    const node = await firstObject(
      `const m = { "/foo": () => import("./foo"), "/bar": "plain" };`,
    );
    expect(matchRouteDict(node)).toBeUndefined();
  });

  it("returns undefined for an empty object", async () => {
    const node = await firstObject(`const m = {};`);
    expect(matchRouteDict(node)).toBeUndefined();
  });
});
