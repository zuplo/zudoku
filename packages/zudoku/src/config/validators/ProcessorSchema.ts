import { z } from "zod";
import type { OpenAPIDocument } from "../../lib/oas/graphql/index.js";

// Schema for build processors
export const BuildProcessorSchema = z.custom<
  (data: {
    file: string;
    schema: OpenAPIDocument;
    params: Record<string, string>;
    dereference: (schema: OpenAPIDocument) => Promise<OpenAPIDocument>;
  }) => OpenAPIDocument | Promise<OpenAPIDocument>
>((val) => typeof val === "function");

export type Processor = z.infer<typeof BuildProcessorSchema>;
export type ProcessorArg = Parameters<Processor>[0];
