import { z } from "zod";
import type { UseAuthReturn } from "../../lib/authentication/hook.js";
import type { ZudokuContext } from "../../lib/core/ZudokuContext.js";
import { IconNames } from "./icon-types.js";

const IconSchema = z.enum(IconNames);

const BadgeSchema = z.object({
  label: z.string(),
  // biome-ignore format: for readability
  color: z.enum(["green", "blue", "yellow", "red", "purple", "indigo", "gray", "outline"]),
  invert: z.boolean().optional(),
  className: z.string().optional(),
});

const InputNavigationCategoryLinkDocSchema = z.union([
  z.string(),
  z.object({
    type: z.literal("doc"),
    file: z.string(),
    label: z.string().optional(),
  }),
]);

export const DisplaySchema = z
  .union([
    z.enum(["auth", "anon", "always", "hide"]),
    z.custom<
      (params: { context: ZudokuContext; auth: UseAuthReturn }) => boolean
    >((val) => typeof val === "function"),
  ])
  .default("always")
  .optional();

const InputNavigationDocSchema = z.union([
  z.string(),
  z.object({
    type: z.literal("doc"),
    file: z.string(),
    // Custom URL path for this document (overrides file-based path)
    path: z.string().optional(),
    icon: IconSchema.optional(),
    label: z.string().optional(),
    badge: BadgeSchema.optional(),
    display: DisplaySchema,
  }),
]);

const InputNavigationLinkSchema = z.object({
  type: z.literal("link"),
  to: z.string(),
  label: z.string(),
  target: z.enum(["_self", "_blank"]).optional(),
  icon: IconSchema.optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

const InputNavigationCustomPageSchema = z.object({
  type: z.literal("custom-page"),
  path: z.string(),
  label: z.string().optional(),
  element: z.any(),
  icon: IconSchema.optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
  layout: z.enum(["default", "none"]).optional(),
});

// Base category schema without items
const BaseInputNavigationCategorySchema = z.object({
  type: z.literal("category"),
  icon: IconSchema.optional(),
  label: z.string(),
  collapsible: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  link: InputNavigationCategoryLinkDocSchema.optional(),
  display: DisplaySchema,
});

export type InputNavigationItem =
  | z.infer<typeof InputNavigationDocSchema>
  | z.infer<typeof InputNavigationLinkSchema>
  | z.infer<typeof InputNavigationCustomPageSchema>
  | (z.infer<typeof BaseInputNavigationCategorySchema> & {
      items: InputNavigationItem[];
    });

const InputNavigationCategorySchema: z.ZodType<
  z.infer<typeof BaseInputNavigationCategorySchema> & {
    items: InputNavigationItem[];
  }
> = BaseInputNavigationCategorySchema.extend({
  items: z.lazy(() => InputNavigationItemSchema.array()),
});

const InputNavigationItemSchema: z.ZodType<InputNavigationItem> = z.union([
  InputNavigationDocSchema,
  InputNavigationLinkSchema,
  InputNavigationCustomPageSchema,
  InputNavigationCategorySchema,
]);

export const InputNavigationSchema = InputNavigationItemSchema.array();

export type InputNavigationDoc = z.infer<typeof InputNavigationDocSchema>;
export type InputNavigationLink = z.infer<typeof InputNavigationLinkSchema>;
export type InputNavigationCustomPage = z.infer<
  typeof InputNavigationCustomPageSchema
>;
export type InputNavigationCategory = z.infer<
  typeof BaseInputNavigationCategorySchema
> & { items: InputNavigationItem[] };
export type InputNavigationCategoryLinkDoc = z.infer<
  typeof InputNavigationCategoryLinkDocSchema
>;

export type InputNavigation = z.infer<typeof InputNavigationSchema>;
