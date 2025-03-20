/* eslint-disable */
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
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  "\n  query ServersQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n": typeof types.ServersQueryDocument;
  "\n  fragment OperationsFragment on OperationItem {\n    slug\n    summary\n    method\n    description\n    operationId\n    contentTypes\n    path\n    deprecated\n    extensions\n    parameters {\n      name\n      in\n      description\n      required\n      schema\n      style\n      explode\n      examples {\n        name\n        description\n        externalValue\n        value\n        summary\n      }\n    }\n    requestBody {\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        schema\n      }\n      description\n      required\n    }\n    responses {\n      statusCode\n      links\n      description\n      content {\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n    }\n  }\n": typeof types.OperationsFragmentFragmentDoc;
  "\n  query AllOperations(\n    $input: JSON!\n    $type: SchemaType!\n    $tag: String\n    $untagged: Boolean\n  ) {\n    schema(input: $input, type: $type) {\n      servers {\n        url\n      }\n      description\n      summary\n      title\n      url\n      version\n      tags(name: $tag) {\n        name\n        description\n      }\n      operations(tag: $tag, untagged: $untagged) {\n        slug\n        ...OperationsFragment\n      }\n    }\n  }\n": typeof types.AllOperationsDocument;
  "\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n": typeof types.GetServerQueryDocument;
  "\n  query GetCategories($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      tags {\n        name\n      }\n    }\n  }\n": typeof types.GetCategoriesDocument;
  "\n  query GetOperations($input: JSON!, $type: SchemaType!, $tag: String) {\n    schema(input: $input, type: $type) {\n      operations(tag: $tag) {\n        slug\n        deprecated\n        method\n        summary\n        operationId\n        path\n        tags {\n          name\n        }\n      }\n      untagged: operations(untagged: true) {\n        slug\n        deprecated\n        method\n        summary\n        operationId\n        path\n      }\n    }\n  }\n": typeof types.GetOperationsDocument;
};
const documents: Documents = {
  "\n  query ServersQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n":
    types.ServersQueryDocument,
  "\n  fragment OperationsFragment on OperationItem {\n    slug\n    summary\n    method\n    description\n    operationId\n    contentTypes\n    path\n    deprecated\n    extensions\n    parameters {\n      name\n      in\n      description\n      required\n      schema\n      style\n      explode\n      examples {\n        name\n        description\n        externalValue\n        value\n        summary\n      }\n    }\n    requestBody {\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        schema\n      }\n      description\n      required\n    }\n    responses {\n      statusCode\n      links\n      description\n      content {\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n    }\n  }\n":
    types.OperationsFragmentFragmentDoc,
  "\n  query AllOperations(\n    $input: JSON!\n    $type: SchemaType!\n    $tag: String\n    $untagged: Boolean\n  ) {\n    schema(input: $input, type: $type) {\n      servers {\n        url\n      }\n      description\n      summary\n      title\n      url\n      version\n      tags(name: $tag) {\n        name\n        description\n      }\n      operations(tag: $tag, untagged: $untagged) {\n        slug\n        ...OperationsFragment\n      }\n    }\n  }\n":
    types.AllOperationsDocument,
  "\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n":
    types.GetServerQueryDocument,
  "\n  query GetCategories($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      tags {\n        name\n      }\n    }\n  }\n":
    types.GetCategoriesDocument,
  "\n  query GetOperations($input: JSON!, $type: SchemaType!, $tag: String) {\n    schema(input: $input, type: $type) {\n      operations(tag: $tag) {\n        slug\n        deprecated\n        method\n        summary\n        operationId\n        path\n        tags {\n          name\n        }\n      }\n      untagged: operations(untagged: true) {\n        slug\n        deprecated\n        method\n        summary\n        operationId\n        path\n      }\n    }\n  }\n":
    types.GetOperationsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query ServersQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n",
): typeof import("./graphql.js").ServersQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  fragment OperationsFragment on OperationItem {\n    slug\n    summary\n    method\n    description\n    operationId\n    contentTypes\n    path\n    deprecated\n    extensions\n    parameters {\n      name\n      in\n      description\n      required\n      schema\n      style\n      explode\n      examples {\n        name\n        description\n        externalValue\n        value\n        summary\n      }\n    }\n    requestBody {\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        schema\n      }\n      description\n      required\n    }\n    responses {\n      statusCode\n      links\n      description\n      content {\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n    }\n  }\n",
): typeof import("./graphql.js").OperationsFragmentFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query AllOperations(\n    $input: JSON!\n    $type: SchemaType!\n    $tag: String\n    $untagged: Boolean\n  ) {\n    schema(input: $input, type: $type) {\n      servers {\n        url\n      }\n      description\n      summary\n      title\n      url\n      version\n      tags(name: $tag) {\n        name\n        description\n      }\n      operations(tag: $tag, untagged: $untagged) {\n        slug\n        ...OperationsFragment\n      }\n    }\n  }\n",
): typeof import("./graphql.js").AllOperationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n",
): typeof import("./graphql.js").GetServerQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query GetCategories($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      tags {\n        name\n      }\n    }\n  }\n",
): typeof import("./graphql.js").GetCategoriesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query GetOperations($input: JSON!, $type: SchemaType!, $tag: String) {\n    schema(input: $input, type: $type) {\n      operations(tag: $tag) {\n        slug\n        deprecated\n        method\n        summary\n        operationId\n        path\n        tags {\n          name\n        }\n      }\n      untagged: operations(untagged: true) {\n        slug\n        deprecated\n        method\n        summary\n        operationId\n        path\n      }\n    }\n  }\n",
): typeof import("./graphql.js").GetOperationsDocument;

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
