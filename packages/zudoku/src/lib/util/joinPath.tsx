/**
 * @deprecated Use `joinUrl` instead.
 */
export const joinPath = (
  ...parts: Array<string | null | undefined | boolean>
) => {
  const cleanPath = parts
    .filter((part): part is string => Boolean(part))
    .map((part) => part.replace(/(^\/+|\/+$)/g, "")) // Strip leading and trailing slashes
    .join("/")
    .replace(/(^\/+|\/+$)/g, "");

  return cleanPath ? `/${cleanPath}` : "/";
};
