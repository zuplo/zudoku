import fs from "node:fs/promises";
import path from "node:path";
import {
  $RefParser,
  type JSONSchema,
} from "@apidevtools/json-schema-ref-parser";
import { upgrade, validate } from "@scalar/openapi-parser";
import slugify from "@sindresorhus/slugify";
import type { LoadedConfig } from "../../config/config.js";
import type { Processor } from "../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { ensureArray } from "../../lib/util/ensureArray.js";
import { flattenAllOfProcessor } from "../../lib/util/flattenAllOf.js";
import { generateCode } from "./schema-codegen.js";

type ProcessedSchema = {
  schema: OpenAPIDocument;
  version: string;
  inputPath: string;
};
const FALLBACK_VERSION = "default";

export class SchemaManager {
  private storeDir: string;
  private processors: Processor[];
  private processedSchemas: Record<string, ProcessedSchema[]> = {};
  private fileToPath: Map<string, string> = new Map();
  private referencedBy = new Map<string, Set<string>>();
  public config: LoadedConfig;
  public schemaMap = new Map<
    string,
    { filePath: string; processedTime: number }
  >();

  constructor({
    storeDir,
    config,
    processors,
  }: {
    storeDir: string;
    config: LoadedConfig;
    processors: Processor[];
  }) {
    this.storeDir = storeDir;
    this.config = config;
    this.processors = [
      ({ schema }) => upgrade(schema).specification as OpenAPIDocument,
      flattenAllOfProcessor,
      ...processors,
    ];
  }

  private getPathForFile = (input: string) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input);

    if (this.fileToPath.has(filePath)) {
      return this.fileToPath.get(filePath);
    }

    const apis = ensureArray(this.config.apis ?? []);
    for (const apiConfig of apis) {
      if (!apiConfig || apiConfig.type !== "file" || !apiConfig.path) continue;

      const inputs = ensureArray(apiConfig.input).map((i) =>
        path.resolve(this.config.__meta.rootDir, i),
      );
      if (inputs.includes(filePath)) {
        this.fileToPath.set(filePath, apiConfig.path);
        return apiConfig.path;
      }
    }
  };

  public processSchema = async (input: string) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input);
    const configuredPath = this.getPathForFile(filePath);
    if (!configuredPath) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`No path found for file ${input}`);
      return;
    }

    const parser = new $RefParser();
    const schema = await parser.bundle(filePath, {
      dereference: { preservedProperties: ["description", "summary"] },
    });

    this.referencedBy.set(filePath, new Set());

    parser.$refs
      .paths()
      .filter((file) => file !== filePath)
      .forEach((file) => {
        if (!this.referencedBy.has(file)) {
          this.referencedBy.set(file, new Set());
        }
        this.referencedBy.get(file)?.add(filePath);
      });

    const validatedSchema = await this.validateSchema(schema, filePath);
    const processedSchema = await this.processors.reduce(
      async (schema, processor) =>
        processor({
          schema: await schema,
          file: filePath,
          dereference: (schema) =>
            new $RefParser<OpenAPIDocument>().dereference(schema, {
              dereference: {
                preservedProperties: ["description", "summary"],
                circular: "ignore",
              },
            }),
        }),
      Promise.resolve(validatedSchema),
    );

    const processedTime = Date.now();
    const code = await generateCode(processedSchema, filePath);

    // Create a unique filename using the configuredPath to avoid collisions
    // when multiple APIs use the same basename (e.g., index.json)
    const prefixPath = slugify(configuredPath, { separator: "_" });
    const processedFilePath = path.posix.join(
      this.storeDir,
      `${prefixPath}-${path.basename(filePath)}.js`,
    );
    await fs.writeFile(processedFilePath, code);
    this.schemaMap.set(filePath, {
      filePath: processedFilePath,
      processedTime,
    });

    const processed = {
      schema: processedSchema,
      version: processedSchema.info.version || FALLBACK_VERSION,
      inputPath: filePath,
    } satisfies ProcessedSchema;

    const schemas = this.processedSchemas[configuredPath];

    if (!schemas) {
      throw new Error(`No schemas found for navigation ID ${configuredPath}.`);
    }

    const index = schemas.findIndex((s) => s.inputPath === filePath);
    if (index > -1) {
      schemas[index] = processed;
    }
    this.fileToPath.set(filePath, configuredPath);
    return processed;
  };

  public getAllTrackedFiles = () => Array.from(this.referencedBy.keys());

  public getFilesToReprocess = (changedFile: string) => {
    const resolvedPath = path.resolve(this.config.__meta.rootDir, changedFile);
    const referencedBy = this.referencedBy.get(resolvedPath);

    if (!referencedBy) return [];
    if (referencedBy.size === 0) return [resolvedPath];
    return Array.from(referencedBy);
  };

  public processAllSchemas = async () => {
    this.schemaMap.clear();
    this.fileToPath.clear();
    this.referencedBy.clear();
    this.processedSchemas = {};

    const apis = ensureArray(this.config.apis ?? []);
    for (const apiConfig of apis) {
      if (apiConfig.type !== "file" || !apiConfig.path) continue;

      const inputs = ensureArray(apiConfig.input);
      if (inputs.length === 0) throw new Error("No schema found");

      this.processedSchemas[apiConfig.path] = inputs.map((input) => ({
        schema: {} as OpenAPIDocument,
        version: "",
        inputPath: path.resolve(this.config.__meta.rootDir, input),
      }));

      const results = await Promise.allSettled(
        inputs.map((input) => this.processSchema(input)),
      );

      const errors = results.flatMap((r) =>
        r.status === "rejected" ? r.reason : [],
      );

      if (errors.length > 0) {
        throw new Error(
          `Failed to process schemas for ${apiConfig.path}: ${errors.join(", ")}`,
        );
      }
    }
  };

  public getLatestSchema = (path: string) => this.processedSchemas[path]?.at(0);

  public getSchemasForPath = (path: string) => this.processedSchemas[path];

  private validateSchema = async (
    schema: JSONSchema,
    filePath: string,
  ): Promise<OpenAPIDocument> => {
    const validated = await validate(schema);
    if (validated.errors?.length) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`Schema warnings in ${filePath}:`);
      for (const error of validated.errors) {
        // biome-ignore lint/suspicious/noConsole: Logging allowed here
        console.warn(error);
      }
    }

    return schema as OpenAPIDocument;
  };
}
