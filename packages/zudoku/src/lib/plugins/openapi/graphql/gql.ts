/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import * as types from "./graphql.js";

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
  "\n  query ServersQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n":
    types.ServersQueryDocument,
  "\n  fragment OperationsFragment on OperationItem {\n    slug\n    summary\n    method\n    description\n    operationId\n    contentTypes\n    path\n    parameters {\n      name\n      in\n      description\n      required\n      schema\n      style\n      examples {\n        name\n        description\n        externalValue\n        value\n        summary\n      }\n    }\n    requestBody {\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n      description\n      required\n    }\n    responses {\n      statusCode\n      links\n      description\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n    }\n  }\n":
    types.OperationsFragmentFragmentDoc,
  "\n  query AllOperations($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      description\n      title\n      url\n      version\n      tags {\n        name\n        description\n        operations {\n          slug\n          ...OperationsFragment\n        }\n      }\n    }\n  }\n":
    types.AllOperationsDocument,
  "\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n":
    types.GetServerQueryDocument,
  "\n  query GetCategories($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      tags {\n        __typename\n        name\n        operations {\n          __typename\n          slug\n          deprecated\n          method\n          summary\n          operationId\n          path\n        }\n      }\n    }\n  }\n":
    types.GetCategoriesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query ServersQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n",
): (typeof documents)["\n  query ServersQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  fragment OperationsFragment on OperationItem {\n    slug\n    summary\n    method\n    description\n    operationId\n    contentTypes\n    path\n    parameters {\n      name\n      in\n      description\n      required\n      schema\n      style\n      examples {\n        name\n        description\n        externalValue\n        value\n        summary\n      }\n    }\n    requestBody {\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n      description\n      required\n    }\n    responses {\n      statusCode\n      links\n      description\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n    }\n  }\n",
): (typeof documents)["\n  fragment OperationsFragment on OperationItem {\n    slug\n    summary\n    method\n    description\n    operationId\n    contentTypes\n    path\n    parameters {\n      name\n      in\n      description\n      required\n      schema\n      style\n      examples {\n        name\n        description\n        externalValue\n        value\n        summary\n      }\n    }\n    requestBody {\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n      description\n      required\n    }\n    responses {\n      statusCode\n      links\n      description\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query AllOperations($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      description\n      title\n      url\n      version\n      tags {\n        name\n        description\n        operations {\n          slug\n          ...OperationsFragment\n        }\n      }\n    }\n  }\n",
): (typeof documents)["\n  query AllOperations($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      description\n      title\n      url\n      version\n      tags {\n        name\n        description\n        operations {\n          slug\n          ...OperationsFragment\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n",
): (typeof documents)["\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query GetCategories($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      tags {\n        __typename\n        name\n        operations {\n          __typename\n          slug\n          deprecated\n          method\n          summary\n          operationId\n          path\n        }\n      }\n    }\n  }\n",
): (typeof documents)["\n  query GetCategories($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      tags {\n        __typename\n        name\n        operations {\n          __typename\n          slug\n          deprecated\n          method\n          summary\n          operationId\n          path\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
