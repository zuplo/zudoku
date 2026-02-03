import type { TypedDocumentString } from "../client/useCreateQuery.js";

/**
 * Types for GraphQL query results
 */
export type MessageResult = {
  name: string | null;
  title: string | null;
  summary: string | null;
  description: string | null;
  contentType: string | null;
  payload: Record<string, unknown> | null;
  headers: Record<string, unknown> | null;
};

export type OperationResult = {
  operationId: string;
  action: "send" | "receive";
  channelAddress: string | null;
  slug: string | null;
  summary: string | null;
  description: string | null;
  protocols: string[];
  messages: MessageResult[];
};

export type SchemaTagResult = {
  name: string | null;
  slug: string | null;
  description: string | null;
  operations: OperationResult[];
  prev: { name: string | null; slug: string | null } | null;
  next: { name: string | null; slug: string | null } | null;
};

export type ServerResult = {
  host: string;
  protocol: string;
  protocolVersion: string | null;
  pathname: string | null;
  description: string | null;
};

export type SchemaResult = {
  asyncapi: string;
  title: string;
  version: string;
  description: string | null;
  servers: ServerResult[];
  tags: { name: string | null; slug: string | null }[];
};

/**
 * Query to fetch all tags (for navigation)
 */
export type AsyncApiSchemaQueryResult = {
  schema: SchemaResult;
};

export const AsyncApiSchemaQuery = `
  query AsyncApiSchema {
    schema {
      asyncapi
      title
      version
      description
      servers {
        host
        protocol
        protocolVersion
        pathname
        description
      }
      tags {
        name
        slug
      }
    }
  }
` as TypedDocumentString<AsyncApiSchemaQueryResult, Record<string, never>>;

/**
 * Query to fetch operations for a specific tag
 */
export type OperationsForTagQueryResult = {
  schema: {
    asyncapi: string;
    title: string;
    version: string;
    description: string | null;
    servers: ServerResult[];
    tag: SchemaTagResult | null;
  };
};

export type OperationsForTagQueryVariables = {
  tag?: string | null;
};

export const OperationsForTagQuery = `
  query OperationsForTag($tag: String) {
    schema {
      asyncapi
      title
      version
      description
      servers {
        host
        protocol
        protocolVersion
        pathname
        description
      }
      tag(slug: $tag) {
        name
        slug
        description
        operations {
          operationId
          action
          channelAddress
          slug
          summary
          description
          protocols
          messages {
            name
            title
            summary
            description
            contentType
            payload
            headers
          }
        }
        prev {
          name
          slug
        }
        next {
          name
          slug
        }
      }
    }
  }
` as TypedDocumentString<
  OperationsForTagQueryResult,
  OperationsForTagQueryVariables
>;

/**
 * Query to fetch all operations (untagged)
 */
export type AllOperationsQueryResult = {
  schema: {
    asyncapi: string;
    title: string;
    version: string;
    description: string | null;
    operations: OperationResult[];
  };
};

export const AllOperationsQuery = `
  query AllOperations {
    schema {
      asyncapi
      title
      version
      description
      operations {
        operationId
        action
        channelAddress
        slug
        summary
        description
        protocols
        messages {
          name
          title
          summary
          description
          contentType
          payload
          headers
        }
      }
    }
  }
` as TypedDocumentString<AllOperationsQueryResult, Record<string, never>>;
