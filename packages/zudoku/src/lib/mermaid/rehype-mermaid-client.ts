/**
 * Lightweight rehype plugin for client-side mermaid rendering.
 *
 * This plugin transforms mermaid code blocks from the standard markdown format:
 *   <pre><code class="language-mermaid">...</code></pre>
 *
 * Into the format that mermaid.js expects in the browser:
 *   <pre class="mermaid">...</pre>
 *
 * This plugin has ZERO dependencies and does NOT require playwright.
 * It's specifically designed for client-side rendering where mermaid.js
 * runs in the browser.
 */

import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

export interface RehypeMermaidClientOptions {
  /**
   * CSS class to add to the pre element (default: "mermaid")
   */
  className?: string;
}

/**
 * Helper to recursively extract all text from a node's descendants.
 * This handles cases where Shiki may have added syntax highlighting spans.
 */
// biome-ignore lint/suspicious/noExplicitAny: Recursive tree traversal requires flexible typing
const extractText = (n: any): string => {
  if (!n) return "";
  if (!n.children) return "";

  let out = "";
  for (const child of n.children) {
    if (child.type === "text") {
      out += String(child.value ?? "");
    } else if (child.children) {
      out += extractText(child);
    }
  }
  return out;
};

/**
 * A lightweight rehype plugin for preparing mermaid diagrams for client-side rendering.
 *
 * Transforms <code class="language-mermaid"> blocks into <pre class="mermaid"> blocks
 * that mermaid.js can process in the browser.
 *
 * @param options - Configuration options
 * @returns Rehype transformer function
 */
export default function rehypeMermaidClient(
  options: RehypeMermaidClientOptions = {},
) {
  const className = options.className ?? "mermaid";

  return (tree: Root) => {
    visit(tree, "element", (node: Element, _index, parent) => {
      if (node.tagName !== "code") return;

      // Check both className (array) and class (string) - Shiki may convert between them
      const classValue =
        node.properties?.className || node.properties?.class || "";
      const classes = Array.isArray(classValue)
        ? classValue
        : typeof classValue === "string"
          ? classValue.split(" ").filter(Boolean)
          : [];

      const hasMermaidClass = classes.some(
        (c: string | number) =>
          typeof c === "string" &&
          (c === "language-mermaid" || c === "lang-mermaid" || c === "mermaid"),
      );

      if (!hasMermaidClass) {
        return;
      }

      if (!parent || parent.type !== "element" || parent.tagName !== "pre") {
        return;
      }

      const diagramCode = extractText(node);

      if (!diagramCode.trim()) {
        return;
      }

      const preEl = parent as Element;

      preEl.tagName = "pre";
      preEl.properties = preEl.properties || {};
      preEl.properties.className = [className];
      preEl.children = [
        {
          type: "text",
          value: diagramCode,
          // biome-ignore lint/suspicious/noExplicitAny: HAST text node type assertion
        } as any,
      ];
    });
  };
}
