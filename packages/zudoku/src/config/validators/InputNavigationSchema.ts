import { z } from "zod";
import { type IconNames } from "./icon-types.js";

const BadgeSchema = z.object({
  label: z.string(),
  color: z.enum([
    "green",
    "blue",
    "yellow",
    "red",
    "purple",
    "indigo",
    "gray",
    "outline",
  ]),
  placement: z.enum(["start", "end"]).optional(),
  invert: z.boolean().optional(),
});

export const BaseInputNavigationItemCategoryLinkDocSchema = z.object({
  type: z.literal("doc"),
  file: z.string(),
  label: z.string().optional(),
});

export type BaseInputNavigationItemCategoryLinkDoc = z.infer<
  typeof BaseInputNavigationItemCategoryLinkDocSchema
>;

export const InputNavigationItemCategoryLinkDocSchema = z.union([
  BaseInputNavigationItemCategoryLinkDocSchema,
  z.string(),
]);

export const DisplaySchema = z
  .enum(["auth", "anon", "always", "hide"])
  .default("always")
  .optional();

export const BaseInputNavigationItemDocSchema = z.object({
  type: z.literal("doc"),
  file: z.string(),
  icon: z.custom<IconNames>().optional(),
  label: z.string().optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

export type BaseInputNavigationItemDoc = z.infer<
  typeof BaseInputNavigationItemDocSchema
>;

export const InputNavigationItemDocSchema = z.union([
  BaseInputNavigationItemDocSchema,
  z.string(),
]);

export const InputNavigationItemLinkSchema = z.object({
  type: z.literal("link"),
  icon: z.custom<IconNames>().optional(),
  label: z.string(),
  href: z.string(),
  description: z.string().optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

export type InputNavigationItemLink = z.infer<
  typeof InputNavigationItemLinkSchema
>;

export const InputNavigationItemCustomPageSchema = z.object({
  type: z.literal("custom-page"),
  path: z.string(),
  label: z.string(),
  element: z.any(),
  icon: z.custom<IconNames>().optional(),
  badge: BadgeSchema.optional(),
  display: DisplaySchema,
});

export type InputNavigationItemCustomPage = z.infer<
  typeof InputNavigationItemCustomPageSchema
>;

export const BaseInputNavigationItemCategorySchema = z.object({
  type: z.literal("category"),
  icon: z.custom<IconNames>().optional(),
  label: z.string(),
  description: z.string().optional(),
  collapsible: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  link: InputNavigationItemCategoryLinkDocSchema.optional(),
  display: DisplaySchema,
});

export type InputNavigationItemCategory = z.infer<
  typeof BaseInputNavigationItemCategorySchema
> & {
  items: InputNavigationItem[];
};

export const InputNavigationItemCategorySchema: z.ZodType<InputNavigationItemCategory> =
  BaseInputNavigationItemCategorySchema.extend({
    items: z.lazy(() => InputNavigationItemSchema.array()),
  });

export type InputNavigationItem =
  | z.infer<typeof InputNavigationItemDocSchema>
  | z.infer<typeof InputNavigationItemLinkSchema>
  | z.infer<typeof InputNavigationItemCategorySchema>
  | z.infer<typeof InputNavigationItemCustomPageSchema>;

export const InputNavigationItemSchema: z.ZodType<InputNavigationItem> = z.lazy(
  () =>
    z.union([
      InputNavigationItemDocSchema,
      InputNavigationItemLinkSchema,
      InputNavigationItemCategorySchema,
      InputNavigationItemCustomPageSchema,
    ]),
);

export const InputNavigationSchema = InputNavigationItemSchema.array();

export type InputNavigation = z.infer<typeof InputNavigationSchema>;
