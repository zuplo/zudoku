/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

/**
 * This is a fork of `react-markdown` converted to typescript.
 * The reason we fork it is because react-markdown is comptaible with
 * unified 11, but references the unified 10 and related packages causing
 * type errors and a bunch of extra imports
 *
 * Source: https://github.com/remarkjs/react-markdown/blob/main/index.js
 */

import { unreachable } from "devlop";
import type { Element, ElementContent, Nodes, Parents } from "hast";
import {
  Components as JsxRuntimeComponents,
  toJsxRuntime,
} from "hast-util-to-jsx-runtime";
import { urlAttributes } from "html-url-attributes";
import { ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import remarkParse from "remark-parse";
import remarkRehype, { Options as RemarkRehypeOptions } from "remark-rehype";
import { PluggableList, unified } from "unified";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";

const changelog =
  "https://github.com/remarkjs/react-markdown/blob/main/changelog.md";

const emptyPlugins: PluggableList = [];
const emptyRemarkRehypeOptions: Readonly<RemarkRehypeOptions> = {
  allowDangerousHtml: true,
};
const safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i;

interface Deprecation {
  from: string;
  id: string;
  to?: keyof Options;
}

interface AllowElement {
  (
    element: Readonly<Element>,
    index: number,
    parent: Readonly<Parents> | undefined,
  ): boolean | null | undefined;
}

interface UrlTransform {
  (
    url: string,
    key: string,
    node: Readonly<Element>,
  ): string | null | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Components extends Partial<JsxRuntimeComponents> {}

interface Options {
  allowElement?: AllowElement | null;
  allowedElements?: ReadonlyArray<string> | null;
  children?: string | null;
  className?: string | null;
  components?: Components | null;
  disallowedElements?: ReadonlyArray<string> | null;
  rehypePlugins?: PluggableList | null;
  remarkPlugins?: PluggableList | null;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | null;
  skipHtml?: boolean | null;
  unwrapDisallowed?: boolean | null;
  urlTransform?: UrlTransform | null;
}

const deprecations: ReadonlyArray<Readonly<Deprecation>> = [
  { from: "astPlugins", id: "remove-buggy-html-in-markdown-parser" },
  { from: "allowDangerousHtml", id: "remove-buggy-html-in-markdown-parser" },
  {
    from: "allowNode",
    id: "replace-allownode-allowedtypes-and-disallowedtypes",
    to: "allowElement",
  },
  {
    from: "allowedTypes",
    id: "replace-allownode-allowedtypes-and-disallowedtypes",
    to: "allowedElements",
  },
  {
    from: "disallowedTypes",
    id: "replace-allownode-allowedtypes-and-disallowedtypes",
    to: "disallowedElements",
  },
  { from: "escapeHtml", id: "remove-buggy-html-in-markdown-parser" },
  { from: "includeElementIndex", id: "#remove-includeelementindex" },
  {
    from: "includeNodeIndex",
    id: "change-includenodeindex-to-includeelementindex",
  },
  { from: "linkTarget", id: "remove-linktarget" },
  {
    from: "plugins",
    id: "change-plugins-to-remarkplugins",
    to: "remarkPlugins",
  },
  { from: "rawSourcePos", id: "#remove-rawsourcepos" },
  { from: "renderers", id: "change-renderers-to-components", to: "components" },
  { from: "source", id: "change-source-to-children", to: "children" },
  { from: "sourcePos", id: "#remove-sourcepos" },
  { from: "transformImageUri", id: "#add-urltransform", to: "urlTransform" },
  { from: "transformLinkUri", id: "#add-urltransform", to: "urlTransform" },
];

export function ReactMarkdown(options: Readonly<Options>): ReactElement {
  const allowedElements = options.allowedElements;
  const allowElement = options.allowElement;
  const children = options.children || "";
  const className = options.className;
  const components = options.components;
  const disallowedElements = options.disallowedElements;
  const rehypePlugins = options.rehypePlugins || emptyPlugins;
  const remarkPlugins = options.remarkPlugins || emptyPlugins;
  const remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...options.remarkRehypeOptions, ...emptyRemarkRehypeOptions }
    : emptyRemarkRehypeOptions;
  const skipHtml = options.skipHtml;
  const unwrapDisallowed = options.unwrapDisallowed;
  const urlTransform = options.urlTransform || defaultUrlTransform;

  const processor = unified()
    .use(remarkParse)
    .use(remarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypePlugins);

  const file = new VFile();

  if (typeof children === "string") {
    file.value = children;
  } else {
    unreachable(
      `Unexpected value '${children}' for 'children' prop, expected 'string'`,
    );
  }

  if (allowedElements && disallowedElements) {
    unreachable(
      "Unexpected combined `allowedElements` and `disallowedElements`, expected one or the other",
    );
  }

  for (const deprecation of deprecations) {
    if (Object.prototype.hasOwnProperty.call(options, deprecation.from)) {
      unreachable(
        `Unexpected '${deprecation.from}' prop, ` +
          (deprecation.to ? `use '${deprecation.to}' instead` : "remove it") +
          ` (see <${changelog}#${deprecation.id}> for more info)`,
      );
    }
  }

  const mdastTree = processor.parse(file);
  let hastTree: Nodes = processor.runSync(mdastTree, file);

  if (className) {
    hastTree = {
      type: "element",
      tagName: "div",
      properties: { className },
      children:
        hastTree.type === "root"
          ? (hastTree.children as ElementContent[])
          : [hastTree],
    };
  }

  // Nodes type is slightly off, different versions of `hast` have different types
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  visit(hastTree, transform);

  return toJsxRuntime(hastTree, {
    Fragment,
    components,
    ignoreInvalidStyle: true,
    jsx,
    jsxs,
    passKeys: true,
    passNode: true,
  });

  function transform(
    node: Nodes,
    index: number | null,
    parent: Parents | undefined,
  ): number | void {
    if (node.type === "raw" && parent && typeof index === "number") {
      if (skipHtml) {
        parent.children.splice(index, 1);
      } else {
        parent.children[index] = { type: "text", value: node.value };
      }
      return index;
    }

    if (node.type === "element") {
      for (const key in urlAttributes) {
        if (
          Object.prototype.hasOwnProperty.call(urlAttributes, key) &&
          Object.prototype.hasOwnProperty.call(node.properties, key)
        ) {
          const value = node.properties[key];
          const test = urlAttributes[key];
          if (
            test === null ||
            test === undefined ||
            test.includes(node.tagName)
          ) {
            node.properties[key] = urlTransform(String(value || ""), key, node);
          }
        }
      }

      let remove = allowedElements
        ? !allowedElements.includes(node.tagName)
        : disallowedElements
          ? disallowedElements.includes(node.tagName)
          : false;

      if (!remove && allowElement && typeof index === "number") {
        remove = !allowElement(node, index, parent);
      }

      if (remove && parent && typeof index === "number") {
        if (unwrapDisallowed && node.children) {
          parent.children.splice(index, 1, ...node.children);
        } else {
          parent.children.splice(index, 1);
        }
        return index;
      }
    }
  }
}

function defaultUrlTransform(value: string): string {
  const colon = value.indexOf(":");
  const questionMark = value.indexOf("?");
  const numberSign = value.indexOf("#");
  const slash = value.indexOf("/");

  if (
    colon < 0 ||
    (slash > -1 && colon > slash) ||
    (questionMark > -1 && colon > questionMark) ||
    (numberSign > -1 && colon > numberSign) ||
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value;
  }

  return "";
}
