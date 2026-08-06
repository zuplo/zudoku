import { describe, expect, it } from "vitest";
import {
  computeOptionalExternals,
  getOptionalPeerDeps,
  optionalDepExternal,
} from "./optional-externals.js";

describe("optionalDepExternal", () => {
  it("matches the package and its subpaths", () => {
    const re = optionalDepExternal("firebase");
    expect(re.test("firebase")).toBe(true);
    expect(re.test("firebase/app")).toBe(true);
    expect(re.test("firebase/auth")).toBe(true);
  });

  it("does not match unrelated packages with the same prefix", () => {
    const re = optionalDepExternal("firebase");
    expect(re.test("firebaseui")).toBe(false);
    expect(re.test("not-firebase")).toBe(false);
  });

  it("escapes scoped package names", () => {
    const re = optionalDepExternal("@supabase/supabase-js");
    expect(re.test("@supabase/supabase-js")).toBe(true);
    expect(re.test("@supabase/supabase-js/dist")).toBe(true);
    expect(re.test("@supabase/other")).toBe(false);
  });
});

describe("computeOptionalExternals", () => {
  const optionalDeps = ["mermaid", "firebase"];

  it("externalizes deps the project did not declare", () => {
    const externals = computeOptionalExternals(optionalDeps, new Set());
    expect(externals.map((re) => re.source)).toEqual([
      optionalDepExternal("mermaid").source,
      optionalDepExternal("firebase").source,
    ]);
  });

  it("does not externalize declared deps", () => {
    const externals = computeOptionalExternals(
      optionalDeps,
      new Set(["firebase"]),
    );
    expect(externals.map((re) => re.source)).toEqual([
      optionalDepExternal("mermaid").source,
    ]);
  });

  it("externalizes nothing when all deps are declared", () => {
    expect(
      computeOptionalExternals(optionalDeps, new Set(["mermaid", "firebase"])),
    ).toEqual([]);
  });
});

describe("getOptionalPeerDeps", () => {
  it("derives optional peers from zudoku and excludes env-gated deps", () => {
    const deps = getOptionalPeerDeps();
    expect(deps).toContain("mermaid");
    // Sentry is gated on SENTRY_DSN, not the project's package.json.
    expect(deps).not.toContain("@sentry/react");
  });
});
