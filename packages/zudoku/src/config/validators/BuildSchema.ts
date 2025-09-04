import os from "node:os";
import path from "node:path";
import type { Options as MdxOptions } from "@mdx-js/rollup";
import { runnerImport } from "vite";
import { z } from "zod";
import type { OpenAPIDocument } from "../../lib/oas/graphql/index.js";
import { fileExists } from "../file-exists.js";
import { getCurrentConfig } from "../loader.js";

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
  prerender: z.object({ workers: z.number().optional() }).optional(),
});

export const getBuildConfig = async () => {
  const initialConfig = getCurrentConfig();
  const buildFilePath = path.join(
    initialConfig.__meta.rootDir,
    "zudoku.build.ts",
  );

  const buildFileExists = await fileExists(buildFilePath);
  if (!buildFileExists) return undefined;

  const buildModule = await runnerImport<{ default: BuildConfig }>(
    buildFilePath,
  ).then((m) => m.module.default);

  return validateBuildConfig(buildModule);
};

export type BuildConfig = z.infer<typeof BuildConfigSchema>;

export function validateBuildConfig(config: unknown): BuildConfig | undefined {
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
