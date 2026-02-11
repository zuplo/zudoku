// AsyncAPI 3.0 TypeScript types
// These types represent dereferenced AsyncAPI documents (no $ref objects)

import type { JSONSchema } from "../oas/parser/dereference/index.js";

// Must be an interface (not a type) to allow merging with AsyncAPI types with index signatures
interface WithRef {
  __$ref?: string;
}

type DeepOmitReference<T> = T extends { $ref: string }
  ? never
  : T extends object
    ? { [K in keyof T]: DeepOmitReference<T[K]> } & WithRef
    : T;

// AsyncAPI 3.0 Root Document
export interface AsyncAPIDocument extends WithRef {
  asyncapi: string;
  id?: string;
  info: InfoObject;
  servers?: Record<string, ServerObject>;
  channels?: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  components?: ComponentsObject;
  defaultContentType?: string;
  // Allow x- extension properties
  [key: `x-${string}`]: unknown;
}

// Info Object
export interface InfoObject extends WithRef {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

export interface ContactObject extends WithRef {
  name?: string;
  url?: string;
  email?: string;
}

export interface LicenseObject extends WithRef {
  name: string;
  url?: string;
}

// Server Object
export interface ServerObject extends WithRef {
  host: string;
  protocol: string;
  protocolVersion?: string;
  pathname?: string;
  description?: string;
  title?: string;
  summary?: string;
  variables?: Record<string, ServerVariableObject>;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: ServerBindingsObject;
}

export interface ServerVariableObject extends WithRef {
  enum?: string[];
  default?: string;
  description?: string;
  examples?: string[];
}

// Channel Object
export interface ChannelObject extends WithRef {
  address?: string | null;
  messages?: Record<string, MessageObject>;
  title?: string;
  summary?: string;
  description?: string;
  servers?: ServerReferenceObject[];
  parameters?: Record<string, ParameterObject>;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: ChannelBindingsObject;
  // Allow x- extension properties
  [key: `x-${string}`]: unknown;
}

// Operation Object
export interface OperationObject extends WithRef {
  action: "send" | "receive";
  channel: ChannelReferenceObject;
  title?: string;
  summary?: string;
  description?: string;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: OperationBindingsObject;
  traits?: OperationTraitObject[];
  messages?: MessageReferenceObject[];
  reply?: OperationReplyObject;
  deprecated?: boolean;
  // Allow x- extension properties
  [key: `x-${string}`]: unknown;
}

// Message Object
export interface MessageObject extends WithRef {
  headers?: SchemaObject | MultiFormatSchemaObject;
  payload?: SchemaObject | MultiFormatSchemaObject;
  correlationId?: CorrelationIdObject;
  contentType?: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: MessageBindingsObject;
  examples?: MessageExampleObject[];
  traits?: MessageTraitObject[];
}

export interface MessageExampleObject extends WithRef {
  headers?: Record<string, unknown>;
  payload?: unknown;
  name?: string;
  summary?: string;
}

// Parameter Object
export interface ParameterObject extends WithRef {
  enum?: string[];
  default?: string;
  description?: string;
  examples?: string[];
  location?: string;
}

// Tag Object
export interface TagObject extends WithRef {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

// External Documentation Object
export interface ExternalDocumentationObject extends WithRef {
  description?: string;
  url: string;
}

// Schema Objects
export type SchemaObject = JSONSchema & WithRef;

export interface MultiFormatSchemaObject extends WithRef {
  schemaFormat: string;
  schema: unknown;
}

// Correlation ID Object
export interface CorrelationIdObject extends WithRef {
  description?: string;
  location: string;
}

// Operation Reply Object
export interface OperationReplyObject extends WithRef {
  address?: OperationReplyAddressObject;
  channel?: ChannelReferenceObject;
  messages?: MessageReferenceObject[];
}

export interface OperationReplyAddressObject extends WithRef {
  location: string;
  description?: string;
}

// Components Object
export interface ComponentsObject extends WithRef {
  schemas?: Record<string, SchemaObject>;
  servers?: Record<string, ServerObject>;
  channels?: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  messages?: Record<string, MessageObject>;
  securitySchemes?: Record<string, SecuritySchemeObject>;
  serverVariables?: Record<string, ServerVariableObject>;
  parameters?: Record<string, ParameterObject>;
  correlationIds?: Record<string, CorrelationIdObject>;
  replies?: Record<string, OperationReplyObject>;
  replyAddresses?: Record<string, OperationReplyAddressObject>;
  externalDocs?: Record<string, ExternalDocumentationObject>;
  tags?: Record<string, TagObject>;
  operationTraits?: Record<string, OperationTraitObject>;
  messageTraits?: Record<string, MessageTraitObject>;
  serverBindings?: Record<string, ServerBindingsObject>;
  channelBindings?: Record<string, ChannelBindingsObject>;
  operationBindings?: Record<string, OperationBindingsObject>;
  messageBindings?: Record<string, MessageBindingsObject>;
}

// Security Objects
export interface SecuritySchemeObject extends WithRef {
  type: string;
  description?: string;
  name?: string;
  in?: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsObject;
  openIdConnectUrl?: string;
  scopes?: string[];
}

export interface OAuthFlowsObject extends WithRef {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject extends WithRef {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes?: Record<string, string>;
}

export type SecurityRequirementObject = Record<string, string[]>;

// Reference Objects
export interface ServerReferenceObject extends WithRef {
  $ref?: string;
}

export interface ChannelReferenceObject extends WithRef {
  $ref?: string;
}

export interface MessageReferenceObject extends WithRef {
  $ref?: string;
}

// Trait Objects
export interface OperationTraitObject extends WithRef {
  title?: string;
  summary?: string;
  description?: string;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: OperationBindingsObject;
}

export interface MessageTraitObject extends WithRef {
  headers?: SchemaObject | MultiFormatSchemaObject;
  correlationId?: CorrelationIdObject;
  contentType?: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: MessageBindingsObject;
  examples?: MessageExampleObject[];
}

// Protocol Bindings (placeholder types - can be extended per protocol)
export interface ServerBindingsObject extends WithRef {
  http?: unknown;
  ws?: unknown;
  kafka?: unknown;
  mqtt?: unknown;
  amqp?: unknown;
  [protocol: string]: unknown;
}

export interface ChannelBindingsObject extends WithRef {
  http?: unknown;
  ws?: unknown;
  kafka?: unknown;
  mqtt?: unknown;
  amqp?: unknown;
  [protocol: string]: unknown;
}

export interface OperationBindingsObject extends WithRef {
  http?: unknown;
  ws?: unknown;
  kafka?: unknown;
  mqtt?: unknown;
  amqp?: unknown;
  [protocol: string]: unknown;
}

export interface MessageBindingsObject extends WithRef {
  http?: unknown;
  ws?: unknown;
  kafka?: unknown;
  mqtt?: unknown;
  amqp?: unknown;
  [protocol: string]: unknown;
}
