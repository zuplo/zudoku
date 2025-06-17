import { z } from "zod/v4";
import { IconNames } from "./icon-types.js";

const IconSchema = z.enum(IconNames);

const BadgeSchema = z.object({
  label: z.string(),
  // prettier-ignore
  color: z.enum(["green", "blue", "yellow", "red", "purple", "indigo", "gray", "outline"]),
  invert: z.boolean().optional(),
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
  .enum(["auth", "anon", "always", "hide"])
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
  icon: IconSchema.optional(),
  description: z.string().optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

const InputNavigationCustomPageSchema = z.object({
  type: z.literal("custom-page"),
  path: z.string(),
  label: z.string().optional(),
  element: z.any(),
  prose: z.boolean().optional(),
  icon: IconSchema.optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

// Base category schema without items
const BaseInputNavigationCategorySchema = z.object({
  type: z.literal("category"),
  icon: IconSchema.optional(),
  label: z.string(),
  description: z.string().optional(),
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
