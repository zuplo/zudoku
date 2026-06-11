import type { ZudokuBuildConfig } from "zudoku";

export type Processor = NonNullable<ZudokuBuildConfig["processors"]>[number];
export type ProcessorArg = Parameters<Processor>[0];
export type OpenAPIDocument = ProcessorArg["schema"];
