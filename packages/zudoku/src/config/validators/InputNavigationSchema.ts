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
    icon: IconSchema.optional(),
    label: z.string().optional(),
    badge: BadgeSchema.optional(),
    display: DisplaySchema,
  }),
]);

const InputNavigationLinkSchema = z.object({
  type: z.literal("link"),
  icon: IconSchema.optional(),
  label: z.string(),
  href: z.string(),
  description: z.string().optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

const InputNavigationCustomPageSchema = z.object({
  type: z.literal("custom-page"),
  path: z.string(),
  label: z.string(),
  element: z.any(),
  icon: IconSchema.optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

const InputNavigationCategorySchema = z.object({
  type: z.literal("category"),
  icon: IconSchema.optional(),
  label: z.string(),
  description: z.string().optional(),
  collapsible: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  link: InputNavigationCategoryLinkDocSchema.optional(),
  display: DisplaySchema,
  get items() {
    return z.array(
      // needs to be `.or` here: https://github.com/colinhacks/zod/issues/4610
      InputNavigationDocSchema.or(InputNavigationLinkSchema)
        .or(InputNavigationCategorySchema)
        .or(InputNavigationCustomPageSchema),
    );
  },
});

const InputNavigationItemSchema = z.union([
  InputNavigationDocSchema,
  InputNavigationLinkSchema,
  InputNavigationCustomPageSchema,
  InputNavigationCategorySchema,
]);

export const InputNavigationSchema = z.array(InputNavigationItemSchema);

export type InputNavigationDoc = z.infer<typeof InputNavigationDocSchema>;
export type InputNavigationLink = z.infer<typeof InputNavigationLinkSchema>;
export type InputNavigationCustomPage = z.infer<
  typeof InputNavigationCustomPageSchema
>;
export type InputNavigationCategory = z.infer<
  typeof InputNavigationCategorySchema
>;
export type InputNavigationCategoryLinkDoc = z.infer<
  typeof InputNavigationCategoryLinkDocSchema
>;

export type InputNavigationItem = z.infer<typeof InputNavigationItemSchema>;
export type InputNavigation = z.infer<typeof InputNavigationSchema>;
