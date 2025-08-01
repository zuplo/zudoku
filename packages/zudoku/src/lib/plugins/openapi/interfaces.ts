import type { AuthState } from "../../authentication/state.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import type { SchemaImports } from "../../oas/graphql/index.js";
import type { OperationListItemResult } from "./OperationList.js";

type DynamicInput = () => Promise<unknown>;

type OasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: { [version: string]: DynamicInput } }
  | { type: "raw"; input: string };

export type ContextOasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: DynamicInput }
  | { type: "raw"; input: string };

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
  operation: OperationListItemResult;
  type: "request" | "response";
}) => Content[];

type BaseOasConfig = {
  server?: string;
  path?: string;
  skipPreload?: boolean;
  tagPages?: Array<string>;
  schemaImports?: SchemaImports;
  options?: {
    examplesLanguage?: string;
    disablePlayground?: boolean;
    disableSidecar?: boolean;
    showVersionSelect?: "always" | "if-available" | "hide";
    expandAllTags?: boolean;
    transformExamples?: TransformExamplesFn;
  };
};

export type OasPluginConfig = BaseOasConfig & OasSource;

export type OasPluginContext = BaseOasConfig &
  ContextOasSource & {
    version?: string;
    versions: Record<string, string>;
  };
