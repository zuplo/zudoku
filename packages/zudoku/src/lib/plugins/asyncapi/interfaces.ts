import type { SchemaImports } from "../../asyncapi/graphql/index.js";
import type { AsyncAPIDocument } from "../../asyncapi/types.js";
import type { AuthState } from "../../authentication/state.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";

/**
 * Processor argument type for AsyncAPI processors
 */
export type AsyncApiProcessorArg = {
  schema: AsyncAPIDocument;
  file: string;
  dereference: (schema: AsyncAPIDocument) => Promise<AsyncAPIDocument>;
};

type DynamicInput = () => Promise<unknown>;

export type VersionedInput<T> = Array<{
  path: string;
  version?: string;
  downloadUrl?: string;
  label?: string;
  input: T;
}>;

type AsyncApiSource =
  | { type: "url"; input: string | VersionedInput<string> }
  | { type: "file"; input: VersionedInput<DynamicInput> }
  | { type: "raw"; input: string };

export type ContextAsyncApiSource = {
  type: "url" | "file" | "raw";
  input: string | DynamicInput;
};

type Example = {
  name?: string;
  summary?: string | null;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  headers?: any | null;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  payload?: any | null;
};

type Message = {
  name?: string;
  title?: string;
  contentType?: string;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  payload?: any | null;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  headers?: any | null;
  examples?: Array<Example> | null;
};

export type TransformExamplesFn = (options: {
  messages: Message[];
  context: ZudokuContext;
  auth: AuthState;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  operation: any; // GraphQL operation fragment
  type: "send" | "receive";
}) => Message[];

export type GenerateCodeSnippetFn = (options: {
  selectedLang: string;
  selectedServer: string;
  protocol: string;
  context: ZudokuContext;
  auth: AuthState;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  operation: any; // GraphQL operation fragment
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  example?: any | null;
}) => string | false;

type BaseAsyncApiConfig = {
  server?: string;
  path?: string;
  skipPreload?: boolean;
  tagPages?: Array<string>;
  schemaImports?: SchemaImports;
  options?: {
    defaultProtocol?: string;
    supportedProtocols?: { value: string; label: string }[];
    disableSimulator?: boolean;
    disableSidecar?: boolean;
    showVersionSelect?: "always" | "if-available" | "hide";
    expandAllTags?: boolean;
    expandApiInformation?: boolean;
    schemaDownload?: {
      enabled: boolean;
    };
    transformExamples?: TransformExamplesFn;
    generateCodeSnippet?: GenerateCodeSnippetFn;
  };
};

export type AsyncApiPluginConfig = BaseAsyncApiConfig & AsyncApiSource;

export type AsyncApiPluginContext = BaseAsyncApiConfig &
  ContextAsyncApiSource & {
    version?: string;
    versions: Record<
      string,
      { path: string; label: string; downloadUrl?: string }
    >;
  };
