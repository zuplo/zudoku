import { parse } from "vite";
import { describe, expect, it } from "vitest";
import { matchPathObject, matchRouteDict } from "./annotator.js";

const firstObject = async (code: string): Promise<any> => {
  const { program } = await parse("test.js", code);
  let found: unknown;
  const visit = (n: unknown) => {
    if (found) return;
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

const pathObjectAndBindings = async (code: string) => {
  const { program } = await parse("test.js", code);
  const declarations = program.body.flatMap((statement: any) =>
    statement.type === "VariableDeclaration" ? statement.declarations : [],
  );
  const bindings = new Map(
    declarations.flatMap((declaration: any) =>
      declaration.id?.type === "Identifier" &&
      declaration.init?.type === "ObjectExpression"
        ? [[declaration.id.name, declaration.init] as const]
        : [],
    ),
  );
  const route = declarations.find(
    (declaration: any) => declaration.id?.name === "route",
  )?.init;

  return { route, bindings };
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

  it("follows a shared top-level schema import registry", async () => {
    const { route, bindings } = await pathObjectAndBindings(`
      const schemaImports = {
        "/processed/first.js": () => import("./first.js"),
        "/processed/second.js": () => import("./second.js"),
      };
      const route = { path: "/api", schemaImports };
    `);

    expect(matchPathObject(route, bindings)).toEqual({
      root: "/api",
      specs: ["./first.js", "./second.js"],
    });
  });

  it("ignores identifiers that are not value references", async () => {
    // `admin` here is a property key, a member property, and a parameter name.
    // None of them reference the top-level `admin` registry, so its import
    // must not be attributed to "/public".
    const { route, bindings } = await pathObjectAndBindings(`
      const admin = { load: () => import("./admin-secret.js") };
      const route = {
        path: "/public",
        handle: { admin: false },
        element: layouts.admin,
        loader: (admin) => admin.data,
        lazy: () => import("./public.js"),
      };
    `);

    expect(matchPathObject(route, bindings)).toEqual({
      root: "/public",
      specs: ["./public.js"],
    });
  });

  it("follows a registry referenced by a nested property value", async () => {
    const { route, bindings } = await pathObjectAndBindings(`
      const schemaImports = { "/processed/first.js": () => import("./first.js") };
      const route = { path: "/api", options: { schemaImports } };
    `);

    expect(matchPathObject(route, bindings)).toEqual({
      root: "/api",
      specs: ["./first.js"],
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
