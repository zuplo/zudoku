import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { generateLlmsTxtFiles } from "./llms.js";
import type { MarkdownFileInfo } from "./plugin-markdown-export.js";

const markdownInfo = (
  routePath: string,
  title?: string,
  description?: string,
): MarkdownFileInfo => ({
  filePath: `/pages${routePath}.md`,
  routePath,
  title,
  description,
  content: `Content for ${routePath}`,
});

describe("generateLlmsTxtFiles", () => {
  let outputDir: string;
  const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(async () => {
    outputDir = await mkdtemp(path.join(os.tmpdir(), "zudoku-llms-test-"));
  });

  afterEach(async () => {
    consoleLog.mockClear();
    await rm(outputDir, { recursive: true, force: true });
  });

  afterAll(() => {
    consoleLog.mockRestore();
  });

  it("uses the default title and description", async () => {
    await generateLlmsTxtFiles({
      markdownFileInfos: [markdownInfo("/guide", "Guide", "Read the guide")],
      outputUrls: ["/guide"],
      baseOutputDir: outputDir,
      basePath: undefined,
      llmsTxt: true,
      redirectUrls: new Set(),
    });

    await expect(readFile(path.join(outputDir, "llms.txt"), "utf-8")).resolves
      .toBe(`# Documentation

> Documentation files for Large Language Models

## Documentation

- [Guide](/guide.md): Read the guide`);
  });

  it("renders custom guidance in specification order and safely formats Markdown", async () => {
    await generateLlmsTxtFiles({
      markdownFileInfos: [
        markdownInfo(
          "/",
          String.raw`Acme [quickstart] \ reference`,
          "Start here\nfor the fastest setup.",
        ),
      ],
      outputUrls: ["/"],
      baseOutputDir: outputDir,
      basePath: "/docs",
      llmsTxt: true,
      title: "  Acme\nAPI  ",
      description: "  Build and operate\nAcme services.  ",
      instructions: `Use these docs when creating an Acme integration.

Call the documented endpoints with a sandbox API key.

## This is guidance, not a link section`,
      redirectUrls: new Set(),
    });

    await expect(readFile(path.join(outputDir, "llms.txt"), "utf-8")).resolves
      .toBe(`# Acme API

> Build and operate Acme services.

Use these docs when creating an Acme integration.

Call the documented endpoints with a sandbox API key.

\\## This is guidance, not a link section

## Documentation

- [Acme \\[quickstart\\] \\\\ reference](/docs/index.md): Start here for the fastest setup.`);
  });

  it("links the root document as index.md without a base path", async () => {
    await generateLlmsTxtFiles({
      markdownFileInfos: [markdownInfo("/", "Home")],
      outputUrls: ["/"],
      baseOutputDir: outputDir,
      basePath: undefined,
      llmsTxt: true,
      redirectUrls: new Set(),
    });

    const result = await readFile(path.join(outputDir, "llms.txt"), "utf-8");
    expect(result).toContain("- [Home](/index.md)");
    expect(result).not.toContain("(/.md)");
  });

  it("URL-encodes generated Markdown links", async () => {
    await generateLlmsTxtFiles({
      markdownFileInfos: [markdownInfo("/guides/café setup", "Café setup")],
      outputUrls: ["/guides/café setup"],
      baseOutputDir: outputDir,
      basePath: "/docs",
      llmsTxt: true,
      redirectUrls: new Set(),
    });

    const result = await readFile(path.join(outputDir, "llms.txt"), "utf-8");
    expect(result).toContain(
      "- [Café setup](/docs/guides/caf%C3%A9%20setup.md)",
    );
  });

  it("omits link-section headings when there are no linkable documents", async () => {
    await generateLlmsTxtFiles({
      markdownFileInfos: [],
      outputUrls: [],
      baseOutputDir: outputDir,
      basePath: undefined,
      llmsTxt: true,
      redirectUrls: new Set(),
    });

    const result = await readFile(path.join(outputDir, "llms.txt"), "utf-8");
    expect(result).toBe(`# Documentation

> Documentation files for Large Language Models`);
    expect(result).not.toContain("## Documentation");
  });

  it("uses the custom title for llms-full.txt", async () => {
    await generateLlmsTxtFiles({
      markdownFileInfos: [markdownInfo("/guide", "Guide")],
      outputUrls: ["/guide"],
      baseOutputDir: outputDir,
      basePath: undefined,
      llmsTxtFull: true,
      title: "Acme API",
      redirectUrls: new Set(),
    });

    const result = await readFile(
      path.join(outputDir, "llms-full.txt"),
      "utf-8",
    );
    expect(result).toMatch(/^# Acme API\n/);
  });

  it("excludes redirects and error pages from the link list", async () => {
    await generateLlmsTxtFiles({
      markdownFileInfos: [
        markdownInfo("/guide", "Guide"),
        markdownInfo("/old", "Old guide"),
        markdownInfo("/404", "Not found"),
      ],
      outputUrls: ["/guide", "/old", "/404"],
      baseOutputDir: outputDir,
      basePath: undefined,
      llmsTxt: true,
      redirectUrls: new Set(["/old"]),
    });

    const result = await readFile(path.join(outputDir, "llms.txt"), "utf-8");
    expect(result).toContain("- [Guide](/guide.md)");
    expect(result).not.toContain("Old guide");
    expect(result).not.toContain("Not found");
  });
});
