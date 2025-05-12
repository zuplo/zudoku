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
  "\n  query SchemaWarmup($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      openapi\n    }\n  }\n": typeof types.SchemaWarmupDocument;
  "\n  query OperationsForTag(\n    $input: JSON!\n    $type: SchemaType!\n    $tag: String\n    $untagged: Boolean\n  ) {\n    schema(input: $input, type: $type) {\n      servers {\n        url\n      }\n      description\n      summary\n      title\n      url\n      version\n      tag(slug: $tag, untagged: $untagged) {\n        name\n        description\n        operations {\n          slug\n          ...OperationsFragment\n        }\n        next {\n          name\n          slug\n        }\n        prev {\n          name\n          slug\n        }\n      }\n    }\n  }\n": typeof types.OperationsForTagDocument;
  "\n  query GetSchemas($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      title\n      description\n      summary\n      components {\n        schemas {\n          name\n          schema\n          extensions\n        }\n      }\n    }\n  }\n": typeof types.GetSchemasDocument;
  "\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n": typeof types.GetServerQueryDocument;
  "\n  query GetSidebarOperations($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      tags {\n        slug\n        name\n        extensions\n        operations {\n          summary\n          slug\n          method\n          operationId\n          path\n        }\n      }\n      components {\n        schemas {\n          __typename\n        }\n      }\n    }\n  }\n": typeof types.GetSidebarOperationsDocument;
};
const documents: Documents = {
  "\n  query ServersQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n":
    types.ServersQueryDocument,
  "\n  fragment OperationsFragment on OperationItem {\n    slug\n    summary\n    method\n    description\n    operationId\n    contentTypes\n    path\n    deprecated\n    extensions\n    parameters {\n      name\n      in\n      description\n      required\n      schema\n      style\n      explode\n      examples {\n        name\n        description\n        externalValue\n        value\n        summary\n      }\n    }\n    requestBody {\n      content {\n        mediaType\n        encoding {\n          name\n        }\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        schema\n      }\n      description\n      required\n    }\n    responses {\n      statusCode\n      links\n      description\n      content {\n        examples {\n          name\n          description\n          externalValue\n          value\n          summary\n        }\n        mediaType\n        encoding {\n          name\n        }\n        schema\n      }\n    }\n  }\n":
    types.OperationsFragmentFragmentDoc,
  "\n  query SchemaWarmup($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      openapi\n    }\n  }\n":
    types.SchemaWarmupDocument,
  "\n  query OperationsForTag(\n    $input: JSON!\n    $type: SchemaType!\n    $tag: String\n    $untagged: Boolean\n  ) {\n    schema(input: $input, type: $type) {\n      servers {\n        url\n      }\n      description\n      summary\n      title\n      url\n      version\n      tag(slug: $tag, untagged: $untagged) {\n        name\n        description\n        operations {\n          slug\n          ...OperationsFragment\n        }\n        next {\n          name\n          slug\n        }\n        prev {\n          name\n          slug\n        }\n      }\n    }\n  }\n":
    types.OperationsForTagDocument,
  "\n  query GetSchemas($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      title\n      description\n      summary\n      components {\n        schemas {\n          name\n          schema\n          extensions\n        }\n      }\n    }\n  }\n":
    types.GetSchemasDocument,
  "\n  query getServerQuery($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      url\n      servers {\n        url\n      }\n    }\n  }\n":
    types.GetServerQueryDocument,
  "\n  query GetSidebarOperations($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      tags {\n        slug\n        name\n        extensions\n        operations {\n          summary\n          slug\n          method\n          operationId\n          path\n        }\n      }\n      components {\n        schemas {\n          __typename\n        }\n      }\n    }\n  }\n":
    types.GetSidebarOperationsDocument,
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
  source: "\n  query SchemaWarmup($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      openapi\n    }\n  }\n",
): typeof import("./graphql.js").SchemaWarmupDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query OperationsForTag(\n    $input: JSON!\n    $type: SchemaType!\n    $tag: String\n    $untagged: Boolean\n  ) {\n    schema(input: $input, type: $type) {\n      servers {\n        url\n      }\n      description\n      summary\n      title\n      url\n      version\n      tag(slug: $tag, untagged: $untagged) {\n        name\n        description\n        operations {\n          slug\n          ...OperationsFragment\n        }\n        next {\n          name\n          slug\n        }\n        prev {\n          name\n          slug\n        }\n      }\n    }\n  }\n",
): typeof import("./graphql.js").OperationsForTagDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query GetSchemas($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      title\n      description\n      summary\n      components {\n        schemas {\n          name\n          schema\n          extensions\n        }\n      }\n    }\n  }\n",
): typeof import("./graphql.js").GetSchemasDocument;
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
  source: "\n  query GetSidebarOperations($input: JSON!, $type: SchemaType!) {\n    schema(input: $input, type: $type) {\n      tags {\n        slug\n        name\n        extensions\n        operations {\n          summary\n          slug\n          method\n          operationId\n          path\n        }\n      }\n      components {\n        schemas {\n          __typename\n        }\n      }\n    }\n  }\n",
): typeof import("./graphql.js").GetSidebarOperationsDocument;

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
