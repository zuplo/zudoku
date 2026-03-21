import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Link, Root } from "mdast";
import { VFile } from "vfile";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { remarkValidateLinks } from "./remark-validate-links.js";

const link = (url: string, line = 1): Link => ({
  type: "link",
  url,
  children: [{ type: "text", value: "link" }],
  position: {
    start: { line, column: 1, offset: 0 },
    end: { line, column: 1, offset: 0 },
  },
});

const run = (links: Link[], filePath: string, mode?: "warn" | "error") => {
  const tree: Root = { type: "root", children: links };
  const vfile = new VFile({ path: filePath });
  remarkValidateLinks(mode)(tree, vfile);
  return vfile;
};

let tmpDir: string;
let tmpMdFile: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-links-"));
  tmpMdFile = path.join(tmpDir, "existing.md");
  fs.writeFileSync(tmpMdFile, "# Test");
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe("remarkValidateLinks", () => {
  it("reports broken relative md link as warning by default", () => {
    const vfile = run([link("./nonexistent.md")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(1);
    expect(vfile.messages[0]?.message).toContain("nonexistent.md");
    expect(vfile.messages[0]?.fatal).not.toBe(true);
  });

  it("fails on broken link in error mode", () => {
    expect(() =>
      run([link("./nonexistent.mdx")], "/tmp/test/doc.md", "error"),
    ).toThrow(/nonexistent\.mdx/);
  });

  it("does not report valid relative md link", () => {
    const source = path.join(tmpDir, "doc.md");
    const vfile = run([link("./existing.md")], source);
    expect(vfile.messages).toHaveLength(0);
  });

  it("skips external links", () => {
    const vfile = run([link("https://example.com")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(0);
  });

  it("skips mailto links", () => {
    const vfile = run([link("mailto:a@b.com")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(0);
  });

  it("skips anchor-only links", () => {
    const vfile = run([link("#heading")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(0);
  });

  it("skips absolute path links", () => {
    const vfile = run([link("/docs/foo.md")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(0);
  });

  it("skips non-markdown relative links", () => {
    const vfile = run([link("./image.png")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(0);
  });

  it("handles links with hash fragments", () => {
    const vfile = run([link("./nonexistent.md#section")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(1);
    expect(vfile.messages[0]?.message).toContain("nonexistent.md#section");
  });

  it("validates .mdx extension links", () => {
    const vfile = run([link("../missing.mdx")], "/tmp/test/doc.md");
    expect(vfile.messages).toHaveLength(1);
  });

  it("includes line number in message", () => {
    const vfile = run([link("./broken.md", 42)], "/tmp/test/doc.md");
    expect(vfile.messages[0]?.message).toContain(":42");
  });

  it("reports multiple broken links", () => {
    const vfile = run(
      [link("./a.md", 1), link("./b.mdx", 5), link("https://ok.com")],
      "/tmp/test/doc.md",
    );
    expect(vfile.messages).toHaveLength(2);
  });
});
