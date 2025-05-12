/* eslint-disable */
import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any };
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any };
  /** OpenAPI schema scalar type that handles circular references */
  JSONSchema: { input: any; output: any };
};

export type Components = {
  __typename?: "Components";
  schemas?: Maybe<Array<SchemaItem>>;
};

export type EncodingItem = {
  __typename?: "EncodingItem";
  allowReserved?: Maybe<Scalars["Boolean"]["output"]>;
  contentType?: Maybe<Scalars["String"]["output"]>;
  explode?: Maybe<Scalars["Boolean"]["output"]>;
  headers?: Maybe<Scalars["JSONObject"]["output"]>;
  name: Scalars["String"]["output"];
  style?: Maybe<Scalars["String"]["output"]>;
};

export type ExampleItem = {
  __typename?: "ExampleItem";
  description?: Maybe<Scalars["String"]["output"]>;
  externalValue?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  summary?: Maybe<Scalars["String"]["output"]>;
  value?: Maybe<Scalars["JSON"]["output"]>;
};

export type MediaTypeObject = {
  __typename?: "MediaTypeObject";
  encoding?: Maybe<Array<EncodingItem>>;
  examples?: Maybe<Array<ExampleItem>>;
  mediaType: Scalars["String"]["output"];
  schema?: Maybe<Scalars["JSONSchema"]["output"]>;
};

export type OperationItem = {
  __typename?: "OperationItem";
  contentTypes: Array<Scalars["String"]["output"]>;
  deprecated?: Maybe<Scalars["Boolean"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  extensions?: Maybe<Scalars["JSONObject"]["output"]>;
  method: Scalars["String"]["output"];
  operationId?: Maybe<Scalars["String"]["output"]>;
  parameters?: Maybe<Array<ParameterItem>>;
  path: Scalars["String"]["output"];
  requestBody?: Maybe<RequestBodyObject>;
  responses: Array<ResponseItem>;
  slug: Scalars["String"]["output"];
  summary?: Maybe<Scalars["String"]["output"]>;
  tags?: Maybe<Array<TagItem>>;
};

export type ParameterIn = "cookie" | "header" | "path" | "query";

export type ParameterItem = {
  __typename?: "ParameterItem";
  allowEmptyValue?: Maybe<Scalars["Boolean"]["output"]>;
  allowReserved?: Maybe<Scalars["Boolean"]["output"]>;
  deprecated?: Maybe<Scalars["Boolean"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  examples?: Maybe<Array<ExampleItem>>;
  explode?: Maybe<Scalars["Boolean"]["output"]>;
  extensions?: Maybe<Scalars["JSONObject"]["output"]>;
  in: ParameterIn;
  name: Scalars["String"]["output"];
  required?: Maybe<Scalars["Boolean"]["output"]>;
  schema?: Maybe<Scalars["JSONSchema"]["output"]>;
  style?: Maybe<Scalars["String"]["output"]>;
};

export type PathItem = {
  __typename?: "PathItem";
  methods: Array<Scalars["String"]["output"]>;
  path: Scalars["String"]["output"];
};

export type Query = {
  __typename?: "Query";
  schema: Schema;
};

export type QuerySchemaArgs = {
  input: Scalars["JSON"]["input"];
  type: SchemaType;
};

export type RequestBodyObject = {
  __typename?: "RequestBodyObject";
  content?: Maybe<Array<MediaTypeObject>>;
  description?: Maybe<Scalars["String"]["output"]>;
  required?: Maybe<Scalars["Boolean"]["output"]>;
};

export type ResponseItem = {
  __typename?: "ResponseItem";
  content?: Maybe<Array<MediaTypeObject>>;
  description?: Maybe<Scalars["String"]["output"]>;
  extensions?: Maybe<Scalars["JSONObject"]["output"]>;
  headers?: Maybe<Scalars["JSON"]["output"]>;
  links?: Maybe<Scalars["JSON"]["output"]>;
  statusCode: Scalars["String"]["output"];
};

export type Schema = {
  __typename?: "Schema";
  components?: Maybe<Components>;
  description?: Maybe<Scalars["String"]["output"]>;
  extensions?: Maybe<Scalars["JSONObject"]["output"]>;
  openapi: Scalars["String"]["output"];
  operations: Array<OperationItem>;
  paths: Array<PathItem>;
  servers: Array<Server>;
  summary?: Maybe<Scalars["String"]["output"]>;
  tag?: Maybe<SchemaTag>;
  tags: Array<SchemaTag>;
  title: Scalars["String"]["output"];
  url?: Maybe<Scalars["String"]["output"]>;
  version: Scalars["String"]["output"];
};

export type SchemaOperationsArgs = {
  method?: InputMaybe<Scalars["String"]["input"]>;
  operationId?: InputMaybe<Scalars["String"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  tag?: InputMaybe<Scalars["String"]["input"]>;
  untagged?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type SchemaTagArgs = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  slug?: InputMaybe<Scalars["String"]["input"]>;
  untagged?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type SchemaItem = {
  __typename?: "SchemaItem";
  extensions?: Maybe<Scalars["JSONObject"]["output"]>;
  name: Scalars["String"]["output"];
  schema: Scalars["JSONSchema"]["output"];
};

export type SchemaTag = {
  __typename?: "SchemaTag";
  description?: Maybe<Scalars["String"]["output"]>;
  extensions?: Maybe<Scalars["JSONObject"]["output"]>;
  isUntagged: Scalars["Boolean"]["output"];
  name?: Maybe<Scalars["String"]["output"]>;
  next?: Maybe<SchemaTag>;
  operations: Array<OperationItem>;
  prev?: Maybe<SchemaTag>;
  slug?: Maybe<Scalars["String"]["output"]>;
};

export type SchemaType = "file" | "raw" | "url";

export type Server = {
  __typename?: "Server";
  description?: Maybe<Scalars["String"]["output"]>;
  url: Scalars["String"]["output"];
};

export type TagItem = {
  __typename?: "TagItem";
  description?: Maybe<Scalars["String"]["output"]>;
  extensions?: Maybe<Scalars["JSONObject"]["output"]>;
  name: Scalars["String"]["output"];
};

export type ServersQueryQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
}>;

export type ServersQueryQuery = {
  __typename?: "Query";
  schema: {
    __typename?: "Schema";
    url?: string | null;
    servers: Array<{ __typename?: "Server"; url: string }>;
  };
};

export type OperationsFragmentFragment = {
  __typename?: "OperationItem";
  slug: string;
  summary?: string | null;
  method: string;
  description?: string | null;
  operationId?: string | null;
  contentTypes: Array<string>;
  path: string;
  deprecated?: boolean | null;
  extensions?: any | null;
  parameters?: Array<{
    __typename?: "ParameterItem";
    name: string;
    in: ParameterIn;
    description?: string | null;
    required?: boolean | null;
    schema?: any | null;
    style?: string | null;
    explode?: boolean | null;
    examples?: Array<{
      __typename?: "ExampleItem";
      name: string;
      description?: string | null;
      externalValue?: string | null;
      value?: any | null;
      summary?: string | null;
    }> | null;
  }> | null;
  requestBody?: {
    __typename?: "RequestBodyObject";
    description?: string | null;
    required?: boolean | null;
    content?: Array<{
      __typename?: "MediaTypeObject";
      mediaType: string;
      schema?: any | null;
      encoding?: Array<{ __typename?: "EncodingItem"; name: string }> | null;
      examples?: Array<{
        __typename?: "ExampleItem";
        name: string;
        description?: string | null;
        externalValue?: string | null;
        value?: any | null;
        summary?: string | null;
      }> | null;
    }> | null;
  } | null;
  responses: Array<{
    __typename?: "ResponseItem";
    statusCode: string;
    links?: any | null;
    description?: string | null;
    content?: Array<{
      __typename?: "MediaTypeObject";
      mediaType: string;
      schema?: any | null;
      examples?: Array<{
        __typename?: "ExampleItem";
        name: string;
        description?: string | null;
        externalValue?: string | null;
        value?: any | null;
        summary?: string | null;
      }> | null;
      encoding?: Array<{ __typename?: "EncodingItem"; name: string }> | null;
    }> | null;
  }>;
} & { " $fragmentName"?: "OperationsFragmentFragment" };

export type SchemaWarmupQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
}>;

export type SchemaWarmupQuery = {
  __typename?: "Query";
  schema: { __typename?: "Schema"; openapi: string };
};

export type OperationsForTagQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
  tag?: InputMaybe<Scalars["String"]["input"]>;
  untagged?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type OperationsForTagQuery = {
  __typename?: "Query";
  schema: {
    __typename?: "Schema";
    description?: string | null;
    summary?: string | null;
    title: string;
    url?: string | null;
    version: string;
    servers: Array<{ __typename?: "Server"; url: string }>;
    tag?: {
      __typename?: "SchemaTag";
      name?: string | null;
      description?: string | null;
      operations: Array<
        { __typename?: "OperationItem"; slug: string } & {
          " $fragmentRefs"?: {
            OperationsFragmentFragment: OperationsFragmentFragment;
          };
        }
      >;
      next?: {
        __typename?: "SchemaTag";
        name?: string | null;
        slug?: string | null;
      } | null;
      prev?: {
        __typename?: "SchemaTag";
        name?: string | null;
        slug?: string | null;
      } | null;
    } | null;
  };
};

export type GetSchemasQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
}>;

export type GetSchemasQuery = {
  __typename?: "Query";
  schema: {
    __typename?: "Schema";
    title: string;
    description?: string | null;
    summary?: string | null;
    components?: {
      __typename?: "Components";
      schemas?: Array<{
        __typename?: "SchemaItem";
        name: string;
        schema: any;
        extensions?: any | null;
      }> | null;
    } | null;
  };
};

export type GetServerQueryQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
}>;

export type GetServerQueryQuery = {
  __typename?: "Query";
  schema: {
    __typename?: "Schema";
    url?: string | null;
    servers: Array<{ __typename?: "Server"; url: string }>;
  };
};

export type GetSidebarOperationsQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
}>;

export type GetSidebarOperationsQuery = {
  __typename?: "Query";
  schema: {
    __typename?: "Schema";
    tags: Array<{
      __typename?: "SchemaTag";
      slug?: string | null;
      name?: string | null;
      extensions?: any | null;
      operations: Array<{
        __typename?: "OperationItem";
        summary?: string | null;
        slug: string;
        method: string;
        operationId?: string | null;
        path: string;
      }>;
    }>;
    components?: {
      __typename?: "Components";
      schemas?: Array<{ __typename: "SchemaItem" }> | null;
    } | null;
  };
};

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>["__apiType"];
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
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
  parameters {
    name
    in
    description
    required
    schema
    style
    explode
    examples {
      name
      description
      externalValue
      value
      summary
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
      next {
        name
        slug
      }
      prev {
        name
        slug
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
  parameters {
    name
    in
    description
    required
    schema
    style
    explode
    examples {
      name
      description
      externalValue
      value
      summary
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
export const GetSidebarOperationsDocument = new TypedDocumentString(`
    query GetSidebarOperations($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
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
  GetSidebarOperationsQuery,
  GetSidebarOperationsQueryVariables
>;
