import fs from "node:fs/promises";
import path from "node:path";
import {
  $RefParser,
  type JSONSchema,
} from "@apidevtools/json-schema-ref-parser";
import { upgrade, validate } from "@scalar/openapi-parser";
import { deepEqual } from "fast-equals";
import type { IntrospectionQuery } from "graphql";
import type { LoadedConfig } from "../../config/config.js";
import type { Processor } from "../../config/validators/BuildSchema.js";
import type {
  ApiOptionsConfig,
  VersionConfig,
} from "../../config/validators/ZudokuConfig.js";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { ensureArray } from "../../lib/util/ensureArray.js";
import { flattenAllOfProcessor } from "../../lib/util/flattenAllOfProcessor.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { slugify } from "../../lib/util/slugify.js";
import { loadSchema, type SchemaSource } from "../graphql/load-schema.js";
import { generateCode } from "./schema-codegen.js";

// Short stable id for a schema source. Avoids leaking absolute paths into the
// published output while staying deterministic so the same source dedups.
const schemaKey = (source: string) => {
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 33) ^ source.charCodeAt(i);
  }
  return `gql-${(hash >>> 0).toString(36)}`;
};

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "trace",
]);

type ProcessedSchema = {
  schema: OpenAPIDocument;
  version: string;
  path: string;
  label?: string;
  inputPath: string;
  params: Record<string, string>;
  importKey: string;
  downloadUrl: string;
  processedJsonPath: string;
  processedTime: number;
};
const FALLBACK_VERSION = "default";

type InputConfig = Partial<VersionConfig> & {
  input: string;
  params: Record<string, string>;
};

const parseInputString = (input: string) => {
  const idx = input.indexOf("?");
  if (idx === -1)
    return { filePath: input, params: {} as Record<string, string> };
  return {
    filePath: input.slice(0, idx),
    params: Object.fromEntries(new URLSearchParams(input.slice(idx))),
  };
};

const canonicalParams = (params: Record<string, string>) =>
  Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

const paramsSuffix = (params: Record<string, string>) => {
  const canonical = canonicalParams(params);
  return canonical ? `-${slugify(canonical)}` : "";
};

const paramsPath = (params: Record<string, string>) => {
  const canonical = canonicalParams(params);
  return canonical ? slugify(canonical) : "";
};

const normalizeInputs = (
  inputs:
    | string
    | InputConfig
    | Array<
        | string
        | (Omit<InputConfig, "params"> & { params?: Record<string, string> })
      >,
): InputConfig[] =>
  ensureArray(inputs).map((i) => {
    const raw = typeof i === "string" ? { input: i } : i;
    const { filePath, params } = parseInputString(raw.input);
    return { ...raw, input: filePath, params: { ...params, ...raw.params } };
  });

export class SchemaManager {
  private storeDir: string;
  private processors: Processor[];
  private processedSchemas: Record<string, ProcessedSchema[]> = {};
  private referencedBy = new Map<string, Set<string>>();
  // Introspected GraphQL schemas for `x-graphql` operations, keyed by source.
  private graphqlSchemas: Record<string, IntrospectionQuery> = {};
  public config: LoadedConfig;

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

  private getPathForFile = (input: string, params: Record<string, string>) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input);

    const apis = ensureArray(this.config.apis ?? []);
    for (const apiConfig of apis) {
      if (!apiConfig || apiConfig.type !== "file" || !apiConfig.path) continue;

      const match = normalizeInputs(apiConfig.input).some(
        (i) =>
          path.resolve(this.config.__meta.rootDir, i.input) === filePath &&
          deepEqual(i.params, params),
      );
      if (match) return apiConfig.path;
    }
  };

  public getGraphQLSchemas = () => this.graphqlSchemas;

  private resolveGraphQLSource = (
    ext: { endpoint?: string; schema?: string },
    oasFilePath: string,
  ): SchemaSource | undefined => {
    if (ext.schema) {
      return {
        type: "file",
        input: path.resolve(path.dirname(oasFilePath), ext.schema),
      };
    }
    if (ext.endpoint) return { type: "url", input: ext.endpoint };
    return undefined;
  };

  // Walk operations for `x-graphql`, load each schema once (SDL file or
  // endpoint introspection), and stamp a `schemaId` into the extension so the
  // client can look the introspected schema up in the bundled module.
  private processGraphQLEndpoints = async (
    schema: OpenAPIDocument,
    oasFilePath: string,
  ) => {
    for (const pathItem of Object.values(schema.paths ?? {})) {
      if (!pathItem || typeof pathItem !== "object") continue;
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.has(method.toLowerCase())) continue;
        const ext = (operation as Record<string, unknown>)?.["x-graphql"];
        if (!ext || typeof ext !== "object") continue;

        const source = this.resolveGraphQLSource(ext, oasFilePath);
        if (!source) continue;

        const key = schemaKey(source.input);
        if (!this.graphqlSchemas[key]) {
          try {
            this.graphqlSchemas[key] = await loadSchema(
              source,
              this.config.__meta.rootDir,
            );
          } catch (error) {
            // Degrade to the playground-only experience on load failure.
            // biome-ignore lint/suspicious/noConsole: Logging allowed here
            console.warn(
              `Failed to load GraphQL schema for ${source.input}: ${String(error)}`,
            );
            continue;
          }
        }
        (ext as { schemaId?: string }).schemaId = key;
      }
    }
  };

  public processSchema = async (input: InputConfig) => {
    const filePath = path.resolve(this.config.__meta.rootDir, input.input);
    const params = input.params;
    const configuredPath = this.getPathForFile(input.input, params);
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
          params,
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

    await this.processGraphQLEndpoints(processedSchema, filePath);

    const processedTime = Date.now();
    const code = generateCode(processedSchema, filePath);

    const prefixPath = slugify(configuredPath);
    const processedFilePath = path.posix.join(
      this.storeDir,
      `${prefixPath}-${path.basename(filePath)}${paramsSuffix(params)}.js`,
    );
    const importKey = processedFilePath;

    await fs.writeFile(processedFilePath, code);

    const processedJsonPath = paramsSuffix(params)
      ? processedFilePath.replace(/\.js$/, ".json")
      : "";
    if (processedJsonPath) {
      await fs.writeFile(
        processedJsonPath,
        JSON.stringify(processedSchema, null, 2),
      );
    }

    const schemas = this.processedSchemas[configuredPath];

    if (!schemas) {
      throw new Error(`No schemas found for navigation ID ${configuredPath}.`);
    }

    const index = schemas.findIndex(
      (s) => s.inputPath === filePath && deepEqual(s.params, params),
    );
    const existingSchema = schemas[index];

    const schemaVersion = processedSchema.info.version ?? FALLBACK_VERSION;
    const versionPath =
      existingSchema?.path && existingSchema.path.length > 0
        ? existingSchema.path
        : paramsPath(params) || schemaVersion;

    const config = ensureArray(this.config.apis ?? []).find(
      (c) => c.path === configuredPath,
    );

    const processed = {
      schema: processedSchema,
      version: schemaVersion,
      path: versionPath,
      label:
        existingSchema?.label ??
        (Object.keys(params).length > 0
          ? Object.values(params).join(", ")
          : undefined),
      inputPath: filePath,
      params,
      importKey,
      downloadUrl: this.createSchemaPath(
        filePath,
        versionPath,
        configuredPath,
        params,
        config?.options,
      ),
      processedJsonPath,
      processedTime,
    } satisfies ProcessedSchema;

    if (index > -1) {
      schemas[index] = processed;
    } else {
      throw new Error(
        `Schema with input path ${filePath} was not pre-initialized for ${configuredPath}.`,
      );
    }
    return processed;
  };

  public getAllTrackedFiles = () => Array.from(this.referencedBy.keys());

  public getFilesToReprocess = (changedFile: string): InputConfig[] => {
    const resolvedPath = path.resolve(this.config.__meta.rootDir, changedFile);
    const referencedBy = this.referencedBy.get(resolvedPath);

    if (!referencedBy) return [];

    const filesToProcess =
      referencedBy.size === 0 ? [resolvedPath] : Array.from(referencedBy);

    return filesToProcess.flatMap((fp) => {
      const configs: InputConfig[] = [];
      for (const schemas of Object.values(this.processedSchemas)) {
        for (const s of schemas) {
          if (s.inputPath === fp) {
            configs.push({ input: fp, params: s.params });
          }
        }
      }
      return configs.length > 0 ? configs : [{ input: fp, params: {} }];
    });
  };

  public processAllSchemas = async () => {
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
        params: input.params,
        importKey: "",
        downloadUrl: "",
        processedJsonPath: "",
        processedTime: 0,
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

  public getSchemaImports = () =>
    Object.values(this.processedSchemas)
      .flat()
      .filter((s) => s.importKey);

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
        map.set(
          schema.downloadUrl,
          schema.processedJsonPath || schema.inputPath,
        );
      }
    }

    return map;
  };

  private createSchemaPath = (
    inputPath: string,
    versionPath: string,
    apiPath: string,
    params: Record<string, string>,
    config: ApiOptionsConfig | undefined,
  ) => {
    const suffix = paramsSuffix(params);
    const extension = suffix ? ".json" : path.extname(inputPath);

    const fileName =
      config?.schemaDownload?.fileName ??
      this.config.defaults?.apis?.schemaDownload?.fileName ??
      "schema";

    return joinUrl(
      this.config.basePath,
      apiPath,
      versionPath,
      `${fileName}${suffix}${extension}`,
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
