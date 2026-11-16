import type { Plugin } from "vite";
import { clearProtectedRegistry, registerProtectedScope } from "./registry.js";

// biome-ignore lint/suspicious/noExplicitAny: working against a loose ESTree shape
type AstNode = any;

type Shadowed = ReadonlySet<string>;

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

// Names bound by a declaration pattern (`a`, `{ a, b: [c] }`, `...d`, `e = 1`).
const patternNames = (pattern: AstNode): string[] => {
  switch (pattern?.type) {
    case "Identifier":
      return [pattern.name];
    case "AssignmentPattern":
      return patternNames(pattern.left);
    case "RestElement":
      return patternNames(pattern.argument);
    case "ArrayPattern":
      return (pattern.elements ?? []).flatMap(patternNames);
    case "ObjectPattern":
      return (pattern.properties ?? []).flatMap((prop: AstNode) =>
        patternNames(prop.type === "RestElement" ? prop : prop.value),
      );
    default:
      return [];
  }
};

const declaredNames = (statement: AstNode): string[] => {
  if (statement?.type === "VariableDeclaration") {
    return (statement.declarations ?? []).flatMap((declaration: AstNode) =>
      patternNames(declaration.id),
    );
  }
  if (
    (statement?.type === "FunctionDeclaration" ||
      statement?.type === "ClassDeclaration") &&
    statement.id
  ) {
    return [statement.id.name];
  }
  return [];
};

// Names a node binds for its own subtree. Program-level declarations are the
// registries themselves, so only nested scopes shadow them. `var` is treated
// as block-scoped: missing a hoisted shadow only keeps the previous behavior.
const scopeNames = (node: AstNode): string[] => {
  if (FUNCTION_TYPES.has(node.type)) {
    return [
      ...(node.params ?? []).flatMap(patternNames),
      ...(node.type === "FunctionExpression" && node.id ? [node.id.name] : []),
    ];
  }
  switch (node.type) {
    case "BlockStatement":
    case "StaticBlock":
      return (node.body ?? []).flatMap(declaredNames);
    case "CatchClause":
      return patternNames(node.param);
    case "ForStatement":
      return declaredNames(node.init);
    case "ForInStatement":
    case "ForOfStatement":
      return declaredNames(node.left);
    case "ClassExpression":
      return node.id ? [node.id.name] : [];
    default:
      return [];
  }
};

// Minimal ESTree walker. Visits every node; skips position fields. Tracks
// the names bound by enclosing nested scopes, so a local or parameter with the
// same name as a top-level registry is not mistaken for a reference to it.
const walk = (
  node: AstNode,
  visit: (n: AstNode, shadowed: Shadowed) => void,
  shadowed: Shadowed = new Set(),
) => {
  if (!node || typeof node !== "object") return;
  let inner = shadowed;
  if (typeof node.type === "string") {
    visit(node, shadowed);
    const names = scopeNames(node);
    if (names.length > 0) inner = new Set([...shadowed, ...names]);
  }
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") {
      continue;
    }
    const val = node[key];
    if (Array.isArray(val)) {
      for (const v of val) walk(v, visit, inner);
    } else if (val && typeof val === "object") {
      walk(val, visit, inner);
    }
  }
};

const literalString = (node: AstNode): string | undefined =>
  node?.type === "Literal" && typeof node.value === "string"
    ? node.value
    : undefined;

const propKey = (prop: AstNode): string | undefined =>
  prop.key?.type === "Identifier" ? prop.key.name : literalString(prop.key);

type ObjectBindings = ReadonlyMap<string, AstNode>;

const collectTopLevelObjectBindings = (ast: AstNode): ObjectBindings =>
  new Map(
    (ast.body ?? []).flatMap((statement: AstNode) => {
      if (statement.type !== "VariableDeclaration") return [];

      return (statement.declarations ?? []).flatMap((declaration: AstNode) =>
        declaration.id?.type === "Identifier" &&
        declaration.init?.type === "ObjectExpression"
          ? [[declaration.id.name, declaration.init] as const]
          : [],
      );
    }),
  );

// All dynamic-import specifiers found anywhere inside a subtree. Follow
// top-level object bindings so generated route objects can share a loader
// registry without losing their route-to-import association.
//
// Only identifiers in *value* position resolve to a binding. `walk` is not
// parent-aware, so property keys (`{ admin: false }`), member
// properties (`layouts.admin`), and parameter names (`(admin) => ...`) all
// arrive as plain `Identifier` nodes; treating those as references would
// attribute an unrelated registry's imports to this route. Likewise a value
// whose name is rebound by an enclosing function or block is not a reference.
const collectImportSpecs = (
  node: AstNode,
  objectBindings: ObjectBindings,
  shadowed: Shadowed,
  visitedBindings = new Set<string>(),
): string[] => {
  const out: string[] = [];
  const referenced: AstNode[] = [];

  const considerReference = (candidate: AstNode, scope: Shadowed) => {
    if (candidate?.type !== "Identifier") return;
    if (scope.has(candidate.name)) return;
    if (visitedBindings.has(candidate.name)) return;
    const binding = objectBindings.get(candidate.name);
    if (!binding) return;

    visitedBindings.add(candidate.name);
    referenced.push(binding);
  };

  // A shared registry reaches a route either as the sibling value itself
  // (`{ path, schemaImports }`) or as a nested property value.
  considerReference(node, shadowed);

  walk(
    node,
    (n, scope) => {
      if (n.type === "ImportExpression") {
        const spec = literalString(n.source);
        if (spec) out.push(spec);
        return;
      }

      if (n.type === "Property") considerReference(n.value, scope);
    },
    shadowed,
  );

  // A registry is a top-level object, so nothing outside it shadows its body.
  for (const binding of referenced) {
    out.push(
      ...collectImportSpecs(
        binding,
        objectBindings,
        new Set(),
        visitedBindings,
      ),
    );
  }
  return out;
};

// Shape A: `{path: "/X", ...}` with any nested dynamic imports. Covers
// RR route objects and plugin-api's `openApiPlugin({path, schemaImports})`.
export const matchPathObject = (
  node: AstNode,
  objectBindings: ObjectBindings = new Map(),
  shadowed: Shadowed = new Set(),
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
  const specs = siblingValues.flatMap((value) =>
    collectImportSpecs(value, objectBindings, shadowed),
  );
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

export const findRouteImports = (
  ast: AstNode,
): Array<{ spec: string; root: string }> => {
  const tasks: Array<{ spec: string; root: string }> = [];
  const objectBindings = collectTopLevelObjectBindings(ast);
  walk(ast, (node, shadowed) => {
    const a = matchPathObject(node, objectBindings, shadowed);
    if (a) for (const spec of a.specs) tasks.push({ spec, root: a.root });
    const b = matchRouteDict(node);
    if (b) for (const { spec, root } of b) tasks.push({ spec, root });
  });
  return tasks;
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

    for (const { spec, root } of findRouteImports(ast)) {
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
