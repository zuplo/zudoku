const DEFAULT_ICON_PREFIX = "lucide";
export const ICON_VIRTUAL_PREFIX = "virtual:zudoku-icon/";

type ParsedIconName = {
  prefix: string;
  name: string;
  id: string;
};

export const parseIconName = (raw: string): ParsedIconName => {
  const separator = raw.indexOf(":");
  const prefix =
    separator === -1 ? DEFAULT_ICON_PREFIX : raw.slice(0, separator);
  const name = separator === -1 ? raw : raw.slice(separator + 1);

  return {
    prefix,
    name,
    id: `${prefix}:${name}`,
  };
};

export const iconVirtualId = (raw: string): string => {
  const { prefix, name } = parseIconName(raw);
  return `${ICON_VIRTUAL_PREFIX}${prefix}/${name}`;
};

const ICON_NAME_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const isIconNameShape = (value: string): boolean => {
  const parts = value.split(":");
  return parts.length <= 2 && parts.every((part) => ICON_NAME_RE.test(part));
};
