import { z } from "zod";
import { IconNames } from "./icon-types.js";

const IconSchema = z.enum(IconNames);

const HeaderNavLinkItemSchema = z.object({
  label: z.string(),
  icon: IconSchema.optional(),
  description: z.string().optional(),
  to: z.string(),
  target: z.enum(["_self", "_blank"]).optional(),
});

const HeaderNavGroupSchema = z.object({
  label: z.string(),
  items: z.array(HeaderNavLinkItemSchema),
});

const HeaderNavItemSchema = z.union([
  z.object({
    label: z.string(),
    icon: IconSchema.optional(),
    to: z.string(),
    target: z.enum(["_self", "_blank"]).optional(),
  }),
  z.object({
    label: z.string(),
    items: z.array(z.union([HeaderNavLinkItemSchema, HeaderNavGroupSchema])),
  }),
]);

export const HeaderNavigationSchema = z.array(HeaderNavItemSchema);

export const isHeaderNavGroup = (
  item: HeaderNavItem | HeaderNavLinkItem | HeaderNavGroup,
): item is HeaderNavGroup => "items" in item;

export type HeaderNavLinkItem = z.infer<typeof HeaderNavLinkItemSchema>;
export type HeaderNavGroup = z.infer<typeof HeaderNavGroupSchema>;
export type HeaderNavItem = z.infer<typeof HeaderNavItemSchema>;
export type HeaderNavigation = z.infer<typeof HeaderNavigationSchema>;
