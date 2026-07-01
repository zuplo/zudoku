import { z } from "zod";
import { isIconNameShape } from "../../lib/util/iconName.js";
import type { IconName } from "./icon-types.js";

export const IconSchema = z.custom<IconName>(
  (value) => typeof value === "string" && isIconNameShape(value),
  {
    message:
      'Invalid icon: expected a lowercase iconify name like "home" or "ph:acorn-duotone".',
  },
);
