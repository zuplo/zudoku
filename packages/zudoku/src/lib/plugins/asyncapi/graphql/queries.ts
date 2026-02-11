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
  examples: MessageExampleResult[];
};

export type MessageExampleResult = {
  name: string | null;
  summary: string | null;
  headers: Record<string, unknown> | null;
  payload: unknown;
};

export type ChannelParameterResult = {
  name: string;
  description: string | null;
  enum: string[] | null;
  default: string | null;
  examples: string[] | null;
  location: string | null;
};

export type SecuritySchemeResult = {
  name: string;
  type: string;
  description: string | null;
  in: string | null;
  scheme: string | null;
  bearerFormat: string | null;
  openIdConnectUrl: string | null;
};

export type SecurityRequirementResult = Record<string, string[]>;

export type OperationResult = {
  operationId: string;
  action: "send" | "receive";
  channelAddress: string | null;
  channelTitle: string | null;
  channelDescription: string | null;
  channelParameters: ChannelParameterResult[];
  slug: string | null;
  summary: string | null;
  description: string | null;
  protocols: string[];
  messages: MessageResult[];
  security: SecurityRequirementResult[] | null;
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
  securitySchemes: SecuritySchemeResult[];
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
      securitySchemes {
        name
        type
        description
        in
        scheme
        bearerFormat
        openIdConnectUrl
      }
    }
  }
` as TypedDocumentString<AsyncApiSchemaQueryResult, Record<string, never>>;

/**
 * Navigation operation result (minimal for sidebar)
 */
export type NavOperationResult = {
  operationId: string;
  action: "send" | "receive";
  channelAddress: string | null;
  channelTitle: string | null;
  channelDescription: string | null;
  slug: string | null;
  summary: string | null;
  protocols: string[];
};

/**
 * Query to fetch tags with operations for navigation sidebar
 */
export type NavigationQueryResult = {
  schema: {
    title: string;
    tags: {
      name: string | null;
      slug: string | null;
      operations: NavOperationResult[];
    }[];
    operations: NavOperationResult[];
  };
};

export const NavigationQuery = `
  query Navigation {
    schema {
      title
      tags {
        name
        slug
        operations {
          operationId
          action
          channelAddress
          channelTitle
          channelDescription
          slug
          summary
          protocols
        }
      }
      operations {
        operationId
        action
        channelAddress
        channelTitle
        channelDescription
        slug
        summary
        protocols
      }
    }
  }
` as TypedDocumentString<NavigationQueryResult, Record<string, never>>;

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
    securitySchemes: SecuritySchemeResult[];
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
      securitySchemes {
        name
        type
        description
        in
        scheme
        bearerFormat
        openIdConnectUrl
      }
      tag(slug: $tag) {
        name
        slug
        description
        operations {
          operationId
          action
          channelAddress
          channelTitle
          channelDescription
          channelParameters {
            name
            description
            enum
            default
            examples
            location
          }
          slug
          summary
          description
          protocols
          security
          messages {
            name
            title
            summary
            description
            contentType
            payload
            headers
            examples {
              name
              summary
              headers
              payload
            }
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
        channelTitle
        channelDescription
        channelParameters {
          name
          description
          enum
          default
          examples
          location
        }
        slug
        summary
        description
        protocols
        security
        messages {
          name
          title
          summary
          description
          contentType
          payload
          headers
          examples {
            name
            summary
            headers
            payload
          }
        }
      }
    }
  }
` as TypedDocumentString<AllOperationsQueryResult, Record<string, never>>;
