import { cn as cnUtil } from "../lib/cn.js";

export const cn = cnUtil;

export const focusRing = cn(
  "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:ring-3 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50",
);
