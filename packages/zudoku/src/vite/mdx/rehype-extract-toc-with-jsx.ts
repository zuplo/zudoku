import type { Element, Root, RootContent } from "hast";
import { headingRank } from "hast-util-heading-rank";
import { toString as hastToString } from "hast-util-to-string";
import type { MdxjsEsm } from "mdast-util-mdx";
import type { MdxJsxFlowElementHast } from "mdast-util-mdx-jsx";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { slugify } from "../../lib/util/slugify.js";

export type TocEntry = {
  depth: number;
  text: string;
  id?: string;
  children?: TocEntry[];
  /** Rich AST nodes for rendering (includes JSX components) */
  rich?: RootContent[];
};

export type Toc = TocEntry[];

declare module "vfile" {
  interface DataMap {
    toc: Toc;
  }
}

/** Tags that end a step's title and start its body. */
const BLOCK_TAGS = new Set([
  "blockquote",
  "details",
  "div",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "iframe",
  "img",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
  "video",
]);

/** Inline wrappers that carry no meaning once a step title is in the toc. */
const EMPHASIS_TAGS = new Set(["b", "em", "i", "strong"]);

/**
 * `TocContent` renders two levels, so entries deeper than this are extracted
 * but never shown — the cut-off `h4` headings already hit.
 */
const MAX_RENDERED_DEPTH = 3;

/**
 * Marks the step anchors the toc actually renders, so `Stepper` observes only
 * those. Deeper steps keep their id and stay linkable, but tracking them would
 * set an `activeAnchor` with no toc entry and blank out the highlight — the
 * same reason `MdxPage` registers only `h2` and `h3` as navigation anchors.
 */
const TOC_ANCHOR_PROPERTY = "dataTocAnchor";

type StepTitle = { owner: Element; nodes: RootContent[] };

type Step = {
  /** The `<Stepper>` this step belongs to, so all its steps share a depth. */
  stepper: MdxJsxFlowElementHast;
  text: string;
  id: string;
  rich?: RootContent[];
};

/**
 * Steps opt out with `<Stepper toc={false}>`. Anything else — including a bare
 * `toc` and `toc={true}` — keeps them in the table of contents.
 */
const isTocEnabled = (node: MdxJsxFlowElementHast) => {
  const attribute = node.attributes.find(
    (attr) => attr.type === "mdxJsxAttribute" && attr.name === "toc",
  );

  if (attribute?.type !== "mdxJsxAttribute") return true;
  if (attribute.value == null) return true;

  const value =
    typeof attribute.value === "string"
      ? attribute.value
      : attribute.value.value;

  return value.trim() !== "false";
};

const unwrapEmphasis = (nodes: RootContent[]): RootContent[] => {
  let current = nodes;

  while (current.length === 1) {
    const [only] = current;
    if (only?.type !== "element" || !EMPHASIS_TAGS.has(only.tagName)) break;
    current = only.children;
  }

  return current;
};

/**
 * The leading inline content of a step, plus the element the anchor belongs on.
 *
 * Loose list items wrap their title in a paragraph, so the anchor goes there:
 * a step can be arbitrarily tall, and the viewport observer only reliably
 * activates short elements. Tight list items are inline-only (and therefore
 * short), so they anchor on the `<li>` itself.
 */
const getStepTitle = (item: Element): StepTitle | undefined => {
  const children = item.children.filter(
    (child) => !(child.type === "text" && child.value.trim() === ""),
  );
  const [first] = children;
  if (!first) return;

  if (first.type === "element" && first.tagName === "p") {
    return { owner: first, nodes: unwrapEmphasis(first.children) };
  }

  const bodyStart = children.findIndex(
    (child) => child.type === "element" && BLOCK_TAGS.has(child.tagName),
  );
  const nodes = bodyStart === -1 ? children : children.slice(0, bodyStart);

  return nodes.length > 0
    ? { owner: item, nodes: unwrapEmphasis(nodes) }
    : undefined;
};

/**
 * The frontmatter `title` never reaches this tree, but `MdxPage` renders it as
 * an `h1` with a slugified id. Without reserving that slug a step sharing the
 * page title produces a duplicate id, and both the anchor link and the viewport
 * observer resolve to the heading instead of the step.
 */
const getFrontmatterTitle = (tree: Root): string | undefined => {
  let title: string | undefined;

  visit(tree, "mdxjsEsm", (node: MdxjsEsm) => {
    for (const statement of node.data?.estree?.body ?? []) {
      if (
        statement.type !== "ExportNamedDeclaration" ||
        statement.declaration?.type !== "VariableDeclaration"
      ) {
        continue;
      }

      for (const declarator of statement.declaration.declarations) {
        if (
          declarator.id.type !== "Identifier" ||
          declarator.id.name !== "frontmatter" ||
          declarator.init?.type !== "ObjectExpression"
        ) {
          continue;
        }

        for (const property of declarator.init.properties) {
          if (property.type !== "Property") continue;

          const key =
            property.key.type === "Identifier"
              ? property.key.name
              : property.key.type === "Literal"
                ? String(property.key.value)
                : undefined;

          if (
            key === "title" &&
            property.value.type === "Literal" &&
            typeof property.value.value === "string"
          ) {
            title = property.value.value;
          }
        }
      }
    }
  });

  return title;
};

/** Slugs step anchors without colliding with ids already in the document. */
const createIdFactory = (tree: Root) => {
  const used = new Set<string>();

  const frontmatterTitle = getFrontmatterTitle(tree);
  if (frontmatterTitle) used.add(slugify(frontmatterTitle));

  visit(tree, "element", (node: Element) => {
    if (node.properties?.id) used.add(String(node.properties.id));
  });

  return (text: string) => {
    const base = slugify(text) || "step";
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    return id;
  };
};

/**
 * Assigns anchor ids to `<Stepper>` steps and indexes them by the element that
 * carries the anchor, so the document-order pass below can place them.
 */
const collectSteps = (tree: Root) => {
  const steppers: MdxJsxFlowElementHast[] = [];

  visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElementHast) => {
    if (node.name === "Stepper" && isTocEnabled(node)) steppers.push(node);
  });

  const steps = new Map<Element, Step>();
  /** Each stepper's list, so depth can be pinned at the list's own position. */
  const lists = new Map<Element, MdxJsxFlowElementHast>();
  if (steppers.length === 0) return { steps, lists };

  const nextId = createIdFactory(tree);

  for (const stepper of steppers) {
    const items = stepper.children.flatMap((list) => {
      if (list.type !== "element" || list.tagName !== "ol") return [];
      lists.set(list, stepper);
      return list.children;
    });

    for (const item of items) {
      if (item.type !== "element" || item.tagName !== "li") continue;

      const title = getStepTitle(item);
      if (!title) continue;

      const text = title.nodes
        .map((node) => hastToString(node))
        .join("")
        .trim();
      if (!text) continue;

      title.owner.properties ??= {};
      title.owner.properties.id ??= nextId(text);

      steps.set(title.owner, {
        stepper,
        text,
        id: String(title.owner.properties.id),
        ...(title.nodes.some((node) => node.type !== "text")
          ? { rich: title.nodes }
          : {}),
      });
    }
  }

  return { steps, lists };
};

const rehypeExtractTocWithJsx: Plugin<[], Root> = () => (tree, vfile) => {
  const { steps, lists } = collectSteps(tree);
  const headings: TocEntry[] = [];

  // Steps nest one level below the heading they follow, so a stepper under an
  // `h2` renders as sub-items and one under an `h3` ends up too deep to render
  // — the same cut-off an `h4` already hits. Steps before any heading sit at
  // depth 2, alongside the headings under the page title.
  let headingDepth = 1;
  const stepperDepths = new Map<MdxJsxFlowElementHast, number>();

  visit(tree, "element", (node: Element) => {
    const level = headingRank(node);

    if (!level) {
      // Pinned at the list itself, so neither a skipped step nor a heading
      // buried in a step body can shift the rest of the stepper deeper.
      const stepper = lists.get(node);
      if (stepper) {
        if (!stepperDepths.has(stepper)) {
          stepperDepths.set(stepper, headingDepth + 1);
        }
        return;
      }

      const step = steps.get(node);
      if (!step) return;

      const depth = stepperDepths.get(step.stepper) ?? headingDepth + 1;

      if (depth <= MAX_RENDERED_DEPTH) {
        node.properties ??= {};
        node.properties[TOC_ANCHOR_PROPERTY] = "";
      }

      headings.push({
        depth,
        text: step.text,
        id: step.id,
        ...(step.rich ? { rich: step.rich } : {}),
      });
      return;
    }

    headingDepth = level;

    const richChildren = node.children as RootContent[];
    const hasRichContent = richChildren.some((child) => child.type !== "text");

    const heading: TocEntry = {
      depth: level,
      text: hastToString(node),
      ...(hasRichContent ? { rich: richChildren } : {}),
    };

    if (node.properties?.id) {
      heading.id = String(node.properties.id);
    }

    headings.push(heading);
  });

  vfile.data.toc = createTree(headings);
};

const createTree = (headings: TocEntry[]): Toc => {
  const root: TocEntry = { depth: 0, text: "", children: [] };
  const stack: TocEntry[] = [root];

  for (const heading of headings) {
    // biome-ignore lint/style/noNonNullAssertion: We check the length of the stack before
    while (stack.length > 1 && stack.at(-1)!.depth >= heading.depth) {
      stack.pop();
    }

    const parent = stack.at(-1) ?? root;
    parent.children ??= [];
    parent.children.push(heading);
    stack.push(heading);
  }

  return root.children ?? [];
};

export default rehypeExtractTocWithJsx;
