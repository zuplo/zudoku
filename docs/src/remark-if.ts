import type { Parent, Root } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
import type { Plugin } from "unified";
import type { Node } from "unist";
import { SKIP, visit } from "unist-util-visit";

interface RemarkIfOptions {
  /**
   * The current mode to use for filtering content.
   * Content with a different mode will be removed.
   */
  mode?: string;
}

interface DirectiveNode extends ContainerDirective {
  attributes?: {
    mode?: string;
  };
}

/**
 * A remark plugin that filters out content based on the mode attribute.
 *
 * Syntax: `::if{mode=opensource}...content...::`
 *
 * If the mode matches the configured mode, the content is kept (but the directive wrapper is removed).
 * If the mode doesn't match, the entire directive and its content is removed.
 *
 * @example
 * ```ts
 * import { remarkIf } from './remark-if.js';
 *
 * export default {
 *   // cSpell:ignore opensource
 *   remarkPlugins: [[remarkIf, { mode: 'opensource' }]],
 * };
 * ```
 */
export const remarkIf: Plugin<[RemarkIfOptions?], Root> = (options = {}) => {
  return (tree: Root) => {
    visit(tree, (node: Node, index?: number, parent?: Parent) => {
      // Handle both containerDirective (:::) and leafDirective (::) with name "if"
      if (
        (node.type !== "containerDirective" && node.type !== "leafDirective") ||
        (node as DirectiveNode).name !== "if" ||
        parent == null ||
        index == null
      ) {
        return;
      }

      const directive = node as DirectiveNode;

      // Get the mode attribute from the directive
      const modeAttribute = directive.attributes?.mode;

      // Find the closing "::" marker (for leafDirective) or handle containerDirective
      const isLeafDirective = node.type === "leafDirective";
      let closingIndex = -1;

      if (isLeafDirective) {
        // For leaf directives, find the paragraph containing only "::"
        for (let i = index + 1; i < parent.children.length; i++) {
          const nextNode = parent.children[i];
          if (nextNode.type !== "paragraph" || !("children" in nextNode)) {
            continue;
          }
          const firstChild = nextNode.children?.[0];
          if (
            nextNode.children?.length === 1 &&
            firstChild &&
            firstChild.type === "text" &&
            "value" in firstChild &&
            typeof firstChild.value === "string" &&
            firstChild.value.trim() === "::"
          ) {
            closingIndex = i;
            break;
          }
        }

        // Fail if no closing "::" was found for leaf directive
        if (closingIndex === -1) {
          const position = directive.position
            ? ` at line ${directive.position.start.line}`
            : "";
          throw new Error(
            `Unclosed ::if directive${position}. Leaf directives (::if) must be closed with a matching "::".`,
          );
        }
      }

      if (!modeAttribute) {
        // If no mode attribute, keep the content but remove the directive wrapper
        if (isLeafDirective && closingIndex > -1) {
          // Remove the closing "::" and the directive, keep content in between
          parent.children.splice(closingIndex, 1);
          parent.children.splice(index, 1);
          return [SKIP, index];
        } else if (directive.children && directive.children.length > 0) {
          parent.children.splice(index, 1, ...directive.children);
          return [SKIP, index];
        } else {
          parent.children.splice(index, 1);
          return [SKIP, index];
        }
      }

      // If the mode matches, keep the content but remove the directive wrapper and closing "::"
      if (modeAttribute === options.mode) {
        if (isLeafDirective && closingIndex > -1) {
          // Remove the closing "::" and the directive, keep content in between
          parent.children.splice(closingIndex, 1);
          parent.children.splice(index, 1);
          return [SKIP, index];
        } else if (directive.children && directive.children.length > 0) {
          parent.children.splice(index, 1, ...directive.children);
          return [SKIP, index];
        } else {
          parent.children.splice(index, 1);
          return [SKIP, index];
        }
      }

      // If the mode doesn't match, remove the directive and all content until the closing "::"
      if (isLeafDirective && closingIndex > -1) {
        // Remove from directive to closing "::" (inclusive)
        parent.children.splice(index, closingIndex - index + 1);
      } else {
        // For container directives or when no closing found, just remove the directive
        parent.children.splice(index, 1);
      }
      return [SKIP, index];
    });
  };
};
