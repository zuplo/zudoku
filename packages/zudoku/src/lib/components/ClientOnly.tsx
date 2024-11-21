import { type ReactNode, useSyncExternalStore } from "react";

const noop = () => () => {};

export const ClientOnly = (props: {
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const value = useSyncExternalStore(
    noop,
    () => "client",
    () => "server",
  );

  return value === "client" ? props.children : props.fallback;
};
