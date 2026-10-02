import type {
  HeaderNavGroup,
  HeaderNavItem,
  HeaderNavLinkItem,
} from "../../config/validators/HeaderNavigationSchema.js";

export const isHeaderNavGroup = (
  item: HeaderNavItem | HeaderNavLinkItem | HeaderNavGroup,
): item is HeaderNavGroup => "items" in item;
