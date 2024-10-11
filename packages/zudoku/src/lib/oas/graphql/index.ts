/* eslint-disable @typescript-eslint/no-explicit-any */
import SchemaBuilder from "@pothos/core";
import {
  slugifyWithCounter,
  type CountableSlugify,
} from "@sindresorhus/slugify";
import { GraphQLJSON, GraphQLJSONObject } from "graphql-type-json";
import { createYoga, type YogaServerOptions } from "graphql-yoga";
import { LRUCache } from "lru-cache";
import hashit from "object-hash";
import {
  HttpMethods,
  validate,
  type EncodingObject,
  type ExampleObject,
  type OpenAPIDocument,
  type OperationObject,
  type ParameterObject,
  type PathsObject,
  type SchemaObject,
  type ServerObject,
  type TagObject,
} from "../parser/index.js";

export type {
  EncodingObject,
  ExampleObject,
  OpenAPIDocument,
  OperationObject,
  ParameterObject,
  PathsObject,
  SchemaObject,
  TagObject,
};

type OperationLike = {
  summary?: string | null;
  operationId?: string | null;
  path: string;
  method: string;
};

export const createOperationSlug = (
  slugify: CountableSlugify,
  operation: OperationLike,
  tag?: string,
) => {
  const summary =
    (operation.summary ?? "") +
    (operation.operationId
      ? "-" +
        operation.operationId.slice(0, operation.summary ? Infinity : Infinity)
      : "");

  return slugify(
    (tag ? tag + "-" : "") +
      (summary || `${operation.method}-${operation.path}`),
  );
};

const cache = new LRUCache<string, OpenAPIDocument>({
  ttl: 60 * 10 * 1000,
  ttlAutopurge: true,
  fetchMethod: (_key, _oldValue, { context }) => validate(context as string),
});

const builder = new SchemaBuilder<{
  Scalars: {
    JSON: any;
    JSONObject: any;
  };
  Context: {
    schema: OpenAPIDocument;
  };
}>({});

const JSONScalar = builder.addScalarType("JSON", GraphQLJSON);
const JSONObjectScalar = builder.addScalarType("JSONObject", GraphQLJSONObject);

const getAllTags = (schema: OpenAPIDocument): TagObject[] => {
  const tags = schema.tags ?? [];

  // Extract tags from operations
  const operationTags = Object.values(schema.paths ?? {})
    .flatMap((path) => Object.values(path ?? {}))
    .flatMap((operation) =>
      typeof operation === "object" && "tags" in operation
        ? (operation.tags ?? [])
        : [],
    );

  // Remove duplicates and tags that appear in the schema
  const uniqueOperationTags = [...new Set(operationTags)].filter(
    (tag) => !tags.some((rootTag) => rootTag.name === tag),
  );
  return [...tags, ...uniqueOperationTags.map((tag) => ({ name: tag }))];
};

const getAllOperations = (paths?: PathsObject, tag?: string) => {
  const slugify = slugifyWithCounter();

  return Object.entries(paths ?? {}).flatMap(([path, value]) =>
    HttpMethods.flatMap((method) => {
      if (!value?.[method]) return [];

      const operation = value[method] as OperationObject;
      const pathParameters = value.parameters ?? [];
      const operationParameters = operation.parameters ?? [];

      // parameters are inherited from the parent path object,
      // but can be overridden by their `name` and `in` location
      const parameters = [
        ...pathParameters.filter(
          // remove path parameters that are already defined in the operation
          (pp) =>
            !operationParameters.some(
              (op) => op.name === pp.name && op.in === pp.in,
            ),
        ),
        ...operationParameters,
      ];

      const slugData = {
        summary: operation.summary,
        operationId: operation.operationId,
        path,
        method,
      };

      return {
        ...operation,
        method,
        path,
        parameters,
        tags: operation.tags ?? [],
        slug: createOperationSlug(slugify, slugData, tag),
      };
    }),
  );
};

const SchemaTag = builder.objectRef<TagObject>("SchemaTag").implement({
  fields: (t) => ({
    name: t.exposeString("name", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    operations: t.field({
      type: [OperationItem],
      resolve: (parent, _args, ctx) => {
        const rootTags = getAllTags(ctx.schema).map((tag) => tag.name);

        return getAllOperations(ctx.schema.paths, parent.name).filter((item) =>
          parent.name
            ? item.tags.includes(parent.name)
            : item.tags.length === 0 ||
              // If none of the tags are present in the root tags, then show them here
              item.tags.every((tag) => !rootTags.includes(tag)),
        );
      },
    }),
  }),
});

const ServerItem = builder.objectRef<ServerObject>("Server").implement({
  fields: (t) => ({
    url: t.exposeString("url"),
    description: t.exposeString("description", { nullable: true }),
  }),
});

const PathItem = builder
  .objectRef<{
    path: string;
    methods: typeof HttpMethods;
  }>("PathItem")
  .implement({
    fields: (t) => ({
      path: t.exposeString("path"),
      methods: t.exposeStringList("methods"),
    }),
  });

const TagItem = builder.objectRef<TagObject>("TagItem").implement({
  fields: (t) => ({
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
  }),
});

const EncodingItem = builder
  .objectRef<EncodingObject & { name: string }>("EncodingItem")
  .implement({
    fields: (t) => ({
      name: t.exposeString("name"),
      contentType: t.exposeString("contentType", { nullable: true }),
      headers: t.expose("headers", { type: JSONObjectScalar, nullable: true }),
      style: t.exposeString("style", { nullable: true }),
      explode: t.exposeBoolean("explode", { nullable: true }),
      allowReserved: t.exposeBoolean("allowReserved", { nullable: true }),
    }),
  });

const ExampleItem = builder
  .objectRef<ExampleObject & { name: string }>("ExampleItem")
  .implement({
    fields: (t) => ({
      name: t.exposeString("name"),
      summary: t.exposeString("summary", { nullable: true }),
      description: t.exposeString("description", { nullable: true }),
      value: t.exposeString("value", { nullable: true }),
      externalValue: t.exposeString("externalValue", { nullable: true }),
    }),
  });

const ParameterIn = builder.enumType("ParameterIn", {
  values: ["query", "header", "path", "cookie"] as const,
});

const ParameterItem = builder
  .objectRef<ParameterObject>("ParameterItem")
  .implement({
    fields: (t) => ({
      name: t.exposeString("name"),
      in: t.field({
        type: ParameterIn,
        resolve: (parent) => parent.in as typeof ParameterIn.$inferType,
      }),
      description: t.exposeString("description", { nullable: true }),
      required: t.exposeBoolean("required", { nullable: true }),
      deprecated: t.exposeBoolean("deprecated", { nullable: true }),
      allowEmptyValue: t.exposeBoolean("allowEmptyValue", { nullable: true }),
      style: t.exposeString("style", { nullable: true }),
      explode: t.exposeBoolean("explode", { nullable: true }),
      allowReserved: t.exposeBoolean("allowReserved", { nullable: true }),
      examples: t.field({
        type: [ExampleItem],
        resolve: (parent) =>
          Object.entries(parent.examples ?? {}).map(([name, value]) => ({
            name,
            ...(typeof value === "string" ? { value } : value),
          })),
        nullable: true,
      }),
      schema: t.expose("schema", { type: JSONScalar, nullable: true }),
    }),
  });

const MediaTypeItem = builder
  .objectRef<{
    mediaType: string;
    schema: any;
    examples: Array<ExampleObject & { name: string }>;
    encoding?: Array<EncodingObject & { name: string }>;
  }>("MediaTypeObject")
  .implement({
    fields: (t) => ({
      mediaType: t.exposeString("mediaType"),
      schema: t.expose("schema", { type: JSONScalar, nullable: true }),
      examples: t.expose("examples", { type: [ExampleItem], nullable: true }),
      encoding: t.expose("encoding", { type: [EncodingItem], nullable: true }),
    }),
  });

const RequestBodyObject = builder
  .objectRef<{
    description?: string;
    required?: boolean;
    content: Array<{
      mediaType: string;
      schema: any;
      examples: Array<ExampleObject & { name: string }>;
      encoding?: Array<EncodingObject & { name: string }>;
    }>;
  }>("RequestBodyObject")
  .implement({
    fields: (t) => ({
      description: t.exposeString("description", { nullable: true }),
      content: t.expose("content", { type: [MediaTypeItem], nullable: true }),
      required: t.exposeBoolean("required", { nullable: true }),
    }),
  });

const ResponseItem = builder
  .objectRef<{
    statusCode: string;
    description?: string;
    content: Array<{
      mediaType: string;
      schema: any;
      examples: Array<ExampleObject & { name: string }>;
    }>;
    headers?: any;
    links?: any;
  }>("ResponseItem")
  .implement({
    fields: (t) => ({
      statusCode: t.exposeString("statusCode"),
      description: t.exposeString("description", { nullable: true }),
      content: t.expose("content", { type: [MediaTypeItem], nullable: true }),
      headers: t.expose("headers", { type: JSONScalar, nullable: true }),
      links: t.expose("links", { type: JSONScalar, nullable: true }),
    }),
  });

const OperationItem = builder
  .objectRef<
    OperationObject & { path: string; method: string; slug: string }
  >("OperationItem")
  .implement({
    fields: (t) => ({
      slug: t.exposeString("slug"),
      path: t.exposeString("path"),
      method: t.exposeString("method"),
      operationId: t.exposeString("operationId", { nullable: true }),
      summary: t.exposeString("summary", { nullable: true }),
      description: t.exposeString("description", { nullable: true }),
      contentTypes: t.stringList({
        resolve: (parent) => Object.keys(parent.requestBody?.content ?? {}),
      }),
      parameters: t.expose("parameters", {
        type: [ParameterItem],
        nullable: true,
      }),
      requestBody: t.field({
        type: RequestBodyObject,
        resolve: (parent) => ({
          description: parent.requestBody?.description,
          required: parent.requestBody?.required,
          content: Object.entries(parent.requestBody?.content ?? {}).map(
            ([mediaType, content]) => ({
              mediaType,
              schema: content.schema,
              examples: Object.entries(content.examples ?? {}).map(
                ([name, value]) => ({ name, ...value }),
              ),
              encoding: Object.entries(content.encoding ?? {}).map(
                ([name, value]) => ({ name, ...value }),
              ),
            }),
          ),
        }),
        nullable: true,
      }),
      responses: t.field({
        type: [ResponseItem],
        resolve: (parent) => {
          return Object.entries(parent.responses ?? {}).map(
            ([statusCode, response]) => ({
              statusCode,
              description: response.description,
              content: Object.entries(response.content ?? {}).map(
                ([mediaType, mediaTypeObject]) => ({
                  mediaType,
                  schema: mediaTypeObject.schema,
                  examples: Object.entries(mediaTypeObject.examples ?? {}).map(
                    ([name, value]) => ({ name, ...value }),
                  ),
                }),
              ),
              headers: response.headers,
              links: response.links,
            }),
          );
        },
      }),
      tags: t.field({
        type: [TagItem],
        resolve: (parent, _, ctx) =>
          parent.tags?.map((tag) => ({
            name: tag,
            description: ctx.schema.tags?.find((t) => t.name === tag)
              ?.description,
          })),
        nullable: true,
      }),
      deprecated: t.exposeBoolean("deprecated", { nullable: true }),
    }),
  });

const Schema = builder.objectRef<OpenAPIDocument>("Schema").implement({
  fields: (t) => ({
    openapi: t.string({ resolve: (root) => root.openapi }),
    url: t.string({ resolve: (root) => root.servers?.at(0)?.url ?? "/" }),
    servers: t.field({
      type: [ServerItem],
      resolve: (root) => root.servers ?? [],
    }),
    title: t.string({ resolve: (root) => root.info.title }),
    version: t.string({ resolve: (root) => root.info.version }),
    description: t.string({
      resolve: (root) => root.info.description,
      nullable: true,
    }),
    paths: t.field({
      type: [PathItem],
      resolve: (root) =>
        Object.entries(root.paths ?? {}).map(([path, value]) => ({
          path,
          methods: Object.keys(value!) as typeof HttpMethods,
        })),
    }),
    tags: t.field({
      args: {
        name: t.arg.string(),
      },
      type: [SchemaTag],
      resolve: (root, args) => {
        const tags = [...getAllTags(root), { name: "" }];
        return args.name ? tags.filter((tag) => tag.name === args.name) : tags;
      },
    }),
    operations: t.field({
      type: [OperationItem],
      args: {
        path: t.arg.string(),
        method: t.arg.string(),
        operationId: t.arg.string(),
        tag: t.arg.string(),
      },
      resolve: (parent, args) =>
        getAllOperations(parent.paths).filter(
          (item) =>
            (!args.operationId || item.operationId === args.operationId) &&
            (!args.path || item.path === args.path) &&
            (!args.method || item.method === args.method) &&
            (!args.tag || item.tags.includes(args.tag)),
        ),
    }),
  }),
});

const loadOpenAPISchema = async (input: NonNullable<unknown>) => {
  const hash = hashit(input);
  return await cache.forceFetch(hash, { context: input });
};

const SchemaSource = builder.enumType("SchemaType", {
  values: ["url", "file", "raw"] as const,
});

builder.queryType({
  fields: (t) => ({
    // https://tan-cow-main-bce8a06.d2.zuplo.dev/openapi
    schema: t.field({
      type: Schema,
      args: {
        type: t.arg({ type: SchemaSource, required: true }),
        input: t.arg({ type: JSONScalar, required: true }),
      },
      resolve: async (_, args, ctx) => {
        const schema = await loadOpenAPISchema(args.input!);
        // for easier access of the whole schema in children resolvers
        ctx.schema = schema;

        return schema;
      },
    }),
  }),
});

export const schema = builder.toSchema();

export const createGraphQLServer = (
  options?: Omit<YogaServerOptions<any, any>, "schema">,
) => createYoga({ schema, ...options });
