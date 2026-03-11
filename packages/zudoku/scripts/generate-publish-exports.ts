// biome-ignore-all lint/suspicious/noConsole: Logging allowed here
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import ts from "typescript";

const cwd = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcDir = path.join(cwd, "src");
const declDir = path.join(cwd, "dist/declarations");

const emitDeclarations = (entryPoints: string[]) => {
  const configPath = ts.findConfigFile(
    cwd,
    ts.sys.fileExists,
    "tsconfig.app.json",
  );
  if (!configPath) throw new Error("Could not find tsconfig.app.json");

  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, cwd);

  const program = ts.createProgram(entryPoints, {
    ...parsed.options,
    declaration: true,
    emitDeclarationOnly: true,
    removeComments: true,
    outDir: declDir,
    noEmit: false,
  });

  const result = program.emit();
  for (const d of result.diagnostics) {
    console.warn(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
  }

  return program;
};

// TS expands large union type aliases inline in declarations. This finds any
// exported union above a threshold and replaces it with an import reference.
const patchExpandedUnions = async (program: ts.Program) => {
  const THRESHOLD = 50;
  const checker = program.getTypeChecker();

  const largeUnions: { name: string; expanded: string; declPath: string }[] =
    [];
  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile || !sf.fileName.startsWith(cwd)) continue;
    const mod = checker.getSymbolAtLocation(sf);
    if (!mod) continue;

    for (const sym of checker.getExportsOfModule(mod)) {
      if (!(sym.flags & ts.SymbolFlags.TypeAlias)) continue;
      const type = checker.getDeclaredTypeOfSymbol(sym);
      if (!type.isUnion() || type.types.length < THRESHOLD) continue;

      const expanded = checker.typeToString(
        type,
        undefined,
        ts.TypeFormatFlags.NoTruncation,
      );
      const rel = path
        .relative(srcDir, sf.fileName)
        .replace(/\.tsx?$/, ".d.ts");
      largeUnions.push({
        name: sym.name,
        expanded,
        declPath: path.join(declDir, rel),
      });
      console.log(
        `Found large union: ${sym.name} (${type.types.length} members)`,
      );
    }
  }

  if (largeUnions.length === 0) return;

  const dtsFiles = await glob("**/*.d.ts", { cwd: declDir, absolute: true });
  await Promise.all(
    dtsFiles.map(async (file) => {
      let content = await readFile(file, "utf-8");
      let patched = false;

      for (const { name, expanded, declPath } of largeUnions) {
        if (file === declPath || !content.includes(expanded)) continue;
        let rel = path
          .relative(path.dirname(file), declPath)
          .replace(/\.d\.ts$/, ".js");
        if (!rel.startsWith(".")) rel = `./${rel}`;
        content = content.replaceAll(expanded, `import("${rel}").${name}`);
        patched = true;
      }

      if (patched) {
        await writeFile(file, content);
        console.log(`Patched large unions in ${path.relative(cwd, file)}`);
      }
    }),
  );
};

// --- Main ---

const pkgPath = path.join(cwd, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));

// Exports that don't point to source files
const IGNORED_EXPORTS = new Set(["./package.json", "./main.css", "./client"]);

const isSource = (p: string) =>
  p.startsWith("./src/") && (/\.tsx?$/.test(p) || p.endsWith("*"));

const getSourcePath = (value: unknown): string | undefined => {
  const p =
    typeof value === "string"
      ? value
      : (value as Record<string, string> | null)?.default;
  return p && isSource(p) ? p : undefined;
};

// Collect source entry points from exports, expanding wildcards
const sourcePaths: string[] = [];
for (const [key, value] of Object.entries(pkg.exports)) {
  const src = getSourcePath(value);
  if (src) {
    sourcePaths.push(src);
  } else if (!IGNORED_EXPORTS.has(key)) {
    console.warn(`Unhandled export "${key}": ${JSON.stringify(value)}`);
  }
}

const globPatterns = sourcePaths.map((p) =>
  /\*\.\w+$/.test(p) ? p : p.replaceAll("*", "*.{ts,tsx}"),
);
const entryPoints = await glob(globPatterns, {
  cwd,
  absolute: true,
  ignore: ["**/*.test.*"],
});

console.log(`Emitting declarations for ${entryPoints.length} entry points`);

// 1. Emit .d.ts files
const program = emitDeclarations(entryPoints);

// 2. Patch expanded unions (e.g. IconNames with ~1,939 string literals)
await patchExpandedUnions(program);

// 3. Write publishConfig.exports with types field pointing to declarations
const toDts = (p: string) => {
  const replaced = p.replace(/^\.\/src\//, "./dist/declarations/");
  if (/\.tsx?$/.test(replaced)) return replaced.replace(/\.tsx?$/, ".d.ts");
  if (replaced.endsWith("*")) return `${replaced}.d.ts`;
  return replaced;
};

const addTypes = (value: unknown): unknown => {
  const src = getSourcePath(value);
  if (!src) return value;
  const types = toDts(src);
  return typeof value === "string"
    ? { types, default: value }
    : { ...(value as Record<string, unknown>), types };
};

pkg.publishConfig = {
  ...pkg.publishConfig,
  exports: Object.fromEntries(
    Object.entries(pkg.exports).map(([k, v]) => [k, addTypes(v)]),
  ),
};

await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("Updated publishConfig.exports in package.json");
