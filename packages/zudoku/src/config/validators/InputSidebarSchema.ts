import { z } from "zod";
import { IconNames } from "./icon-types.js";

const BadgeSchema = z.object({
  label: z.string(),
  color: z.enum(["green", "blue", "yellow", "red", "purple", "indigo", "gray"]),
  placement: z.enum(["start", "end"]).optional(),
});

export const BaseInputSidebarItemCategoryLinkDocSchema = z.object({
  type: z.literal("doc"),
  id: z.string(),
  label: z.string().optional(),
});

export type BaseInputSidebarItemCategoryLinkDoc = z.infer<
  typeof BaseInputSidebarItemCategoryLinkDocSchema
>;

export const InputSidebarItemCategoryLinkDocSchema = z.union([
  BaseInputSidebarItemCategoryLinkDocSchema,
  z.string(),
]);

export const BaseInputSidebarItemDocSchema = z.object({
  type: z.literal("doc"),
  id: z.string(),
  icon: z.custom<IconNames>().optional(),
  label: z.string().optional(),
  badge: BadgeSchema.optional(),
});

export type BaseInputSidebarItemDoc = z.infer<
  typeof BaseInputSidebarItemDocSchema
>;

export const InputSidebarItemDocSchema = z.union([
  BaseInputSidebarItemDocSchema,
  z.string(),
]);

export const InputSidebarItemLinkSchema = z.object({
  type: z.literal("link"),
  label: z.string(),
  href: z.string(),
  description: z.string().optional(),
  badge: BadgeSchema.optional(),
});

export type InputSidebarItemLink = z.infer<typeof InputSidebarItemLinkSchema>;

export const BaseInputSidebarItemCategorySchema = z.object({
  type: z.literal("category"),
  icon: z.custom<IconNames>().optional(),
  label: z.string(),
  description: z.string().optional(),
  collapsible: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  link: InputSidebarItemCategoryLinkDocSchema.optional(),
});

export type InputSidebarItem =
  | z.infer<typeof InputSidebarItemDocSchema>
  | z.infer<typeof InputSidebarItemLinkSchema>
  | z.infer<typeof InputSidebarItemCategorySchema>;

export const InputSidebarItemSchema: z.ZodType<InputSidebarItem> = z.lazy(() =>
  z.union([
    InputSidebarItemDocSchema,
    InputSidebarItemLinkSchema,
    InputSidebarItemCategorySchema,
  ]),
);

export type InputSidebarItemCategory = z.infer<
  typeof BaseInputSidebarItemCategorySchema
> & {
  items: InputSidebarItem[];
};

export const InputSidebarItemCategorySchema: z.ZodType<InputSidebarItemCategory> =
  BaseInputSidebarItemCategorySchema.extend({
    items: InputSidebarItemSchema.array(),
  });

export const InputSidebarSchema = InputSidebarItemSchema.array();

export type SidebarEntry = z.infer<typeof InputSidebarSchema>;
export type SidebarConfig = Record<string, SidebarEntry>;
