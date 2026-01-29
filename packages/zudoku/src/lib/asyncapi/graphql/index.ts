// biome-ignore-all lint/suspicious/noExplicitAny: Allow any type
import SchemaBuilder from "@pothos/core";
import {
  type CountableSlugify,
  slugifyWithCounter,
} from "@sindresorhus/slugify";
import { GraphQLJSON, GraphQLJSONObject } from "graphql-type-json";
import { createYoga, type YogaServerOptions } from "graphql-yoga";
import { GraphQLJSONSchema } from "../../oas/graphql/circular.js";
import { validate } from "../parser/index.js";
import type {
  AsyncAPIDocument,
  ChannelObject,
  MessageObject,
  OperationObject,
  ServerObject,
  TagObject,
} from "../types.js";

export type {
  AsyncAPIDocument,
  ChannelObject,
  MessageObject,
  OperationObject,
  ServerObject,
  TagObject,
};

type OperationLike = {
  summary?: string | null;
  operationId?: string;
  action: "send" | "receive";
  channelAddress?: string;
};

export const createOperationSlug = (
  slugify: CountableSlugify,
  operation: OperationLike,
) => {
  const summary =
    operation.summary ||
    operation.operationId ||
    `${operation.action}-${operation.channelAddress}`;

  return slugify(summary);
};

export type SchemaImport = () => Promise<{
  schema: AsyncAPIDocument;
  slugs: ReturnType<typeof getAllSlugs>;
}>;

export type SchemaImports = Record<string, SchemaImport>;

type Context = {
  schema: AsyncAPIDocument;
  operations: GraphQLOperationObject[];
  schemaImports?: SchemaImports;
  tags: ReturnType<typeof getAllTags>;
  slugs: ReturnType<typeof getAllSlugs>;
};

const builder = new SchemaBuilder<{
  DefaultFieldNullability: false;
  Scalars: {
    JSON: any;
    JSONObject: any;
    JSONSchema: any;
  };
  Context: Context;
}>({
  defaultFieldNullability: false,
});

type GraphQLOperationObject = OperationObject & {
  operationId: string;
  channelAddress?: string;
  slug?: string;
  parentTag?: string;
  protocols?: string[];
};

const JSONScalar = builder.addScalarType("JSON", GraphQLJSON);
const JSONObjectScalar = builder.addScalarType("JSONObject", GraphQLJSONObject);
const JSONSchemaScalar = builder.addScalarType("JSONSchema", GraphQLJSONSchema);

const resolveExtensions = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => key.startsWith("x-")),
  );

/**
 * Get all tags from the AsyncAPI document
 */
export const getAllTags = (
  schema: AsyncAPIDocument,
  slugs: ReturnType<typeof getAllSlugs>["tags"],
): Array<Omit<TagObject, "name"> & { name?: string; slug?: string }> => {
  const rootTags = schema.info?.tags ?? [];
  const operationTags = new Set(
    Object.values(schema.operations ?? {})
      .flatMap((op) => op.tags ?? [])
      .map((tag) => tag.name),
  );

  const hasUntaggedOperations = Object.values(schema.operations ?? {}).some(
    (op) => !op.tags?.length,
  );

  const result = [
    // Keep root tags that are actually used in operations
    ...rootTags
      .filter((tag) => operationTags.has(tag.name))
      .map((tag) => ({ ...tag, slug: slugs[tag.name] })),
    // Add tags found in operations but not defined in root tags
    ...Array.from(operationTags)
      .filter((tag) => !rootTags.some((rt) => rt.name === tag))
      .map((tag) => ({ name: tag, slug: slugs[tag] })),
    // Add untagged operations if there are any
    ...(hasUntaggedOperations ? [{ name: undefined, slug: undefined }] : []),
  ];

  return result;
};

/**
 * Generate slugs for all operations and tags
 */
export const getAllSlugs = (
  ops: GraphQLOperationObject[],
  schemaTags: TagObject[] = [],
) => {
  const slugify = slugifyWithCounter();

  const tags = Array.from(
    new Set([
      ...ops.flatMap((op) => op.tags?.map((t) => t.name) ?? []),
      ...schemaTags.map((tag) => tag.name),
    ]),
  );

  return {
    operations: Object.fromEntries(
      ops.map((op) => [
        getOperationSlugKey(op),
        createOperationSlug(slugify, op),
      ]),
    ),
    tags: Object.fromEntries(tags.map((tag) => [tag, slugify(tag)])),
  };
};

const getOperationSlugKey = (op: GraphQLOperationObject) =>
  [op.channelAddress, op.action, op.operationId, op.summary]
    .filter(Boolean)
    .join("-");

/**
 * Detect protocols from channel and server objects
 */
const detectProtocols = (
  channel: ChannelObject | undefined,
  servers: Record<string, ServerObject> | undefined,
  serverRefs: any[] = [],
): string[] => {
  const protocols = new Set<string>();

  // From channel bindings
  if (channel?.bindings) {
    Object.keys(channel.bindings).forEach((protocol) => {
      if (protocol !== "__$ref" && channel.bindings?.[protocol]) {
        protocols.add(protocol);
      }
    });
  }

  // From server refs
  serverRefs.forEach((ref) => {
    const serverName =
      typeof ref === "string"
        ? ref.replace("#/servers/", "")
        : ref.$ref?.replace("#/servers/", "");
    const server = servers?.[serverName];
    if (server?.protocol) {
      protocols.add(server.protocol);
    }
  });

  return Array.from(protocols);
};

/**
 * Get all operations from the AsyncAPI document with enriched data
 */
export const getAllOperations = (
  operations?: Record<string, OperationObject>,
  channels?: Record<string, ChannelObject>,
  servers?: Record<string, ServerObject>,
): GraphQLOperationObject[] => {
  return Object.entries(operations ?? {}).map(([operationId, operation]) => {
    // Resolve channel reference
    const channelRef =
      typeof operation.channel === "string"
        ? operation.channel.replace("#/channels/", "")
        : operation.channel.$ref?.replace("#/channels/", "");

    const channel = channels?.[channelRef || ""];

    // Detect protocols
    const protocols = detectProtocols(channel, servers, channel?.servers ?? []);

    return {
      ...operation,
      operationId,
      channelAddress: channel?.address ?? undefined,
      protocols,
      parentTag: operation.tags?.[0]?.name,
    };
  });
};

// GraphQL Types

const ActionEnum = builder.enumType("Action", {
  values: ["send", "receive"] as const,
});

const ServerItem = builder.objectRef<ServerObject>("ServerItem");
const SchemaTag = builder.objectRef<
  Omit<TagObject, "name"> & {
    name?: string;
    slug?: string;
    prev?: any;
    next?: any;
  }
>("SchemaTag");
const Channel = builder.objectRef<ChannelObject>("Channel");
const Message = builder.objectRef<MessageObject>("Message");
const OperationItem =
  builder.objectRef<GraphQLOperationObject>("OperationItem");
const Schema = builder.objectRef<AsyncAPIDocument>("Schema");

ServerItem.implement({
  fields: (t) => ({
    host: t.exposeString("host"),
    protocol: t.exposeString("protocol"),
    protocolVersion: t.string({
      nullable: true,
      resolve: (server) => server.protocolVersion ?? null,
    }),
    pathname: t.string({
      nullable: true,
      resolve: (server) => server.pathname ?? null,
    }),
    description: t.string({
      nullable: true,
      resolve: (server) => server.description ?? null,
    }),
  }),
});

SchemaTag.implement({
  fields: (t) => ({
    name: t.string({
      nullable: true,
      resolve: (tag) => tag.name ?? null,
    }),
    slug: t.string({
      nullable: true,
      resolve: (tag) => tag.slug ?? null,
    }),
    description: t.string({
      nullable: true,
      resolve: (tag) => tag.description ?? null,
    }),
    operations: t.field({
      type: [OperationItem],
      resolve: (tag, _, ctx) =>
        ctx.operations.filter((op) =>
          tag.name
            ? op.tags?.some((t) => t.name === tag.name)
            : !op.tags?.length,
        ),
    }),
    prev: t.field({
      type: SchemaTag,
      nullable: true,
      resolve: (tag, _, ctx) => {
        if (!tag.slug) return null;
        const tagIndex = ctx.tags.findIndex((t) => t.slug === tag.slug);
        return tagIndex > 0 ? ctx.tags[tagIndex - 1] : null;
      },
    }),
    next: t.field({
      type: SchemaTag,
      nullable: true,
      resolve: (tag, _, ctx) => {
        if (!tag.slug) return null;
        const tagIndex = ctx.tags.findIndex((t) => t.slug === tag.slug);
        return tagIndex < ctx.tags.length - 1 ? ctx.tags[tagIndex + 1] : null;
      },
    }),
  }),
});

Message.implement({
  fields: (t) => ({
    name: t.string({
      nullable: true,
      resolve: (message) => message.name ?? null,
    }),
    title: t.string({
      nullable: true,
      resolve: (message) => message.title ?? null,
    }),
    summary: t.string({
      nullable: true,
      resolve: (message) => message.summary ?? null,
    }),
    description: t.string({
      nullable: true,
      resolve: (message) => message.description ?? null,
    }),
    contentType: t.string({
      nullable: true,
      resolve: (message) => message.contentType ?? null,
    }),
    payload: t.field({
      type: JSONSchemaScalar,
      nullable: true,
      resolve: (message) => message.payload ?? null,
    }),
    headers: t.field({
      type: JSONSchemaScalar,
      nullable: true,
      resolve: (message) => message.headers ?? null,
    }),
  }),
});

Channel.implement({
  fields: (t) => ({
    address: t.string({
      nullable: true,
      resolve: (channel) => channel.address ?? null,
    }),
    title: t.string({
      nullable: true,
      resolve: (channel) => channel.title ?? null,
    }),
    summary: t.string({
      nullable: true,
      resolve: (channel) => channel.summary ?? null,
    }),
    description: t.string({
      nullable: true,
      resolve: (channel) => channel.description ?? null,
    }),
    messages: t.field({
      type: [Message],
      resolve: (channel) => Object.values(channel.messages ?? {}),
    }),
    servers: t.field({
      type: [ServerItem],
      resolve: (channel, _, ctx) => {
        const serverRefs = channel.servers ?? [];
        return serverRefs
          .map((ref) => {
            const serverName =
              typeof ref === "string"
                ? ref.replace("#/servers/", "")
                : ref.$ref?.replace("#/servers/", "");
            return ctx.schema.servers?.[serverName || ""];
          })
          .filter((s): s is ServerObject => !!s);
      },
    }),
  }),
});

OperationItem.implement({
  fields: (t) => ({
    operationId: t.exposeString("operationId"),
    action: t.field({
      type: ActionEnum,
      resolve: (op) => op.action,
    }),
    channelAddress: t.string({
      nullable: true,
      resolve: (op) => op.channelAddress ?? null,
    }),
    slug: t.string({
      nullable: true,
      resolve: (op) => op.slug ?? null,
    }),
    summary: t.string({
      nullable: true,
      resolve: (op) => op.summary ?? null,
    }),
    description: t.string({
      nullable: true,
      resolve: (op) => op.description ?? null,
    }),
    protocols: t.stringList({
      resolve: (op) => op.protocols ?? [],
    }),
    messages: t.field({
      type: [Message],
      resolve: (op, _, ctx) => {
        const messageRefs = op.messages ?? [];
        return messageRefs
          .map((ref) => {
            const messageName =
              typeof ref === "string"
                ? ref.replace("#/components/messages/", "")
                : ref.$ref?.replace("#/components/messages/", "");
            return ctx.schema.components?.messages?.[messageName || ""];
          })
          .filter((m): m is MessageObject => !!m);
      },
    }),
  }),
});

Schema.implement({
  fields: (t) => ({
    asyncapi: t.exposeString("asyncapi"),
    title: t.string({
      resolve: (schema) => schema.info.title,
    }),
    version: t.string({
      resolve: (schema) => schema.info.version,
    }),
    description: t.string({
      nullable: true,
      resolve: (schema) => schema.info.description ?? null,
    }),
    servers: t.field({
      type: [ServerItem],
      resolve: (schema) => Object.values(schema.servers ?? {}),
    }),
    tags: t.field({
      type: [SchemaTag],
      resolve: (_, __, ctx) => ctx.tags,
    }),
    tag: t.field({
      type: SchemaTag,
      nullable: true,
      args: {
        slug: t.arg.string(),
        name: t.arg.string({ required: false }),
      },
      resolve: (_, args, ctx) =>
        ctx.tags.find(
          (tag) =>
            tag.slug === args.slug ||
            (args.name && tag.name === args.name) ||
            (args.slug === undefined && tag.name === undefined),
        ) ?? null,
    }),
    operations: t.field({
      type: [OperationItem],
      args: {
        action: t.arg({
          type: ActionEnum,
          required: false,
        }),
        tag: t.arg.string({ required: false }),
      },
      resolve: (_, args, ctx) => {
        let ops = ctx.operations;

        if (args.action) {
          ops = ops.filter((op) => op.action === args.action);
        }

        if (args.tag) {
          ops = ops.filter((op) => op.tags?.some((t) => t.name === args.tag));
        }

        return ops;
      },
    }),
    extensions: t.field({
      type: JSONObjectScalar,
      resolve: (schema) => resolveExtensions(schema as any),
    }),
  }),
});

builder.queryType({
  fields: (t) => ({
    schema: t.field({
      type: Schema,
      resolve: (_, __, ctx) => ctx.schema,
    }),
  }),
});

/**
 * Create a GraphQL server for querying AsyncAPI documents
 */
export const createGraphQLServer = (
  schemaInputs: unknown | SchemaImports,
  options?: YogaServerOptions<Context, Context>,
) => {
  return createYoga({
    schema: builder.toSchema(),
    ...options,
    context: async (ctx) => {
      // If schemaInputs is a function (SchemaImports), use it
      if (typeof schemaInputs === "function") {
        const schemaImport = schemaInputs as SchemaImport;
        const { schema, slugs } = await schemaImport();
        const operations = getAllOperations(
          schema.operations,
          schema.channels,
          schema.servers,
        );

        return {
          ...ctx,
          schema,
          operations,
          slugs,
          tags: getAllTags(schema, slugs.tags),
        };
      }

      // If schemaInputs is an object (SchemaImports), use default
      if (typeof schemaInputs === "object" && schemaInputs !== null) {
        const imports = schemaInputs as SchemaImports;
        const defaultImport = imports.default;

        if (defaultImport) {
          const { schema, slugs } = await defaultImport();
          const operations = getAllOperations(
            schema.operations,
            schema.channels,
            schema.servers,
          );

          return {
            ...ctx,
            schema,
            operations,
            slugs,
            tags: getAllTags(schema, slugs.tags),
            schemaImports: imports,
          };
        }
      }

      // Otherwise, validate the input directly
      const schema = await validate(schemaInputs);
      const operations = getAllOperations(
        schema.operations,
        schema.channels,
        schema.servers,
      );
      const slugs = getAllSlugs(operations, schema.info?.tags ?? []);

      return {
        ...ctx,
        schema,
        operations,
        slugs,
        tags: getAllTags(schema, slugs.tags),
      };
    },
  });
};
