import rehypeMetaAsAttributes from "@lekoarts/rehype-meta-as-attributes";
import { compile, nodeTypes } from "@mdx-js/mdx";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import type { PluggableList } from "unified";
import { describe, expect, it } from "vitest";

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

describe("rehype-raw ordering relative to the other default rehype plugins", () => {
  // Mirrors plugin-mdx's defaultRehypePlugins order: rehype-raw must run after
  // rehype-meta-as-attributes (and after rehype-slug), not before it, otherwise
  // it re-parses the tree and drops code-block meta before anything reads it.
  // https://github.com/zuplo/zudoku/issues/2809
  const orderedRehypePlugins: PluggableList = [
    rehypeSlug,
    rehypeMetaAsAttributes,
    [rehypeRaw, { passThrough: nodeTypes }],
  ];

  it("keeps a code block's title attribute when rehype-raw runs after rehype-meta-as-attributes", async () => {
    const mdx = `
\`\`\`tsx title="hello.tsx"
console.log("Hello, World!");
\`\`\`
`;
    const out = String(
      await compile(mdx, {
        format: "mdx",
        rehypePlugins: orderedRehypePlugins,
      }),
    );

    expect(out).toContain("hello.tsx");
  });

  it("loses the title attribute when rehype-raw runs before rehype-meta-as-attributes (regression guard)", async () => {
    const mdx = `
\`\`\`tsx title="hello.tsx"
console.log("Hello, World!");
\`\`\`
`;
    const out = String(
      await compile(mdx, {
        format: "mdx",
        rehypePlugins: [
          [rehypeRaw, { passThrough: nodeTypes }],
          rehypeMetaAsAttributes,
        ],
      }),
    );

    expect(out).not.toContain("hello.tsx");
  });

  it("still generates heading slugs with rehype-raw after rehype-slug", async () => {
    const mdx = "# Hello World\n";
    const out = String(
      await compile(mdx, {
        format: "mdx",
        rehypePlugins: orderedRehypePlugins,
      }),
    );

    expect(out).toContain('id: "hello-world"');
  });
});
