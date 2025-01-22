import fs from "fs";
import path from "path";
import type { JSONSchema } from "./index.js";

/**
 * Resolves a file-based reference and returns the referenced schema.
 * @param baseDir - The base directory to resolve relative paths from
 * @param ref - The reference string (e.g. "./schemas/user.yaml#/components/schemas/User")
 * @returns The referenced schema or undefined if not found
 */
export const resolveFileRef = async (
  baseDir: string,
  ref: string,
): Promise<JSONSchema | undefined> => {
  // Split the reference into file path and JSON pointer
  const [filePath, jsonPointer = ""] = ref.split("#");

  // If it's not a file reference, return undefined
  if (!filePath || filePath.includes("://")) {
    return undefined;
  }

  // Resolve the absolute file path
  const absolutePath = path.resolve(baseDir, filePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    return undefined;
  }

  // Read and parse the file
  const fileContent = fs.readFileSync(absolutePath, "utf-8");
  let schema: JSONSchema;

  try {
    if (fileContent.trim().startsWith("{")) {
      schema = JSON.parse(fileContent);
    } else {
      const yaml = await import("yaml");
      schema = yaml.parse(fileContent);
    }
  } catch (err) {
    console.warn(`Failed to parse referenced file: ${absolutePath}`, err);
    return undefined;
  }

  // If there's no JSON pointer, return the entire schema
  if (!jsonPointer) {
    return schema;
  }

  // Navigate the schema using the JSON pointer
  const segments = jsonPointer.split("/").slice(1); // Remove empty first segment
  let current: any = schema;

  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }

  return current;
};
