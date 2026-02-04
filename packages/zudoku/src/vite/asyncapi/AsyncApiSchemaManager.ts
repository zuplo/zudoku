import fs from "node:fs/promises";
import path from "node:path";
import {
  $RefParser,
  type JSONSchema,
} from "@apidevtools/json-schema-ref-parser";
import slugify from "@sindresorhus/slugify";
import type { LoadedConfig } from "../../config/config.js";
import type { VersionConfig } from "../../config/validators/validate.js";
import type { AsyncAPIDocument } from "../../lib/asyncapi/types.js";
import { ensureArray } from "../../lib/util/ensureArray.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { generateAsyncApiCode } from "./schema-codegen.js";

type ProcessedSchema = {
  schema: AsyncAPIDocument;
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

export class AsyncApiSchemaManager {
  private storeDir: string;
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
  }: {
    storeDir: string;
    config: LoadedConfig;
  }) {
    this.storeDir = storeDir;
    this.config = config;
  }

  private getPathForFile = (input: string) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input);

    if (this.fileToPath.has(filePath)) {
      return this.fileToPath.get(filePath);
    }

    const asyncApis = ensureArray(this.config.asyncApis ?? []);
    for (const apiConfig of asyncApis) {
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
      console.warn(`No path found for AsyncAPI file ${input.input}`);
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

    const processedSchema = await this.validateSchema(schema, filePath);

    const processedTime = Date.now();
    const code = await generateAsyncApiCode(processedSchema, filePath);

    // Create a unique filename using the configuredPath to avoid collisions
    const prefixPath = slugify(configuredPath, { separator: "_" });
    const processedFilePath = path.posix.join(
      this.storeDir,
      `asyncapi-${prefixPath}-${path.basename(filePath)}.js`,
    );
    await fs.writeFile(processedFilePath, code);
    this.schemaMap.set(filePath, {
      filePath: processedFilePath,
      processedTime,
    });

    const schemas = this.processedSchemas[configuredPath];

    if (!schemas) {
      throw new Error(
        `No schemas found for AsyncAPI navigation ID ${configuredPath}.`,
      );
    }

    const index = schemas.findIndex((s) => s.inputPath === filePath);
    const existingSchema = schemas[index];

    const schemaVersion = processedSchema.info?.version ?? FALLBACK_VERSION;
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
    } else {
      throw new Error(
        `Schema with input path ${filePath} was not pre-initialized for ${configuredPath}.`,
      );
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

    const asyncApis = ensureArray(this.config.asyncApis ?? []);
    for (const apiConfig of asyncApis) {
      if (apiConfig.type !== "file" || !apiConfig.path) continue;

      const inputs = normalizeInputs(apiConfig.input);
      if (inputs.length === 0) throw new Error("No AsyncAPI schema found");

      this.processedSchemas[apiConfig.path] = inputs.map((input) => ({
        schema: {} as AsyncAPIDocument,
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
          `Failed to process AsyncAPI schemas for ${apiConfig.path}: ${errors.join(", ")}`,
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

    const asyncApis = ensureArray(this.config.asyncApis ?? []);
    for (const apiConfig of asyncApis) {
      if (apiConfig.type !== "file" || !apiConfig.path) continue;

      const downloadEnabled =
        apiConfig.options?.schemaDownload?.enabled ??
        this.config.defaults?.asyncApis?.schemaDownload?.enabled ??
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
      `asyncapi-schema${extension}`,
    );
  };

  private validateSchema = async (
    schema: JSONSchema,
    filePath: string,
  ): Promise<AsyncAPIDocument> => {
    const asyncApiSchema = schema as AsyncAPIDocument;

    // Basic AsyncAPI validation
    if (!asyncApiSchema.asyncapi) {
      throw new Error(`${filePath}: Missing 'asyncapi' version field`);
    }

    if (!asyncApiSchema.info) {
      throw new Error(`${filePath}: Missing 'info' field`);
    }

    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log(
      `[zudoku:asyncapi] Processed ${filePath} (AsyncAPI ${asyncApiSchema.asyncapi})`,
    );

    return asyncApiSchema;
  };
}
