import { useSyncExternalStore } from "react";

const noop = () => () => {};

export const ClientOnly = (props: { children: React.ReactNode }) => {
  const value = useSyncExternalStore(
    noop,
    () => "client",
    () => "server",
  );

  return value === "client" ? props.children : null;
};
