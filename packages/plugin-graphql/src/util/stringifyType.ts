import type { TypeWrapper } from "./unwrapType.js";

export const stringifyType = (
  name: string,
  wrappers: TypeWrapper[],
): string => {
  const [left, right] = wrappers.reduce<[string, string]>(
    ([l, r], kind) => {
      switch (kind) {
        case "NON_NULL":
          return [l, `${r}!`];
        case "LIST":
          return [`${l}[`, `${r}]`];
        default:
          return [l, r];
      }
    },
    ["", ""],
  );

  return `${left}${name}${right}`;
};
