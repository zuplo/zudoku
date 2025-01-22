import icons from "lucide-react/dynamicIconImports";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const iconNames = Object.keys(icons)
  .sort()
  .map((icon) => `"${icon}"`)
  .join(" | ");

const typeDefinition = await format(`export type IconNames = ${iconNames};`, {
  parser: "typescript",
});

const outputPath = fileURLToPath(
  new URL("../src/config/validators/icon-types.ts", import.meta.url),
);
writeFileSync(outputPath, typeDefinition);
