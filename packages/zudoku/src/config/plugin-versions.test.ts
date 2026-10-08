import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

vi.mock("../vite/package-root.js", () => ({
  findPackageRoot: vi.fn(),
}));

import { readFile } from "node:fs/promises";
import { findPackageRoot } from "../vite/package-root.js";
import { getPluginVersions } from "./plugin-versions.js";

const pkg = (name: string, version: string) =>
  JSON.stringify({ name, version });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPluginVersions", () => {
  it("returns an empty array when there are no plugin dirs", async () => {
    expect(await getPluginVersions([])).toEqual([]);
    expect(findPackageRoot).not.toHaveBeenCalled();
    expect(readFile).not.toHaveBeenCalled();
  });

  it("resolves name and version from each plugin's package.json", async () => {
    vi.mocked(findPackageRoot).mockImplementation(async (dir) =>
      dir === "/a/src" ? "/a" : "/b",
    );
    vi.mocked(readFile).mockImplementation(async (file) =>
      String(file).startsWith("/a")
        ? pkg("@zuplo/zudoku-plugin-monetization", "0.0.45")
        : pkg("@zudoku/plugin-graphql", "0.0.12"),
    );

    expect(await getPluginVersions(["/a/src", "/b/src"])).toEqual([
      { name: "@zuplo/zudoku-plugin-monetization", version: "0.0.45" },
      { name: "@zudoku/plugin-graphql", version: "0.0.12" },
    ]);
  });

  it("dedupes plugins that record their directory more than once", async () => {
    vi.mocked(findPackageRoot).mockResolvedValue("/a");
    vi.mocked(readFile).mockResolvedValue(
      pkg("@zudoku/plugin-graphql", "1.0.0"),
    );

    expect(await getPluginVersions(["/a/x", "/a/y"])).toEqual([
      { name: "@zudoku/plugin-graphql", version: "1.0.0" },
    ]);
  });

  it("skips dirs without a resolvable package root", async () => {
    vi.mocked(findPackageRoot).mockResolvedValue(undefined);

    expect(await getPluginVersions(["/nowhere"])).toEqual([]);
    expect(readFile).not.toHaveBeenCalled();
  });

  it("skips packages with an unreadable or nameless package.json", async () => {
    vi.mocked(findPackageRoot).mockImplementation(async (dir) => dir);
    vi.mocked(readFile).mockImplementation(async (file) => {
      if (String(file).startsWith("/broken")) throw new Error("ENOENT");
      return JSON.stringify({ version: "1.0.0" }); // no name
    });

    expect(await getPluginVersions(["/broken", "/nameless"])).toEqual([]);
  });

  it("falls back to 'unknown' when a version is missing", async () => {
    vi.mocked(findPackageRoot).mockResolvedValue("/a");
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "@zudoku/plugin-graphql" }),
    );

    expect(await getPluginVersions(["/a"])).toEqual([
      { name: "@zudoku/plugin-graphql", version: "unknown" },
    ]);
  });
});
