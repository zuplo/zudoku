import type { Plugin } from "vite";
import { clearProtectedRegistry, registerProtectedScope } from "./registry.js";

// Minimal ESTree walker. Visits every node; skips position fields.
// biome-ignore lint/suspicious/noExplicitAny: working against a loose ESTree shape
type AstNode = any;

const walk = (node: AstNode, visit: (n: AstNode) => void) => {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visit(node);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") {
      continue;
    }
    const val = node[key];
    if (Array.isArray(val)) {
      for (const v of val) walk(v, visit);
    } else if (val && typeof val === "object") {
      walk(val, visit);
    }
  }
};

const literalString = (node: AstNode): string | undefined =>
  node?.type === "Literal" && typeof node.value === "string"
    ? node.value
    : undefined;

const propKey = (prop: AstNode): string | undefined =>
  prop.key?.type === "Identifier" ? prop.key.name : literalString(prop.key);

// All dynamic-import specifiers found anywhere inside a subtree.
const collectImportSpecs = (node: AstNode): string[] => {
  const out: string[] = [];
  walk(node, (n) => {
    if (n.type === "ImportExpression") {
      const spec = literalString(n.source);
      if (spec) out.push(spec);
    }
  });
  return out;
};

// Shape A: `{path: "/X", ...}` with any nested dynamic imports. Covers
// RR route objects and plugin-api's `openApiPlugin({path, schemaImports})`.
export const matchPathObject = (
  node: AstNode,
): { root: string; specs: string[] } | undefined => {
  if (node.type !== "ObjectExpression") return;
  let root: string | undefined;
  const siblingValues: AstNode[] = [];
  for (const prop of node.properties ?? []) {
    if (prop.type !== "Property") continue;
    const name = propKey(prop);
    const strValue = literalString(prop.value);
    if (name === "path" && strValue) root = strValue;
    else siblingValues.push(prop.value);
  }
  if (!root) return;
  const specs = siblingValues.flatMap(collectImportSpecs);
  if (specs.length === 0) return;
  return { root, specs };
};

// Shape B: `{ "/foo": () => import(...), ... }`. Keys must be path-like
// (leading `/`, no `.`) to avoid matching file-path dicts.
export const matchRouteDict = (
  node: AstNode,
): Array<{ root: string; spec: string }> | undefined => {
  if (node.type !== "ObjectExpression") return;
  const props = node.properties ?? [];
  if (props.length === 0) return;
  const pairs: Array<{ root: string; spec: string }> = [];
  for (const prop of props) {
    if (prop.type !== "Property") return;
    const key = literalString(prop.key);
    if (!key?.startsWith("/") || key.includes(".")) return;
    if (
      prop.value?.type !== "ArrowFunctionExpression" ||
      prop.value.body?.type !== "ImportExpression"
    ) {
      return;
    }
    const spec = literalString(prop.value.body.source);
    if (!spec) return;
    pairs.push({ root: key, spec });
  }
  return pairs;
};

// Auto-registers route-shaped dynamic imports. Covers plugin-docs,
// plugin-api, and user custom pages without plugin-side changes.
export const protectedAnnotatorPlugin = (): Plugin => ({
  name: "zudoku:protected-annotator",
  buildStart() {
    clearProtectedRegistry();
  },
  async transform(code, id) {
    if (id.includes("/node_modules/")) return;
    if (!code.includes("import(")) return;

    let ast: AstNode;
    try {
      ast = this.parse(code);
    } catch (err) {
      // Parse failure leaves this module unregistered, so any protected
      // dynamic imports inside it would ship ungated. Warn loudly.
      this.warn(
        `protected-annotator: failed to parse ${id}: ${err instanceof Error ? err.message : String(err)}. Protected gating will NOT apply to this module.`,
      );
      return;
    }

    const tasks: Array<{ spec: string; root: string }> = [];
    walk(ast, (node) => {
      const a = matchPathObject(node);
      if (a) for (const spec of a.specs) tasks.push({ spec, root: a.root });
      const b = matchRouteDict(node);
      if (b) for (const { spec, root } of b) tasks.push({ spec, root });
    });

    for (const { spec, root } of tasks) {
      const resolved = await this.resolve(spec, id);
      if (!resolved || resolved.external) {
        this.warn(
          `Route-shaped import "${spec}" in ${id} did not resolve to a first-party module; protected gating will not apply.`,
        );
        continue;
      }
      registerProtectedScope(resolved.id.split("?")[0] ?? resolved.id, {
        type: "subtree",
        root,
      });
    }
  },
});
