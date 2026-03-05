import { type ReactNode, useSyncExternalStore } from "react";

const noop = () => () => {};

export const useIsClient = () => {
  const value = useSyncExternalStore(
    noop,
    () => "client",
    () => "server",
  );
  return value === "client";
};

export const ClientOnly = (props: {
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  return useIsClient() ? props.children : props.fallback;
};
