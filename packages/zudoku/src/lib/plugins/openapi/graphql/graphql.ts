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
  schema?: Maybe<Scalars["JSON"]["output"]>;
};

export type OperationItem = {
  __typename?: "OperationItem";
  contentTypes: Array<Scalars["String"]["output"]>;
  deprecated?: Maybe<Scalars["Boolean"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
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
  in: ParameterIn;
  name: Scalars["String"]["output"];
  required?: Maybe<Scalars["Boolean"]["output"]>;
  schema?: Maybe<Scalars["JSON"]["output"]>;
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
  headers?: Maybe<Scalars["JSON"]["output"]>;
  links?: Maybe<Scalars["JSON"]["output"]>;
  statusCode: Scalars["String"]["output"];
};

export type Schema = {
  __typename?: "Schema";
  description?: Maybe<Scalars["String"]["output"]>;
  openapi: Scalars["String"]["output"];
  operations: Array<OperationItem>;
  paths: Array<PathItem>;
  servers: Array<Server>;
  tags: Array<SchemaTag>;
  title: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
  version: Scalars["String"]["output"];
  summary?: Maybe<Scalars["String"]["output"]>;
};

export type SchemaOperationsArgs = {
  method?: InputMaybe<Scalars["String"]["input"]>;
  operationId?: InputMaybe<Scalars["String"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  tag?: InputMaybe<Scalars["String"]["input"]>;
};

export type SchemaTagsArgs = {
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type SchemaTag = {
  __typename?: "SchemaTag";
  description?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  operations: Array<OperationItem>;
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
    url: string;
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
  parameters?: Array<{
    __typename?: "ParameterItem";
    name: string;
    in: ParameterIn;
    description?: string | null;
    required?: boolean | null;
    schema?: any | null;
    style?: string | null;
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

export type AllOperationsQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
}>;

export type AllOperationsQuery = {
  __typename?: "Query";
  schema: {
    __typename?: "Schema";
    description?: string | null;
    summary?: string | null;
    title: string;
    url: string;
    version: string;
    tags: Array<{
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
    }>;
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
    url: string;
    servers: Array<{ __typename?: "Server"; url: string }>;
  };
};

export type GetCategoriesQueryVariables = Exact<{
  input: Scalars["JSON"]["input"];
  type: SchemaType;
}>;

export type GetCategoriesQuery = {
  __typename?: "Query";
  schema: {
    __typename?: "Schema";
    url: string;
    tags: Array<{
      __typename: "SchemaTag";
      name?: string | null;
      operations: Array<{
        __typename: "OperationItem";
        slug: string;
        deprecated?: boolean | null;
        method: string;
        summary?: string | null;
        operationId?: string | null;
        path: string;
      }>;
    }>;
  };
};

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>["__apiType"];

  constructor(
    private value: string,
    public __meta__?: Record<string, any> | undefined,
  ) {
    super(value);
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
  parameters {
    name
    in
    description
    required
    schema
    style
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
export const AllOperationsDocument = new TypedDocumentString(`
    query AllOperations($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    description
    summary
    title
    url
    version
    tags {
      name
      description
      operations {
        slug
        ...OperationsFragment
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
  parameters {
    name
    in
    description
    required
    schema
    style
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
  AllOperationsQuery,
  AllOperationsQueryVariables
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
export const GetCategoriesDocument = new TypedDocumentString(`
    query GetCategories($input: JSON!, $type: SchemaType!) {
  schema(input: $input, type: $type) {
    url
    tags {
      __typename
      name
      operations {
        __typename
        slug
        deprecated
        method
        summary
        operationId
        path
      }
    }
  }
}
    `) as unknown as TypedDocumentString<
  GetCategoriesQuery,
  GetCategoriesQueryVariables
>;
