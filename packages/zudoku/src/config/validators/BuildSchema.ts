import type { Options as MdxOptions } from "@mdx-js/rollup";
import { z } from "zod";
import type { OpenAPIDocument } from "../../lib/oas/graphql/index.js";

// Schema for build processors
export const BuildProcessorSchema = z.custom<
  (data: {
    file: string;
    schema: OpenAPIDocument;
    dereference: (schema: OpenAPIDocument) => Promise<OpenAPIDocument>;
  }) => OpenAPIDocument | Promise<OpenAPIDocument>
>((val) => typeof val === "function");

export type Processor = z.infer<typeof BuildProcessorSchema>;
export type ProcessorArg = Parameters<Processor>[0];

export const BuildConfigSchema = z.object({
  processors: z.array(BuildProcessorSchema).optional(),
  remarkPlugins: z.custom<MdxOptions["remarkPlugins"]>().optional(),
  rehypePlugins: z.custom<MdxOptions["rehypePlugins"]>().optional(),
});

export type BuildConfig = z.infer<typeof BuildConfigSchema>;

export function validateBuildConfig(config: unknown) {
  const validationResult = BuildConfigSchema.safeParse(config);

  if (!validationResult.success) {
    // In production (build mode), throw an error to fail the build
    if (process.env.NODE_ENV === "production") {
      throw new Error(z.prettifyError(validationResult.error));
    }

    // In development mode, log warnings but don't fail
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.warn("Build config validation errors:");
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.warn(z.prettifyError(validationResult.error));
    return;
  }

  return validationResult.data;
}
