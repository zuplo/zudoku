import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Rolldown } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertNoProtectedLeaks,
  findProtectedLeaks,
  moveProtectedChunks,
  warnUnmatchedProtectedPatterns,
} from "./build.js";
import { clearProtectedRegistry, registerProtectedScope } from "./registry.js";

const chunk = (
  fileName: string,
  imports: string[] = [],
  opts: { isEntry?: boolean; dynamicImports?: string[] } = {},
): Rolldown.OutputChunk =>
  ({
    type: "chunk",
    fileName,
    imports,
    dynamicImports: opts.dynamicImports ?? [],
    isEntry: opts.isEntry ?? false,
  }) as Rolldown.OutputChunk;

describe("findProtectedLeaks", () => {
  it("returns empty for an output with no static edges into _protected/", () => {
    const output = [
      chunk("assets/entry.js", ["assets/shared.js"], { isEntry: true }),
      chunk("assets/shared.js"),
      chunk("_protected/secret.js"),
    ];
    expect(findProtectedLeaks(output)).toEqual([]);
  });

  it("reports direct static edges from an entry chunk", () => {
    const output = [
      chunk("assets/entry.js", ["_protected/secret.js"], { isEntry: true }),
      chunk("_protected/secret.js"),
    ];
    expect(findProtectedLeaks(output)).toEqual([
      "assets/entry.js -> _protected/secret.js",
    ]);
  });

  it("reports transitive static edges through intermediate chunks", () => {
    const output = [
      chunk("assets/entry.js", ["assets/middle.js"], { isEntry: true }),
      chunk("assets/middle.js", ["_protected/secret.js"]),
      chunk("_protected/secret.js"),
    ];
    expect(findProtectedLeaks(output)).toEqual([
      "assets/entry.js -> assets/middle.js -> _protected/secret.js",
    ]);
  });

  it("does not report dynamic imports into _protected/ (route-split lazy)", () => {
    const output = [
      chunk("assets/entry.js", [], {
        isEntry: true,
        dynamicImports: ["_protected/secret.js"],
      }),
      chunk("_protected/secret.js"),
    ];
    expect(findProtectedLeaks(output)).toEqual([]);
  });

  it("ignores non-entry chunks as roots", () => {
    const output = [
      chunk("_protected/facade.js", ["_protected/secret.js"]),
      chunk("_protected/secret.js"),
    ];
    expect(findProtectedLeaks(output)).toEqual([]);
  });
});

describe("assertNoProtectedLeaks", () => {
  it("throws with the leak chain when a leak exists", () => {
    const output = [
      chunk("assets/entry.js", ["_protected/secret.js"], { isEntry: true }),
      chunk("_protected/secret.js"),
    ];
    expect(() => assertNoProtectedLeaks(output)).toThrow(
      /assets\/entry\.js -> _protected\/secret\.js/,
    );
  });

  it("is a no-op when no leaks exist", () => {
    const output = [
      chunk("assets/entry.js", [], { isEntry: true }),
      chunk("_protected/secret.js"),
    ];
    expect(() => assertNoProtectedLeaks(output)).not.toThrow();
  });

  it("throws when a chunk under _protected/ is itself an entry", () => {
    const output = [
      chunk("assets/entry.js", [], { isEntry: true }),
      chunk("_protected/secret.js", [], { isEntry: true }),
    ];
    expect(() => assertNoProtectedLeaks(output)).toThrow(
      /Protected chunk\(s\) marked as entries/,
    );
  });
});

describe("moveProtectedChunks", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "zudoku-protected-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("moves files from client/_protected to server/_protected and removes the source dir", async () => {
    const clientDir = path.join(root, "client");
    const serverDir = path.join(root, "server");
    await mkdir(path.join(clientDir, "_protected"), { recursive: true });
    await writeFile(
      path.join(clientDir, "_protected", "a.js"),
      "export const a=1;",
    );
    await writeFile(
      path.join(clientDir, "_protected", "b.js"),
      "export const b=2;",
    );

    await moveProtectedChunks(clientDir, serverDir);

    expect(
      await readFile(path.join(serverDir, "_protected", "a.js"), "utf-8"),
    ).toBe("export const a=1;");
    expect(
      await readFile(path.join(serverDir, "_protected", "b.js"), "utf-8"),
    ).toBe("export const b=2;");
    await expect(
      readFile(path.join(clientDir, "_protected", "a.js"), "utf-8"),
    ).rejects.toThrow();
  });

  it("is a no-op when the source dir doesn't exist", async () => {
    const clientDir = path.join(root, "client");
    const serverDir = path.join(root, "server");
    await mkdir(clientDir, { recursive: true });
    await expect(
      moveProtectedChunks(clientDir, serverDir),
    ).resolves.toBeUndefined();
  });
});

describe("warnUnmatchedProtectedPatterns", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    warn.mockClear();
    clearProtectedRegistry();
  });

  const configWith = (patterns: string[]) =>
    ({
      protectedRoutes: patterns,
      __meta: { rootDir: "/tmp" },
    }) as never;

  it("warns listing every unmatched pattern", () => {
    registerProtectedScope("/abs/foo.mdx", { type: "route", path: "/foo" });
    warnUnmatchedProtectedPatterns(configWith(["/foo", "/missing/*"]));
    expect(warn).toHaveBeenCalledOnce();
    const message = warn.mock.calls[0]?.[0] ?? "";
    expect(message).toContain(`"/missing/*"`);
    expect(message).not.toContain(`"/foo"`);
  });

  it("is silent when every pattern matches some scope", () => {
    registerProtectedScope("/abs/foo.mdx", { type: "route", path: "/foo" });
    warnUnmatchedProtectedPatterns(configWith(["/foo"]));
    expect(warn).not.toHaveBeenCalled();
  });

  it("is silent when no patterns are configured", () => {
    warnUnmatchedProtectedPatterns(configWith([]));
    expect(warn).not.toHaveBeenCalled();
  });
});
