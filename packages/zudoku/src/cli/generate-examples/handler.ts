import { render } from "ink";
import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { type OpenAPIDocument, validate } from "../../lib/oas/parser/index.js";
import type { Arguments } from "../cmds/generate-examples.js";
import { GenerateExamplesApp } from "./GenerateExamplesApp.js";

export async function generateExamples(argv: Arguments) {
  const { file, output } = argv;

  // Resolve file path
  const filePath = path.resolve(file);
  const outputPath = output ? path.resolve(output) : filePath;

  try {
    // Check if file exists
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read the original file content
  const fileContent = await fs.readFile(filePath, "utf-8");
  let originalSchema: any;

  // Parse based on file extension
  if (filePath.endsWith(".json")) {
    originalSchema = JSON.parse(fileContent);
  } else if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    const yaml = await import("yaml");
    originalSchema = yaml.parse(fileContent);
  } else {
    throw new Error(
      "Unsupported file format. Please use .json, .yaml, or .yml files.",
    );
  }

  // Validate the schema (this will throw if invalid)
  await validate(originalSchema);

  // Render the interactive UI with the original schema
  const { waitUntilExit } = render(
    React.createElement(GenerateExamplesApp, {
      schema: originalSchema as OpenAPIDocument,
      inputPath: filePath,
      outputPath,
      originalContent: fileContent,
    }),
  );

  await waitUntilExit();
}
