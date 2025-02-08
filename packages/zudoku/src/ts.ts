/* eslint-disable no-console */
import path from "node:path";
import ts from "typescript";

/**
 * Function to check if a TypeScript string is valid
 * Used for tests
 */
export async function checkTypescriptString(code: string) {
  const rootDir = process.cwd();
  const inMemoryFileName = path.join(rootDir, "/src/temp.ts");
  const configPath = ts.findConfigFile(
    rootDir,
    ts.sys.fileExists,
    "tsconfig.json",
  );
  if (!configPath) {
    throw new Error("Could not find a valid tsconfig.json");
  }
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  // Custom compiler host to handle in-memory file and delegate to default host for others
  const compilerHost: ts.CompilerHost = {
    ...ts.createCompilerHost(parsedCommandLine.options),
    getSourceFile: (
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    ) => {
      if (fileName === inMemoryFileName) {
        return ts.createSourceFile(fileName, code, languageVersion, true);
      }
      return ts
        .createCompilerHost(parsedCommandLine.options)
        .getSourceFile(
          fileName,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        );
    },
    fileExists: (fileName) => {
      if (fileName === inMemoryFileName) {
        return true;
      }
      return ts.sys.fileExists(fileName);
    },
    readFile: (fileName) => {
      if (fileName === inMemoryFileName) {
        return code;
      }
      return ts.sys.readFile(fileName);
    },
  };

  // Create a program using the in-memory source file
  const program = ts.createProgram({
    rootNames: parsedCommandLine.fileNames.concat(inMemoryFileName),
    options: parsedCommandLine.options,
    host: compilerHost,
  });

  // Get all diagnostics for the program, which includes syntax and semantic errors
  const diagnostics = ts.getPreEmitDiagnostics(program);

  diagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!,
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`,
      );
    } else {
      console.log(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );
    }
  });

  return diagnostics;
}
