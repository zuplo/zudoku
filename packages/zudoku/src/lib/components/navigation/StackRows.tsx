import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "zudoku/icons";
import type { NavigationCategory as NavigationCategoryType } from "../../../config/validators/NavigationSchema.js";
import { cn } from "../../util/cn.js";
import { NavigationCategory } from "./NavigationCategory.js";
import { navigationListItem, stackCategoryTarget } from "./utils.js";

export const StackDrillRow = ({
  to,
  onRequestClose,
  className,
  children,
}: {
  to: string;
  onRequestClose?: () => void;
  className?: string;
  children: ReactNode;
}) => (
  <Link
    viewTransition
    to={to}
    onClick={onRequestClose}
    className={cn(navigationListItem(), "group justify-between", className)}
  >
    <span className="flex items-center gap-2 truncate">{children}</span>
    <span className="grid size-6 shrink-0 place-items-center">
      <ChevronRightIcon size={16} />
    </span>
  </Link>
);

// Renders a drill-in row that navigates to a stacked sub-panel.
// Falls back to an inline category if there's no navigable target.
export const StackCategoryRow = ({
  category,
  onRequestClose,
}: {
  category: NavigationCategoryType;
  onRequestClose?: () => void;
}) => {
  const target = stackCategoryTarget(category);
  if (!target) {
    // biome-ignore lint/suspicious/noConsole: Dev-only stacked navigation misconfiguration warning
    console.warn(
      `[Zudoku] Stacked category "${category.label}" has no navigable items; rendering inline.`,
    );
    return (
      <NavigationCategory category={category} onRequestClose={onRequestClose} />
    );
  }

  return (
    <StackDrillRow
      to={target}
      onRequestClose={onRequestClose}
      className="font-medium"
    >
      {category.icon && (
        <Icon
          icon={category.icon}
          size={16}
          className="shrink-0 align-[-0.125em]"
        />
      )}
      <span className="truncate">{category.label}</span>
    </StackDrillRow>
  );
};
