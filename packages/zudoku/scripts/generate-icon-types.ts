import { readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import * as ts from "typescript";

const path = import.meta.resolve("lucide-react/dynamicIconImports.js");
const filePath = new URL(path).pathname;
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

const outputPath = new URL(
  "../src/config/validators/icon-types.ts",
  import.meta.url,
).pathname;
writeFileSync(outputPath, typeDefinition);
