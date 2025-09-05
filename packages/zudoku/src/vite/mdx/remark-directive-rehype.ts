/**
 * Remark plugin to convert directives to HTML-compatible nodes.
 * This is forked from remark-directive-rehype (https://github.com/IGassmann/remark-directive-rehype)
 * with additional validation to handle invalid directives that may be incorrectly parsed.
 *
 * Addresses: https://github.com/remarkjs/remark-directive/issues/19
 */
import { h } from "hastscript";
import type { Directives } from "mdast-util-directive";
import type { Plugin, Transformer } from "unified";
import type { Node } from "unist";
import { type MapFunction, map } from "unist-util-map";

const isDirectiveNode = (node: Node): node is Directives =>
  node.type === "textDirective" ||
  node.type === "leafDirective" ||
  node.type === "containerDirective";

const isValidDirectiveName = (name: string) => {
  if (/^\d/.test(name)) return false;

  return true;
};

const mapDirectiveNode: MapFunction = (node) => {
  if (isDirectiveNode(node)) {
    if (!isValidDirectiveName(node.name)) {
      if (node.type === "textDirective") {
        return { type: "text", value: `:${node.name}` };
      }
      return node;
    }

    const { properties, tagName } = h(node.name, node.attributes || {});

    return {
      ...node,
      data: { hName: tagName, hProperties: properties },
    };
  }

  return node;
};

const transformNodeTree: Transformer = (nodeTree) =>
  map(nodeTree, mapDirectiveNode);

export const remarkDirectiveRehype: Plugin = () => transformNodeTree;
