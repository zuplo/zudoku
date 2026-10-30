import { schemeSetKey } from "../../../hooks/useIdentityStore.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";

export type SecuritySchemeItem = NonNullable<
  OperationsFragmentFragment["security"]
>[number]["schemes"][number]["scheme"];

export type SecurityOption<Scheme = SecuritySchemeItem> = {
  names: string[];
  schemes: Scheme[];
};

export const extractOperationSecurityOptions = (
  operation: OperationsFragmentFragment,
): SecurityOption[] => {
  const seenKeys = new Set<string>();
  return (operation.security ?? []).flatMap((requirement) => {
    const schemes = requirement.schemes.map((s) => s.scheme);
    const names = schemes.map((scheme) => scheme.name);
    const key = schemeSetKey(names);
    if (names.length === 0 || seenKeys.has(key)) {
      return [];
    }
    seenKeys.add(key);
    return [{ names, schemes }];
  });
};

export const findSecurityOption = <Option extends { names: string[] }>(
  options: Option[],
  schemeNames: string[],
) => {
  const key = schemeSetKey(schemeNames);
  return options.find((option) => schemeSetKey(option.names) === key);
};
