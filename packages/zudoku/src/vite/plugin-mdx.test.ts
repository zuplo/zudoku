import { compile, nodeTypes } from "@mdx-js/mdx";
import type { Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import rehypeRaw from "rehype-raw";
import type { PluggableList } from "unified";
import { visit } from "unist-util-visit";
import { beforeAll, describe, expect, it } from "vitest";
import { highlighterPromise } from "../lib/shiki.js";
import { createDefaultRehypePlugins } from "./plugin-mdx.js";

// Mirrors how plugin-mdx wires rehype-raw so raw HTML in `.md` files survives.
const rehypePlugins: PluggableList = [[rehypeRaw, { passThrough: nodeTypes }]];

describe("raw HTML handling in the mdx pipeline", () => {
  it("preserves a raw HTML anchor in a markdown (.md) file", async () => {
    const md = `Download the spec:

<a href="/documents/api-spec.pdf" download="/documents/api-spec.pdf">Download</a>
`;
    const out = String(await compile(md, { format: "md", rehypePlugins }));

    expect(out).toContain('href: "/documents/api-spec.pdf"');
    expect(out).toContain('download: "/documents/api-spec.pdf"');
    expect(out).toContain("_components.a");
  });

  it("keeps MDX imports, components and expressions intact (.mdx)", async () => {
    const mdx = `import { Foo } from "./foo.js";

<Foo bar="baz" />

{1 + 2}

<a href="/x.pdf">Download</a>
`;
    const out = String(await compile(mdx, { format: "mdx", rehypePlugins }));

    expect(out).toMatch(/import\s*\{\s*Foo\s*\}/);
    expect(out).toMatch(/_jsx\(Foo/);
    expect(out).toContain("1 + 2");
    expect(out).toContain('href: "/x.pdf"');
  });
});

describe("default rehype plugins", () => {
  beforeAll(async () => {
    const highlighter = await highlighterPromise;
    await highlighter.loadTheme(
      import("@shikijs/themes/github-light"),
      import("@shikijs/themes/github-dark"),
    );
    await highlighter.loadLanguage(import("@shikijs/langs/typescript"));
  });

  const compileWithDefaults = async (
    value: string,
    format: "md" | "mdx",
    userRehypePlugins: PluggableList = [],
  ) => {
    const rehypePlugins = createDefaultRehypePlugins(await highlighterPromise, {
      build: { rehypePlugins: userRehypePlugins },
    });
    return String(await compile(value, { format, rehypePlugins }));
  };

  it.each(["md", "mdx"] as const)(
    "keeps code block meta like the title through rehype-raw (.%s)",
    async (format) => {
      const out = await compileWithDefaults(
        '```ts title="hello.ts" {1}\nconst a = 1;\n```\n',
        format,
      );

      expect(out).toContain('title: "hello.ts"');
      // `{1}` line highlighting reads the meta as well
      expect(out).toContain('className: "line highlighted"');
      expect(out).not.toMatch(/zudoku-?code-?meta/i);
    },
  );

  it("still gives raw HTML headings in .md files a slug", async () => {
    const out = await compileWithDefaults("<h2>Raw heading</h2>\n", "md");

    expect(out).toContain('id: "raw-heading"');
  });

  it.each(["md", "mdx"] as const)(
    "leaves math blocks for user rehype plugins like rehype-katex (.%s)",
    async (format) => {
      // Collects what rehype-katex would render: `language-math` code (in a
      // `pre` for display math)
      const mathBlocks: string[] = [];
      const rehypeCollectMath = () => (tree: Root) => {
        visit(tree, "element", (node, _index, parent) => {
          const className = node.properties.className;
          if (
            !Array.isArray(className) ||
            !className.includes("language-math")
          ) {
            return;
          }
          const tagName = parent?.type === "element" ? parent.tagName : "";
          mathBlocks.push(`${tagName}>${node.tagName}: ${hastToString(node)}`);
        });
      };

      await compileWithDefaults("```math\nx^2\n```\n", format, [
        rehypeCollectMath,
      ]);

      expect(mathBlocks).toEqual(["pre>code: x^2\n"]);
    },
  );

  it("compiles JSX images, which have no children after normalization (.mdx)", async () => {
    const out = await compileWithDefaults(
      '<img src="/interstellar.png" alt="Interstellar Freight Ship" />\n',
      "mdx",
    );

    expect(out).toContain('alt: "Interstellar Freight Ship"');
  });

  it("keeps the language class of math blocks without a math plugin", async () => {
    const out = await compileWithDefaults("```math\nx^2\n```\n", "mdx");

    expect(out).toContain('className: "language-math"');
    expect(out).not.toContain('className: ""');
  });
});
