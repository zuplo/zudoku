import { stat } from "node:fs/promises";

export const fileExists = (path: string) =>
  stat(path)
    .then(() => true)
    .catch(() => false);
