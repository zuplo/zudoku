import type { AuthState } from "../../authentication/state.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import type { SchemaImports } from "../../oas/graphql/index.js";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";
import type { ResolvedAuth } from "./util/createHttpSnippet.js";

type DynamicInput = () => Promise<unknown>;

export type VersionedInput<T = string> = {
  path: string;
  version?: string;
  downloadUrl?: string;
  label?: string;
  input: T;
  hasUntaggedOperations?: boolean;
  tagPages?: string[];
};

type OasSource =
  | { type: "url"; input: string | VersionedInput[] }
  | { type: "file"; input: VersionedInput<DynamicInput>[] }
  | { type: "raw"; input: string };

export type ContextOasSource = {
  type: "url" | "file" | "raw";
  input: string | DynamicInput;
};

export type Example = {
  name: string;
  description?: string | null;
  externalValue?: string | null;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  value?: any | null;
  summary?: string | null;
};

export type Content = {
  mediaType: string;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  schema?: any | null;
  encoding?: Array<{
    name: string;
  }> | null;
  examples?: Array<Example> | null;
};

export type TransformExamplesFn = (options: {
  content: Content[];
  context: ZudokuContext;
  auth: AuthState;
  operation: OperationsFragmentFragment;
  type: "request" | "response";
}) => Content[];

export type GenerateCodeSnippetFn = (options: {
  selectedLang: string;
  selectedServer: string;
  context: ZudokuContext;
  auth: AuthState;
  operation: OperationsFragmentFragment;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  example?: any | null;
  resolvedAuth?: ResolvedAuth;
}) => string | false;

/**
 * Document root extension selecting a renderer for the whole document instead
 * of the default REST view. Read at build time from the processed schema, since
 * `getRoutes` builds the route tree without access to it.
 */
export const DOCUMENT_TYPE_EXTENSION = "x-zudoku-type";

export const MCP_CATALOG = "mcp-catalog";

/** Known `x-zudoku-type` values. Unknown values fall back to the REST view. */
export type OasDocumentType = typeof MCP_CATALOG;

type BaseOasConfig = {
  server?: string;
  path?: string;
  skipPreload?: boolean;
  tagPages?: Array<string>;
  schemaImports?: SchemaImports;
  documentType?: OasDocumentType;
  options?: {
    examplesLanguage?: string;
    supportedLanguages?: { value: string; label: string }[];
    disablePlayground?: boolean;
    disableSidecar?: boolean;
    disableSecurity?: boolean;
    disableMcpAuthInstructions?: boolean;
    showVersionSelect?: "always" | "if-available" | "hide";
    expandAllTags?: boolean;
    showInfoPage?: boolean;
    schemaDownload?: {
      enabled: boolean;
    };
    transformExamples?: TransformExamplesFn;
    generateCodeSnippet?: GenerateCodeSnippetFn;
  };
};

export type OasPluginConfig = BaseOasConfig & OasSource;

export type VersionEntry = {
  path: string;
  label: string;
  downloadUrl?: string;
  tagPages?: string[];
};

export type OasPluginContext = BaseOasConfig &
  ContextOasSource & {
    version?: string;
    versions: Record<string, VersionEntry>;
  };
