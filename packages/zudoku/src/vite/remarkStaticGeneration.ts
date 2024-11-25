import { type ImportDeclaration, Program } from "estree";
import { valueToEstree } from "estree-util-value-to-estree";
import { Root } from "mdast";
import type { MdxjsEsm } from "mdast-util-mdx";
import vm, { type Context as VmContext } from "node:vm";
import { SKIP, visit } from "unist-util-visit";
import { VFile } from "vfile";

const FUNCTION_NAME = "generateStaticData";
const VARIABLE_NAME = "STATIC_DATA";

const isStaticExport = (program: Program) => {
  for (const node of program.body) {
    if (node.type === "ExportNamedDeclaration" && node.declaration) {
      const decl = node.declaration;
      if (decl.type === "VariableDeclaration") {
        // Check variable declarations like: export const _static = () => { ... }
        for (const declarator of decl.declarations) {
          if (
            declarator.id.type === "Identifier" &&
            declarator.id.name === FUNCTION_NAME &&
            declarator.init?.type === "ArrowFunctionExpression"
          ) {
            return true;
          }
        }
      } else if (
        decl.type === "FunctionDeclaration" &&
        decl.id.name === FUNCTION_NAME
      ) {
        // Check function declarations like: export function _static() { ... }
        return true;
      }
    }
  }
  return false;
};

const injectResult = (variableName: string, tree: Root, result: unknown) => {
  const estreeValue = valueToEstree(result, {
    preserveReferences: true,
    instanceAsObject: true,
  });

  tree.children.unshift({
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        body: [
          {
            type: "VariableDeclaration",
            declarations: [
              {
                type: "VariableDeclarator",
                id: { type: "Identifier", name: variableName },
                init: estreeValue,
              },
            ],
            kind: "const",
          },
        ],
        sourceType: "module",
      },
    },
  });
};

const executeFunction = async (
  file: VFile,
  code: string,
  importNodes: ImportDeclaration[],
) => {
  const context: VmContext = {
    result: "",
    process,
    console,
  };

  code = code.replace(/^\s*export/, "");

  for (const { source, specifiers } of importNodes) {
    const modulePath = source.value;
    if (typeof modulePath !== "string") continue;

    const module = await import(modulePath);

    for (const specifier of specifiers) {
      const localName = specifier.local.name;
      switch (specifier.type) {
        case "ImportSpecifier": {
          if (specifier.imported.type !== "Identifier") continue;
          const importedName = specifier.imported.name;
          context[localName] = module[importedName];
          break;
        }
        case "ImportDefaultSpecifier":
          context[localName] = module.default ?? module;
          break;
        case "ImportNamespaceSpecifier":
          context[localName] = module;
          break;
      }
    }
  }

  const script = new vm.Script(`
   (async () => {
       result = await (async () => { ${code}; return ${FUNCTION_NAME}(); })();
   })();
 `);

  const prevCwd = process.cwd();
  // Run VM relative to the file's directory
  process.chdir(file.dirname ?? file.cwd);
  await script.runInNewContext(context);
  process.chdir(prevCwd);

  return context.result;
};

export const remarkStaticGeneration = () => async (tree: Root, file: VFile) => {
  const collectedImports = new Set<string>();

  const imports: ImportDeclaration[] = [];
  const nodesToProcess: MdxjsEsm[] = [];

  visit(tree, "mdxjsEsm", (node) => {
    const innerTree = node.data?.estree;
    if (!innerTree) return;

    if (innerTree.body[0]?.type === "ImportDeclaration") {
      imports.push(innerTree.body[0]);
      collectedImports.add(node.value);
    }

    if (isStaticExport(innerTree)) {
      nodesToProcess.push(node);
      return SKIP;
    }
  });

  for (const node of nodesToProcess) {
    const executed = await executeFunction(file, node.value, imports);
    if (!executed) continue;

    injectResult(VARIABLE_NAME, tree, executed);
  }
};
