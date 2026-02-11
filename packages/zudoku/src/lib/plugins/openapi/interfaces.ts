import type { AuthState } from "../../authentication/state.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import type { SchemaImports } from "../../oas/graphql/index.js";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";

type DynamicInput = () => Promise<unknown>;

export type VersionedInput<T> = Array<{
  path: string;
  version?: string;
  downloadUrl?: string;
  label?: string;
  input: T;
}>;

type OasSource =
  | { type: "url"; input: string | VersionedInput<string> }
  | { type: "file"; input: VersionedInput<DynamicInput> }
  | { type: "raw"; input: string };

export type ContextOasSource = {
  type: "url" | "file" | "raw";
  input: string | DynamicInput;
};

type Example = {
  name: string;
  description?: string | null;
  externalValue?: string | null;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  value?: any | null;
  summary?: string | null;
};

type Content = {
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
}) => string | false;

type BaseOasConfig = {
  server?: string;
  path?: string;
  skipPreload?: boolean;
  tagPages?: Array<string>;
  schemaImports?: SchemaImports;
  options?: {
    examplesLanguage?: string;
    supportedLanguages?: { value: string; label: string }[];
    disablePlayground?: boolean;
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

export type OasPluginConfig = BaseOasConfig & OasSource;

export type OasPluginContext = BaseOasConfig &
  ContextOasSource & {
    version?: string;
    versions: Record<
      string,
      { path: string; label: string; downloadUrl?: string }
    >;
  };
