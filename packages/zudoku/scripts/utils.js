import ts from "typescript";

export const extractCompleteTypeDefinition = (filePath, typeName) => {
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    skipLibCheck: true,
  });

  const sourceFile = program.getSourceFile(filePath);
  const typeChecker = program.getTypeChecker();

  const extractedTypes = new Map();

  const visit = (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      const name = node.name.text;
      const type = typeChecker.getTypeAtLocation(node);
      const typeString = typeChecker.typeToString(
        type,
        node,
        ts.TypeFormatFlags.InTypeAlias |
          ts.TypeFormatFlags.NoTruncation |
          ts.TypeFormatFlags.WriteArrayAsGenericType,
      );
      extractedTypes.set(name, typeString);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // Get the main type and resolve references
  let mainType = extractedTypes.get(typeName);
  if (mainType) {
    // Replace references to other extracted types
    for (const [name, definition] of extractedTypes) {
      if (name !== typeName && mainType.includes(name)) {
        mainType = mainType.replace(
          new RegExp(`\\b${name}\\b`, "g"),
          `(${definition})`,
        );
      }
    }
  }

  return mainType;
};
