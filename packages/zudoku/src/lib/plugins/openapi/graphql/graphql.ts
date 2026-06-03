/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";
export type ParameterIn = "cookie" | "header" | "path" | "query";

export type SchemaType = "file" | "raw" | "url";

export type SecuritySchemeIn = "cookie" | "header" | "query";

export type SecuritySchemeType =
  | "apiKey"
  | "http"
  | "mutualTLS"
  | "oauth2"
  | "openIdConnect";

export type ServersQueryQueryVariables = Exact<{
  input: any;
  type: SchemaType;
}>;

export type ServersQueryQuery = {
  schema: { url: string | null; servers: Array<{ url: string }> };
};

export type OperationsFragmentFragment = {
  slug: string;
  summary: string | null;
  method: string;
  description: string | null;
  operationId: string | null;
  contentTypes: Array<string>;
  path: string;
  deprecated: boolean | null;
  extensions: any;
  servers: Array<{ url: string; description: string | null }>;
  parameters: Array<{
    name: string;
    in: ParameterIn;
    description: string | null;
    required: boolean | null;
    schema: any;
    style: string | null;
    explode: boolean | null;
    allowReserved: boolean | null;
    examples: Array<{
      name: string;
      description: string | null;
      externalValue: string | null;
      value: any;
      summary: string | null;
    }> | null;
  }> | null;
  security: Array<{
    schemes: Array<{
      scopes: Array<string>;
      scheme: {
        name: string;
        type: SecuritySchemeType;
        description: string | null;
        in: SecuritySchemeIn | null;
        paramName: string | null;
        scheme: string | null;
        bearerFormat: string | null;
        openIdConnectUrl: string | null;
        flows: {
          implicit: {
            authorizationUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
          password: {
            tokenUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
          clientCredentials: {
            tokenUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
          authorizationCode: {
            authorizationUrl: string | null;
            tokenUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
        } | null;
      };
    }>;
  }> | null;
  requestBody: {
    description: string | null;
    required: boolean | null;
    content: Array<{
      mediaType: string;
      schema: any;
      encoding: Array<{ name: string }> | null;
      examples: Array<{
        name: string;
        description: string | null;
        externalValue: string | null;
        value: any;
        summary: string | null;
      }> | null;
    }> | null;
  } | null;
  responses: Array<{
    statusCode: string;
    links: any;
    description: string | null;
    content: Array<{
      mediaType: string;
      schema: any;
      examples: Array<{
        name: string;
        description: string | null;
        externalValue: string | null;
        value: any;
        summary: string | null;
      }> | null;
      encoding: Array<{ name: string }> | null;
    }> | null;
  }>;
} & { " $fragmentName"?: "OperationsFragmentFragment" };

export type OperationsForTagQueryVariables = Exact<{
  input: any;
  type: SchemaType;
  tag?: string | null | undefined;
  untagged?: boolean | null | undefined;
}>;

export type OperationsForTagQuery = {
  schema: {
    description: string | null;
    summary: string | null;
    title: string;
    url: string | null;
    version: string;
    servers: Array<{ url: string }>;
    tag: {
      name: string | null;
      description: string | null;
      extensions: any;
      operations: Array<
        { slug: string } & {
          " $fragmentRefs"?: {
            OperationsFragmentFragment: OperationsFragmentFragment;
          };
        }
      >;
      next: {
        name: string | null;
        slug: string | null;
        extensions: any;
      } | null;
      prev: {
        name: string | null;
        slug: string | null;
        extensions: any;
      } | null;
    } | null;
  };
};

export type SchemaInfoQueryVariables = Exact<{
  input: any;
  type: SchemaType;
}>;

export type SchemaInfoQuery = {
  schema: {
    termsOfService: string | null;
    description: string | null;
    summary: string | null;
    title: string;
    url: string | null;
    version: string;
    servers: Array<{ url: string; description: string | null }>;
    license: {
      name: string;
      url: string | null;
      identifier: string | null;
    } | null;
    externalDocs: { description: string | null; url: string } | null;
    contact: {
      name: string | null;
      url: string | null;
      email: string | null;
    } | null;
    tags: Array<{
      name: string | null;
      description: string | null;
      extensions: any;
    }>;
    components: {
      securitySchemes: Array<{
        name: string;
        type: SecuritySchemeType;
        description: string | null;
        in: SecuritySchemeIn | null;
        paramName: string | null;
        scheme: string | null;
        bearerFormat: string | null;
        openIdConnectUrl: string | null;
        flows: {
          implicit: {
            authorizationUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
          password: {
            tokenUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
          clientCredentials: {
            tokenUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
          authorizationCode: {
            authorizationUrl: string | null;
            tokenUrl: string | null;
            scopes: Array<{ name: string; description: string }>;
          } | null;
        } | null;
      }> | null;
    } | null;
    webhooks: Array<{
      name: string;
      method: string;
      summary: string | null;
      description: string | null;
    }>;
  };
};

export type GetSchemasQueryVariables = Exact<{
  input: any;
  type: SchemaType;
}>;

export type GetSchemasQuery = {
  schema: {
    title: string;
    description: string | null;
    summary: string | null;
    components: {
      schemas: Array<{ name: string; schema: any; extensions: any }> | null;
    } | null;
  };
};

export type GetServerQueryQueryVariables = Exact<{
  input: any;
  type: SchemaType;
}>;

export type GetServerQueryQuery = {
  schema: { url: string | null; servers: Array<{ url: string }> };
};

export type GetNavigationOperationsQueryVariables = Exact<{
  input: any;
  type: SchemaType;
}>;

export type GetNavigationOperationsQuery = {
  schema: {
    extensions: any;
    tags: Array<{
      slug: string | null;
      name: string | null;
      extensions: any;
      operations: Array<{
        summary: string | null;
        slug: string;
        method: string;
        operationId: string | null;
        path: string;
      }>;
    }>;
    components: { schemas: Array<{ __typename: "SchemaItem" }> | null } | null;
  };
};

export type SchemaWarmupQueryVariables = Exact<{
  input: any;
  type: SchemaType;
}>;

export type SchemaWarmupQuery = { schema: { openapi: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<
    DocumentTypeDecoration<TResult, TVariables>["__apiType"]
  >;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const OperationsFragmentFragmentDoc = new TypedDocumentString(
  `
    fragment OperationsFragment on OperationItem {
  slug
  summary
  method
  description
  operationId
  contentTypes
  path
  deprecated
  extensions
  servers {
    url
    description
  }
  parameters {
    name
    in
    description
    required
    schema
    style
    explode
    allowReserved
    examples {
      name
      description
      externalValue
      value
      summary
    }
  }
  security {
    schemes {
      scopes
      scheme {
        name
        type
        description
        in
        paramName
        scheme
        bearerFormat
        openIdConnectUrl
        flows {
          implicit {
            authorizationUrl
            scopes {
              name
              description
            }
          }
          password {
            tokenUrl
            scopes {
              name
              description
            }
          }
          clientCredentials {
            tokenUrl
            scopes {
              name
              description
            }
          }
          authorizationCode {
            authorizationUrl
            tokenUrl
            scopes {
              name
              description
            }
          }
        }
      }
    }
  }
  requestBody {
    content {
      mediaType
      encoding {
        name
      }
      examples {
        name
        description
        externalValue
        value
        summary
      }
      schema
    }
    description
    required
  }
  responses {
    statusCode
    links
    description
    content {
      examples {
        name
        description
        externalValue
        value
        summary
      }
      mediaType
      encoding {
        name
      }
      schema
    }
  }
}
    `,
  { fragmentName: "OperationsFragment" },
) as unknown as TypedDocumentString<OperationsFragmentFragment, unknown>;
export const ServersQueryDocument = new TypedDocumentString(`
    query ServersQuery($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    url
    servers {
      url
    }
  }
}
    `) as unknown as TypedDocumentString<
  ServersQueryQuery,
  ServersQueryQueryVariables
>;
export const OperationsForTagDocument = new TypedDocumentString(`
    query OperationsForTag($input: JSON!, $type: SchemaType!, $tag: String, $untagged: Boolean) {
  schema(input: $input, type: $type) {
    servers {
      url
    }
    description
    summary
    title
    url
    version
    tag(slug: $tag, untagged: $untagged) {
      name
      description
      operations {
        slug
        ...OperationsFragment
      }
      extensions
      next {
        name
        slug
        extensions
      }
      prev {
        name
        slug
        extensions
      }
    }
  }
}
    fragment OperationsFragment on OperationItem {
  slug
  summary
  method
  description
  operationId
  contentTypes
  path
  deprecated
  extensions
  servers {
    url
    description
  }
  parameters {
    name
    in
    description
    required
    schema
    style
    explode
    allowReserved
    examples {
      name
      description
      externalValue
      value
      summary
    }
  }
  security {
    schemes {
      scopes
      scheme {
        name
        type
        description
        in
        paramName
        scheme
        bearerFormat
        openIdConnectUrl
        flows {
          implicit {
            authorizationUrl
            scopes {
              name
              description
            }
          }
          password {
            tokenUrl
            scopes {
              name
              description
            }
          }
          clientCredentials {
            tokenUrl
            scopes {
              name
              description
            }
          }
          authorizationCode {
            authorizationUrl
            tokenUrl
            scopes {
              name
              description
            }
          }
        }
      }
    }
  }
  requestBody {
    content {
      mediaType
      encoding {
        name
      }
      examples {
        name
        description
        externalValue
        value
        summary
      }
      schema
    }
    description
    required
  }
  responses {
    statusCode
    links
    description
    content {
      examples {
        name
        description
        externalValue
        value
        summary
      }
      mediaType
      encoding {
        name
      }
      schema
    }
  }
}`) as unknown as TypedDocumentString<
  OperationsForTagQuery,
  OperationsForTagQueryVariables
>;
export const SchemaInfoDocument = new TypedDocumentString(`
    query SchemaInfo($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    servers {
      url
      description
    }
    license {
      name
      url
      identifier
    }
    termsOfService
    externalDocs {
      description
      url
    }
    contact {
      name
      url
      email
    }
    description
    summary
    title
    url
    version
    tags {
      name
      description
      extensions
    }
    components {
      securitySchemes {
        name
        type
        description
        in
        paramName
        scheme
        bearerFormat
        openIdConnectUrl
        flows {
          implicit {
            authorizationUrl
            scopes {
              name
              description
            }
          }
          password {
            tokenUrl
            scopes {
              name
              description
            }
          }
          clientCredentials {
            tokenUrl
            scopes {
              name
              description
            }
          }
          authorizationCode {
            authorizationUrl
            tokenUrl
            scopes {
              name
              description
            }
          }
        }
      }
    }
    webhooks {
      name
      method
      summary
      description
    }
  }
}
    `) as unknown as TypedDocumentString<
  SchemaInfoQuery,
  SchemaInfoQueryVariables
>;
export const GetSchemasDocument = new TypedDocumentString(`
    query GetSchemas($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    title
    description
    summary
    components {
      schemas {
        name
        schema
        extensions
      }
    }
  }
}
    `) as unknown as TypedDocumentString<
  GetSchemasQuery,
  GetSchemasQueryVariables
>;
export const GetServerQueryDocument = new TypedDocumentString(`
    query getServerQuery($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    url
    servers {
      url
    }
  }
}
    `) as unknown as TypedDocumentString<
  GetServerQueryQuery,
  GetServerQueryQueryVariables
>;
export const GetNavigationOperationsDocument = new TypedDocumentString(`
    query GetNavigationOperations($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    extensions
    tags {
      slug
      name
      extensions
      operations {
        summary
        slug
        method
        operationId
        path
      }
    }
    components {
      schemas {
        __typename
      }
    }
  }
}
    `) as unknown as TypedDocumentString<
  GetNavigationOperationsQuery,
  GetNavigationOperationsQueryVariables
>;
export const SchemaWarmupDocument = new TypedDocumentString(`
    query SchemaWarmup($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    openapi
  }
}
    `) as unknown as TypedDocumentString<
  SchemaWarmupQuery,
  SchemaWarmupQueryVariables
>;
