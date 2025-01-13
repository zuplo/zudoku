import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import * as ts from "typescript";

const require = createRequire(import.meta.url);
const filePath = require.resolve("lucide-react/dynamicIconImports.js");
const fileContent = readFileSync(filePath, "utf-8");

const sourceFile = ts.createSourceFile(
  "dynamicIconImports.js",
  fileContent,
  ts.ScriptTarget.Latest,
  true,
);

const iconNames: string[] = [];

function visit(node: ts.Node) {
  if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) {
    iconNames.push(node.name.text);
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);

let typeDefinition = `export type IconNames = ${iconNames.map((name) => `"${name}"`).join(" | ")};`;
typeDefinition = await format(typeDefinition, { parser: "typescript" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
  __dirname,
  "../src/config/validators/icon-types.ts",
);
writeFileSync(outputPath, typeDefinition);
