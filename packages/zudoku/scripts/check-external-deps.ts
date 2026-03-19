import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import { parseSync } from "oxc-parser";

const toPackageName = (specifier: string) =>
  specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];

const isBareDep = (s: string) =>
  !s.startsWith(".") && !s.startsWith("node:") && !s.startsWith("virtual:");

export const getImportedPackages = (source: string, filename: string) => {
  const {
    module: { staticImports, staticExports },
  } = parseSync(filename, source);

  const importedPackages = staticImports.flatMap((imp) =>
    imp.entries.every((e) => e.isType) ? [] : imp.moduleRequest.value,
  );
  const reExportedPackages = staticExports.flatMap((exp) =>
    exp.entries.flatMap((e) =>
      e.isType || !e.moduleRequest ? [] : e.moduleRequest.value,
    ),
  );

  return [...importedPackages, ...reExportedPackages]
    .filter(isBareDep)
    .map(toPackageName);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");
const pkg = JSON.parse(
  await readFile(path.join(pkgRoot, "package.json"), "utf8"),
);

const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  pkg.name,
]);

const files = await glob("src/**/*.{ts,tsx}", {
  cwd: pkgRoot,
  ignore: ["**/*.test.*", "**/*.test-d.*", "**/*.spec.*", "**/__tests__/**"],
});

const missing = new Map<string, string[]>();

for (const file of files) {
  const source = await readFile(path.join(pkgRoot, file), "utf8");

  for (const dep of getImportedPackages(source, file)) {
    if (declared.has(dep)) continue;
    const entries = missing.get(dep) ?? [];
    entries.push(file);
    missing.set(dep, entries);
  }
}

if (missing.size > 0) {
  // biome-ignore lint/suspicious/noConsole: build script
  console.error("Imports not declared in dependencies or peerDependencies:\n");
  for (const [dep, files] of missing) {
    // biome-ignore lint/suspicious/noConsole: build script
    console.error(`  ${dep} (${files.join(", ")})`);
  }
  process.exit(1);
}
