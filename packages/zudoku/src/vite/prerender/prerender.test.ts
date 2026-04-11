import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveEntryServerPath } from "./prerender.js";

describe("resolveEntryServerPath", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "zudoku-test-"));
    await mkdir(path.join(tmpDir, "server"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns .mjs path when entry.server.mjs exists", async () => {
    await writeFile(path.join(tmpDir, "server/entry.server.mjs"), "");
    const result = await resolveEntryServerPath(tmpDir);
    expect(result).toBe(path.join(tmpDir, "server/entry.server.mjs"));
  });

  it("returns .js path when only entry.server.js exists", async () => {
    await writeFile(path.join(tmpDir, "server/entry.server.js"), "");
    const result = await resolveEntryServerPath(tmpDir);
    expect(result).toBe(path.join(tmpDir, "server/entry.server.js"));
  });

  it("prefers .mjs when both exist", async () => {
    await writeFile(path.join(tmpDir, "server/entry.server.js"), "");
    await writeFile(path.join(tmpDir, "server/entry.server.mjs"), "");
    const result = await resolveEntryServerPath(tmpDir);
    expect(result).toBe(path.join(tmpDir, "server/entry.server.mjs"));
  });

  it("falls back to .js path when neither exists", async () => {
    const result = await resolveEntryServerPath(tmpDir);
    expect(result).toBe(path.join(tmpDir, "server/entry.server.js"));
  });
});
