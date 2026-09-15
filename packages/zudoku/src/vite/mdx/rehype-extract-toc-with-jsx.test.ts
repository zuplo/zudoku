import { compile, nodeTypes } from "@mdx-js/mdx";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { describe, expect, it } from "vitest";
import rehypeExtractTocWithJsx, {
  type Toc,
  type TocEntry,
} from "./rehype-extract-toc-with-jsx.js";

// Mirrors the plugins `plugin-mdx` puts around the toc extractor.
const compileMdx = async (mdx: string) =>
  await compile(mdx, {
    format: "mdx",
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
    rehypePlugins: [
      [rehypeRaw, { passThrough: nodeTypes }],
      rehypeSlug,
      rehypeExtractTocWithJsx,
    ],
  });

const getToc = async (mdx: string): Promise<Toc> =>
  (await compileMdx(mdx)).data.toc ?? [];

/** Flattens to `depth:text` lines so nesting is readable in assertions. */
const outline = (entries: TocEntry[]): string[] =>
  entries.flatMap((entry) => [
    `${entry.depth}:${entry.text}`,
    ...outline(entry.children ?? []),
  ]);

const STEPS = `1. **Prepare Your Cargo**

   Vacuum-seal everything before it leaves the dock.

1. **Book Your Shipment**

   \`\`\`js
   await cosmocargo.shipments.create({ origin: "Earth" });
   \`\`\`

1. **Track the Freighter**

   Watch it cross the belt in real time.`;

describe("stepper steps in the table of contents", () => {
  it("places steps one level below the heading they follow", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper>

${STEPS}

</Stepper>
`);

    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "2:Prepare Your Cargo",
      "2:Book Your Shipment",
      "2:Track the Freighter",
    ]);
  });

  it("nests steps under an h2 as sub-items", async () => {
    const toc = await getToc(`# Shipping Process

## Booking a Freighter

<Stepper>

${STEPS}

</Stepper>

## After Launch

Nothing to do.
`);

    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "2:Booking a Freighter",
      "3:Prepare Your Cargo",
      "3:Book Your Shipment",
      "3:Track the Freighter",
      "2:After Launch",
    ]);
  });

  it("puts steps under an h3 too deep to render", async () => {
    const toc = await getToc(`# Shipping Process

## Booking a Freighter

### Manifest Details

<Stepper>

${STEPS}

</Stepper>
`);

    // Depth 4 is the same cut-off an `h4` hits — the toc renders two levels.
    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "2:Booking a Freighter",
      "3:Manifest Details",
      "4:Prepare Your Cargo",
      "4:Book Your Shipment",
      "4:Track the Freighter",
    ]);
  });

  it("sits beside top-level headings when no heading precedes it", async () => {
    const toc = await getToc(`<Stepper>

${STEPS}

</Stepper>

## Troubleshooting

Check the manifest.
`);

    expect(outline(toc)).toEqual([
      "2:Prepare Your Cargo",
      "2:Book Your Shipment",
      "2:Track the Freighter",
      "2:Troubleshooting",
    ]);
  });

  it("omits steps when the stepper opts out", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper toc={false}>

${STEPS}

</Stepper>

## Troubleshooting
`);

    expect(outline(toc)).toEqual(["1:Shipping Process", "2:Troubleshooting"]);
  });

  it("keeps steps for a bare `toc` and for `toc={true}`", async () => {
    for (const attribute of ["toc", "toc={true}"]) {
      const toc = await getToc(`# Shipping Process

<Stepper ${attribute}>

1. **Prepare Your Cargo**

   Vacuum-seal everything.

</Stepper>
`);

      expect(outline(toc)).toEqual([
        "1:Shipping Process",
        "2:Prepare Your Cargo",
      ]);
    }
  });

  it("anchors each step and avoids ids already used by headings", async () => {
    const toc = await getToc(`# Shipping Process

## Prepare Your Cargo

<Stepper>

1. **Prepare Your Cargo**

   Vacuum-seal everything.

1. **Book Your Shipment**

   Pick a lane.

</Stepper>
`);

    const steps = toc[0]?.children?.[0]?.children ?? [];

    expect(steps.map((step) => step.id)).toEqual([
      "prepare-your-cargo-2",
      "book-your-shipment",
    ]);
  });

  it("drops the bold wrapper around a step title", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper>

1. **Prepare Your Cargo**

   Vacuum-seal everything.

</Stepper>
`);

    const [step] = toc[0]?.children ?? [];

    expect(step?.text).toBe("Prepare Your Cargo");
    expect(step?.rich).toBeUndefined();
  });

  it("keeps rich content such as inline code in a step title", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper>

1. Run \`cosmocargo init\`

   It scaffolds the manifest.

</Stepper>
`);

    const [step] = toc[0]?.children ?? [];

    expect(step?.text).toBe("Run cosmocargo init");
    expect(step?.rich).toBeDefined();
  });

  it("uses only the title of a step, not its body", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper>

1. **Prepare Your Cargo**

   This body copy must not leak into the table of contents.
   - Vacuum-sealed packaging
   - Radiation shielding

</Stepper>
`);

    const [step] = toc[0]?.children ?? [];

    expect(step?.text).toBe("Prepare Your Cargo");
  });

  it("supports tight lists, where the title is inline on the item", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper>
1. Prepare Your Cargo
1. Book Your Shipment
</Stepper>
`);

    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "2:Prepare Your Cargo",
      "2:Book Your Shipment",
    ]);
  });

  it("skips a step with no usable title", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper>

1. \`\`\`sh
   pnpm deploy
   \`\`\`

1. **Track the Freighter**

   Watch it cross the belt.

</Stepper>
`);

    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "2:Track the Freighter",
    ]);
  });

  it("keeps every step of one stepper at the same depth", async () => {
    const toc = await getToc(`# Shipping Process

<Stepper>

1. **Prepare Your Cargo**

   ### A heading buried in a step

   Vacuum-seal everything.

1. **Book Your Shipment**

   Pick a lane.

</Stepper>
`);

    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "2:Prepare Your Cargo",
      "3:A heading buried in a step",
      "2:Book Your Shipment",
    ]);
  });

  it("pins the depth even when the first step is skipped", async () => {
    // The skipped step buries a heading, which must not push the titled steps
    // that follow it past the depth the toc renders.
    const toc = await getToc(`# Shipping Process

<Stepper>

1. \`\`\`sh
   pnpm deploy
   \`\`\`

   ### A heading buried in a skipped step

1. **Book Your Shipment**

   Pick a lane.

</Stepper>
`);

    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "3:A heading buried in a skipped step",
      "2:Book Your Shipment",
    ]);
  });

  it("does not reuse the id the frontmatter title will claim", async () => {
    // `MdxPage` renders the frontmatter title as an `h1` with a slugified id,
    // which never appears in this tree.
    const toc = await getToc(`---
title: Prepare Your Cargo
---

<Stepper>

1. **Prepare Your Cargo**

   Vacuum-seal everything.

</Stepper>
`);

    const [step] = toc;

    expect(step?.text).toBe("Prepare Your Cargo");
    expect(step?.id).toBe("prepare-your-cargo-2");
  });
});

describe("stepper anchors in the compiled output", () => {
  const compileToJs = async (mdx: string) => String(await compileMdx(mdx));

  it("marks the steps the toc renders so Stepper can track them", async () => {
    const out = await compileToJs(`# Shipping Process

<Stepper>

1. **Prepare Your Cargo**

   Vacuum-seal everything.

</Stepper>
`);

    expect(out).toContain('id: "prepare-your-cargo"');
    expect(out).toContain('"data-toc-anchor"');
  });

  it("leaves steps too deep for the toc linkable but unmarked", async () => {
    const out = await compileToJs(`# Shipping Process

## Booking a Freighter

### Manifest Details

<Stepper>

1. **Prepare Your Cargo**

   Vacuum-seal everything.

</Stepper>
`);

    expect(out).toContain('id: "prepare-your-cargo"');
    expect(out).not.toContain("data-toc-anchor");
  });

  it("leaves documents without a stepper untouched", async () => {
    const toc = await getToc(`# Shipping Process

## Booking a Freighter

1. Not a step
1. Also not a step

### Manifest Details
`);

    expect(outline(toc)).toEqual([
      "1:Shipping Process",
      "2:Booking a Freighter",
      "3:Manifest Details",
    ]);
  });
});
