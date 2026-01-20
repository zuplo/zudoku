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
import type { VersionConfig } from "../../config/validators/validate.js";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { ensureArray } from "../../lib/util/ensureArray.js";
import { flattenAllOfProcessor } from "../../lib/util/flattenAllOf.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { generateCode } from "./schema-codegen.js";

type ProcessedSchema = {
  schema: OpenAPIDocument;
  version: string;
  path: string;
  label?: string;
  inputPath: string;
  downloadUrl: string;
};
const FALLBACK_VERSION = "default";

type InputConfig = Partial<VersionConfig> & { input: string };

const normalizeInputs = (
  inputs: string | InputConfig | Array<string | InputConfig>,
): InputConfig[] =>
  ensureArray(inputs).map((i) => (typeof i === "string" ? { input: i } : i));

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

      const inputs = normalizeInputs(apiConfig.input).map((i) =>
        path.resolve(this.config.__meta.rootDir, i.input),
      );
      if (inputs.includes(filePath)) {
        this.fileToPath.set(filePath, apiConfig.path);
        return apiConfig.path;
      }
    }
  };

  public processSchema = async (input: InputConfig) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input.input);
    const configuredPath = this.getPathForFile(filePath);
    if (!configuredPath) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`No path found for file ${input.input}`);
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

    const schemas = this.processedSchemas[configuredPath];

    if (!schemas) {
      throw new Error(`No schemas found for navigation ID ${configuredPath}.`);
    }

    const index = schemas.findIndex((s) => s.inputPath === filePath);
    const existingSchema = schemas[index];

    const schemaVersion = processedSchema.info.version ?? FALLBACK_VERSION;
    const versionPath =
      existingSchema?.path && existingSchema.path.length > 0
        ? existingSchema.path
        : schemaVersion;

    const processed = {
      schema: processedSchema,
      version: schemaVersion,
      path: versionPath,
      label: existingSchema?.label,
      inputPath: filePath,
      downloadUrl: this.createSchemaPath(filePath, versionPath, configuredPath),
    } satisfies ProcessedSchema;

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

      const inputs = normalizeInputs(apiConfig.input);
      if (inputs.length === 0) throw new Error("No schema found");

      this.processedSchemas[apiConfig.path] = inputs.map((input) => ({
        schema: {} as OpenAPIDocument,
        version: "",
        path: input.path ?? "",
        label: input.label,
        inputPath: path.resolve(this.config.__meta.rootDir, input.input),
        downloadUrl: "",
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

  public getBySchemaFilepath = (schemaPath: string) =>
    this.schemaMap.get(path.resolve(this.config.__meta.rootDir, schemaPath));

  public getSchemasForPath = (path: string) => this.processedSchemas[path];

  public getUrlToFilePathMap = () => {
    const map = new Map<string, string>();

    const apis = ensureArray(this.config.apis ?? []);
    for (const apiConfig of apis) {
      if (apiConfig.type !== "file" || !apiConfig.path) continue;

      const downloadEnabled =
        apiConfig.options?.schemaDownload?.enabled ??
        this.config.defaults?.apis?.schemaDownload?.enabled ??
        false;

      if (!downloadEnabled) continue;

      const schemas = this.processedSchemas[apiConfig.path];

      if (!schemas || schemas.length === 0) continue;

      for (const schema of schemas) {
        map.set(schema.downloadUrl, schema.inputPath);
      }
    }

    return map;
  };

  private createSchemaPath = (
    inputPath: string,
    versionPath: string,
    apiPath: string,
  ) => {
    const extension = path.extname(inputPath);
    return joinUrl(
      this.config.basePath,
      apiPath,
      versionPath,
      `schema${extension}`,
    );
  };

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
