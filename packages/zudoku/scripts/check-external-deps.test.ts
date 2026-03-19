import { describe, expect, it, vi, beforeEach } from "vitest";

const fakeFiles: Record<string, string> = {};
let fakePkg = { name: "test-pkg", dependencies: {}, peerDependencies: {} };

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async (filePath: string) => {
    if (filePath.endsWith("package.json")) {
      return JSON.stringify(fakePkg);
    }
    for (const [name, content] of Object.entries(fakeFiles)) {
      if (filePath.endsWith(name)) return content;
    }
    throw new Error(`File not found: ${filePath}`);
  }),
}));

vi.mock("glob", () => ({ glob: vi.fn(async () => Object.keys(fakeFiles)) }));

const mockExit = vi
  .spyOn(process, "exit")
  .mockImplementation(() => undefined as never);

const mockStderr = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

beforeEach(() => {
  Object.keys(fakeFiles).forEach((k) => delete fakeFiles[k]);
  fakePkg = {
    name: "test-pkg",
    dependencies: {} as Record<string, string>,
    peerDependencies: {} as Record<string, string>,
  };
  mockExit.mockClear();
  mockStderr.mockClear();
});

const runCheck = async () => {
  vi.resetModules();
  await import("./check-external-deps.js");
};

describe("check-external-deps", () => {
  it("passes when all imports are declared", async () => {
    fakePkg.dependencies = { react: "^19", zod: "^4" } as Record<
      string,
      string
    >;
    fakeFiles["src/app.ts"] = `
      import { useState } from "react";
      import { z } from "zod";
    `;
    await runCheck();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("fails when a dependency is missing", async () => {
    fakePkg.dependencies = { react: "^19" } as Record<string, string>;
    fakeFiles["src/app.ts"] = `
      import { useState } from "react";
      import { build } from "esbuild";
    `;
    await runCheck();
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockStderr).toHaveBeenCalledWith(expect.stringContaining("esbuild"));
  });

  it("ignores type-only imports", async () => {
    fakePkg.dependencies = { react: "^19" } as Record<string, string>;
    fakeFiles["src/app.ts"] = `
      import { useState } from "react";
      import type { Foo } from "undeclared";
    `;
    await runCheck();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("flags mixed imports with value specifiers", async () => {
    fakeFiles["src/app.ts"] = `import { type Foo, bar } from "undeclared";`;
    await runCheck();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("ignores relative, node:, and virtual: imports", async () => {
    fakeFiles["src/app.ts"] = `
      import { foo } from "./local";
      import { readFile } from "node:fs";
      import config from "virtual:zudoku-config";
    `;
    await runCheck();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("resolves scoped package names", async () => {
    fakeFiles["src/app.ts"] = `import { foo } from "@scope/pkg/deep";`;
    await runCheck();
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining("@scope/pkg"),
    );
  });

  it("allows peerDependencies", async () => {
    fakePkg.peerDependencies = { mermaid: "^11" } as Record<string, string>;
    fakeFiles["src/app.ts"] = `import mermaid from "mermaid";`;
    await runCheck();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("detects undeclared re-exports", async () => {
    fakeFiles["src/index.ts"] = `export { foo } from "undeclared";`;
    await runCheck();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("ignores type-only re-exports", async () => {
    fakeFiles["src/index.ts"] = `export type { Foo } from "undeclared";`;
    await runCheck();
    expect(mockExit).not.toHaveBeenCalled();
  });
});
