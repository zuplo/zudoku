import type { Options as MdxOptions } from "@mdx-js/rollup";
import z from "zod";
import { fromError } from "zod-validation-error";
import type { OpenAPIDocument } from "../../lib/oas/graphql/index.js";

// Schema for build processors
export const BuildProcessorSchema = z
  .function()
  .args(
    z.object({
      file: z.string(),
      schema: z.custom<OpenAPIDocument>(),
      dereference: z
        .function()
        .args(z.custom<OpenAPIDocument>())
        .returns(z.promise(z.custom<OpenAPIDocument>())),
    }),
  )
  .returns(
    z.custom<OpenAPIDocument>().or(z.promise(z.custom<OpenAPIDocument>())),
  );

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
    // eslint-disable-next-line no-console
    console.warn("Build config validation errors:");
    // eslint-disable-next-line no-console
    console.warn(fromError(validationResult.error).toString());
    return;
  }

  return validationResult.data;
}
