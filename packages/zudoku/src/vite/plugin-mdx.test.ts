import { compile, nodeTypes } from "@mdx-js/mdx";
import rehypeRaw from "rehype-raw";
import { describe, expect, it } from "vitest";

// Mirrors how plugin-mdx wires rehype-raw so raw HTML in `.md` files survives.
const rehypePlugins = [[rehypeRaw, { passThrough: nodeTypes }]] as const;

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
