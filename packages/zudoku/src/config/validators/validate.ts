import type { Options } from "@mdx-js/rollup";
import type { ComponentType, ReactNode } from "react";
import z from "zod";
import { fromError } from "zod-validation-error";
import type { ExposedComponentProps } from "../../lib/components/SlotletProvider.js";
import type { ZudokuPlugin } from "../../lib/core/plugins.js";
import { MdxComponentsType } from "../../lib/util/MdxComponents.js";
import { CommonConfigSchema, refine } from "./common.js";

/**
 * These are the configuration elements that are only available if using
 * zudoku.config.{js,ts,tsx,jsx} files.
 */
const CodeConfigSchema = z.object({
  // slotlets are a concept we are working on and not yet finalized
  UNSAFE_slotlets: z.record(
    z.string(),
    z.custom<ReactNode | ComponentType<ExposedComponentProps>>(),
  ),
  mdx: z
    .object({
      components: z.custom<MdxComponentsType>(),
    })
    .partial(),
  customPages: z.array(
    z.object({
      path: z.string(),
      element: z.custom<NonNullable<ReactNode>>().optional(),
      render: z.custom<ComponentType<ExposedComponentProps>>().optional(),
      prose: z.boolean().optional(),
    }),
  ),
  plugins: z.array(z.custom<ZudokuPlugin>()),
  build: z.custom<{
    remarkPlugins?: Options["remarkPlugins"];
    rehypePlugins?: Options["rehypePlugins"];
  }>(),
});

const ConfigSchema = CommonConfigSchema.merge(CodeConfigSchema)
  .partial()
  .superRefine(refine);

/**
 * Type for the zudoku.config.{js,ts,tsx,jsx} files
 */
export type ZudokuConfig = z.infer<typeof ConfigSchema>;

export function validateConfig(config: unknown) {
  const validationResult = ConfigSchema.safeParse(config);

  if (!validationResult.success) {
    // eslint-disable-next-line no-console
    console.log("Validation errors:");
    // eslint-disable-next-line no-console
    console.log(fromError(validationResult.error).toString());
  }
}
