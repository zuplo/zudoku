import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createCriticalCssProcessor, rebaseCssUrls } from "./critical-css.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const createFixture = async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "zudoku-css-"));
  temporaryDirectories.push(directory);
  await mkdir(path.join(directory, "assets"));
  await writeFile(
    path.join(directory, "assets/entry.css"),
    [
      ":root { --background: white; }",
      ".dark { --background: black; }",
      ".critical { color: red; }",
      ".unused { color: blue; }",
      ".dark\\:hidden:is(.dark *) { display: none; }",
      ".client-only:is(.dark *) { color: white; }",
      '@font-face { font-family: "Docs"; src: url(./docs.woff2) format("woff2"); }',
      '.critical { font-family: "Docs"; }',
    ].join("\n"),
  );

  return directory;
};

describe("createCriticalCssProcessor", () => {
  test("inlines used styles and defers the complete stylesheet", async () => {
    const assetsPath = await createFixture();
    const process = createCriticalCssProcessor({
      assetsPath,
      publicPath: "/docs",
    });

    const html = await process(`<!doctype html>
      <html><head>
        <style>.user-defined { background: url(./inline.svg); }</style>
        <link rel="stylesheet" href="/docs/assets/entry.css">
      </head><body>
        <main class="critical" style="background: url(./attribute.svg)">Documentation</main>
        <img class="dark:hidden" alt="Light logo">
      </body></html>`);

    expect(html).toContain(":root{--background:white}");
    expect(html).toContain(".dark{--background:black}");
    expect(html).toContain(".critical{color:red}");
    expect(html).not.toContain(".unused{color:blue}");
    expect(html).toContain(".dark\\:hidden:is(.dark *){display:none}");
    expect(html).toContain(".client-only:is(.dark *){color:white}");
    expect(html).toMatch(/@font-face\s*\{font-family:"Docs"/);
    expect(html).toContain('url("/docs/assets/docs.woff2")');
    expect(html).toContain(
      "<style>.user-defined { background: url(./inline.svg); }</style>",
    );
    expect(html).toContain('style="background: url(./attribute.svg)"');
    const preload =
      '<link rel="preload" href="/docs/assets/entry.css" as="style" data-zudoku-deferred-stylesheet>';
    const noScriptStylesheet =
      '<noscript><link rel="stylesheet" href="/docs/assets/entry.css"></noscript>';
    expect(html).toContain(preload);
    expect(html).toContain(noScriptStylesheet);
    expect(html.indexOf(preload)).toBeLessThan(html.indexOf("</head>"));
    expect(html.slice(html.indexOf("<body>"))).not.toContain(
      '<link rel="stylesheet" href="/docs/assets/entry.css">',
    );
    expect(html).not.toContain("onload=");
  });

  test("resolves locally emitted assets behind a CDN public path", async () => {
    const assetsPath = await createFixture();
    const process = createCriticalCssProcessor({
      assetsPath,
      publicPath: "https://cdn.example.com/docs",
    });

    const html = await process(`<!doctype html>
      <html><head>
        <link rel="stylesheet" href="https://cdn.example.com/docs/assets/entry.css">
      </head><body><main class="critical">Documentation</main></body></html>`);

    expect(html).toContain(".critical{color:red}");
    expect(html).toContain(
      'href="https://cdn.example.com/docs/assets/entry.css"',
    );
    expect(html).toContain(
      'url("https://cdn.example.com/docs/assets/docs.woff2")',
    );
  });
});

describe("rebaseCssUrls", () => {
  test("rebases relative assets without changing self-contained URLs", () => {
    const css = [
      ".relative { background: url('../images/hero image.svg#icon'); }",
      '.quoted { src: url("./font.woff2?v=1#regular"); }',
      ".escaped { background: url(foo\\(bar\\).svg); }",
      ".root { background: url(/images/root.svg); }",
      ".remote { background: url(https://images.example.com/hero.svg); }",
      ".protocol { background: url(//images.example.com/hero.svg); }",
      ".data { background: url(data:image/svg+xml,%3Csvg%3E); }",
      ".hash { filter: url(#shadow); }",
      ".variable { background: url(var(--image)); }",
      '.content::after { content: "url(./not-an-asset.svg)"; }',
      "/* url(./not-an-asset.svg) */",
    ].join("\n");

    expect(rebaseCssUrls(css, "/docs/assets/entry.css")).toBe(
      [
        ".relative { background: url('/docs/images/hero%20image.svg#icon'); }",
        '.quoted { src: url("/docs/assets/font.woff2?v=1#regular"); }',
        '.escaped { background: url("/docs/assets/foo(bar).svg"); }',
        ".root { background: url(/images/root.svg); }",
        ".remote { background: url(https://images.example.com/hero.svg); }",
        ".protocol { background: url(//images.example.com/hero.svg); }",
        ".data { background: url(data:image/svg+xml,%3Csvg%3E); }",
        ".hash { filter: url(#shadow); }",
        ".variable { background: url(var(--image)); }",
        '.content::after { content: "url(./not-an-asset.svg)"; }',
        "/* url(./not-an-asset.svg) */",
      ].join("\n"),
    );
  });
});
