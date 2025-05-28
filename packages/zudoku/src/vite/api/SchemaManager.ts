import {
  $RefParser,
  type JSONSchema,
} from "@apidevtools/json-schema-ref-parser";
import { upgrade, validate } from "@scalar/openapi-parser";
import { merge as mergeAllOf } from "allof-merge";
import fs from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import type { LoadedConfig } from "../../config/config.js";
import type { Processor } from "../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { ensureArray } from "../../lib/util/ensureArray.js";
import { generateCode } from "./schema-codegen.js";

type ProcessedSchema = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: OpenAPIDocument;
  version: string;
  inputPath: string;
};
const FALLBACK_VERSION = "default";

export class SchemaManager {
  private storeDir: string;
  private processors: Processor[];
  private processedSchemas: Record<string, ProcessedSchema[]> = {};
  private fileToNavigationId: Map<string, string> = new Map();
  public config: LoadedConfig;
  public trackedFiles = new Set<string>();
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
      ({ schema }) => upgrade(schema).specification,
      ({ schema, file }) => {
        try {
          return mergeAllOf(schema, {
            onMergeError: (message, path) => {
              throw new Error(`${message} at '${path.join(".")}'`);
            },
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            colors.yellow(
              `Failed to merge \`allOf\` in ${file}: ` +
                (error instanceof Error ? error.message : error),
            ),
          );
          return schema; // Return original schema if merge fails
        }
      },
      ...processors,
    ];
  }

  private getNavigationIdForFile = (input: string) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input);

    if (this.fileToNavigationId.has(filePath)) {
      return this.fileToNavigationId.get(filePath);
    }

    const apis = ensureArray(this.config.apis ?? []);
    for (const apiConfig of apis) {
      if (!apiConfig || apiConfig.type !== "file" || !apiConfig.navigationId)
        continue;

      const inputs = ensureArray(apiConfig.input).map((i) =>
        path.resolve(this.config.__meta.rootDir, i),
      );
      if (inputs.includes(filePath)) {
        this.fileToNavigationId.set(filePath, apiConfig.navigationId);
        return apiConfig.navigationId;
      }
    }
  };

  public processSchema = async (input: string) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input);
    const navigationId = this.getNavigationIdForFile(filePath);
    if (!navigationId) {
      // eslint-disable-next-line no-console
      console.warn(`No navigation ID found for file ${input}`);
      return;
    }

    const parser = new $RefParser();
    const schema = await parser.bundle(filePath);

    parser.$refs.paths().forEach((file) => this.trackedFiles.add(file));

    const validatedSchema = await this.validateSchema(schema, filePath);
    const processedSchema = await this.processors.reduce(
      async (schema, processor) =>
        processor({
          schema: await schema,
          file: filePath,
          dereference: (schema) =>
            new $RefParser<OpenAPIDocument>().dereference(schema),
        }),
      Promise.resolve(validatedSchema),
    );

    const processedTime = Date.now();
    const code = await generateCode(processedSchema, filePath);

    const processedFilePath = path.posix.join(
      this.storeDir,
      `${path.basename(filePath)}.js`,
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

    const schemas = this.processedSchemas[navigationId];

    if (!schemas) {
      throw new Error(`No schemas found for navigation ID ${navigationId}.`);
    }

    const index = schemas.findIndex((s) => s.inputPath === filePath);
    if (index > -1) {
      schemas[index] = processed;
    }
    this.fileToNavigationId.set(filePath, navigationId);
    return processed;
  };

  public processAllSchemas = async () => {
    this.schemaMap.clear();
    this.trackedFiles.clear();
    this.fileToNavigationId.clear();
    this.processedSchemas = {};

    const apis = ensureArray(this.config.apis ?? []);
    for (const apiConfig of apis) {
      if (apiConfig.type !== "file" || !apiConfig.navigationId) continue;

      const inputs = ensureArray(apiConfig.input);
      if (inputs.length === 0) throw new Error("No schema found");

      this.processedSchemas[apiConfig.navigationId] = inputs.map((input) => ({
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
          `Failed to process schemas for ${apiConfig.navigationId}: ${errors.join(", ")}`,
        );
      }
    }
  };

  public getLatestSchema = (navigationId: string) =>
    this.processedSchemas[navigationId]?.at(0);

  public getSchemasForId = (navigationId: string) =>
    this.processedSchemas[navigationId];

  private validateSchema = async (
    schema: JSONSchema,
    filePath: string,
  ): Promise<OpenAPIDocument> => {
    const validated = await validate(schema);
    if (validated.errors?.length) {
      // eslint-disable-next-line no-console
      console.warn(`Schema warnings in ${filePath}:`);
      for (const error of validated.errors) {
        // eslint-disable-next-line no-console
        console.warn(error);
      }
    }

    return schema as OpenAPIDocument;
  };
}
