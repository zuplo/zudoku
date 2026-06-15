import { z } from "zod";
import { isIconNameShape } from "../../lib/util/iconName.js";
import type { IconName } from "./icon-types.js";

export const IconSchema = z.custom<IconName>(
  (value) => typeof value === "string" && isIconNameShape(value),
);
